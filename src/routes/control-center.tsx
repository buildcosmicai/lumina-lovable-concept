import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  Activity,
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleAlert,
  Clock3,
  Gauge,
  HardDrive,
  Images,
  KeyRound,
  Layers,
  Lightbulb,
  ListVideo,
  Monitor,
  MoreHorizontal,
  Plus,
  Search,
  Settings,
  Sparkles,
  TrendingUp,
  Users,
  WifiOff,
  X,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/control-center")({
  head: () => ({
    meta: [
      { title: "Control Centre — Signage CMS" },
      { name: "description", content: "Monitor screen health, content delivery, schedules and intelligent recommendations across your signage network." },
      { property: "og:title", content: "Control Centre — Signage CMS" },
      { property: "og:description", content: "A live operational view of every screen, schedule and content signal." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ControlCentrePage,
});

const NAV_ITEMS = [
  { label: "Control Center", icon: Gauge, to: "/control-center" as const },
  { label: "Pulse", icon: Activity },
  { label: "Screens", icon: Monitor },
  { label: "Schedules", icon: CalendarDays },
  { label: "Media", icon: Images, to: "/media" as const },
  { label: "Playlists", icon: ListVideo },
  { label: "Layouts", icon: Layers, to: "/layouts" as const },
  { label: "Licensing", icon: KeyRound },
  { label: "Users", icon: Users },
];

const HEALTH_POINTS = [58, 62, 61, 69, 66, 76, 72, 82, 78, 88, 86, 91, 89, 94, 92, 96, 95, 97];

type AlertItem = {
  id: string;
  severity: "critical" | "warning" | "notice";
  title: string;
  detail: string;
  time: string;
  action: string;
  icon: typeof WifiOff;
};

const START_ALERTS: AlertItem[] = [
  { id: "atrium", severity: "critical", title: "Atrium display is offline", detail: "No heartbeat for 14 minutes · Floor 01", time: "14m", action: "Inspect", icon: WifiOff },
  { id: "campaign", severity: "warning", title: "Autumn campaign expires today", detail: "8 screens will fall back at 18:00", time: "2h", action: "Extend", icon: Clock3 },
  { id: "conflict", severity: "notice", title: "Schedule overlap detected", detail: "Lobby East · Welcome and Town Hall", time: "4h", action: "Resolve", icon: CalendarDays },
];

const SCHEDULE = [
  { time: "10:30", title: "Morning menu → Lunch menu", place: "Cafeteria · 4 screens", tone: "primary" },
  { time: "12:00", title: "Town Hall takeover", place: "HQ network · 18 screens", tone: "accent" },
  { time: "16:30", title: "Evening ambience", place: "Lobby & atrium · 6 screens", tone: "muted" },
];

function ControlCentrePage() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [range, setRange] = useState<"Today" | "7 days" | "30 days">("Today");
  const [alerts, setAlerts] = useState(START_ALERTS);
  const [recommendationVisible, setRecommendationVisible] = useState(true);
  const health = useMemo(() => range === "Today" ? "97.4%" : range === "7 days" ? "96.8%" : "95.9%", [range]);

  const navAction = (label: string) => toast(label, { description: "This section is not connected yet." });
  const resolveAlert = (alert: AlertItem) => {
    setAlerts((current) => current.filter((item) => item.id !== alert.id));
    toast.success(`${alert.action} started`, { description: alert.title });
  };

  return (
    <div className="flex h-screen min-w-[880px] overflow-hidden bg-surface text-foreground">
      <Toaster />
      <aside className={cn("relative flex h-screen shrink-0 border-r border-border bg-card transition-[width] duration-200", sidebarOpen ? "w-72" : "w-16")}>
        <div className="flex w-16 shrink-0 flex-col items-center border-r border-border bg-surface py-3">
          <Link to="/control-center" aria-label="Control Centre home" className="mb-5 grid size-9 place-items-center rounded-md bg-primary text-primary-foreground shadow-sm"><Layers className="size-4" /></Link>
          <nav aria-label="Primary navigation" className="flex flex-col items-center gap-0.5">
            {NAV_ITEMS.map((item) => item.to ? (
              <Button key={item.label} asChild variant="ghost" size="icon" className={cn("size-9 text-muted-foreground", item.to === "/control-center" && "bg-primary/15 text-primary hover:bg-primary/20 hover:text-primary")}>
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
              <Button key={item.label} asChild variant="ghost" className={cn("h-9 w-full justify-start gap-3 px-2 text-sm font-normal text-muted-foreground", item.to === "/control-center" && "bg-primary/15 font-semibold text-primary hover:bg-primary/20 hover:text-primary")}>
                <Link to={item.to}><item.icon className="size-4 shrink-0" />{item.label}</Link>
              </Button>
            ) : (
              <Button key={item.label} variant="ghost" onClick={() => navAction(item.label)} className="h-9 w-full justify-start gap-3 px-2 text-sm font-normal text-muted-foreground"><item.icon className="size-4 shrink-0" />{item.label}</Button>
            ))}
          </nav>
          <section className="mt-5 border-t border-border pt-5">
            <p className="label-caps px-2">Network</p>
            <div className="mt-3 space-y-2 px-2 text-xs">
              <div className="flex items-center justify-between"><span className="flex items-center gap-2 text-muted-foreground"><span className="size-1.5 rounded-full bg-accent" />Online</span><span className="font-mono">46</span></div>
              <div className="flex items-center justify-between"><span className="flex items-center gap-2 text-muted-foreground"><span className="size-1.5 rounded-full bg-primary" />Needs attention</span><span className="font-mono">2</span></div>
              <div className="flex items-center justify-between"><span className="flex items-center gap-2 text-muted-foreground"><span className="size-1.5 rounded-full bg-destructive" />Offline</span><span className="font-mono">1</span></div>
            </div>
          </section>
          <div className="mt-auto rounded-md border border-border bg-surface p-3">
            <div className="flex items-center gap-2"><Zap className="size-3.5 text-primary" /><p className="text-xs font-semibold">All systems synced</p></div>
            <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">Last network check 42 seconds ago.</p>
          </div>
        </div>}
        {!sidebarOpen && <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(true)} aria-label="Expand sidebar" title="Expand sidebar" className="absolute left-11 top-3 size-7 border border-border bg-card text-muted-foreground shadow-sm"><ChevronRight className="size-3.5" /></Button>}
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 shrink-0 items-center gap-3 border-b border-border bg-card px-6">
          <div><h1 className="font-display text-base font-semibold leading-tight">Control Centre</h1><p className="text-xs text-muted-foreground">Saturday, 19 September · London workspace</p></div>
          <div className="ml-auto flex items-center gap-2">
            <div className="relative"><Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" /><Input aria-label="Search workspace" placeholder="Search screens, media…" className="h-8 w-52 bg-secondary pl-8 text-sm" /></div>
            <Button size="sm" onClick={() => toast.success("Quick create", { description: "Choose a layout, playlist or schedule." })}><Plus className="size-4" /> Create</Button>
          </div>
        </header>

        <main className="min-w-0 flex-1 overflow-y-auto">
          <div className="mx-auto max-w-[1440px] px-6 py-6">
            <section className="mb-6 flex items-end justify-between gap-6">
              <div><p className="label-caps mb-2">Live operations</p><h2 className="max-w-xl font-display text-2xl font-semibold leading-tight">Your network is healthy.<br /><span className="text-muted-foreground">Three items need your attention.</span></h2></div>
              <div className="flex rounded-md border border-border bg-card p-1">
                {(["Today", "7 days", "30 days"] as const).map((item) => <Button key={item} variant="ghost" size="sm" onClick={() => setRange(item)} className={cn("h-7 px-3 text-xs", range === item && "bg-secondary text-foreground")}>{item}</Button>)}
              </div>
            </section>

            <section className="grid grid-cols-4 border-y border-border bg-card">
              <Metric icon={Monitor} label="Screens online" value="46 / 49" detail="2 warnings · 1 offline" emphasis="accent" />
              <Metric icon={Activity} label="Network health" value={health} detail="+1.8% from last period" emphasis="primary" />
              <Metric icon={ListVideo} label="Live campaigns" value="12" detail="Across 7 locations" emphasis="accent" />
              <Metric icon={HardDrive} label="Storage used" value="24%" detail="2.4 of 10 GB" emphasis="primary" last />
            </section>

            <div className="mt-6 grid grid-cols-[minmax(0,1.55fr)_minmax(300px,.85fr)] gap-5">
              <div className="space-y-5">
                <section className="panel overflow-hidden">
                  <div className="flex items-center justify-between border-b border-border px-5 py-4">
                    <div><div className="flex items-center gap-2"><CircleAlert className="size-4 text-primary" /><h3 className="font-display text-sm font-semibold">Attention queue</h3><span className="rounded-sm bg-primary/15 px-1.5 py-0.5 font-mono text-[9px] font-medium text-primary">{alerts.length}</span></div><p className="mt-1 text-xs text-muted-foreground">Prioritized by impact and urgency</p></div>
                    <Button variant="ghost" size="sm" onClick={() => setAlerts([])} className="h-7 text-xs text-muted-foreground">Clear all</Button>
                  </div>
                  {alerts.length ? <div>{alerts.map((alert) => <AlertRow key={alert.id} alert={alert} onAction={() => resolveAlert(alert)} />)}</div> : <div className="grid h-44 place-items-center text-center"><div><CheckCircle2 className="mx-auto mb-2 size-6 text-accent" /><p className="text-sm font-medium">Everything is clear</p><p className="mt-1 text-xs text-muted-foreground">No active issues need your attention.</p></div></div>}
                </section>

                <section className="panel p-5">
                  <div className="flex items-start justify-between"><div><div className="flex items-center gap-2"><Activity className="size-4 text-accent" /><h3 className="font-display text-sm font-semibold">Network activity</h3></div><p className="mt-1 text-xs text-muted-foreground">Successful content check-ins · last 12 hours</p></div><div className="text-right"><p className="font-display text-xl font-semibold">14.8k</p><p className="flex items-center justify-end gap-1 text-[11px] text-accent"><TrendingUp className="size-3" /> 8.2% increase</p></div></div>
                  <div className="relative mt-6 h-36 border-b border-l border-border">
                    <div className="absolute inset-0 flex flex-col justify-between">{[0, 1, 2, 3].map((line) => <span key={line} className="block border-t border-dashed border-border/70" />)}</div>
                    <div className="absolute inset-x-3 bottom-0 top-2 flex items-end gap-1.5">{HEALTH_POINTS.map((point, index) => <div key={index} className="group relative flex-1"><div className="w-full rounded-t-sm bg-accent/25 transition-colors group-hover:bg-accent/55" style={{ height: `${point}%` }} /><span className="pointer-events-none absolute -top-6 left-1/2 hidden -translate-x-1/2 rounded-sm bg-foreground px-1.5 py-0.5 font-mono text-[9px] text-background group-hover:block">{point}%</span></div>)}</div>
                  </div>
                  <div className="mt-2 flex justify-between font-mono text-[9px] text-muted-foreground"><span>00:00</span><span>04:00</span><span>08:00</span><span>Now</span></div>
                </section>
              </div>

              <div className="space-y-5">
                {recommendationVisible && <section className="overflow-hidden rounded-md border border-primary/35 bg-card shadow-panel">
                  <div className="flex items-start gap-3 border-b border-border bg-primary/10 p-4"><div className="grid size-8 shrink-0 place-items-center rounded-md bg-primary text-primary-foreground"><Sparkles className="size-4" /></div><div className="min-w-0 flex-1"><p className="label-caps text-primary">CMS Intelligence</p><h3 className="mt-1 font-display text-sm font-semibold">Recover 18 hours of screen time</h3></div><Button variant="ghost" size="icon" onClick={() => setRecommendationVisible(false)} aria-label="Dismiss recommendation" className="size-7 text-muted-foreground"><X className="size-3.5" /></Button></div>
                  <div className="p-4"><p className="text-xs leading-relaxed text-muted-foreground">The Atrium display usually reconnects after a remote player restart. Applying this now could restore service before the lunch peak.</p><div className="mt-4 flex items-center gap-2"><Button size="sm" className="h-8" onClick={() => { setAlerts((current) => current.filter((item) => item.id !== "atrium")); setRecommendationVisible(false); toast.success("Remote restart sent", { description: "Atrium display is reconnecting." }); }}><Zap className="size-3.5" /> Apply fix</Button><Button variant="ghost" size="sm" className="h-8 text-xs" onClick={() => toast("Why this suggestion?", { description: "Based on 6 similar recoveries this month." })}>Why this?</Button></div></div>
                </section>}

                <section className="panel overflow-hidden">
                  <div className="flex items-center justify-between border-b border-border px-4 py-3.5"><div className="flex items-center gap-2"><CalendarDays className="size-4 text-accent" /><h3 className="font-display text-sm font-semibold">Up next</h3></div><Button variant="ghost" size="icon" aria-label="Schedule options" className="size-7 text-muted-foreground"><MoreHorizontal className="size-4" /></Button></div>
                  <div className="px-4">{SCHEDULE.map((item, index) => <div key={item.time} className="relative flex gap-3 border-b border-border py-3.5 last:border-0"><div className="w-11 shrink-0 pt-0.5 font-mono text-[10px] text-muted-foreground">{item.time}</div><div className="relative min-w-0 flex-1"><span className={cn("absolute -left-[18px] top-1 size-1.5 rounded-full", item.tone === "accent" ? "bg-accent" : item.tone === "primary" ? "bg-primary" : "bg-muted-foreground")} /><p className="truncate text-xs font-medium">{item.title}</p><p className="mt-1 truncate text-[11px] text-muted-foreground">{item.place}</p></div>{index === 0 && <span className="self-start rounded-sm bg-accent/15 px-1.5 py-0.5 font-mono text-[8px] uppercase text-accent">Next</span>}</div>)}</div>
                  <Button variant="ghost" className="h-10 w-full rounded-none border-t border-border text-xs text-muted-foreground" onClick={() => navAction("Schedules")}>View full schedule <ArrowRight className="size-3.5" /></Button>
                </section>

                <section className="grid grid-cols-2 gap-3">
                  <QuickAction icon={Layers} label="New layout" to="/" />
                  <QuickAction icon={Images} label="Add media" to="/media" />
                </section>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

function Metric({ icon: Icon, label, value, detail, emphasis, last = false }: { icon: typeof Monitor; label: string; value: string; detail: string; emphasis: "primary" | "accent"; last?: boolean }) {
  return <div className={cn("min-w-0 px-5 py-4", !last && "border-r border-border")}><div className="flex items-center justify-between"><p className="label-caps truncate">{label}</p><Icon className={cn("size-4", emphasis === "accent" ? "text-accent" : "text-primary")} /></div><p className="mt-3 font-display text-2xl font-semibold">{value}</p><p className="mt-1 truncate text-[11px] text-muted-foreground">{detail}</p></div>;
}

function AlertRow({ alert, onAction }: { alert: AlertItem; onAction: () => void }) {
  const Icon = alert.icon;
  return <div className="group grid grid-cols-[36px_minmax(0,1fr)_auto_auto] items-center gap-3 border-b border-border px-5 py-3.5 last:border-0 hover:bg-secondary/40"><div className={cn("grid size-8 place-items-center rounded-md", alert.severity === "critical" ? "bg-destructive/10 text-destructive" : alert.severity === "warning" ? "bg-primary/15 text-primary" : "bg-accent/15 text-accent")}><Icon className="size-4" /></div><div className="min-w-0"><p className="truncate text-sm font-medium">{alert.title}</p><p className="mt-0.5 truncate text-[11px] text-muted-foreground">{alert.detail}</p></div><span className="font-mono text-[9px] text-muted-foreground">{alert.time}</span><Button variant="outline" size="sm" onClick={onAction} className="h-7 w-16 px-2 text-[11px]">{alert.action}</Button></div>;
}

function QuickAction({ icon: Icon, label, to }: { icon: typeof Layers; label: string; to: "/" | "/media" }) {
  return <Button asChild variant="outline" className="h-12 justify-between bg-card px-3"><Link to={to}><span className="flex items-center gap-2 text-xs"><Icon className="size-4 text-primary" />{label}</span><ArrowRight className="size-3.5 text-muted-foreground" /></Link></Button>;
}