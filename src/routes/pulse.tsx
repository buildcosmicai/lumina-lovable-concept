import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  Activity,
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleAlert,
  Gauge,
  Images,
  KeyRound,
  Layers,
  ListVideo,
  MapPin,
  Monitor,
  Pause,
  Play,
  Radio,
  Search,
  Settings,
  Signal,
  Sparkles,
  TimerReset,
  Users,
  WifiOff,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/pulse")({
  head: () => ({
    meta: [
      { title: "Pulse — Signage CMS" },
      { name: "description", content: "Follow live playback, delivery quality, screen reach and intelligent signage network signals." },
      { property: "og:title", content: "Pulse — Signage CMS" },
      { property: "og:description", content: "A live heartbeat for playback, delivery and every connected signage screen." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PulsePage,
});

const NAV_ITEMS = [
  { label: "Control Center", icon: Gauge, to: "/control-center" as const },
  { label: "Pulse", icon: Activity, to: "/pulse" as const },
  { label: "Screens", icon: Monitor },
  { label: "Schedules", icon: CalendarDays },
  { label: "Media", icon: Images, to: "/media" as const },
  { label: "Playlists", icon: ListVideo },
  { label: "Layouts", icon: Layers, to: "/layouts" as const },
  { label: "Licensing", icon: KeyRound },
  { label: "Users", icon: Users },
];

const PULSE_POINTS = [42, 45, 44, 51, 48, 56, 61, 58, 67, 63, 72, 78, 74, 82, 79, 87, 84, 90, 92, 88, 95, 91, 97, 94, 96, 92, 98, 95];

type FeedEvent = {
  id: number;
  time: string;
  title: string;
  detail: string;
  status: "success" | "active" | "warning";
  icon: typeof Play;
};

const EVENTS: FeedEvent[] = [
  { id: 1, time: "21:39:52", title: "Playback completed", detail: "Autumn launch · Lobby East", status: "success", icon: CheckCircle2 },
  { id: 2, time: "21:39:41", title: "Content started", detail: "Evening ambience · Atrium wall", status: "active", icon: Play },
  { id: 3, time: "21:39:24", title: "Screen heartbeat", detail: "Cafeteria 04 · 18 ms latency", status: "success", icon: Signal },
  { id: 4, time: "21:38:59", title: "Playback recovered", detail: "Reception portrait · 2 retries", status: "warning", icon: TimerReset },
  { id: 5, time: "21:38:43", title: "Playlist synchronized", detail: "Town Hall · 6 screens", status: "success", icon: Zap },
];

const CONTENT = [
  { name: "Autumn launch", plays: "1,284", completion: 98, trend: "+12%" },
  { name: "Evening ambience", plays: "936", completion: 96, trend: "+8%" },
  { name: "Lunch menu", plays: "712", completion: 99, trend: "+3%" },
  { name: "Visitor welcome", plays: "604", completion: 91, trend: "−4%" },
];

const LOCATIONS = [
  { name: "London HQ", plays: "2.8k", reach: "20 screens", quality: 99 },
  { name: "Manchester", plays: "1.6k", reach: "12 screens", quality: 97 },
  { name: "Bristol", plays: "1.1k", reach: "9 screens", quality: 96 },
];

function PulsePage() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [range, setRange] = useState<"Live" | "1 hour" | "24 hours">("Live");
  const [location, setLocation] = useState("All locations");
  const [streaming, setStreaming] = useState(true);
  const [anomalyVisible, setAnomalyVisible] = useState(true);
  const [query, setQuery] = useState("");

  const visibleEvents = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return EVENTS;
    return EVENTS.filter((event) => `${event.title} ${event.detail}`.toLowerCase().includes(needle));
  }, [query]);

  const navAction = (label: string) => toast(label, { description: "This section is not connected yet." });

  return (
    <div className="flex h-screen min-w-[920px] overflow-hidden bg-surface text-foreground">
      <Toaster />
      <aside className={cn("relative flex h-screen shrink-0 border-r border-border bg-card transition-[width] duration-200", sidebarOpen ? "w-72" : "w-16")}>
        <div className="flex w-16 shrink-0 flex-col items-center border-r border-border bg-surface py-3">
          <Link to="/control-center" aria-label="Control Centre home" className="mb-5 grid size-9 place-items-center rounded-md bg-primary text-primary-foreground shadow-sm"><Layers className="size-4" /></Link>
          <nav aria-label="Primary navigation" className="flex flex-col items-center gap-0.5">
            {NAV_ITEMS.map((item) => item.to ? (
              <Button key={item.label} asChild variant="ghost" size="icon" className={cn("size-9 text-muted-foreground", item.to === "/pulse" && "bg-primary/15 text-primary hover:bg-primary/20 hover:text-primary")}>
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
              <Button key={item.label} asChild variant="ghost" className={cn("h-9 w-full justify-start gap-3 px-2 text-sm font-normal text-muted-foreground", item.to === "/pulse" && "bg-primary/15 font-semibold text-primary hover:bg-primary/20 hover:text-primary")}>
                <Link to={item.to}><item.icon className="size-4 shrink-0" />{item.label}</Link>
              </Button>
            ) : (
              <Button key={item.label} variant="ghost" onClick={() => navAction(item.label)} className="h-9 w-full justify-start gap-3 px-2 text-sm font-normal text-muted-foreground"><item.icon className="size-4 shrink-0" />{item.label}</Button>
            ))}
          </nav>
          <section className="mt-5 border-t border-border pt-5">
            <p className="label-caps px-2">Live signal</p>
            <div className="mt-3 space-y-3 px-2">
              <SignalLine label="Playback" value="Stable" tone="accent" />
              <SignalLine label="Delivery" value="18 ms" tone="accent" />
              <SignalLine label="Reach" value="48 / 49" tone="primary" />
            </div>
          </section>
          <div className="mt-auto border-t border-border pt-4">
            <div className="flex items-center gap-2 text-xs font-medium"><span className={cn("size-2 rounded-full", streaming ? "bg-accent animate-pulse" : "bg-muted-foreground")} />{streaming ? "Live stream connected" : "Stream paused"}</div>
            <p className="mt-1 text-[11px] text-muted-foreground">Events update every few seconds.</p>
          </div>
        </div>}
        {!sidebarOpen && <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(true)} aria-label="Expand sidebar" title="Expand sidebar" className="absolute left-11 top-3 size-7 border border-border bg-card text-muted-foreground shadow-sm"><ChevronRight className="size-3.5" /></Button>}
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 shrink-0 items-center gap-3 border-b border-border bg-card px-6">
          <div><div className="flex items-center gap-2"><h1 className="font-display text-base font-semibold leading-tight">Pulse</h1><span className="flex items-center gap-1 rounded-sm bg-accent/15 px-1.5 py-0.5 font-mono text-[8px] uppercase text-accent"><span className="size-1 rounded-full bg-accent animate-pulse" /> Live</span></div><p className="text-xs text-muted-foreground">Network activity · Thursday, 1 October</p></div>
          <div className="ml-auto flex items-center gap-2">
            <Button variant="outline" size="sm" className="h-8 gap-2 text-xs" onClick={() => setLocation((current) => current === "All locations" ? "London HQ" : "All locations")}><MapPin className="size-3.5" />{location}<ChevronDown className="size-3" /></Button>
            <div className="relative"><Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" /><Input value={query} onChange={(event) => setQuery(event.target.value)} aria-label="Search live events" placeholder="Search live events…" className="h-8 w-48 bg-secondary pl-8 text-sm" /></div>
            <Button variant={streaming ? "outline" : "default"} size="sm" className="h-8" onClick={() => { setStreaming((current) => !current); toast(streaming ? "Live stream paused" : "Live stream resumed"); }}>{streaming ? <Pause className="size-3.5" /> : <Play className="size-3.5" />}{streaming ? "Pause" : "Resume"}</Button>
          </div>
        </header>

        <main className="min-w-0 flex-1 overflow-y-auto">
          <div className="mx-auto max-w-[1440px] px-6 py-6">
            <section className="mb-5 flex items-end justify-between gap-5">
              <div><p className="label-caps mb-2">Network heartbeat</p><h2 className="font-display text-2xl font-semibold leading-tight">5,436 plays are flowing now.<br /><span className="text-muted-foreground">Delivery is faster than usual.</span></h2></div>
              <div className="flex rounded-md border border-border bg-card p-1">
                {(["Live", "1 hour", "24 hours"] as const).map((item) => <Button key={item} variant="ghost" size="sm" onClick={() => setRange(item)} className={cn("h-7 px-3 text-xs", range === item && "bg-secondary text-foreground")}>{item}</Button>)}
              </div>
            </section>

            <section className="panel relative overflow-hidden p-5">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4"><div className="grid size-11 place-items-center rounded-md bg-accent/15 text-accent"><Radio className="size-5" /></div><div><p className="text-sm font-semibold">Playback pulse</p><p className="mt-0.5 text-xs text-muted-foreground">Successful content starts · {range.toLowerCase()}</p></div></div>
                <div className="flex gap-8 text-right"><div><p className="font-mono text-[9px] uppercase text-muted-foreground">Current rate</p><p className="mt-1 font-display text-xl font-semibold">92<span className="ml-1 text-xs font-normal text-muted-foreground">/min</span></p></div><div><p className="font-mono text-[9px] uppercase text-muted-foreground">Signal quality</p><p className="mt-1 font-display text-xl font-semibold text-accent">99.2%</p></div></div>
              </div>
              <div className="relative mt-5 h-36 overflow-hidden border-b border-border">
                <div className="absolute inset-0 flex flex-col justify-between">{[0, 1, 2, 3].map((line) => <span key={line} className="block border-t border-dashed border-border/70" />)}</div>
                <div className="absolute inset-x-0 bottom-0 flex h-full items-center gap-1">{PULSE_POINTS.map((point, index) => <div key={index} className="group flex flex-1 items-center"><div className={cn("w-full rounded-sm transition-colors", index > 22 ? "bg-primary/65 group-hover:bg-primary" : "bg-accent/35 group-hover:bg-accent")} style={{ height: `${Math.max(3, Math.abs(point - 70) * 2.4)}px` }} /></div>)}</div>
                <div className="absolute inset-x-0 top-1/2 border-t border-accent/30" />
              </div>
              <div className="mt-2 flex justify-between font-mono text-[9px] text-muted-foreground"><span>−30 min</span><span>−20 min</span><span>−10 min</span><span>Now</span></div>
            </section>

            <section className="mt-5 grid grid-cols-4 border-y border-border bg-card">
              <Metric label="Total plays" value="5,436" detail="12.4% above baseline" icon={Play} trend="up" />
              <Metric label="Estimated reach" value="18.2k" detail="Across 7 locations" icon={Users} trend="up" />
              <Metric label="Delivery latency" value="18 ms" detail="6 ms faster than average" icon={Zap} trend="down" />
              <Metric label="Screens reached" value="48 / 49" detail="One screen reconnecting" icon={Monitor} trend="warning" last />
            </section>

            <div className="mt-5 grid grid-cols-[minmax(0,1.35fr)_minmax(320px,.8fr)] gap-5">
              <div className="space-y-5">
                <section className="panel overflow-hidden">
                  <div className="flex items-center justify-between border-b border-border px-5 py-4"><div><div className="flex items-center gap-2"><Activity className="size-4 text-accent" /><h3 className="font-display text-sm font-semibold">Live event stream</h3></div><p className="mt-1 text-xs text-muted-foreground">The latest signals from every connected screen</p></div><span className="font-mono text-[9px] uppercase text-muted-foreground">{visibleEvents.length} visible</span></div>
                  <div className="min-h-64">{visibleEvents.length ? visibleEvents.map((event) => <EventRow key={event.id} event={event} />) : <div className="grid h-64 place-items-center text-sm text-muted-foreground">No matching events</div>}</div>
                </section>

                <section className="panel overflow-hidden">
                  <div className="flex items-center justify-between border-b border-border px-5 py-4"><div><h3 className="font-display text-sm font-semibold">Content momentum</h3><p className="mt-1 text-xs text-muted-foreground">What is earning attention right now</p></div><Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => navAction("Media")}>View media <ArrowRight className="size-3.5" /></Button></div>
                  <div className="grid grid-cols-[minmax(0,1fr)_72px_150px_52px] gap-3 border-b border-border px-5 py-2 font-mono text-[9px] uppercase text-muted-foreground"><span>Content</span><span>Plays</span><span>Completion</span><span>Trend</span></div>
                  {CONTENT.map((item) => <div key={item.name} className="grid grid-cols-[minmax(0,1fr)_72px_150px_52px] items-center gap-3 border-b border-border px-5 py-3 last:border-0"><p className="truncate text-xs font-medium">{item.name}</p><span className="font-mono text-[10px]">{item.plays}</span><div className="flex items-center gap-2"><div className="h-1.5 flex-1 overflow-hidden rounded-sm bg-secondary"><div className="h-full bg-accent" style={{ width: `${item.completion}%` }} /></div><span className="w-8 font-mono text-[9px] text-muted-foreground">{item.completion}%</span></div><span className={cn("font-mono text-[9px]", item.trend.startsWith("+") ? "text-accent" : "text-destructive")}>{item.trend}</span></div>)}
                </section>
              </div>

              <div className="space-y-5">
                {anomalyVisible && <section className="overflow-hidden rounded-md border border-primary/35 bg-card shadow-panel">
                  <div className="flex items-start gap-3 border-b border-border bg-primary/10 p-4"><div className="grid size-8 shrink-0 place-items-center rounded-md bg-primary text-primary-foreground"><Sparkles className="size-4" /></div><div><p className="label-caps text-primary">Pulse intelligence</p><h3 className="mt-1 font-display text-sm font-semibold">A recovery pattern is emerging</h3></div></div>
                  <div className="p-4"><p className="text-xs leading-relaxed text-muted-foreground">Reception portrait is retrying media more often than peer screens. Pre-caching its active playlist should prevent an interruption.</p><div className="mt-3 flex items-center gap-2 rounded-md bg-secondary px-3 py-2"><CircleAlert className="size-3.5 text-primary" /><span className="text-[11px]">Predicted risk in 24 min</span><span className="ml-auto font-mono text-[9px] text-primary">82% confidence</span></div><div className="mt-4 flex gap-2"><Button size="sm" className="h-8" onClick={() => { setAnomalyVisible(false); toast.success("Playlist pre-cached", { description: "Reception portrait is protected." }); }}><Zap className="size-3.5" /> Protect playback</Button><Button variant="ghost" size="sm" className="h-8 text-xs" onClick={() => setAnomalyVisible(false)}>Dismiss</Button></div></div>
                </section>}

                <section className="panel overflow-hidden">
                  <div className="border-b border-border px-4 py-3.5"><div className="flex items-center gap-2"><MapPin className="size-4 text-primary" /><h3 className="font-display text-sm font-semibold">Location signals</h3></div><p className="mt-1 text-xs text-muted-foreground">Live playback quality by workspace</p></div>
                  <div className="px-4">{LOCATIONS.map((item) => <div key={item.name} className="border-b border-border py-3.5 last:border-0"><div className="flex items-center justify-between"><p className="text-xs font-medium">{item.name}</p><span className="font-display text-sm font-semibold">{item.quality}%</span></div><div className="mt-1.5 flex items-center justify-between text-[10px] text-muted-foreground"><span>{item.plays} plays · {item.reach}</span><span className="flex items-center gap-1 text-accent"><span className="size-1.5 rounded-full bg-accent" /> Healthy</span></div></div>)}</div>
                </section>

                <Button variant="outline" className="h-11 w-full justify-between bg-card px-4 text-xs" onClick={() => toast("Pulse report ready", { description: "The latest network snapshot has been prepared." })}><span className="flex items-center gap-2"><Activity className="size-4 text-accent" />Create pulse snapshot</span><ArrowRight className="size-3.5 text-muted-foreground" /></Button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

