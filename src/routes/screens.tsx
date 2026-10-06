import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Activity, CalendarDays, ChevronDown, ChevronLeft, ChevronRight, CircleAlert, Gauge, Grid2X2, Images, KeyRound, Layers, List, ListVideo, MapPin, Monitor, MoreHorizontal, Plus, RefreshCw, Search, Settings, Signal, SlidersHorizontal, Users, WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { SCREENS, type ScreenRecord, type ScreenStatus } from "@/lib/screens-data";

export const Route = createFileRoute("/screens")({
  head: () => ({ meta: [
    { title: "Screens — Signage CMS" },
    { name: "description", content: "Monitor, filter and manage every connected digital signage screen." },
    { property: "og:title", content: "Screens — Signage CMS" },
    { property: "og:description", content: "A live inventory of connected digital signage screens and their health." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ]}),
  component: ScreensPage,
});

const NAV_ITEMS = [
  { label: "Control Center", icon: Gauge, to: "/control-center" as const },
  { label: "Pulse", icon: Activity, to: "/pulse" as const },
  { label: "Screens", icon: Monitor, to: "/screens" as const },
  { label: "Schedules", icon: CalendarDays },
  { label: "Media", icon: Images, to: "/media" as const },
  { label: "Playlists", icon: ListVideo },
  { label: "Layouts", icon: Layers, to: "/layouts" as const },
  { label: "Licensing", icon: KeyRound },
  { label: "Users", icon: Users },
];

function ScreensPage() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"all" | ScreenStatus>("all");
  const [location, setLocation] = useState("All locations");
  const [view, setView] = useState<"grid" | "list">("grid");
  const visible = useMemo(() => SCREENS.filter((screen) => {
    const text = `${screen.name} ${screen.location} ${screen.area} ${screen.currentContent}`.toLowerCase();
    return text.includes(query.trim().toLowerCase()) && (status === "all" || screen.status === status) && (location === "All locations" || screen.location === location);
  }), [query, status, location]);
  const navAction = (label: string) => toast(label, { description: "This section is not connected yet." });

  return <div className="flex h-screen min-w-[900px] overflow-hidden bg-surface text-foreground">
    <Toaster />
    <aside className={cn("relative flex h-screen shrink-0 border-r border-border bg-card transition-[width] duration-200", sidebarOpen ? "w-72" : "w-16")}>
      <div className="flex w-16 shrink-0 flex-col items-center border-r border-border bg-surface py-3">
        <Link to="/control-center" aria-label="Control Centre home" className="mb-5 grid size-9 place-items-center rounded-md bg-primary text-primary-foreground shadow-sm"><Layers className="size-4" /></Link>
        <nav aria-label="Primary navigation" className="flex flex-col items-center gap-0.5">{NAV_ITEMS.map((item) => item.to ? <Button key={item.label} asChild variant="ghost" size="icon" className={cn("size-9 text-muted-foreground", item.to === "/screens" && "bg-primary/15 text-primary hover:bg-primary/20 hover:text-primary")}><Link to={item.to} title={item.label} aria-label={item.label}><item.icon className="size-4" /></Link></Button> : <Button key={item.label} variant="ghost" size="icon" title={item.label} aria-label={item.label} onClick={() => navAction(item.label)} className="size-9 text-muted-foreground"><item.icon className="size-4" /></Button>)}</nav>
        <Button variant="ghost" size="icon" title="Settings" aria-label="Settings" className="mt-auto size-9 text-muted-foreground" onClick={() => navAction("Settings")}><Settings className="size-4" /></Button>
      </div>
      {sidebarOpen && <div className="flex min-w-0 flex-1 flex-col overflow-y-auto px-4 py-3">
        <div className="mb-5 flex h-9 items-center justify-between gap-2"><div className="flex items-baseline gap-2"><p className="font-display text-sm font-semibold">Signage CMS</p><p className="label-caps">Workspace</p></div><Button variant="ghost" size="icon" onClick={() => setSidebarOpen(false)} aria-label="Collapse sidebar" className="size-7 text-muted-foreground"><ChevronLeft className="size-3.5" /></Button></div>
        <nav className="flex flex-col gap-0.5">{NAV_ITEMS.map((item) => item.to ? <Button key={item.label} asChild variant="ghost" className={cn("h-9 w-full justify-start gap-3 px-2 text-sm font-normal text-muted-foreground", item.to === "/screens" && "bg-primary/15 font-semibold text-primary hover:bg-primary/20 hover:text-primary")}><Link to={item.to}><item.icon className="size-4 shrink-0" />{item.label}</Link></Button> : <Button key={item.label} variant="ghost" onClick={() => navAction(item.label)} className="h-9 w-full justify-start gap-3 px-2 text-sm font-normal text-muted-foreground"><item.icon className="size-4 shrink-0" />{item.label}</Button>)}</nav>
        <section className="mt-5 border-t border-border pt-5"><p className="label-caps px-2">Locations</p><div className="mt-2 space-y-0.5">{["All locations", "London HQ", "Manchester", "Bristol"].map((name) => <Button key={name} variant="ghost" onClick={() => setLocation(name)} className={cn("h-8 w-full justify-start gap-2 px-2 text-xs font-normal", location === name ? "bg-secondary font-medium text-primary" : "text-muted-foreground")}><MapPin className="size-3.5" /><span className="flex-1 text-left">{name}</span><span className="font-mono text-[9px]">{name === "All locations" ? SCREENS.length : SCREENS.filter((item) => item.location === name).length}</span></Button>)}</div></section>
        <div className="mt-auto border-t border-border pt-4"><div className="flex items-center gap-2 text-xs font-medium"><span className="size-2 rounded-full bg-accent animate-pulse" />Fleet monitoring live</div><p className="mt-1 text-[11px] text-muted-foreground">Last refresh 8 seconds ago.</p></div>
      </div>}
      {!sidebarOpen && <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(true)} aria-label="Expand sidebar" className="absolute left-11 top-3 size-7 border border-border bg-card text-muted-foreground shadow-sm"><ChevronRight className="size-3.5" /></Button>}
    </aside>
    <div className="flex min-w-0 flex-1 flex-col">
      <header className="flex h-16 shrink-0 items-center gap-3 border-b border-border bg-card px-6"><div><h1 className="font-display text-base font-semibold">Screens</h1><p className="text-xs text-muted-foreground">Live fleet inventory · {SCREENS.length} registered</p></div><div className="ml-auto flex items-center gap-2"><div className="relative"><Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" /><Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search screens…" aria-label="Search screens" className="h-8 w-52 bg-secondary pl-8 text-sm" /></div><Button size="sm" onClick={() => toast.success("Registration opened", { description: "Enter the pairing code shown on the display." })}><Plus className="size-4" /> Register screen</Button></div></header>
      <main className="min-w-0 flex-1 overflow-y-auto"><div className="mx-auto max-w-[1440px] px-6 py-6">
        <section className="mb-5 flex items-end justify-between gap-5"><div><p className="label-caps mb-2">Fleet overview</p><h2 className="font-display text-2xl font-semibold leading-tight">Your network is visible at a glance.<br /><span className="text-muted-foreground">Three screens need attention.</span></h2></div><Button variant="outline" size="sm" onClick={() => toast.success("Fleet refreshed", { description: "All screen states are up to date." })}><RefreshCw className="size-3.5" /> Refresh</Button></section>
        <section className="grid grid-cols-4 border-y border-border bg-card"><Summary icon={Monitor} label="Registered" value="8" detail="Across 3 locations" /><Summary icon={Signal} label="Online" value="5" detail="Receiving heartbeat" tone="accent" /><Summary icon={CircleAlert} label="Attention" value="2" detail="Storage or temperature" tone="primary" /><Summary icon={WifiOff} label="Offline" value="1" detail="Atrium video wall" tone="destructive" last /></section>
        <div className="mt-5 flex items-center gap-2"><div className="flex rounded-md border border-border bg-card p-1">{(["all", "online", "attention", "offline"] as const).map((item) => <Button key={item} variant="ghost" size="sm" onClick={() => setStatus(item)} className={cn("h-7 px-3 text-xs capitalize", status === item && "bg-secondary text-foreground")}>{item === "all" ? "All screens" : item}</Button>)}</div><Button variant="outline" size="sm" className="h-9 text-xs" onClick={() => toast("Filters", { description: `${location} · ${status === "all" ? "All statuses" : status}` })}><SlidersHorizontal className="size-3.5" /> Filters</Button><p className="ml-auto label-caps">{visible.length} visible</p><div className="flex rounded-md border border-border bg-card p-1"><Button variant="ghost" size="icon" onClick={() => setView("grid")} aria-label="Grid view" className={cn("size-7", view === "grid" && "bg-secondary")}><Grid2X2 className="size-3.5" /></Button><Button variant="ghost" size="icon" onClick={() => setView("list")} aria-label="List view" className={cn("size-7", view === "list" && "bg-secondary")}><List className="size-3.5" /></Button></div></div>
        {view === "grid" ? <section className="mt-4 grid grid-cols-3 gap-4">{visible.map((screen) => <ScreenCard key={screen.id} screen={screen} />)}</section> : <section className="panel mt-4 overflow-hidden"><div className="grid grid-cols-[minmax(220px,1.4fr)_1fr_1fr_110px_44px] gap-4 border-b border-border px-4 py-2 label-caps"><span>Screen</span><span>Now playing</span><span>Device</span><span>Status</span><span /></div>{visible.map((screen) => <ScreenRow key={screen.id} screen={screen} />)}</section>}
        {!visible.length && <div className="mt-4 grid h-64 place-items-center border border-dashed border-border bg-card text-center"><div><Monitor className="mx-auto size-7 text-muted-foreground" /><p className="mt-3 text-sm font-medium">No screens found</p><p className="mt-1 text-xs text-muted-foreground">Try another search or filter.</p></div></div>}
      </div></main>
    </div>
  </div>;
}

