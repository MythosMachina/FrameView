import CategoryChip from "./CategoryChip";

type Category = {
  id: string;
  name: string;
  kind?: string;
};

type CategoriesBarProps = {
  categories: Category[];
  activeCategory: string | null;
  onSelect: (name: string | null) => void;
};

export default function CategoriesBar({ categories, activeCategory, onSelect }: CategoriesBarProps) {
  const visible = categories.filter(
    (category) => !/^score_\\d+(?:_up|_down)?$/i.test(category.name)
  );
  if (!visible.length) return null;
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-white/10 bg-panel px-4 py-3 shadow-panel">
      <span className="text-xs uppercase tracking-widest text-muted">Categories</span>
      <button
        onClick={() => onSelect(null)}
        className={`rounded-full border px-2 py-1 text-[10px] uppercase tracking-wide transition ${
          activeCategory
            ? "border-white/10 text-muted hover:border-accent hover:text-accent"
            : "border-accent text-accent"
        }`}
      >
        All
      </button>
      {visible.map((category) => (
        <CategoryChip
          key={category.id}
          name={category.name}
          kind={category.kind}
          onClick={() => onSelect(category.name)}
        />
      ))}
    </div>
  );
}
