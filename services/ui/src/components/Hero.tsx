type HeroProps = {
  totalImages: number;
  activeFilters: number;
  onSearchChange: (value: string) => void;
  query: string;
};

export default function Hero({ totalImages, activeFilters, onSearchChange, query }: HeroProps) {
  return (
    <section className="relative overflow-hidden rounded-2xl border border-white/10 bg-panel p-6 shadow-panel">
      <div className="panel-sheen absolute inset-0" />
      <div className="relative z-10 grid gap-4 lg:grid-cols-[1.3fr_0.7fr]">
        <div>
          <h1 className="font-display text-4xl uppercase tracking-wide text-text">
            Gallery control for AI imagery
          </h1>
          <p className="mt-2 max-w-xl text-sm text-muted">
            Index local folders, extract rich metadata, and navigate your generation history
            with precision filters and category lanes.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <input
              value={query}
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder="Search prompt, model, tags"
              className="w-full max-w-md rounded-xl border border-white/10 bg-panelAlt px-4 py-2 text-sm text-text focus:border-accent focus:outline-none"
            />
            <button className="rounded-xl bg-gradient-to-br from-accent to-[#b0742e] px-4 py-2 text-sm font-semibold text-black shadow-glow">
              New index run
            </button>
          </div>
        </div>
        <div className="rounded-xl border border-white/10 bg-panelAlt p-4 text-xs text-muted">
          <div className="mb-3 font-display text-lg uppercase text-accent2">
            Live metrics
          </div>
          <div className="grid gap-2">
            <div className="flex items-center justify-between">
              <span>Indexed images</span>
              <span className="text-text">{totalImages}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Active filters</span>
              <span className="text-text">{activeFilters}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Data source</span>
              <span className="text-text">Local FS</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