function StatusDot({ status }: { status: ScreenStatus }) { return <span className={cn("size-2 rounded-full", status === "online" ? "bg-accent" : status === "attention" ? "bg-primary" : "bg-destructive")} />; }
function Summary({ icon: Icon, label, value, detail, tone = "muted", last = false }: { icon: typeof Monitor; label: string; value: string; detail: string; tone?: "muted" | "accent" | "primary" | "destructive"; last?: boolean }) { return <div className={cn("px-5 py-4", !last && "border-r border-border")}><div className="flex items-center justify-between"><p className="label-caps">{label}</p><Icon className={cn("size-4", tone === "accent" ? "text-accent" : tone === "primary" ? "text-primary" : tone === "destructive" ? "text-destructive" : "text-muted-foreground")} /></div><p className="mt-3 font-display text-2xl font-semibold">{value}</p><p className="mt-1 text-[11px] text-muted-foreground">{detail}</p></div>; }
function ScreenPreview({ screen }: { screen: ScreenRecord }) { return <div className={cn("relative mx-auto grid overflow-hidden border-4 border-foreground/80 bg-secondary shadow-sm", screen.orientation === "Portrait" ? "aspect-[9/16] h-32" : screen.orientation === "Ultrawide" ? "aspect-[32/9] w-full" : "aspect-video w-full")}><div className="grid grid-cols-[1.6fr_1fr]"><div className="flex flex-col justify-end bg-accent/15 p-3"><span className="label-caps text-accent">Now playing</span><p className="mt-1 truncate text-xs font-semibold">{screen.currentContent}</p></div><div className="grid grid-rows-2"><div className="bg-primary/20" /><div className="border-t border-border bg-card" /></div></div><span className="absolute right-1.5 top-1.5 flex items-center gap-1 rounded-sm bg-card/90 px-1.5 py-0.5 font-mono text-[8px]"><StatusDot status={screen.status} />{screen.status}</span></div>; }
function ScreenCard({ screen }: { screen: ScreenRecord }) { return <article className="panel overflow-hidden transition-shadow hover:shadow-md"><Link to="/screens/$screenId" params={{ screenId: screen.id }} className="block bg-surface p-4"><ScreenPreview screen={screen} /></Link><div className="p-4"><div className="flex items-start gap-3"><div className="min-w-0 flex-1"><Link to="/screens/$screenId" params={{ screenId: screen.id }} className="font-display text-sm font-semibold hover:text-primary">{screen.name}</Link><p className="mt-0.5 flex items-center gap-1 text-[11px] text-muted-foreground"><MapPin className="size-3" />{screen.location} · {screen.area}</p></div><Button variant="ghost" size="icon" aria-label={`More options for ${screen.name}`} className="size-7 text-muted-foreground" onClick={() => toast(screen.name, { description: "Screen actions are ready." })}><MoreHorizontal className="size-4" /></Button></div><div className="mt-4 grid grid-cols-2 gap-3 border-t border-border pt-3"><div><p className="label-caps">Content</p><p className="mt-1 truncate text-[11px] font-medium">{screen.currentContent}</p></div><div><p className="label-caps">Last signal</p><p className="mt-1 text-[11px] font-medium">{screen.lastSeen}</p></div></div></div></article>; }
function ScreenRow({ screen }: { screen: ScreenRecord }) { return <Link to="/screens/$screenId" params={{ screenId: screen.id }} className="grid grid-cols-[minmax(220px,1.4fr)_1fr_1fr_110px_44px] items-center gap-4 border-b border-border px-4 py-3 last:border-0 hover:bg-secondary/40"><div className="flex items-center gap-3"><div className="grid size-9 place-items-center rounded-md bg-secondary"><Monitor className="size-4 text-muted-foreground" /></div><div><p className="text-xs font-semibold">{screen.name}</p><p className="mt-0.5 text-[10px] text-muted-foreground">{screen.location} · {screen.area}</p></div></div><div><p className="truncate text-xs">{screen.currentContent}</p><p className="mt-0.5 text-[10px] text-muted-foreground">{screen.layout}</p></div><div><p className="text-xs">{screen.resolution}</p><p className="mt-0.5 text-[10px] text-muted-foreground">{screen.player}</p></div><span className="flex items-center gap-2 text-xs capitalize"><StatusDot status={screen.status} />{screen.status}</span><ChevronRight className="size-4 text-muted-foreground" /></Link>; }
