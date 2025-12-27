type SettingsPanelProps = {
  totalImages: number;
  activeFilters: number;
  onReindex?: () => void;
  indexerStatus?: string;
};

export default function SettingsPanel({
  totalImages,
  activeFilters,
  onReindex,
  indexerStatus,
}: SettingsPanelProps) {
  return (
    <section className="rounded-2xl border border-white/10 bg-panel p-5 shadow-panel">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-display text-2xl uppercase tracking-wide text-text">Settings</h2>
        <span className="text-xs uppercase tracking-widest text-muted">System status</span>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-white/10 bg-panelAlt p-4 text-xs text-muted">
          <div className="mb-3 font-display text-lg uppercase text-accent2">Live metrics</div>
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
        <div className="rounded-xl border border-white/10 bg-panelAlt p-4">
          <div className="mb-2 text-xs uppercase tracking-widest text-muted">Sources</div>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-sm text-text">/ai/FrameView/images</div>
              <div className="text-xs text-muted">Last scan: on demand</div>
            </div>
            <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-muted">
              <span
                className={`h-2 w-2 rounded-full ${
                  indexerStatus === "active" ? "bg-success" : "bg-accent"
                }`}
              />
              {indexerStatus ?? "unknown"}
            </div>
            <button
            type="button"
            onClick={onReindex}
            className="rounded-xl border border-accent/40 bg-white/5 px-3 py-2 text-xs uppercase tracking-widest text-accent"
          >
            Reindex
          </button>
          </div>
          <div className="mt-3 text-xs text-muted">
            Manage watched folders via the settings endpoint.
          </div>
        </div>
      </div>
    </section>
  );
}
