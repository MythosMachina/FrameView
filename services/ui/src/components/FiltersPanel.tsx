type FiltersPanelProps = {
  collapsed: boolean;
  models: string[];
  loras: string[];
  selectedModel: string;
  selectedLora: string;
  onModelChange: (value: string) => void;
  onLoraChange: (value: string) => void;
};

export default function FiltersPanel({
  collapsed,
  models,
  loras,
  selectedModel,
  selectedLora,
  onModelChange,
  onLoraChange,
}: FiltersPanelProps) {
  if (collapsed) {
    return null;
  }
  return (
    <aside className="rounded-2xl border border-white/10 bg-panel p-5 shadow-panel">
      <h2 className="font-display text-2xl uppercase tracking-wide text-text">Filters</h2>
      <p className="mt-1 text-xs text-muted">Refine by model, tags, size, date.</p>
      <div className="mt-4 space-y-4 text-sm">
        <div>
          <label className="mb-1 block text-xs uppercase tracking-widest text-muted">Model</label>
          <select
            value={selectedModel}
            onChange={(event) => onModelChange(event.target.value)}
            className="w-full rounded-xl border border-white/10 bg-panelAlt px-3 py-2 text-sm text-text"
          >
            <option value="">All models</option>
            {models.map((model) => (
              <option key={model} value={model}>
                {model}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs uppercase tracking-widest text-muted">LoRA</label>
          <select
            value={selectedLora}
            onChange={(event) => onLoraChange(event.target.value)}
            className="w-full rounded-xl border border-white/10 bg-panelAlt px-3 py-2 text-sm text-text"
          >
            <option value="">All LoRAs</option>
            {loras.map((lora) => (
              <option key={lora} value={lora}>
                {lora}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs uppercase tracking-widest text-muted">Tags</label>
          <input
            placeholder="comma separated"
            className="w-full rounded-xl border border-white/10 bg-panelAlt px-3 py-2 text-sm text-text"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs uppercase tracking-widest text-muted">Resolution</label>
          <div className="grid grid-cols-2 gap-2">
            <input
              placeholder="min w"
              className="rounded-xl border border-white/10 bg-panelAlt px-3 py-2 text-sm text-text"
            />
            <input
              placeholder="min h"
              className="rounded-xl border border-white/10 bg-panelAlt px-3 py-2 text-sm text-text"
            />
          </div>
        </div>
        <button className="w-full rounded-xl border border-accent/50 bg-white/5 px-3 py-2 text-sm text-accent transition hover:border-accent hover:bg-white/10">
          Apply filters
        </button>
      </div>
    </aside>
  );
}
