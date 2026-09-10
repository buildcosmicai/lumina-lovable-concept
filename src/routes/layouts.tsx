import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
  CloudSun,
  Copy,
  Gauge,
  Folder as FolderIcon,
  FolderPlus,
  Image as ImageIcon,
  Images,
  KeyRound,
  Layers,
  ListVideo,
  Monitor,
  MoreHorizontal,
  PenSquare,
  Plus,
  RectangleHorizontal,
  RectangleVertical,
  Search,
  Settings,
  Trash2,
  Type as TypeIcon,
  Users,
  Video,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Toaster } from "@/components/ui/sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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

const NAV_ITEMS = [
  { label: "Control Center", icon: Gauge },
  { label: "Pulse", icon: Activity },
  { label: "Screens", icon: Monitor },
  { label: "Schedules", icon: CalendarDays },
  { label: "Media", icon: Images },
  { label: "Playlists", icon: ListVideo },
  { label: "Layouts", icon: Layers, active: true },
  { label: "Licensing", icon: KeyRound },
  { label: "Users", icon: Users },
];

const uid = () => Math.random().toString(36).slice(2, 9);

const EDITOR_KEY = "signage-layout-editor:v1";
const LIBRARY_KEY = "signage-layout-editor:layouts:v1";
const FOLDERS_KEY = "signage-layout-editor:folders:v1";

type Folder = { id: string; name: string };

