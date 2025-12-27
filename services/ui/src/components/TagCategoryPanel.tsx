export default function TagCategoryPanel() {
  return (
    <section className="rounded-2xl border border-white/10 bg-panel p-5 shadow-panel">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-display text-2xl uppercase tracking-wide text-text">Tags & Categories</h2>
        <span className="text-xs uppercase tracking-widest text-muted">Management</span>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-white/10 bg-panelAlt p-4">
          <h3 className="text-sm uppercase tracking-widest text-muted">Tags</h3>
          <p className="mt-2 text-xs text-muted">
            Auto-tags (pony scores) stay distinct; user tags layer on top.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <span className="rounded-full border border-accent/40 bg-black/40 px-2 py-1 text-[10px] uppercase text-accent">
              auto
            </span>
            <span className="rounded-full border border-white/20 bg-black/20 px-2 py-1 text-[10px] uppercase text-muted">
              user
            </span>
          </div>
          <button className="mt-4 w-full rounded-xl border border-accent/50 bg-white/5 px-3 py-2 text-sm text-accent transition hover:border-accent hover:bg-white/10">
            Manage tags
          </button>
        </div>
        <div className="rounded-xl border border-white/10 bg-panelAlt p-4">
          <h3 className="text-sm uppercase tracking-widest text-muted">Categories</h3>
          <p className="mt-2 text-xs text-muted">
            Curate collections and multi-assign images without breaking metadata.
          </p>
          <button className="mt-4 w-full rounded-xl border border-accent2/50 bg-white/5 px-3 py-2 text-sm text-accent2 transition hover:border-accent2 hover:bg-white/10">
            Manage categories
          </button>
        </div>
      </div>
    </section>
  );
}
