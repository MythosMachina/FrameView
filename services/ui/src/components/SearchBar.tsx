type SearchBarProps = {
  query: string;
  onChange: (value: string) => void;
  onToggleFilters: () => void;
  filtersOpen: boolean;
};

export default function SearchBar({ query, onChange, onToggleFilters, filtersOpen }: SearchBarProps) {
  return (
    <section className="rounded-2xl border border-white/10 bg-panel px-5 py-4 shadow-panel">
      <div className="flex flex-wrap items-center gap-3">
        <input
          value={query}
          onChange={(event) => onChange(event.target.value)}
          placeholder="Search prompt, model, tags"
          className="w-full flex-1 rounded-xl border border-white/10 bg-panelAlt px-4 py-2 text-sm text-text focus:border-accent focus:outline-none"
        />
        <button
          onClick={onToggleFilters}
          className="rounded-xl border border-accent/50 bg-white/5 px-4 py-2 text-sm text-accent transition hover:border-accent hover:bg-white/10"
        >
          {filtersOpen ? "Hide filters" : "Show filters"}
        </button>
      </div>
    </section>
  );
}
