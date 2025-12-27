export type SourceType = "png_text" | "exif" | "sidecar" | "unknown";

export type TagKind = "user" | "auto" | "system";

export interface ImageRecord {
  id: string;
  path: string;
  filename: string;
  createdAt: string;
  fileSize: number;
  width: number;
  height: number;
  hash: string;
  sourceType: SourceType;
}

export interface GenerationMetadata {
  imageId: string;
  rawPrompt: string;
  prompt?: string | null;
  rawNegativePrompt?: string | null;
  negativePrompt?: string | null;
  modelName?: string | null;
  modelHash?: string | null;
  vaeName?: string | null;
  samplerName?: string | null;
  schedulerName?: string | null;
  steps?: number | null;
  cfgScale?: number | null;
  seed?: string | null;
  sharpness?: number | null;
  admGuidance?: string | null;
  performance?: string | null;
  clipSkip?: number | null;
  version?: string | null;
}

export interface LoraUsage {
  name: string;
  hash?: string | null;
  weight?: number | null;
}

export interface Tag {
  name: string;
  kind: TagKind;
}

export interface ParsedPngText {
  parameters?: string;
  fooocusScheme?: string;
  other: Record<string, string>;
}

export interface ParsedParameters {
  rawPrompt: string;
  rawNegativePrompt?: string | null;
  settings: Record<string, string>;
  loras: LoraUsage[];
}
