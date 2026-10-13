import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  Activity, CalendarDays, ChevronLeft, ChevronRight, Clock, Copy, Film, Gauge, GripVertical, Image as ImageIcon, Images,
  KeyRound, Layers, ListVideo, Monitor, Pause, Play, Plus, Repeat, Search, Settings, Shuffle, SkipForward, Sparkles,
  Trash2, Type, Users, Wand2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/playlists")({
  head: () => ({
    meta: [
      { title: "Playlists — Signage CMS" },
      { name: "description", content: "Build signage playlists with drag-and-drop ordering, live preview, runtime insights and smart suggestions." },
      { property: "og:title", content: "Playlists — Signage CMS" },
      { property: "og:description", content: "Drag, preview and fine-tune what plays on every screen." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PlaylistsPage,
});

const NAV_ITEMS = [
  { label: "Control Center", icon: Gauge, to: "/control-center" as const },
  { label: "Pulse", icon: Activity, to: "/pulse" as const },
  { label: "Screens", icon: Monitor, to: "/screens" as const },
  { label: "Schedules", icon: CalendarDays, to: "/schedules" as const },
  { label: "Media", icon: Images, to: "/media" as const },
  { label: "Playlists", icon: ListVideo, to: "/playlists" as const },
  { label: "Layouts", icon: Layers, to: "/layouts" as const },
  { label: "Licensing", icon: KeyRound },
  { label: "Users", icon: Users, to: "/users" as const },
];

const TONES = ["bg-zone-1", "bg-zone-2", "bg-zone-3", "bg-zone-4", "bg-zone-5"];
type Kind = "Video" | "Image" | "Text";
type Item = { uid: number; name: string; kind: Kind; duration: number; tone: number; transition: "Cut" | "Fade" | "Slide" };
type Playlist = { id: number; name: string; screens: number; items: Item[]; loop: boolean; shuffle: boolean };

const KIND_ICON = { Video: Film, Image: ImageIcon, Text: Type };
const LIBRARY: Omit<Item, "uid" | "transition">[] = [
  { name: "Autumn launch film", kind: "Video", duration: 30, tone: 1 },
  { name: "Lunch menu", kind: "Image", duration: 12, tone: 0 },
  { name: "Wi-Fi details", kind: "Text", duration: 8, tone: 4 },
  { name: "Brand loop", kind: "Video", duration: 45, tone: 2 },
  { name: "Safety notice", kind: "Image", duration: 10, tone: 3 },
  { name: "Visitor welcome", kind: "Text", duration: 10, tone: 0 },
  { name: "Customer quote", kind: "Image", duration: 9, tone: 2 },
  { name: "Team spotlight", kind: "Video", duration: 25, tone: 4 },
];

let uidSeed = 100;
const mk = (i: number, transition: Item["transition"] = "Fade"): Item => ({ ...LIBRARY[i]!, uid: ++uidSeed, transition });

const SEED: Playlist[] = [
  { id: 1, name: "Lobby — daytime", screens: 6, loop: true, shuffle: false, items: [mk(5), mk(0), mk(4), mk(6), mk(2)] },
  { id: 2, name: "Cafeteria menus", screens: 4, loop: true, shuffle: false, items: [mk(1, "Slide"), mk(2), mk(4)] },
  { id: 3, name: "Brand evening", screens: 3, loop: true, shuffle: true, items: [mk(3), mk(7), mk(6)] },
  { id: 4, name: "Reception welcome", screens: 2, loop: false, shuffle: false, items: [mk(5), mk(2)] },
];

const fmt = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

function PlaylistsPage() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [lists, setLists] = useState(SEED);
  const [activeId, setActiveId] = useState(1);
  const [selectedUid, setSelectedUid] = useState<number | null>(null);
  const [dragUid, setDragUid] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);
  const [libQuery, setLibQuery] = useState("");
  const [playing, setPlaying] = useState(true);
  const [cursor, setCursor] = useState(0);
  const [elapsed, setElapsed] = useState(0);

  const list = lists.find((l) => l.id === activeId)!;
  const total = list.items.reduce((s, i) => s + i.duration, 0);
  const current = list.items[cursor % Math.max(1, list.items.length)];
  const selected = list.items.find((i) => i.uid === selectedUid) ?? null;
  const library = useMemo(() => LIBRARY.filter((l) => l.name.toLowerCase().includes(libQuery.toLowerCase())), [libQuery]);

  useEffect(() => { setCursor(0); setElapsed(0); setSelectedUid(null); }, [activeId]);
  useEffect(() => {
    if (!playing || !current) return;
    const t = setInterval(() => setElapsed((e) => {
      if (e + 1 >= current.duration) { setCursor((c) => (c + 1) % list.items.length); return 0; }
      return e + 1;
    }), 1000 / 4);
    return () => clearInterval(t);
  }, [playing, current, list.items.length]);

  const patchList = (patch: Partial<Playlist>) => setLists((all) => all.map((l) => (l.id === activeId ? { ...l, ...patch } : l)));
  const setItems = (items: Item[]) => patchList({ items });
  const patchItem = (uid: number, patch: Partial<Item>) => setItems(list.items.map((i) => (i.uid === uid ? { ...i, ...patch } : i)));
  const navAction = (label: string) => toast(label, { description: "This section is not connected yet." });

  const addFromLibrary = (idx: number, at = list.items.length) => {
    const src = LIBRARY.findIndex((l) => l.name === library[idx]?.name);
    if (src < 0) return;
    const items = [...list.items];
    items.splice(at, 0, mk(src));
    setItems(items);
    toast(`Added “${LIBRARY[src]!.name}”`);
  };

  const drop = (at: number, e: React.DragEvent) => {
    e.preventDefault();
    const libIdx = e.dataTransfer.getData("lib");
    if (libIdx) addFromLibrary(+libIdx, at);
    else if (dragUid !== null) {
      const items = [...list.items];
      const from = items.findIndex((i) => i.uid === dragUid);
      const [moved] = items.splice(from, 1);
      items.splice(from < at ? at - 1 : at, 0, moved!);
      setItems(items);
    }
    setDragUid(null); setOverIndex(null);
  };

  const suggestions = [
    list.items.some((i, k) => k > 0 && list.items[k - 1]!.kind === i.kind && i.kind === "Video") && "Two videos play back to back — add an image between them to keep viewers' attention.",
    total > 120 && "This loop runs over 2 minutes. Passers-by usually see under 30 seconds — consider moving key messages to the front.",
    !list.items.some((i) => i.kind === "Text") && "No text slides yet. A short message (Wi-Fi, welcome) helps visitors.",
    list.items.length < 3 && "Short playlists feel repetitive. Add at least 3 items.",
  ].filter(Boolean) as string[];

  const newPlaylist = () => {
    const id = Math.max(...lists.map((l) => l.id)) + 1;
    setLists((all) => [...all, { id, name: `Untitled playlist ${id}`, screens: 0, loop: true, shuffle: false, items: [] }]);
    setActiveId(id);
  };

  return (
    <div className="flex h-screen min-w-[1080px] overflow-hidden bg-surface text-foreground">
      <Toaster />
      <aside className={cn("relative flex h-screen shrink-0 border-r border-border bg-card transition-[width] duration-200", sidebarOpen ? "w-64" : "w-16")}>
        <div className="flex w-16 shrink-0 flex-col items-center border-r border-border bg-surface py-3">
          <Link to="/control-center" aria-label="Control Centre home" className="mb-5 grid size-9 place-items-center rounded-md bg-primary text-primary-foreground shadow-sm"><Layers className="size-4" /></Link>
          <nav aria-label="Primary navigation" className="flex flex-col items-center gap-0.5">
            {NAV_ITEMS.map((item) => item.to ? (
              <Button key={item.label} asChild variant="ghost" size="icon" className={cn("size-9 text-muted-foreground", item.to === "/playlists" && "bg-primary/15 text-primary hover:bg-primary/20 hover:text-primary")}>
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
            <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(false)} aria-label="Collapse sidebar" className="size-7 text-muted-foreground"><ChevronLeft className="size-3.5" /></Button>
          </div>
          <nav className="flex flex-col gap-0.5">
            {NAV_ITEMS.map((item) => item.to ? (
              <Button key={item.label} asChild variant="ghost" className={cn("h-9 w-full justify-start gap-3 px-2 text-sm font-normal text-muted-foreground", item.to === "/playlists" && "bg-primary/15 font-semibold text-primary hover:bg-primary/20 hover:text-primary")}>
                <Link to={item.to}><item.icon className="size-4 shrink-0" />{item.label}</Link>
              </Button>
            ) : (
              <Button key={item.label} variant="ghost" onClick={() => navAction(item.label)} className="h-9 w-full justify-start gap-3 px-2 text-sm font-normal text-muted-foreground"><item.icon className="size-4 shrink-0" />{item.label}</Button>
            ))}
          </nav>
          <section className="mt-5 border-t border-border pt-5">
            <div className="flex items-center justify-between px-2"><p className="label-caps">Playlists</p><Button variant="ghost" size="icon" className="size-6" aria-label="New playlist" onClick={newPlaylist}><Plus className="size-3.5" /></Button></div>
            <ul className="mt-2 space-y-0.5">
              {lists.map((l) => (
                <li key={l.id}><button onClick={() => setActiveId(l.id)} className={cn("flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs", l.id === activeId ? "bg-secondary font-semibold" : "text-muted-foreground hover:bg-secondary")}>
                  <span className="flex h-3 w-6 shrink-0 overflow-hidden rounded-sm">{l.items.slice(0, 4).map((i) => <span key={i.uid} className={cn("flex-1", TONES[i.tone])} />)}</span>
                  <span className="truncate">{l.name}</span><span className="ml-auto font-mono text-[10px]">{l.items.length}</span>
                </button></li>
              ))}
            </ul>
          </section>
        </div>}
        {!sidebarOpen && <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(true)} aria-label="Expand sidebar" className="absolute left-11 top-3 size-7 border border-border bg-card text-muted-foreground shadow-sm"><ChevronRight className="size-3.5" /></Button>}
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 shrink-0 items-center gap-3 border-b border-border bg-card px-6">
          <div className="min-w-0">
            <input value={list.name} onChange={(e) => patchList({ name: e.target.value })} aria-label="Playlist name" className="w-72 bg-transparent font-display text-base font-semibold leading-tight outline-none focus:underline" />
            <p className="text-xs text-muted-foreground">{list.items.length} items · {fmt(total)} loop · on {list.screens} screens</p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <Button variant={list.loop ? "secondary" : "outline"} size="sm" className="h-8" onClick={() => patchList({ loop: !list.loop })}><Repeat className="size-3.5" />Loop {list.loop ? "on" : "off"}</Button>
            <Button variant={list.shuffle ? "secondary" : "outline"} size="sm" className="h-8" onClick={() => patchList({ shuffle: !list.shuffle })}><Shuffle className="size-3.5" />Shuffle {list.shuffle ? "on" : "off"}</Button>
            <Button size="sm" className="h-8" onClick={() => toast("Playlist published", { description: `Pushed to ${list.screens} screens.` })}>Publish</Button>
          </div>
        </header>

        <div className="flex min-h-0 flex-1">
          <main className="min-w-0 flex-1 overflow-y-auto px-6 py-5">
            {/* Preview + runtime ribbon */}
            <section className="panel grid grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] gap-5 rounded-md border border-border bg-card p-4">
              <div className={cn("relative grid aspect-video place-items-center overflow-hidden rounded-md text-primary-foreground transition-colors duration-500", current ? TONES[current.tone] : "bg-secondary")}>
                {current ? (
                  <div key={current.uid} className="animate-in fade-in text-center duration-500">
                    {(() => { const I = KIND_ICON[current.kind]; return <I className="mx-auto size-8 opacity-80" />; })()}
                    <p className="mt-2 font-display text-xl font-semibold">{current.name}</p>
                    <p className="font-mono text-[11px] opacity-80">{current.kind} · {current.transition}</p>
                  </div>
                ) : <p className="text-sm text-muted-foreground">Drop media here to start</p>}
                <span className="absolute left-3 top-3 rounded-sm bg-foreground/30 px-1.5 py-0.5 font-mono text-[9px] uppercase">Preview · 4× speed</span>
                {current && <div className="absolute inset-x-0 bottom-0 h-1 bg-foreground/20"><div className="h-full bg-primary-foreground transition-all" style={{ width: `${(elapsed / current.duration) * 100}%` }} /></div>}
              </div>
              <div className="flex flex-col">
                <p className="label-caps">Now previewing</p>
                <p className="mt-1 font-display text-lg font-semibold">{current?.name ?? "—"}</p>
                <p className="text-xs text-muted-foreground">Item {list.items.length ? (cursor % list.items.length) + 1 : 0} of {list.items.length}</p>
                <div className="mt-3 flex gap-2">
                  <Button size="sm" variant="outline" className="h-8" onClick={() => setPlaying((p) => !p)}>{playing ? <Pause className="size-3.5" /> : <Play className="size-3.5" />}{playing ? "Pause" : "Play"}</Button>
                  <Button size="sm" variant="outline" className="h-8" onClick={() => { setCursor((c) => (c + 1) % Math.max(1, list.items.length)); setElapsed(0); }}><SkipForward className="size-3.5" />Next</Button>
                </div>
                <p className="label-caps mt-auto pt-4">Loop runtime · {fmt(total)}</p>
                <div className="mt-2 flex h-6 overflow-hidden rounded-sm border border-border">
                  {list.items.map((i, k) => (
                    <button key={i.uid} title={`${i.name} · ${i.duration}s`} onClick={() => { setCursor(k); setElapsed(0); setSelectedUid(i.uid); }} className={cn("border-r border-card transition-opacity last:border-0", TONES[i.tone], k !== cursor % list.items.length && "opacity-50 hover:opacity-80")} style={{ flexGrow: i.duration }} />
                  ))}
                </div>
              </div>
            </section>

            {/* Smart suggestions */}
            {suggestions.length > 0 && (
              <section className="mt-4 rounded-md border border-primary/30 bg-primary/5 p-3">
                <p className="flex items-center gap-1.5 text-xs font-semibold text-primary"><Sparkles className="size-3.5" />Smart suggestions</p>
                <ul className="mt-1.5 space-y-1 text-xs text-muted-foreground">{suggestions.map((s) => <li key={s}>• {s}</li>)}</ul>
              </section>
            )}

            {/* Sequence */}
            <section className="mt-4">
              <div className="mb-2 flex items-center justify-between">
                <p className="label-caps">Sequence · drag to reorder</p>
                <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => { setItems([...list.items].sort((a, b) => a.duration - b.duration)); toast("Shortest items moved to the front", { description: "Key messages now appear sooner." }); }}><Wand2 className="size-3" />Optimise order</Button>
              </div>
              <ol className="panel rounded-md border border-border bg-card" onDragOver={(e) => { e.preventDefault(); if (!list.items.length) setOverIndex(0); }} onDrop={(e) => !list.items.length && drop(0, e)}>
                {list.items.length === 0 && <li className="p-8 text-center text-sm text-muted-foreground">Drag media from the library on the right, or click + on any item.</li>}
                {list.items.map((item, k) => {
                  const I = KIND_ICON[item.kind];
                  const startAt = list.items.slice(0, k).reduce((s, i) => s + i.duration, 0);
                  return (
                    <li key={item.uid} draggable onDragStart={() => setDragUid(item.uid)} onDragEnd={() => { setDragUid(null); setOverIndex(null); }}
                      onDragOver={(e) => { e.preventDefault(); const r = e.currentTarget.getBoundingClientRect(); setOverIndex(e.clientY < r.top + r.height / 2 ? k : k + 1); }}
                      onDrop={(e) => drop(overIndex ?? k, e)} onClick={() => setSelectedUid(item.uid)}
                      className={cn("group relative flex cursor-pointer items-center gap-3 border-b border-border px-3 py-2.5 last:border-0 hover:bg-secondary/60",
                        selectedUid === item.uid && "bg-primary/10", dragUid === item.uid && "opacity-40",
                        k === cursor % list.items.length && playing && "border-l-2 border-l-primary")}>
                      {overIndex === k && <span className="absolute inset-x-0 -top-px h-0.5 bg-primary" />}
                      {overIndex === k + 1 && k === list.items.length - 1 && <span className="absolute inset-x-0 -bottom-px h-0.5 bg-primary" />}
                      <GripVertical className="size-4 cursor-grab text-muted-foreground" />
                      <span className="w-5 font-mono text-[10px] text-muted-foreground">{String(k + 1).padStart(2, "0")}</span>
                      <span className={cn("grid size-10 shrink-0 place-items-center rounded-sm text-primary-foreground", TONES[item.tone])}><I className="size-4" /></span>
                      <div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{item.name}</p><p className="text-[11px] text-muted-foreground">{item.kind} · {item.transition} · starts {fmt(startAt)}</p></div>
                      <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="icon" className="size-6" aria-label="Shorter" onClick={() => patchItem(item.uid, { duration: Math.max(3, item.duration - 5) })}>−</Button>
                        <span className="w-12 text-center font-mono text-xs"><Clock className="mr-1 inline size-3" />{item.duration}s</span>
                        <Button variant="ghost" size="icon" className="size-6" aria-label="Longer" onClick={() => patchItem(item.uid, { duration: item.duration + 5 })}>+</Button>
                        <Button variant="ghost" size="icon" className="size-7 opacity-0 group-hover:opacity-100" aria-label="Duplicate" onClick={() => { const items = [...list.items]; items.splice(k + 1, 0, { ...item, uid: ++uidSeed }); setItems(items); }}><Copy className="size-3.5" /></Button>
                        <Button variant="ghost" size="icon" className="size-7 text-destructive opacity-0 group-hover:opacity-100" aria-label="Remove" onClick={() => { setItems(list.items.filter((i) => i.uid !== item.uid)); toast(`Removed “${item.name}”`); }}><Trash2 className="size-3.5" /></Button>
                      </div>
                    </li>
                  );
                })}
              </ol>
            </section>
          </main>

          {/* Right panel: item settings + library */}
          <aside className="flex w-72 shrink-0 flex-col overflow-y-auto border-l border-border bg-card">
            {selected && (
              <section className="space-y-3 border-b border-border p-4">
                <p className="label-caps">Item settings</p>
                <p className="font-display font-semibold">{selected.name}</p>
                <label className="block text-xs"><span className="label-caps">Duration · {selected.duration}s</span>
                  <input type="range" min={3} max={90} value={selected.duration} onChange={(e) => patchItem(selected.uid, { duration: +e.target.value })} className="mt-2 w-full accent-primary" />
                </label>
                <div><p className="label-caps mb-1.5">Transition</p>
                  <div className="grid grid-cols-3 gap-1">{(["Cut", "Fade", "Slide"] as const).map((t) => <Button key={t} size="sm" variant={selected.transition === t ? "default" : "outline"} className="h-7 text-xs" onClick={() => patchItem(selected.uid, { transition: t })}>{t}</Button>)}</div>
                </div>
              </section>
            )}
            <section className="flex-1 p-4">
              <p className="label-caps">Media library</p>
              <div className="relative mt-2"><Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" /><Input value={libQuery} onChange={(e) => setLibQuery(e.target.value)} placeholder="Search media…" aria-label="Search media" className="h-8 bg-secondary pl-8 text-sm" /></div>
              <p className="mt-2 text-[11px] text-muted-foreground">Drag into the sequence, or click + to add at the end.</p>
              <ul className="mt-3 space-y-1.5">
                {library.map((m, idx) => {
                  const I = KIND_ICON[m.kind];
                  return (
                    <li key={m.name} draggable onDragStart={(e) => e.dataTransfer.setData("lib", String(idx))} className="flex cursor-grab items-center gap-2 rounded-md border border-border p-1.5 hover:border-primary">
                      <span className={cn("grid size-8 shrink-0 place-items-center rounded-sm text-primary-foreground", TONES[m.tone])}><I className="size-3.5" /></span>
                      <div className="min-w-0 flex-1"><p className="truncate text-xs font-medium">{m.name}</p><p className="font-mono text-[10px] text-muted-foreground">{m.kind} · {m.duration}s</p></div>
                      <Button variant="ghost" size="icon" className="size-7" aria-label={`Add ${m.name}`} onClick={() => addFromLibrary(idx)}><Plus className="size-3.5" /></Button>
                    </li>
                  );
                })}
              </ul>
            </section>
          </aside>
        </div>
      </div>
    </div>
  );
}
