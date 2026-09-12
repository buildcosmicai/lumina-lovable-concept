import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useRef, useState, type ChangeEvent } from "react";
import {
  Activity, CalendarDays, Check, ChevronLeft, ChevronRight, Download, FileImage,
  FileVideo, Folder as FolderIcon, FolderPlus, Gauge, Grid2X2, Image as ImageIcon,
  Images, Info, KeyRound, Layers, List, ListVideo, Monitor, MoreHorizontal, Pencil,
  Play, Plus, Search, Settings, SlidersHorizontal, Trash2, Upload, Users, Video, X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Toaster } from "@/components/ui/sonner";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import lobbyImage from "@/assets/media-lobby.jpg";
import menuImage from "@/assets/media-menu.jpg";
import motionImage from "@/assets/media-motion.jpg";
import cityImage from "@/assets/media-city.jpg";

export const Route = createFileRoute("/media")({
  head: () => ({
    meta: [
      { title: "Media Library — Signage CMS" },
      { name: "description", content: "Upload, organize and manage images and videos for digital signage screens." },
      { property: "og:title", content: "Media Library — Signage CMS" },
      { property: "og:description", content: "Upload, organize and manage digital signage media." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: MediaPage,
});

type MediaKind = "image" | "video";
type MediaItem = {
  id: string; name: string; kind: MediaKind; src: string; size: string; dimensions: string;
  duration?: string; added: string; folder: string; usedIn: string[];
};

const NAV_ITEMS = [
  { label: "Control Center", icon: Gauge }, { label: "Pulse", icon: Activity },
  { label: "Screens", icon: Monitor }, { label: "Schedules", icon: CalendarDays },
  { label: "Media", icon: Images, to: "/media" as const }, { label: "Playlists", icon: ListVideo },
  { label: "Layouts", icon: Layers, to: "/layouts" as const }, { label: "Licensing", icon: KeyRound },
  { label: "Users", icon: Users },
];

const START_MEDIA: MediaItem[] = [
  { id: "lobby", name: "Lobby morning.jpg", kind: "image", src: lobbyImage, size: "3.8 MB", dimensions: "1920 × 1080", added: "Today, 09:42", folder: "Brand assets", usedIn: ["Lobby — Morning loop", "Reception video wall"] },
  { id: "menu", name: "Harvest bowl.jpg", kind: "image", src: menuImage, size: "2.4 MB", dimensions: "1920 × 1080", added: "Yesterday", folder: "Menu boards", usedIn: ["Cafeteria menu board"] },
  { id: "motion", name: "Brand motion.mp4", kind: "video", src: motionImage, size: "18.6 MB", dimensions: "1920 × 1080", duration: "00:18", added: "Sep 8, 2026", folder: "Brand assets", usedIn: ["Reception video wall", "Town hall all-hands"] },
  { id: "city", name: "City sunrise.jpg", kind: "image", src: cityImage, size: "4.1 MB", dimensions: "2560 × 1440", added: "Sep 7, 2026", folder: "Campaigns", usedIn: ["Elevator portrait"] },
  { id: "welcome", name: "Welcome sequence.mp4", kind: "video", src: lobbyImage, size: "42.8 MB", dimensions: "3840 × 2160", duration: "00:32", added: "Sep 5, 2026", folder: "Campaigns", usedIn: ["Lobby — Morning loop"] },
  { id: "menu-detail", name: "Seasonal menu.jpg", kind: "image", src: menuImage, size: "2.9 MB", dimensions: "1080 × 1920", added: "Sep 3, 2026", folder: "Menu boards", usedIn: [] },
  { id: "ambient", name: "Ambient waves.mp4", kind: "video", src: motionImage, size: "27.2 MB", dimensions: "1920 × 1080", duration: "00:24", added: "Aug 29, 2026", folder: "Unfiled", usedIn: [] },
  { id: "skyline", name: "City panorama.jpg", kind: "image", src: cityImage, size: "5.6 MB", dimensions: "3840 × 1080", added: "Aug 24, 2026", folder: "Campaigns", usedIn: ["Reception video wall"] },
];

const uid = () => Math.random().toString(36).slice(2, 9);

function MediaPage() {
  const uploadRef = useRef<HTMLInputElement>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [items, setItems] = useState(START_MEDIA);
  const [selectedId, setSelectedId] = useState(START_MEDIA[0].id);
  const [query, setQuery] = useState("");
  const [kind, setKind] = useState<"all" | MediaKind>("all");
  const [folder, setFolder] = useState("All media");
  const [folders, setFolders] = useState(["Brand assets", "Campaigns", "Menu boards"]);
  const [creatingFolder, setCreatingFolder] = useState(false);
  const [folderName, setFolderName] = useState("");
  const [view, setView] = useState<"grid" | "list">("grid");
  const selected = items.find((item) => item.id === selectedId) ?? null;

  const visible = useMemo(() => items.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(query.trim().toLowerCase());
    const matchesKind = kind === "all" || item.kind === kind;
    const matchesFolder = folder === "All media" || folder === item.folder;
    return matchesSearch && matchesKind && matchesFolder;
  }), [items, query, kind, folder]);

  const addFolder = () => {
    const name = folderName.trim();
    if (!name) return;
    if (!folders.includes(name)) setFolders((current) => [...current, name]);
    setFolder(name); setFolderName(""); setCreatingFolder(false);
    toast.success("Folder created", { description: name });
  };

  const handleUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    if (!files.length) return;
    const additions = files.map((file) => ({
      id: uid(), name: file.name, kind: file.type.startsWith("video/") ? "video" as const : "image" as const,
      src: file.type.startsWith("video/") ? motionImage : lobbyImage,
      size: `${Math.max(.1, file.size / 1024 / 1024).toFixed(1)} MB`, dimensions: "Processing…",
      added: "Just now", folder: folder === "All media" ? "Unfiled" : folder, usedIn: [],
    }));
    setItems((current) => [...additions, ...current]); setSelectedId(additions[0].id);
    toast.success(`${files.length} file${files.length === 1 ? "" : "s"} uploaded`);
    event.target.value = "";
  };

  const removeItem = (item: MediaItem) => {
    setItems((current) => current.filter((candidate) => candidate.id !== item.id));
    if (selectedId === item.id) setSelectedId("");
    toast("Media deleted", { description: item.name });
  };

  const navAction = (label: string) => toast(label, { description: "This section is not connected yet." });

  return (
    <div className="flex h-screen min-w-[760px] overflow-hidden bg-surface text-foreground">
      <Toaster />
      <input ref={uploadRef} type="file" multiple accept="image/*,video/*" className="hidden" onChange={handleUpload} />
      <aside className={cn("relative flex h-screen shrink-0 border-r border-border bg-card transition-[width] duration-200", sidebarOpen ? "w-72" : "w-16")}>
        <div className="flex w-16 shrink-0 flex-col items-center border-r border-border bg-surface py-3">
          <Link to="/layouts" aria-label="Layouts home" className="mb-5 grid size-9 place-items-center rounded-md bg-primary text-primary-foreground shadow-sm"><Layers className="size-4" /></Link>
          <nav aria-label="Primary navigation" className="flex flex-col items-center gap-0.5">
            {NAV_ITEMS.map((item) => item.to ? (
              <Button key={item.label} asChild variant="ghost" size="icon" className={cn("size-9 text-muted-foreground", item.to === "/media" && "bg-primary/15 text-primary hover:bg-primary/20 hover:text-primary")}>
                <Link to={item.to} title={item.label} aria-label={item.label}><item.icon className="size-4" /></Link>
              </Button>
            ) : (
              <Button key={item.label} variant="ghost" size="icon" title={item.label} aria-label={item.label} onClick={() => navAction(item.label)} className="size-9 text-muted-foreground"><item.icon className="size-4" /></Button>
            ))}
          </nav>
          <Button variant="ghost" size="icon" title="Settings" aria-label="Settings" className="mt-auto size-9 text-muted-foreground" onClick={() => navAction("Settings")}><Settings className="size-4" /></Button>
        </div>

        {sidebarOpen && <div className="flex min-w-0 flex-1 flex-col overflow-y-auto px-4 py-3">
          <div className="mb-5 flex h-9 items-center justify-between gap-2">
            <div className="flex items-baseline gap-2"><p className="font-display text-sm font-semibold">Signage CMS</p><p className="label-caps">Workspace</p></div>
            <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(false)} aria-label="Collapse sidebar" title="Collapse sidebar" className="size-7 text-muted-foreground"><ChevronLeft className="size-3.5" /></Button>
          </div>
          <nav aria-label="Primary navigation" className="flex flex-col gap-0.5">
            {NAV_ITEMS.map((item) => item.to ? (
              <Button key={item.label} asChild variant="ghost" className={cn("h-9 w-full justify-start gap-3 px-2 text-sm font-normal text-muted-foreground", item.to === "/media" && "bg-primary/15 font-semibold text-primary hover:bg-primary/20 hover:text-primary")}>
                <Link to={item.to}><item.icon className="size-4 shrink-0" />{item.label}</Link>
              </Button>
            ) : (
              <Button key={item.label} variant="ghost" onClick={() => navAction(item.label)} className="h-9 w-full justify-start gap-3 px-2 text-sm font-normal text-muted-foreground"><item.icon className="size-4 shrink-0" />{item.label}</Button>
            ))}
          </nav>
          <section className="mt-1 border-t border-border pt-4">
            <div className="mb-2 flex items-center justify-between px-2"><p className="label-caps">Media folders</p><Button variant="ghost" size="icon" onClick={() => setCreatingFolder(true)} className="size-6 text-muted-foreground hover:text-primary" aria-label="New folder" title="New folder"><FolderPlus className="size-3.5" /></Button></div>
            {creatingFolder && <div className="mb-2 flex items-center gap-1"><Input autoFocus value={folderName} onChange={(e) => setFolderName(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") addFolder(); if (e.key === "Escape") setCreatingFolder(false); }} placeholder="Folder name" className="h-7 flex-1 text-xs" /><Button variant="ghost" size="icon" onClick={addFolder} aria-label="Create folder" className="size-6 text-primary"><Check className="size-3.5" /></Button><Button variant="ghost" size="icon" onClick={() => setCreatingFolder(false)} aria-label="Cancel" className="size-6 text-muted-foreground"><X className="size-3.5" /></Button></div>}
            {["All media", "Unfiled", ...folders].map((name) => <Button key={name} variant="ghost" onClick={() => setFolder(name)} className={cn("h-8 w-full justify-start gap-2 px-2.5 text-sm font-normal", folder === name ? "bg-secondary font-medium text-primary" : "text-muted-foreground")}><FolderIcon className="size-3.5" /><span className="min-w-0 flex-1 truncate text-left">{name}</span><span className="font-mono text-[10px] text-muted-foreground">{name === "All media" ? items.length : items.filter((item) => item.folder === name).length}</span></Button>)}
          </section>
          <div className="mt-auto border-t border-border pt-4"><div className="mb-2 flex items-center justify-between text-xs"><span className="text-muted-foreground">Storage</span><span className="font-mono text-[10px]">2.4 / 10 GB</span></div><div className="h-1.5 overflow-hidden rounded-full bg-secondary"><div className="h-full w-1/4 rounded-full bg-accent" /></div></div>
        </div>}
        {!sidebarOpen && <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(true)} aria-label="Expand sidebar" title="Expand sidebar" className="absolute left-11 top-3 size-7 border border-border bg-card text-muted-foreground shadow-sm"><ChevronRight className="size-3.5" /></Button>}
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 shrink-0 items-center gap-3 border-b border-border bg-card px-5">
          <div><h1 className="font-display text-base font-semibold leading-tight">Media</h1><p className="text-xs text-muted-foreground">Manage images and videos for your screens</p></div>
          <div className="ml-auto flex items-center gap-2"><div className="relative"><Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" /><Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search media" aria-label="Search media" className="h-8 w-52 bg-secondary pl-8 text-sm" /></div><Button size="sm" onClick={() => uploadRef.current?.click()}><Upload className="size-4" /> Upload media</Button></div>
        </header>

        <div className="flex min-h-0 flex-1">
          <main className="min-w-0 flex-1 overflow-y-auto px-6 py-5">
            <div className="mb-5 flex items-center gap-2">
              <div className="flex items-center gap-1 rounded-md border border-border bg-card p-1">
                {(["all", "image", "video"] as const).map((value) => <Button key={value} variant="ghost" size="sm" onClick={() => setKind(value)} className={cn("h-7 px-3 text-xs capitalize", kind === value && "bg-secondary text-foreground")}>{value === "all" ? "All files" : `${value}s`}</Button>)}
              </div>
              <Button variant="outline" size="sm" className="h-9 text-xs" onClick={() => toast("Filters", { description: "Showing the latest files first." })}><SlidersHorizontal className="size-3.5" /> Filters</Button>
              <p className="ml-auto label-caps">{visible.length} item{visible.length === 1 ? "" : "s"}</p>
              <div className="flex rounded-md border border-border bg-card p-0.5"><Button variant="ghost" size="icon" onClick={() => setView("grid")} aria-label="Grid view" title="Grid view" className={cn("size-7", view === "grid" && "bg-secondary text-primary")}><Grid2X2 className="size-3.5" /></Button><Button variant="ghost" size="icon" onClick={() => setView("list")} aria-label="List view" title="List view" className={cn("size-7", view === "list" && "bg-secondary text-primary")}><List className="size-3.5" /></Button></div>
            </div>

            {visible.length === 0 ? <div className="panel grid min-h-72 place-items-center text-center"><div><Search className="mx-auto mb-3 size-7 text-muted-foreground" /><p className="text-sm font-medium">No media found</p><p className="mt-1 text-xs text-muted-foreground">Try another search or folder.</p></div></div> : view === "grid" ? (
              <div className="grid grid-cols-2 gap-4 xl:grid-cols-3 2xl:grid-cols-4">
                <Button variant="ghost" onClick={() => uploadRef.current?.click()} className="h-auto min-h-52 flex-col gap-2 rounded-lg border border-dashed border-border bg-card/50 text-muted-foreground hover:border-primary/60 hover:bg-card hover:text-primary"><Upload className="size-6" /><span className="text-sm font-medium">Upload files</span></Button>
                {visible.map((item) => <MediaCard key={item.id} item={item} active={item.id === selectedId} onSelect={() => setSelectedId(item.id)} onDelete={() => removeItem(item)} />)}
              </div>
            ) : (
              <div className="panel overflow-hidden"><div className="grid grid-cols-[44px_minmax(180px,1fr)_90px_110px_120px_36px] gap-3 border-b border-border bg-secondary/60 px-3 py-2 label-caps"><span /><span>Name</span><span>Type</span><span>Size</span><span>Added</span><span /></div>{visible.map((item) => <div key={item.id} onClick={() => setSelectedId(item.id)} className={cn("grid cursor-pointer grid-cols-[44px_minmax(180px,1fr)_90px_110px_120px_36px] items-center gap-3 border-b border-border px-3 py-2.5 text-xs last:border-0 hover:bg-secondary/50", item.id === selectedId && "bg-primary/10")}><img src={item.src} alt="" width={80} height={45} className="h-8 w-11 rounded-sm object-cover" /><span className="truncate font-medium">{item.name}</span><span className="capitalize text-muted-foreground">{item.kind}</span><span className="font-mono text-[10px] text-muted-foreground">{item.size}</span><span className="text-muted-foreground">{item.added}</span><ItemMenu item={item} onDelete={() => removeItem(item)} /></div>)}</div>
            )}
          </main>
          {selected && <DetailsPanel item={selected} onClose={() => setSelectedId("")} onDelete={() => removeItem(selected)} />}
        </div>
      </div>
    </div>
  );
}

function MediaCard({ item, active, onSelect, onDelete }: { item: MediaItem; active: boolean; onSelect: () => void; onDelete: () => void }) {
  return <article className={cn("group overflow-hidden rounded-lg border bg-card transition-shadow", active ? "border-primary shadow-panel ring-1 ring-primary/20" : "border-border hover:shadow-panel")}>
    <Button variant="ghost" onClick={onSelect} className="relative block h-auto w-full rounded-none p-0"><img src={item.src} alt={`Preview of ${item.name}`} loading="lazy" width={1088} height={608} className="aspect-video w-full object-cover" />{item.kind === "video" && <span className="absolute inset-0 grid place-items-center bg-foreground/10"><span className="grid size-9 place-items-center rounded-full bg-card/90 text-foreground shadow-sm"><Play className="ml-0.5 size-4 fill-current" /></span></span>}<span className="absolute bottom-2 left-2 inline-flex items-center gap-1 rounded-sm bg-card/90 px-1.5 py-1 font-mono text-[9px] uppercase text-foreground shadow-sm">{item.kind === "video" ? <FileVideo className="size-3 text-accent" /> : <FileImage className="size-3 text-primary" />}{item.kind}{item.duration && ` · ${item.duration}`}</span></Button>
    <div className="flex items-center gap-2 p-3"><div className="min-w-0 flex-1"><h2 className="truncate text-sm font-medium">{item.name}</h2><p className="mt-0.5 font-mono text-[10px] text-muted-foreground">{item.dimensions} · {item.size}</p></div><ItemMenu item={item} onDelete={onDelete} /></div>
  </article>;
}

function ItemMenu({ item, onDelete }: { item: MediaItem; onDelete: () => void }) {
  return <DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" size="icon" onClick={(e) => e.stopPropagation()} aria-label={`Actions for ${item.name}`} className="size-8 shrink-0 text-muted-foreground"><MoreHorizontal className="size-4" /></Button></DropdownMenuTrigger><DropdownMenuContent align="end"><DropdownMenuItem onClick={() => toast("Rename", { description: item.name })}><Pencil className="size-3.5" /> Rename</DropdownMenuItem><DropdownMenuItem onClick={() => toast.success("Download started", { description: item.name })}><Download className="size-3.5" /> Download</DropdownMenuItem><DropdownMenuSeparator /><DropdownMenuItem variant="destructive" onClick={onDelete}><Trash2 className="size-3.5" /> Delete</DropdownMenuItem></DropdownMenuContent></DropdownMenu>;
}

function DetailsPanel({ item, onClose, onDelete }: { item: MediaItem; onClose: () => void; onDelete: () => void }) {
  return <aside className="w-72 shrink-0 overflow-y-auto border-l border-border bg-card"><div className="flex h-12 items-center justify-between border-b border-border px-4"><div className="flex items-center gap-2"><Info className="size-4 text-primary" /><h2 className="font-display text-sm font-semibold">File details</h2></div><Button variant="ghost" size="icon" onClick={onClose} aria-label="Close details" className="size-7 text-muted-foreground"><X className="size-3.5" /></Button></div><div className="p-4"><div className="relative overflow-hidden rounded-md border border-border bg-surface"><img src={item.src} alt={`Preview of ${item.name}`} width={1088} height={608} className="aspect-video w-full object-cover" />{item.kind === "video" && <span className="absolute inset-0 grid place-items-center"><span className="grid size-8 place-items-center rounded-full bg-card/90"><Play className="ml-0.5 size-3.5 fill-current" /></span></span>}</div><h3 className="mt-3 break-words text-sm font-semibold">{item.name}</h3><p className="mt-1 flex items-center gap-1.5 text-xs capitalize text-muted-foreground">{item.kind === "video" ? <Video className="size-3.5 text-accent" /> : <ImageIcon className="size-3.5 text-primary" />}{item.kind} file</p><dl className="mt-5 space-y-3 border-y border-border py-4 text-xs">{[["Dimensions", item.dimensions], ["File size", item.size], ["Added", item.added], ["Folder", item.folder], ...(item.duration ? [["Duration", item.duration]] : [])].map(([term, value]) => <div key={term} className="flex justify-between gap-4"><dt className="text-muted-foreground">{term}</dt><dd className="text-right font-medium">{value}</dd></div>)}</dl><div className="mt-5"><p className="label-caps mb-2">Used in</p>{item.usedIn.length ? <div className="space-y-1.5">{item.usedIn.map((layout) => <div key={layout} className="flex items-center gap-2 rounded-md bg-secondary px-2.5 py-2 text-xs"><Layers className="size-3.5 text-accent" /><span className="truncate">{layout}</span></div>)}</div> : <p className="text-xs text-muted-foreground">Not used in any layouts.</p>}</div><div className="mt-6 grid grid-cols-2 gap-2"><Button variant="outline" size="sm" onClick={() => toast.success("Download started", { description: item.name })}><Download className="size-3.5" /> Download</Button><Button variant="outline" size="sm" className="text-destructive hover:text-destructive" onClick={onDelete}><Trash2 className="size-3.5" /> Delete</Button></div></div></aside>;
}
