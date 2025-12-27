import type { Tag } from "./types.js";

const SCORE_TOKEN = /^score_\d+(?:_up|_down)?$/i;

export function normalizePrompt(rawPrompt: string): { prompt: string; autoTags: string[] } {
  const tokens = rawPrompt
    .split(",")
    .map((token) => token.trim())
    .filter(Boolean);

  const autoTags: string[] = [];
  const keep: string[] = [];

  for (const token of tokens) {
    if (SCORE_TOKEN.test(token)) {
      autoTags.push(token);
    } else {
      keep.push(token);
    }
  }

  return {
    prompt: keep.join(", "),
    autoTags,
  };
}

export function buildAutoTags(tokens: string[]): Tag[] {
  return tokens.map((token) => ({ name: token, kind: "auto" }));
}
