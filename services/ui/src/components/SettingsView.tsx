import SettingsPanel from "./SettingsPanel";

type SettingsViewProps = {
  totalImages: number;
  activeFilters: number;
  onReindex?: () => void;
  indexerStatus?: string;
};

export default function SettingsView({
  totalImages,
  activeFilters,
  onReindex,
  indexerStatus,
}: SettingsViewProps) {
  return (
    <div className="space-y-4">
      <section className="rounded-2xl border border-white/10 bg-panel px-5 py-4 shadow-panel">
        <h1 className="font-display text-3xl uppercase tracking-wide text-text">Settings</h1>
        <p className="mt-1 text-xs text-muted">
          Configure sources, review index stats, and monitor system health.
        </p>
      </section>
      <SettingsPanel
        totalImages={totalImages}
        activeFilters={activeFilters}
        onReindex={onReindex}
        indexerStatus={indexerStatus}
      />
    </div>
  );
}
