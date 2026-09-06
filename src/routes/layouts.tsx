import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  Clock,
  CloudSun,
  Copy,
  Image as ImageIcon,
  Layers,
  Monitor,
  PenSquare,
  Plus,
  RectangleHorizontal,
  RectangleVertical,
  Search,
  Trash2,
  Type as TypeIcon,
  Video,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/layouts")({
  head: () => ({
    meta: [
      { title: "All Layouts — Signage Layout Editor" },
      {
        name: "description",
        content:
          "Browse, open, duplicate and manage every saved digital signage screen layout in one place.",
      },
      { property: "og:title", content: "All Layouts — Signage Layout Editor" },
      {
        property: "og:description",
        content: "Browse, open, duplicate and manage every saved digital signage screen layout.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: LayoutsPage,
});

type ZoneKind = "video" | "image" | "ticker" | "clock" | "weather" | "web";

type Zone = {
  id: string;
  name: string;
  kind: ZoneKind;
  x: number;
  y: number;
  w: number;
  h: number;
  locked: boolean;
  opacity: number;
};

const KIND_ICON: Record<ZoneKind, typeof Video> = {
  video: Video,
  image: ImageIcon,
  ticker: TypeIcon,
  clock: Clock,
  weather: CloudSun,
  web: Monitor,
};

const ZONE_TONE: Record<ZoneKind, string> = {
  video: "var(--zone-1)",
  image: "var(--zone-2)",
  ticker: "var(--zone-3)",
  clock: "var(--zone-4)",
  weather: "var(--zone-5)",
  web: "var(--zone-2)",
};

type Preset = { id: string; label: string; ratio: number; icon: typeof RectangleHorizontal };

const PRESETS: Preset[] = [
  { id: "landscape", label: "16:9 Landscape", ratio: 16 / 9, icon: RectangleHorizontal },
  { id: "portrait", label: "9:16 Portrait", ratio: 9 / 16, icon: RectangleVertical },
  { id: "ultrawide", label: "32:9 Video wall", ratio: 32 / 9, icon: RectangleHorizontal },
];

const uid = () => Math.random().toString(36).slice(2, 9);

const EDITOR_KEY = "signage-layout-editor:v1";
const LIBRARY_KEY = "signage-layout-editor:layouts:v1";

type LayoutEntry = {
  id: string;
  name: string;
  presetId: string;
  zones: Zone[];
  savedAt: string; // ISO
};

const DEFAULT_SETTINGS = {
  snapToGrid: true,
  gridSize: 2.5,
  showGrid: true,
  alignSnap: true,
  threshold: 8,
};

function sampleLayouts(): LayoutEntry[] {
  const z = (name: string, kind: ZoneKind, x: number, y: number, w: number, h: number): Zone => ({
    id: uid(),
    name,
    kind,
    x,
    y,
    w,
    h,
    locked: false,
    opacity: 100,
  });
  const now = Date.now();
  return [
    {
      id: uid(),
      name: "Lobby — Morning loop",
      presetId: "landscape",
      savedAt: new Date(now - 1000 * 60 * 12).toISOString(),
      zones: [
        z("Main feature", "video", 0, 0, 70, 78),
        z("Promo panel", "image", 70, 0, 30, 44),
        z("Local weather", "weather", 70, 44, 30, 34),
        z("News ticker", "ticker", 0, 78, 80, 22),
        z("Clock", "clock", 80, 78, 20, 22),
      ],
    },
    {
      id: uid(),
      name: "Cafeteria menu board",
      presetId: "landscape",
      savedAt: new Date(now - 1000 * 60 * 60 * 3).toISOString(),
      zones: [
        z("Menu left", "image", 0, 0, 50, 80),
        z("Menu right", "image", 50, 0, 50, 80),
        z("Ticker", "ticker", 0, 80, 100, 20),
      ],
    },
    {
      id: uid(),
      name: "Elevator portrait",
      presetId: "portrait",
      savedAt: new Date(now - 1000 * 60 * 60 * 26).toISOString(),
      zones: [
        z("Headline video", "video", 0, 0, 100, 55),
        z("Weather", "weather", 0, 55, 50, 25),
        z("Clock", "clock", 50, 55, 50, 25),
        z("Ticker", "ticker", 0, 80, 100, 20),
      ],
    },
    {
      id: uid(),
      name: "Reception video wall",
      presetId: "ultrawide",
      savedAt: new Date(now - 1000 * 60 * 60 * 50).toISOString(),
      zones: [
        z("Brand film", "video", 0, 0, 62.5, 100),
        z("Dashboard", "web", 62.5, 0, 37.5, 70),
        z("Clock", "clock", 62.5, 70, 37.5, 30),
      ],
    },
    {
      id: uid(),
      name: "Wayfinding totem",
      presetId: "portrait",
      savedAt: new Date(now - 1000 * 60 * 60 * 80).toISOString(),
      zones: [
        z("Directory", "web", 0, 0, 100, 70),
        z("Promo", "image", 0, 70, 100, 30),
      ],
    },
    {
      id: uid(),
      name: "Town hall all-hands",
      presetId: "landscape",
      savedAt: new Date(now - 1000 * 60 * 60 * 120).toISOString(),
      zones: [
        z("Stream", "video", 0, 0, 100, 75),
        z("Agenda", "web", 0, 75, 70, 25),
        z("Clock", "clock", 70, 75, 30, 25),
      ],
    },
  ];
}

function timeAgo(iso: string) {
  const mins = Math.max(1, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  return `${days}d ago`;
}

function MiniPreview({ entry }: { entry: LayoutEntry }) {
  const preset = PRESETS.find((p) => p.id === entry.presetId) ?? PRESETS[0]!;
  return (
    <div className="flex h-36 items-center justify-center border-b border-border bg-surface px-6 py-3">
      <div
        className="relative max-h-full max-w-full overflow-hidden rounded-sm border border-border bg-background"
        style={{ aspectRatio: String(preset.ratio), height: "100%" }}
      >
        {entry.zones.map((zone) => {
          const Icon = KIND_ICON[zone.kind];
          return (
            <div
              key={zone.id}
              className="absolute grid place-items-center"
              style={{
                left: `${zone.x}%`,
                top: `${zone.y}%`,
                width: `${zone.w}%`,
                height: `${zone.h}%`,
                background: `color-mix(in oklch, ${ZONE_TONE[zone.kind]} 22%, transparent)`,
                boxShadow: `inset 0 0 0 1px color-mix(in oklch, ${ZONE_TONE[zone.kind]} 55%, transparent)`,
              }}
            >
              <Icon className="size-3 opacity-70" style={{ color: ZONE_TONE[zone.kind] }} />
            </div>
          );
        })}
      </div>
    </div>
  );
}

function LayoutsPage() {
  const navigate = useNavigate();
  const [layouts, setLayouts] = useState<LayoutEntry[]>([]);
  const [query, setQuery] = useState("");
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(LIBRARY_KEY);
      if (raw) {
        setLayouts(JSON.parse(raw) as LayoutEntry[]);
      } else {
        const seeded = sampleLayouts();
        // Fold the editor's currently saved single layout into the library, if any.
        const current = localStorage.getItem(EDITOR_KEY);
        if (current) {
          const data = JSON.parse(current) as Partial<LayoutEntry>;
          if (data.zones && data.name) {
            seeded.unshift({
              id: uid(),
              name: data.name,
              presetId: data.presetId ?? "landscape",
              zones: data.zones,
              savedAt: new Date().toISOString(),
            });
          }
        }
        setLayouts(seeded);
        localStorage.setItem(LIBRARY_KEY, JSON.stringify(seeded));
      }
    } catch {
      /* ignore */
    }
    setLoaded(true);
  }, []);

  const persist = (next: LayoutEntry[]) => {
    setLayouts(next);
    try {
      localStorage.setItem(LIBRARY_KEY, JSON.stringify(next));
    } catch {
      /* ignore */
    }
  };

  const openInEditor = (entry: LayoutEntry) => {
    try {
      localStorage.setItem(
        EDITOR_KEY,
        JSON.stringify({
          zones: entry.zones,
          name: entry.name,
          presetId: entry.presetId,
          settings: DEFAULT_SETTINGS,
        }),
      );
    } catch {
      /* ignore */
    }
    navigate({ to: "/" });
  };

  const duplicate = (entry: LayoutEntry) => {
    const copy: LayoutEntry = {
      ...entry,
      id: uid(),
      name: `${entry.name} copy`,
      zones: entry.zones.map((zone) => ({ ...zone, id: uid() })),
      savedAt: new Date().toISOString(),
    };
    const next = [copy, ...layouts];
    persist(next);
    toast.success("Layout duplicated", { description: copy.name });
  };

  const remove = (entry: LayoutEntry) => {
    persist(layouts.filter((l) => l.id !== entry.id));
    toast("Layout deleted", { description: entry.name });
  };

  const createNew = () => {
    const entry: LayoutEntry = {
      id: uid(),
      name: "Untitled layout",
      presetId: "landscape",
      zones: [
        { id: uid(), name: "Main feature", kind: "video", x: 0, y: 0, w: 100, h: 100, locked: false, opacity: 100 },
      ],
      savedAt: new Date().toISOString(),
    };
    persist([entry, ...layouts]);
    openInEditor(entry);
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = q ? layouts.filter((l) => l.name.toLowerCase().includes(q)) : layouts;
    return [...list].sort((a, b) => +new Date(b.savedAt) - +new Date(a.savedAt));
  }, [layouts, query]);

  return (
    <div className="flex min-h-screen flex-col bg-surface text-foreground">
      <Toaster />
      <header className="flex shrink-0 items-center gap-3 border-b border-border bg-card px-4 py-2.5">
        <div className="flex items-center gap-2">
          <span className="grid size-8 place-items-center rounded-md bg-primary text-primary-foreground">
            <Layers className="size-4" />
          </span>
          <div>
            <h1 className="text-sm font-semibold leading-tight">Signage Layout Editor</h1>
            <p className="label-caps">Layouts</p>
          </div>
        </div>
        <nav className="ml-4 flex items-center gap-1 text-sm">
          <span className="rounded-md bg-secondary px-2.5 py-1 font-medium text-primary">Layouts</span>
          <Link to="/" className="rounded-md px-2.5 py-1 text-muted-foreground hover:bg-secondary hover:text-foreground">
            Editor
          </Link>
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search layouts"
              aria-label="Search layouts"
              className="h-8 w-56 bg-secondary pl-8 text-sm"
            />
          </div>
          <Button size="sm" onClick={createNew}>
            <Plus className="size-4" /> New layout
          </Button>
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl flex-1 px-6 py-6">
        <div className="mb-4 flex items-baseline justify-between">
          <p className="label-caps">
            {filtered.length} layout{filtered.length === 1 ? "" : "s"}
          </p>
        </div>

        {!loaded ? null : filtered.length === 0 ? (
          <div className="panel grid place-items-center gap-3 py-20 text-center">
            <p className="text-sm text-muted-foreground">No layouts match “{query}”.</p>
            <Button variant="secondary" size="sm" onClick={() => setQuery("")}>
              Clear search
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            <button
              onClick={createNew}
              className="group flex min-h-56 flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border bg-card/50 text-muted-foreground transition-colors hover:border-primary/60 hover:text-primary"
            >
              <Plus className="size-6" />
              <span className="text-sm font-medium">New layout</span>
            </button>

            {filtered.map((entry) => {
              const preset = PRESETS.find((p) => p.id === entry.presetId) ?? PRESETS[0]!;
              return (
                <article
                  key={entry.id}
                  className="panel group overflow-hidden transition-shadow duration-200 hover:-translate-y-0.5 hover:shadow-lg"
                >
                  <button
                    onClick={() => openInEditor(entry)}
                    className="block w-full text-left"
                    aria-label={`Open ${entry.name} in editor`}
                  >
                    <MiniPreview entry={entry} />
                  </button>
                  <div className="space-y-2 p-3.5">
                    <div className="flex items-start justify-between gap-2">
                      <h2 className="text-sm font-semibold leading-tight">{entry.name}</h2>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span className="inline-flex items-center gap-1 rounded-sm bg-secondary px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wide">
                        <preset.icon className="size-3" />
                        {preset.label}
                      </span>
                      <span>{entry.zones.length} zones</span>
                      <span className="ml-auto">{timeAgo(entry.savedAt)}</span>
                    </div>
                    <div className="flex items-center gap-1.5 border-t border-border pt-2.5">
                      <Button size="sm" variant="secondary" className="h-7 flex-1 text-xs" onClick={() => openInEditor(entry)}>
                        <PenSquare className="size-3.5" /> Open
                      </Button>
                      <Button size="sm" variant="ghost" className="h-7 px-2" onClick={() => duplicate(entry)} aria-label={`Duplicate ${entry.name}`}>
                        <Copy className="size-3.5" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 px-2 text-destructive hover:text-destructive"
                        onClick={() => remove(entry)}
                        aria-label={`Delete ${entry.name}`}
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
