import { useEffect, useState } from "react";
import CategoryChip from "./CategoryChip";

const API_URL = import.meta.env.VITE_API_URL ?? `http://${window.location.hostname}:4010`;

type Tag = { id: string; name: string; kind: string };

type Category = {
  id: string;
  name: string;
  description?: string | null;
  kind?: string;
  source_tag?: string | null;
};

type TagsCategoriesViewProps = {
  onCategorySelect?: (name: string) => void;
  onTagSelect?: (name: string) => void;
};

export default function TagsCategoriesView({ onCategorySelect, onTagSelect }: TagsCategoriesViewProps) {
  const [tags, setTags] = useState<Tag[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const isScore = (value: string) => /^score_\d+(?:_up|_down)?$/i.test(value);

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        setLoading(true);
        const [tagsRes, categoriesRes] = await Promise.all([
          fetch(`${API_URL}/tags`),
          fetch(`${API_URL}/categories`),
        ]);
        const tagsData = await tagsRes.json();
        const categoriesData = await categoriesRes.json();
        if (!active) return;
        const categoryNames = new Set(
          (categoriesData.rows ?? []).map((category: Category) => category.name)
        );
        setTags(
          (tagsData.rows ?? []).filter(
            (tag: Tag) => !isScore(tag.name) && !categoryNames.has(tag.name)
          )
        );
        setCategories((categoriesData.rows ?? []).filter((category: Category) => !isScore(category.name)));
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="space-y-4">
      <section className="rounded-2xl border border-white/10 bg-panel px-5 py-4 shadow-panel">
        <h1 className="font-display text-3xl uppercase tracking-wide text-text">
          Tags & Categories
        </h1>
        <p className="mt-1 text-xs text-muted">
          Live data from the index. Auto categories are created from the first prompt tag.
        </p>
      </section>
      {loading ? (
        <div className="rounded-2xl border border-white/10 bg-panel p-6 text-sm text-muted">
          Loading tags and categories...
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          <section className="rounded-2xl border border-white/10 bg-panel p-5 shadow-panel">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display text-2xl uppercase tracking-wide text-text">Tags</h2>
              <span className="text-xs uppercase tracking-widest text-muted">{tags.length} total</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <button
                  key={tag.id}
                  onClick={() => onTagSelect?.(tag.name)}
                  className={`rounded-full border px-2 py-1 text-[10px] uppercase tracking-wide ${
                    tag.kind === "auto"
                      ? "border-accent/40 text-accent"
                      : "border-white/10 text-muted"
                  }`}
                >
                  {tag.name}
                </button>
              ))}
            </div>
          </section>
          <section className="rounded-2xl border border-white/10 bg-panel p-5 shadow-panel">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display text-2xl uppercase tracking-wide text-text">Categories</h2>
              <span className="text-xs uppercase tracking-widest text-muted">{categories.length} total</span>
            </div>
            <div className="space-y-3">
              {categories.map((category) => (
                <div key={category.id} className="rounded-xl border border-white/10 bg-panelAlt p-3">
                  <div className="flex items-center justify-between">
                    <CategoryChip
                      name={category.name}
                      kind={category.kind}
                      onClick={onCategorySelect}
                    />
                    <span
                      className={`text-[10px] uppercase tracking-widest ${
                        category.kind === "auto" ? "text-accent" : "text-muted"
                      }`}
                    >
                      {category.kind ?? "user"}
                    </span>
                  </div>
                  {category.source_tag ? (
                    <div className="mt-1 text-xs text-muted">Source tag: {category.source_tag}</div>
                  ) : null}
                </div>
              ))}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
