type ImageRow = {
  id: string;
  image_url?: string;
  raw_prompt?: string;
  prompt?: string;
  raw_negative_prompt?: string;
  negative_prompt?: string;
  model_name?: string;
  vae_name?: string;
  sampler_name?: string;
  scheduler_name?: string;
  steps?: number;
  cfg_scale?: string;
  seed?: string;
  sharpness?: string;
  performance?: string;
  clip_skip?: number;
  version?: string;
  tags?: string[];
  width?: number;
  height?: number;
  filename?: string;
};

type ImageDetailModalProps = {
  image: ImageRow;
  onClose: () => void;
  onTagClick?: (tag: string) => void;
};

const SCORE_TOKEN = /^score_\d+(?:_up|_down)?$/i;

function displayPrompt(image: ImageRow) {
  if (image.prompt) return image.prompt;
  if (!image.raw_prompt) return "(no prompt)";
  return image.raw_prompt
    .split(",")
    .map((token) => token.trim())
    .filter((token) => token && !SCORE_TOKEN.test(token))
    .join(", ");
}

export default function ImageDetailModal({ image, onClose, onTagClick }: ImageDetailModalProps) {
  const visibleTags = (image.raw_prompt ?? "")
    .split(",")
    .map((token) => token.trim())
    .filter((token) => token && !SCORE_TOKEN.test(token));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-6">
      <div className="relative max-h-[90vh] w-full max-w-5xl overflow-auto rounded-2xl border border-white/10 bg-panel p-6 shadow-panel">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full border border-white/10 bg-panelAlt px-3 py-1 text-xs uppercase tracking-widest text-muted"
        >
          Close
        </button>
        <div className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
          <div className="space-y-4">
            <div className="rounded-xl border border-white/10 bg-panelAlt p-3">
              {image.image_url ? (
                <img
                  src={image.image_url}
                  alt={image.filename ?? "Image"}
                  className="max-h-[70vh] w-full rounded-lg border border-white/10 object-contain"
                />
              ) : (
                <div className="h-64 rounded-lg border border-white/10 bg-gradient-to-br from-black/50 to-black/10" />
              )}
            </div>
            <div>
              <div className="text-xs uppercase tracking-widest text-muted">Prompt</div>
              <p className="mt-2 text-sm text-text">{displayPrompt(image)}</p>
            </div>
            {image.negative_prompt ? (
              <div>
                <div className="text-xs uppercase tracking-widest text-muted">Negative prompt</div>
                <p className="mt-2 text-sm text-muted">{image.negative_prompt}</p>
              </div>
            ) : null}
          </div>
          <div className="space-y-4">
            <div className="rounded-xl border border-white/10 bg-panelAlt p-4">
              <div className="mb-3 text-xs uppercase tracking-widest text-muted">Metadata</div>
              <div className="grid gap-2 text-xs text-muted">
                <MetaRow label="Model" value={image.model_name} />
                <MetaRow label="VAE" value={image.vae_name} />
                <MetaRow label="Sampler" value={image.sampler_name} />
                <MetaRow label="Scheduler" value={image.scheduler_name} />
                <MetaRow label="Steps" value={image.steps} />
                <MetaRow label="CFG" value={image.cfg_scale} />
                <MetaRow label="Seed" value={image.seed} />
                <MetaRow label="Sharpness" value={image.sharpness} />
                <MetaRow label="Performance" value={image.performance} />
                <MetaRow label="Clip skip" value={image.clip_skip} />
                <MetaRow label="Version" value={image.version} />
                <MetaRow label="Resolution" value={image.width && image.height ? `${image.width}x${image.height}` : null} />
              </div>
            </div>
            <div className="rounded-xl border border-white/10 bg-panelAlt p-4">
              <div className="mb-3 text-xs uppercase tracking-widest text-muted">Tags</div>
              <div className="flex flex-wrap gap-2">
                {visibleTags.length ? (
                  visibleTags.map((tag) => (
                    <button
                      key={tag}
                      onClick={() => onTagClick?.(tag)}
                      className="rounded-full border border-white/10 bg-black/30 px-2 py-1 text-[10px] uppercase tracking-wide text-muted transition hover:border-accent hover:text-accent"
                    >
                      {tag}
                    </button>
                  ))
                ) : (
                  <span className="text-xs text-muted">No tags</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

type MetaRowProps = {
  label: string;
  value?: string | number | null;
};

function MetaRow({ label, value }: MetaRowProps) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span>{label}</span>
      <span className="text-text">{value ?? "—"}</span>
    </div>
  );
}
