import { useEffect, useState } from "react";
import Topbar from "./components/Topbar";
import SearchBar from "./components/SearchBar";
import FiltersPanel from "./components/FiltersPanel";
import GalleryGrid from "./components/GalleryGrid";
import TagsCategoriesView from "./components/TagsCategoriesView";
import SettingsView from "./components/SettingsView";
import ImageDetailModal from "./components/ImageDetailModal";
import ActiveTags from "./components/ActiveTags";
import CategoriesBar from "./components/CategoriesBar";
import CornerLinks from "./components/CornerLinks";

const API_URL =
  import.meta.env.VITE_API_URL ?? `http://${window.location.hostname}:4010`;

type ImageRow = {
  id: string;
  path: string;
  filename: string;
  raw_prompt?: string;
  model_name?: string;
  tags?: string[];
  width?: number;
  height?: number;
  image_url?: string;
};

type Category = {
  id: string;
  name: string;
  kind?: string;
};

type ModelRow = {
  id: string;
  name: string;
};

type LoraRow = {
  id: string;
  name: string;
};

export default function App() {
  const [images, setImages] = useState<ImageRow[]>([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [activeView, setActiveView] = useState<"gallery" | "tags" | "settings">("gallery");
  const [selectedImage, setSelectedImage] = useState<ImageRow | null>(null);
  const [activeTags, setActiveTags] = useState<string[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [indexerStatus, setIndexerStatus] = useState<string>("unknown");
  const [models, setModels] = useState<string[]>([]);
  const [loras, setLoras] = useState<string[]>([]);
  const [selectedModel, setSelectedModel] = useState("");
  const [selectedLora, setSelectedLora] = useState("");

  useEffect(() => {
    let active = true;
    async function load(reset: boolean) {
      try {
        if (reset) {
          setInitialLoading(true);
          setError(null);
        } else {
          setLoadingMore(true);
        }
        const url = new URL(`${API_URL}/images`);
        url.searchParams.set("pageSize", "60");
        if (query) url.searchParams.set("text", query);
        if (activeTags.length) url.searchParams.set("tags", activeTags.join(","));
        if (activeCategory) url.searchParams.set("category", activeCategory);
        if (selectedModel) url.searchParams.set("model", selectedModel);
        if (selectedLora) url.searchParams.set("lora", selectedLora);
        if (!reset && cursor) url.searchParams.set("cursor", cursor);
        const res = await fetch(url.toString());
        if (!res.ok) throw new Error("Failed to load images");
        const data = await res.json();
        if (!active) return;
        const rows = (data.rows ?? []) as ImageRow[];
        setImages((prev) => (reset ? rows : [...prev, ...rows]));
        setCursor(data.nextCursor ?? null);
        setHasMore(Boolean(data.nextCursor));
      } catch (err) {
        if (active) setError((err as Error).message);
      } finally {
        if (active) {
          setInitialLoading(false);
          setLoadingMore(false);
        }
      }
    }
    load(true);
    return () => {
      active = false;
    };
  }, [query, activeTags, activeCategory, selectedModel, selectedLora]);

  useEffect(() => {
    let active = true;
    async function loadCategories() {
      try {
        const res = await fetch(`${API_URL}/categories`);
        const data = await res.json();
        if (!active) return;
        const rows = (data.rows ?? []) as Category[];
        setCategories(rows.filter((row) => row.name));
      } catch {
        if (active) setCategories([]);
      }
    }
    loadCategories();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    async function loadFilters() {
      try {
        const [modelsRes, lorasRes] = await Promise.all([
          fetch(`${API_URL}/models`),
          fetch(`${API_URL}/loras`),
        ]);
        const modelsData = await modelsRes.json();
        const lorasData = await lorasRes.json();
        if (!active) return;
        setModels((modelsData.rows ?? []).map((row: ModelRow) => row.name).filter(Boolean));
        setLoras((lorasData.rows ?? []).map((row: LoraRow) => row.name).filter(Boolean));
      } catch {
        if (active) {
          setModels([]);
          setLoras([]);
        }
      }
    }
    loadFilters();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    async function pollStatus() {
      try {
        const res = await fetch(`${API_URL}/indexer-status`);
        const data = await res.json();
        if (active) setIndexerStatus(data.status ?? "unknown");
      } catch {
        if (active) setIndexerStatus("unknown");
      }
    }
    pollStatus();
    const timer = window.setInterval(pollStatus, 5000);
    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, []);

  async function loadMore() {
    if (loadingMore || !hasMore) return;
    const url = new URL(`${API_URL}/images`);
    url.searchParams.set("pageSize", "60");
    if (query) url.searchParams.set("text", query);
    if (activeTags.length) url.searchParams.set("tags", activeTags.join(","));
    if (activeCategory) url.searchParams.set("category", activeCategory);
    if (selectedModel) url.searchParams.set("model", selectedModel);
    if (selectedLora) url.searchParams.set("lora", selectedLora);
    if (cursor) url.searchParams.set("cursor", cursor);
    try {
      setLoadingMore(true);
      const res = await fetch(url.toString());
      if (!res.ok) throw new Error("Failed to load images");
      const data = await res.json();
      const rows = (data.rows ?? []) as ImageRow[];
      setImages((prev) => [...prev, ...rows]);
      setCursor(data.nextCursor ?? null);
      setHasMore(Boolean(data.nextCursor));
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoadingMore(false);
    }
  }

  function handleTagClick(tag: string) {
    setActiveTags((prev) => (prev.includes(tag) ? prev : [...prev, tag]));
  }

  return (
    <div className="min-h-screen">
      <Topbar activeView={activeView} onChange={setActiveView} />

      <main className="mx-auto mt-8 flex w-full max-w-6xl flex-col gap-6 px-4 pb-16">
        {activeView === "gallery" ? (
          <>
            <SearchBar
              query={query}
              onChange={setQuery}
              onToggleFilters={() => setFiltersOpen((prev) => !prev)}
              filtersOpen={filtersOpen}
            />
            <CategoriesBar
              categories={categories}
              activeCategory={activeCategory}
              onSelect={setActiveCategory}
            />
            <ActiveTags
              tags={activeTags}
              onRemove={(tag) => setActiveTags((prev) => prev.filter((t) => t !== tag))}
              onClear={() => setActiveTags([])}
            />
            <section
              className={`grid gap-6 ${filtersOpen ? "lg:grid-cols-[320px_1fr]" : "lg:grid-cols-1"}`}
            >
              <FiltersPanel
                collapsed={!filtersOpen}
                models={models}
                loras={loras}
                selectedModel={selectedModel}
                selectedLora={selectedLora}
                onModelChange={setSelectedModel}
                onLoraChange={setSelectedLora}
              />
              <div className="space-y-4">
                <GalleryGrid
                  images={images}
                  loading={initialLoading}
                  error={error}
                  onSelect={setSelectedImage}
                  onTagClick={handleTagClick}
                />
                {hasMore && !initialLoading ? (
                  <button
                    onClick={loadMore}
                    disabled={loadingMore}
                    className="w-full rounded-xl border border-accent/50 bg-white/5 px-3 py-3 text-sm text-accent transition hover:border-accent hover:bg-white/10 disabled:opacity-50"
                  >
                    {loadingMore ? "Loading more..." : "Load more"}
                  </button>
                ) : null}
              </div>
            </section>
          </>
        ) : null}

        {activeView === "tags" ? (
          <TagsCategoriesView
            onCategorySelect={(name) => {
              setActiveCategory(name);
              setActiveView("gallery");
            }}
            onTagSelect={(name) => {
              handleTagClick(name);
              setActiveView("gallery");
            }}
          />
        ) : null}

        {activeView === "settings" ? (
          <SettingsView
            totalImages={images.length}
            activeFilters={query ? 1 : 0}
            onReindex={async () => {
              await fetch(`${API_URL}/reindex`, { method: "POST" });
              setIndexerStatus("active");
            }}
            indexerStatus={indexerStatus}
          />
        ) : null}
      </main>
      {selectedImage ? (
        <ImageDetailModal
          image={selectedImage}
          onClose={() => setSelectedImage(null)}
          onTagClick={(tag) => {
            handleTagClick(tag);
            setSelectedImage(null);
          }}
        />
      ) : null}
      <CornerLinks />
    </div>
  );
}
