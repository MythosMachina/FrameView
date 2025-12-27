type ActiveTagsProps = {
  tags: string[];
  onRemove: (tag: string) => void;
  onClear: () => void;
};

export default function ActiveTags({ tags, onRemove, onClear }: ActiveTagsProps) {
  if (tags.length === 0) return null;
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-white/10 bg-panel px-4 py-3 shadow-panel">
      <span className="text-xs uppercase tracking-widest text-muted">Active tags</span>
      {tags.map((tag) => (
        <button
          key={tag}
          onClick={() => onRemove(tag)}
          className="rounded-full border border-accent/40 bg-black/30 px-2 py-1 text-[10px] uppercase tracking-wide text-accent transition hover:border-accent"
        >
          {tag} ×
        </button>
      ))}
      <button
        onClick={onClear}
        className="ml-auto text-[10px] uppercase tracking-widest text-muted hover:text-text"
      >
        Clear all
      </button>
    </div>
  );
}
