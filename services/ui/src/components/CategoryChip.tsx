type CategoryChipProps = {
  name: string;
  kind?: string;
  onClick?: (name: string) => void;
};

export default function CategoryChip({ name, kind, onClick }: CategoryChipProps) {
  return (
    <button
      onClick={() => onClick?.(name)}
      className={`rounded-full border px-2 py-1 text-[10px] uppercase tracking-wide transition ${
        kind === "auto"
          ? "border-accent/40 text-accent hover:border-accent"
          : "border-white/10 text-muted hover:border-accent hover:text-accent"
      }`}
    >
      {name}
    </button>
  );
}