type LayoutEntry = {
  id: string;
  name: string;
  presetId: string;
  zones: Zone[];
  savedAt: string; // ISO
  folderId?: string | null;
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
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [layouts, setLayouts] = useState<LayoutEntry[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [activeFolder, setActiveFolder] = useState<string | "all" | "unfiled">("all");
  const [creatingFolder, setCreatingFolder] = useState(false);
  const [folderName, setFolderName] = useState("");
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
    try {
      const fraw = localStorage.getItem(FOLDERS_KEY);
      if (fraw) setFolders(JSON.parse(fraw) as Folder[]);
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

  const persistFolders = (next: Folder[]) => {
    setFolders(next);
    try {
      localStorage.setItem(FOLDERS_KEY, JSON.stringify(next));
    } catch {
      /* ignore */
    }
  };

  const createFolder = () => {
    const name = folderName.trim();
    if (!name) return;
    const folder = { id: uid(), name };
    persistFolders([...folders, folder]);
    setFolderName("");
    setCreatingFolder(false);
    setActiveFolder(folder.id);
    toast.success("Folder created", { description: name });
  };

  const deleteFolder = (folder: Folder) => {
    persistFolders(folders.filter((f) => f.id !== folder.id));
    persist(layouts.map((l) => (l.folderId === folder.id ? { ...l, folderId: null } : l)));
    if (activeFolder === folder.id) setActiveFolder("all");
    toast("Folder deleted", { description: `${folder.name} — layouts kept, now unfiled` });
  };

  const moveToFolder = (entry: LayoutEntry, folderId: string | null) => {
    persist(layouts.map((l) => (l.id === entry.id ? { ...l, folderId } : l)));
    const target = folderId ? folders.find((f) => f.id === folderId)?.name : "Unfiled";
    toast.success("Layout moved", { description: `${entry.name} → ${target}` });
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
    const scoped =
      activeFolder === "all"
        ? layouts
        : activeFolder === "unfiled"
          ? layouts.filter((l) => !l.folderId)
          : layouts.filter((l) => l.folderId === activeFolder);
    const list = q ? scoped.filter((l) => l.name.toLowerCase().includes(q)) : scoped;
    return [...list].sort((a, b) => +new Date(b.savedAt) - +new Date(a.savedAt));
  }, [layouts, query, activeFolder]);

  return (
    <div className="flex min-h-screen bg-surface text-foreground">
      <Toaster />
      <aside className={cn("sticky top-0 flex h-screen shrink-0 border-r border-border bg-card transition-[width] duration-200", sidebarOpen ? "w-72" : "w-16")}>
        <div className="flex w-16 shrink-0 flex-col items-center border-r border-border bg-surface py-3">
          <Link to="/layouts" aria-label="Layouts home" className="mb-5 grid size-9 place-items-center rounded-md bg-primary text-primary-foreground shadow-sm">
            <Layers className="size-4" />
          </Link>
          <nav aria-label="Primary navigation" className="flex flex-col items-center gap-0.5">
            {NAV_ITEMS.map((item) => (
              <Button
                key={item.label}
                variant="ghost"
                size="icon"
                title={item.label}
                aria-label={item.label}
                onClick={() => item.active ? setActiveFolder("all") : toast(item.label, { description: "This section is not connected yet." })}
                className={cn("size-9 text-muted-foreground", item.active && "bg-primary/15 text-primary hover:bg-primary/20 hover:text-primary")}
              >
                <item.icon className="size-4" />
              </Button>
            ))}
          </nav>
          <Button variant="ghost" size="icon" title="Settings" aria-label="Settings" className="mt-auto size-9 text-muted-foreground" onClick={() => toast("Settings", { description: "This section is not connected yet." })}>
            <Settings className="size-4" />
          </Button>
        </div>

        {sidebarOpen && (
          <div className="flex min-w-0 flex-1 flex-col overflow-y-auto px-4 py-3">
            <div className="mb-5 flex h-9 items-center justify-between gap-2">
              <div className="flex items-baseline gap-2">
                <p className="font-display text-sm font-semibold">Signage CMS</p>
                <p className="label-caps">Workspace</p>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(false)} aria-label="Collapse sidebar" title="Collapse sidebar" className="size-7 text-muted-foreground">
                <ChevronLeft className="size-3.5" />
              </Button>
            </div>

            <nav aria-label="Primary navigation" className="flex flex-col gap-0.5">
              {NAV_ITEMS.map((item) => (
                <Button
                  key={item.label}
                  variant="ghost"
                  onClick={() => item.active ? setActiveFolder("all") : toast(item.label, { description: "This section is not connected yet." })}
                  className={cn("h-9 w-full justify-start gap-3 px-2 text-sm font-normal text-muted-foreground", item.active && "bg-primary/15 font-semibold text-primary hover:bg-primary/20 hover:text-primary")}
                >
                  <item.icon className="size-4 shrink-0" />
                  {item.label}
                </Button>
              ))}
            </nav>

            <section className="mt-1 border-t border-border pt-4">
              <div className="mb-2 flex items-center justify-between px-2">
                <p className="label-caps">Folders</p>
                <Button variant="ghost" size="icon" onClick={() => setCreatingFolder(true)} className="size-6 text-muted-foreground hover:text-primary" aria-label="New folder" title="New folder">
                  <FolderPlus className="size-3.5" />
                </Button>
              </div>
          {creatingFolder && (
            <div className="mb-2 flex items-center gap-1">
              <Input
                autoFocus
                value={folderName}
                onChange={(e) => setFolderName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") createFolder();
                  if (e.key === "Escape") {
                    setCreatingFolder(false);
                    setFolderName("");
                  }
                }}
                placeholder="Folder name"
                className="h-7 flex-1 text-xs"
              />
              <Button variant="ghost" size="icon" onClick={createFolder} aria-label="Create folder" className="size-6 text-primary">
                <Check className="size-3.5" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => { setCreatingFolder(false); setFolderName(""); }} aria-label="Cancel" className="size-6 text-muted-foreground">
                <X className="size-3.5" />
              </Button>
            </div>
          )}
          {(
            [
              { id: "all" as const, name: "All layouts", count: layouts.length },
              { id: "unfiled" as const, name: "Unfiled", count: layouts.filter((l) => !l.folderId).length },
              ...folders.map((f) => ({ ...f, count: layouts.filter((l) => l.folderId === f.id).length })),
            ]
          ).map((f) => (
            <div
              key={f.id}
              className={cn(
                "group flex w-full cursor-pointer items-center gap-2 rounded-md px-2.5 py-1.5 text-sm",
                activeFolder === f.id ? "bg-secondary font-medium text-primary" : "text-muted-foreground hover:bg-secondary hover:text-foreground",
              )}
              onClick={() => setActiveFolder(f.id)}
              role="button"
            >
              <FolderIcon className="size-3.5 shrink-0" />
              <span className="min-w-0 flex-1 truncate">{f.name}</span>
              <span className="font-mono text-[10px] text-muted-foreground">{f.count}</span>
              {f.id !== "all" && f.id !== "unfiled" && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteFolder(f as Folder & { count: number });
                  }}
                  aria-label={`Delete folder ${f.name}`}
                  className="hidden size-5 text-destructive group-hover:inline-flex"
                >
                  <Trash2 className="size-3" />
                </Button>
              )}
            </div>
          ))}
            </section>
          </div>
        )}
        {!sidebarOpen && (
          <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(true)} aria-label="Expand sidebar" title="Expand sidebar" className="absolute left-11 top-3 size-7 border border-border bg-card text-muted-foreground shadow-sm">
            <ChevronRight className="size-3.5" />
          </Button>
        )}
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex shrink-0 items-center gap-3 border-b border-border bg-card px-5 py-3">
          <div>
            <h1 className="font-display text-base font-semibold leading-tight">Layouts</h1>
            <p className="text-xs text-muted-foreground">Create and manage screen compositions</p>
          </div>
          <Link to="/" className="ml-3 rounded-md px-2.5 py-1 text-sm text-muted-foreground hover:bg-secondary hover:text-foreground">Editor</Link>
          <div className="ml-auto flex items-center gap-2">
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search layouts" aria-label="Search layouts" className="h-8 w-56 bg-secondary pl-8 text-sm" />
            </div>
            <Button size="sm" onClick={createNew}><Plus className="size-4" /> New layout</Button>
          </div>
        </header>

        <div className="mx-auto flex w-full max-w-7xl flex-1 px-6 py-6">

      <main className="min-w-0 flex-1">
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
      </div>
    </div>
  );
}
