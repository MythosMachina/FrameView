type ImageRow = {
  id: string;
  path: string;
  filename: string;
  raw_prompt?: string;
  prompt?: string;
  model_name?: string;
  tags?: string[];
  width?: number;
  height?: number;
  image_url?: string;
};

type GalleryGridProps = {
  images: ImageRow[];
  loading: boolean;
  error: string | null;
  onSelect: (image: ImageRow) => void;
  onTagClick: (tag: string) => void;
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

export default function GalleryGrid({ images, loading, error, onSelect, onTagClick }: GalleryGridProps) {
  const displayTags = (image: ImageRow) => {
    const source = image.raw_prompt ?? "";
    const tokens = source
      .split(",")
      .map((token) => token.trim())
      .filter((token) => token && !SCORE_TOKEN.test(token));
    return tokens.slice(0, 3);
  };

  return (
    <section className="rounded-2xl border border-white/10 bg-panel p-5 shadow-panel">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-display text-2xl uppercase tracking-wide text-text">Gallery</h2>
        <span className="text-xs uppercase tracking-widest text-muted">{images.length} results</span>
      </div>
      {loading ? (
        <div className="rounded-xl border border-white/10 bg-panelAlt p-6 text-sm text-muted">
          Loading gallery...
        </div>
      ) : error ? (
        <div className="rounded-xl border border-danger/50 bg-panelAlt p-6 text-sm text-danger">
          {error}
        </div>
      ) : images.length === 0 ? (
        <div className="rounded-xl border border-dashed border-white/20 bg-panelAlt p-6 text-sm text-muted">
          No images indexed yet.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {images.map((image) => (
            <article
              key={image.id}
              className="group cursor-pointer rounded-xl border border-white/10 bg-panelAlt p-4 transition hover:-translate-y-1 hover:border-accent/60"
              onClick={() => onSelect(image)}
            >
              <div className="mb-3 flex items-center justify-between text-xs text-muted">
                <span>{image.model_name ?? "Unknown model"}</span>
                <span>
                  {image.width}x{image.height}
                </span>
              </div>
              {image.image_url ? (
                <img
                  src={image.image_url}
                  alt={image.raw_prompt ?? image.model_name ?? "Image"}
                  className="h-40 w-full rounded-lg border border-white/10 object-cover"
                  loading="lazy"
                />
              ) : (
                <div className="h-40 rounded-lg border border-white/10 bg-gradient-to-br from-black/50 to-black/10" />
              )}
              <p className="mt-3 max-h-14 overflow-hidden text-xs text-text">
                {displayPrompt(image)}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {displayTags(image).map((tag) => (
                  <button
                    key={tag}
                    onClick={(event) => {
                      event.stopPropagation();
                      onTagClick(tag);
                    }}
                    className="rounded-full border border-white/10 bg-black/30 px-2 py-1 text-[10px] uppercase tracking-wide text-muted transition hover:border-accent hover:text-accent"
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
