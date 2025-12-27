type TopbarProps = {
  activeView: "gallery" | "tags" | "settings";
  onChange: (view: "gallery" | "tags" | "settings") => void;
};

const NAV_ITEMS: Array<{ id: "gallery" | "tags" | "settings"; label: string }> = [
  { id: "gallery", label: "Gallery" },
  { id: "tags", label: "Tags & Categories" },
  { id: "settings", label: "Settings" },
];

export default function Topbar({ activeView, onChange }: TopbarProps) {
  return (
    <header className="sticky top-4 z-10 mx-auto mt-4 flex w-full max-w-6xl items-center justify-between gap-4 rounded-2xl border border-white/10 bg-panel px-6 py-4 shadow-panel">
      <div className="flex items-center gap-4">
        <div className="frameview-gear" />
        <div>
          <div className="font-display text-3xl uppercase tracking-widest text-text">
            FrameView
          </div>
          <div className="text-xs uppercase tracking-[0.2em] text-muted">
            curated ai gallery
          </div>
        </div>
      </div>
      <nav className="hidden items-center gap-3 text-sm lg:flex">
        {NAV_ITEMS.map((item) => (
          <button
            key={item.id}
            onClick={() => onChange(item.id)}
            className={`rounded-lg border px-3 py-2 transition ${
              activeView === item.id
                ? "border-accent text-accent"
                : "border-white/10 bg-panelAlt text-text hover:border-accent hover:text-accent"
            }`}
          >
            {item.label}
          </button>
        ))}
      </nav>
      <button className="flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-4 py-2 text-xs text-text">
        <span className="h-2 w-2 rounded-full bg-success shadow-[0_0_10px_rgba(91,216,143,0.8)]" />
        System online
      </button>
    </header>
  );
}
