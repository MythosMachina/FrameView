import { inflateSync } from "node:zlib";
import { ParsedParameters, ParsedPngText, LoraUsage } from "./types.js";

const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

export function parsePngTextChunks(buffer: Buffer): ParsedPngText {
  if (buffer.length < 8 || !buffer.subarray(0, 8).equals(PNG_SIGNATURE)) {
    return { other: {} };
  }

  const other: Record<string, string> = {};
  let parameters: string | undefined;
  let fooocusScheme: string | undefined;
  let offset = 8;

  while (offset + 8 <= buffer.length) {
    const length = buffer.readUInt32BE(offset);
    const type = buffer.subarray(offset + 4, offset + 8).toString("ascii");
    const dataStart = offset + 8;
    const dataEnd = dataStart + length;

    if (dataEnd > buffer.length) {
      break;
    }

    const data = buffer.subarray(dataStart, dataEnd);

    if (type === "tEXt") {
      const splitIndex = data.indexOf(0x00);
      if (splitIndex !== -1) {
        const key = data.subarray(0, splitIndex).toString("latin1");
        const value = data.subarray(splitIndex + 1).toString("utf8");
        ({ parameters, fooocusScheme } = captureText(key, value, parameters, fooocusScheme, other));
      }
    } else if (type === "zTXt") {
      const splitIndex = data.indexOf(0x00);
      if (splitIndex !== -1 && data.length > splitIndex + 2) {
        const key = data.subarray(0, splitIndex).toString("latin1");
        const method = data[splitIndex + 1];
        if (method === 0) {
          try {
            const value = inflateSync(data.subarray(splitIndex + 2)).toString("utf8");
            ({ parameters, fooocusScheme } = captureText(key, value, parameters, fooocusScheme, other));
          } catch {
            other[key] = "";
          }
        }
      }
    } else if (type === "iTXt") {
      const parts = splitITXt(data);
      if (parts) {
        const { key, text } = parts;
        ({ parameters, fooocusScheme } = captureText(key, text, parameters, fooocusScheme, other));
      }
    }

    offset = dataEnd + 4; // skip CRC
    if (type === "IEND") {
      break;
    }
  }

  return { parameters, fooocusScheme, other };
}

function captureText(
  key: string,
  value: string,
  parameters: string | undefined,
  fooocusScheme: string | undefined,
  other: Record<string, string>
) {
  if (key.toLowerCase() === "parameters") {
    if (!parameters) {
      parameters = value;
    }
  } else if (key.toLowerCase() === "fooocus_scheme") {
    if (!fooocusScheme) {
      fooocusScheme = value;
    }
  } else {
    other[key] = value;
  }
  return { parameters, fooocusScheme };
}

function splitITXt(data: Buffer): { key: string; text: string } | null {
  let offset = 0;
  const nul = data.indexOf(0x00, offset);
  if (nul === -1) return null;
  const key = data.subarray(offset, nul).toString("latin1");
  offset = nul + 1;

  if (offset + 2 > data.length) return null;
  const compressionFlag = data[offset];
  const compressionMethod = data[offset + 1];
  offset += 2;

  const langEnd = data.indexOf(0x00, offset);
  if (langEnd === -1) return null;
  offset = langEnd + 1;

  const translatedEnd = data.indexOf(0x00, offset);
  if (translatedEnd === -1) return null;
  offset = translatedEnd + 1;

  let textData = data.subarray(offset);
  if (compressionFlag === 1 && compressionMethod === 0) {
    try {
      textData = inflateSync(textData);
    } catch {
      return null;
    }
  }

  return { key, text: textData.toString("utf8") };
}

export function parseFooocusParameters(parameters: string): ParsedParameters {
  const normalized = parameters.replace(/\r\n/g, "\n").trim();
  const stepsIndex = normalized.indexOf("Steps:");
  const promptBlock = stepsIndex >= 0 ? normalized.slice(0, stepsIndex).trim() : normalized;
  const metaBlock = stepsIndex >= 0 ? normalized.slice(stepsIndex).trim() : "";

  const negativeMarker = "Negative prompt:";
  let rawPrompt = promptBlock;
  let rawNegativePrompt: string | null = null;

  const negIndex = promptBlock.indexOf(negativeMarker);
  if (negIndex >= 0) {
    rawPrompt = promptBlock.slice(0, negIndex).trim();
    rawNegativePrompt = promptBlock.slice(negIndex + negativeMarker.length).trim();
  }

  const settings: Record<string, string> = {};
  if (metaBlock) {
    const fields = splitMetaFields(metaBlock);
    for (const field of fields) {
      const colonIndex = field.indexOf(":");
      if (colonIndex === -1) continue;
      const key = field.slice(0, colonIndex).trim();
      const value = field.slice(colonIndex + 1).trim();
      if (key) settings[key] = value;
    }
  }

  const loras = parseLoras(settings["Lora hashes"], settings["Lora weights"]);

  return {
    rawPrompt,
    rawNegativePrompt,
    settings,
    loras,
  };
}

function splitMetaFields(text: string): string[] {
  const out: string[] = [];
  let current = "";
  let depth = 0;
  let inQuotes = false;

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    const next = text[i + 1];

    if (char === '"') {
      inQuotes = !inQuotes;
      current += char;
      continue;
    }

    if (!inQuotes) {
      if (char === "(" || char === "[" || char === "{") depth += 1;
      if (char === ")" || char === "]" || char === "}") depth = Math.max(0, depth - 1);
    }

    if (char === "," && next === " " && depth === 0 && !inQuotes) {
      out.push(current.trim());
      current = "";
      i += 1;
      continue;
    }

    current += char;
  }

  if (current.trim()) out.push(current.trim());
  return out;
}

function parseLoras(hashText?: string, weightText?: string): LoraUsage[] {
  const hashes = parseKeyValueList(hashText);
  const weights = parseKeyValueList(weightText);

  const names = new Set<string>([...Object.keys(hashes), ...Object.keys(weights)]);
  const loras: LoraUsage[] = [];

  for (const name of names) {
    loras.push({
      name,
      hash: hashes[name] ?? null,
      weight: weights[name] ? Number(weights[name]) : null,
    });
  }

  return loras;
}

function parseKeyValueList(input?: string): Record<string, string> {
  if (!input) return {};
  const trimmed = input.replace(/^"|"$/g, "");
  const pairs = splitMetaFields(trimmed);
  const result: Record<string, string> = {};
  for (const pair of pairs) {
    const [name, value] = pair.split(":").map((part) => part.trim());
    if (name && value) {
      result[name] = value;
    }
  }
  return result;
}