function SignalLine({ label, value, tone }: { label: string; value: string; tone: "accent" | "primary" }) {
  return <div className="flex items-center justify-between text-xs"><span className="text-muted-foreground">{label}</span><span className="flex items-center gap-1.5 font-mono text-[10px]"><span className={cn("size-1.5 rounded-full", tone === "accent" ? "bg-accent" : "bg-primary")} />{value}</span></div>;
}

function Metric({ label, value, detail, icon: Icon, trend, last = false }: { label: string; value: string; detail: string; icon: typeof Play; trend: "up" | "down" | "warning"; last?: boolean }) {
  const TrendIcon = trend === "up" ? ArrowUpRight : trend === "down" ? ArrowDownRight : WifiOff;
  return <div className={cn("min-w-0 px-5 py-4", !last && "border-r border-border")}><div className="flex items-center justify-between"><p className="label-caps truncate">{label}</p><Icon className={cn("size-4", trend === "warning" ? "text-primary" : "text-accent")} /></div><p className="mt-3 font-display text-2xl font-semibold">{value}</p><p className={cn("mt-1 flex items-center gap-1 truncate text-[11px]", trend === "warning" ? "text-primary" : "text-muted-foreground")}><TrendIcon className="size-3 shrink-0" />{detail}</p></div>;
}

function EventRow({ event }: { event: FeedEvent }) {
  const Icon = event.icon;
  return <div className="grid grid-cols-[68px_32px_minmax(0,1fr)_auto] items-center gap-3 border-b border-border px-5 py-3 last:border-0 hover:bg-secondary/40"><span className="font-mono text-[9px] text-muted-foreground">{event.time}</span><div className={cn("grid size-8 place-items-center rounded-md", event.status === "warning" ? "bg-primary/15 text-primary" : event.status === "active" ? "bg-accent/15 text-accent" : "bg-secondary text-muted-foreground")}><Icon className="size-3.5" /></div><div className="min-w-0"><p className="truncate text-xs font-medium">{event.title}</p><p className="mt-0.5 truncate text-[10px] text-muted-foreground">{event.detail}</p></div><span className={cn("size-1.5 rounded-full", event.status === "warning" ? "bg-primary" : "bg-accent")} /></div>;
}