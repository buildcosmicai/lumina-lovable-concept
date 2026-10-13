import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useRef, useState } from "react";
import {
  Activity, AlertTriangle, CalendarDays, ChevronLeft, ChevronRight, Clock, Copy, Gauge, Images, KeyRound,
  Layers, ListVideo, Monitor, Plus, Repeat, Settings, Sparkles, Trash2, Users, Wand2,
, Handshake } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/schedules")({
  head: () => ({
    meta: [
      { title: "Schedules — Signage CMS" },
      { name: "description", content: "Plan what plays where and when with a drag-and-drop timeline, conflict detection and natural-language scheduling." },
      { property: "og:title", content: "Schedules — Signage CMS" },
      { property: "og:description", content: "A visual, intelligent timeline for scheduling signage content across every screen group." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SchedulesPage,
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
  { label: "Partners", icon: Handshake, to: "/partners" as const },
];

const START = 6;
const END = 24;
const SPAN = END - START;
const NOW = 14.5;
const DAYS = ["Mon 12", "Tue 13", "Wed 14", "Thu 15", "Fri 16", "Sat 17", "Sun 18"];
const CHANNELS = ["Lobby East", "Atrium wall", "Cafeteria", "Meeting suites", "Street window", "Bristol welcome"];
const TONES = ["bg-zone-1", "bg-zone-2", "bg-zone-3", "bg-zone-4", "bg-zone-5"];
const RECUR = ["Once", "Daily", "Weekdays", "Weekends"] as const;

type Slot = { id: number; title: string; channel: number; start: number; end: number; tone: number; priority: "Normal" | "High"; recur: (typeof RECUR)[number] };

const SEED: Slot[] = [
  { id: 1, title: "Morning welcome", channel: 0, start: 7, end: 10, tone: 0, priority: "Normal", recur: "Weekdays" },
  { id: 2, title: "Autumn launch", channel: 0, start: 10, end: 17, tone: 1, priority: "High", recur: "Daily" },
  { id: 3, title: "Evening ambience", channel: 1, start: 16, end: 22, tone: 4, priority: "Normal", recur: "Daily" },
  { id: 4, title: "Brand film loop", channel: 1, start: 8, end: 13, tone: 2, priority: "Normal", recur: "Daily" },
  { id: 5, title: "Breakfast menu", channel: 2, start: 7, end: 11, tone: 3, priority: "Normal", recur: "Weekdays" },
  { id: 6, title: "Lunch menu", channel: 2, start: 11, end: 14.5, tone: 0, priority: "High", recur: "Weekdays" },
  { id: 7, title: "Wellbeing week", channel: 2, start: 13.5, end: 16, tone: 2, priority: "High", recur: "Once" },
  { id: 8, title: "Room bookings", channel: 3, start: 8, end: 18, tone: 1, priority: "Normal", recur: "Weekdays" },
  { id: 9, title: "Window promo", channel: 4, start: 9, end: 21, tone: 4, priority: "Normal", recur: "Daily" },
  { id: 10, title: "Visitor welcome", channel: 5, start: 8, end: 12, tone: 3, priority: "Normal", recur: "Weekdays" },
];

const fmt = (h: number) => `${String(Math.floor(h) % 24).padStart(2, "0")}:${h % 1 ? "30" : "00"}`;
const overlaps = (a: Slot, b: Slot) => a.channel === b.channel && a.id !== b.id && a.start < b.end && b.start < a.end;

function SchedulesPage() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [day, setDay] = useState(0);
  const [slots, setSlots] = useState<Slot[]>(SEED);
  const [selectedId, setSelectedId] = useState<number | null>(2);
  const [command, setCommand] = useState("");
  const trackRef = useRef<HTMLDivElement>(null);

  const selected = slots.find((s) => s.id === selectedId) ?? null;
  const conflicts = useMemo(() => {
    const ids = new Set<number>();
    slots.forEach((a) => slots.forEach((b) => overlaps(a, b) && ids.add(a.id)));
    return ids;
  }, [slots]);
  const gaps = useMemo(() => CHANNELS.map((_, c) => {
    const covered = slots.filter((s) => s.channel === c).reduce((sum, s) => sum + (s.end - s.start), 0);
    return Math.max(0, SPAN - covered);
  }), [slots]);
  const totalGap = gaps.reduce((a, b) => a + b, 0);
  const coverage = Math.round(100 - (totalGap / (SPAN * CHANNELS.length)) * 100);
  const nowPlaying = slots.filter((s) => s.start <= NOW && s.end > NOW);

  const update = (id: number, patch: Partial<Slot>) => setSlots((all) => all.map((s) => (s.id === id ? { ...s, ...patch } : s)));
  const navAction = (label: string) => toast(label, { description: "This section is not connected yet." });

  const startDrag = (e: React.PointerEvent, slot: Slot, mode: "move" | "resize") => {
    if (!trackRef.current) return;
    e.stopPropagation();
    e.preventDefault();
    setSelectedId(slot.id);
    const width = trackRef.current.getBoundingClientRect().width;
    const originX = e.clientX;
    const { start, end } = slot;
    const onMove = (ev: PointerEvent) => {
      const delta = Math.round(((ev.clientX - originX) / width) * SPAN * 2) / 2;
      if (mode === "move") {
        const len = end - start;
        const s = Math.min(Math.max(START, start + delta), END - len);
        update(slot.id, { start: s, end: s + len });
      } else {
        update(slot.id, { end: Math.min(END, Math.max(start + 0.5, end + delta)) });
      }
    };
    const onUp = () => { window.removeEventListener("pointermove", onMove); window.removeEventListener("pointerup", onUp); };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  };

  const addSlot = (partial: Partial<Slot>) => {
    const id = Math.max(0, ...slots.map((s) => s.id)) + 1;
    const slot: Slot = { id, title: "New campaign", channel: 0, start: 18, end: 20, tone: id % 5, priority: "Normal", recur: "Once", ...partial };
    setSlots((all) => [...all, slot]);
    setSelectedId(id);
    return slot;
  };

  const runCommand = () => {
    const m = command.trim().match(/^(.+?)\s+(?:from\s+)?(\d{1,2})(?::(30))?\s*(?:-|to)\s*(\d{1,2})(?::(30))?\s+(?:at|on|in)\s+(.+?)(?:\s+(daily|weekdays|weekends))?$/i);
    if (!m || !m[1] || !m[2] || !m[4] || !m[6]) { toast("Try a sentence like this", { description: "Lunch specials 11-14 at Cafeteria weekdays" }); return; }
    const where = m[6].toLowerCase();
    const channel = CHANNELS.findIndex((c) => c.toLowerCase().includes(where) || where.includes(c.toLowerCase().split(" ")[0] ?? ""));
    if (channel < 0) { toast("Screen group not found", { description: `Choose one of: ${CHANNELS.join(", ")}` }); return; }
    const start = Math.max(START, +m[2] + (m[3] ? 0.5 : 0));
    const end = Math.min(END, +m[4] + (m[5] ? 0.5 : 0));
    if (end <= start) { toast("The end time must be after the start time"); return; }
    const r7 = m[7]; const recur = (r7 ? r7.charAt(0).toUpperCase() + r7.slice(1).toLowerCase() : "Once") as Slot["recur"];
    const slot = addSlot({ title: m[1] as string, channel, start, end, recur });
    setCommand("");
    toast(`Scheduled “${slot.title}”`, { description: `${CHANNELS[channel]} · ${fmt(start)}–${fmt(end)} · ${recur}` });
  };

  const autoResolve = () => {
    setSlots((all) => {
      const next = all.map((s) => ({ ...s }));
      CHANNELS.forEach((_, c) => {
        const row = next.filter((s) => s.channel === c).sort((a, b) => (a.priority === b.priority ? a.start - b.start : a.priority === "High" ? -1 : 1));
        const placed: Slot[] = [];
        row.forEach((s) => {
          const clash = placed.find((p) => s.start < p.end && p.start < s.end);
          if (clash) {
            const len = s.end - s.start;
            if (s.start >= clash.start) { s.start = Math.min(clash.end, END - 0.5); s.end = Math.min(END, s.start + len); }
            else { s.end = clash.start; }
          }
          placed.push(s);
        });
      });
      return next;
    });
    toast("Conflicts resolved", { description: "Higher-priority campaigns kept their slots; others were shifted." });
  };

  const fillGaps = () => {
    const added: Slot[] = [];
    let id = Math.max(...slots.map((s) => s.id));
    CHANNELS.forEach((_, c) => {
      const row = slots.filter((s) => s.channel === c).sort((a, b) => a.start - b.start);
      let cursor = START;
      [...row, { start: END, end: END } as Slot].forEach((s) => {
        if (s.start - cursor >= 1) added.push({ id: ++id, title: "House playlist", channel: c, start: cursor, end: s.start, tone: 4, priority: "Normal", recur: "Daily" });
        cursor = Math.max(cursor, s.end);
      });
    });
    setSlots((all) => [...all, ...added]);
    toast(`Filled ${added.length} empty windows`, { description: "Screens will fall back to the house playlist." });
  };

  return (
    <div className="flex h-screen min-w-[1080px] overflow-hidden bg-surface text-foreground">
      <Toaster />
      <aside className={cn("relative flex h-screen shrink-0 border-r border-border bg-card transition-[width] duration-200", sidebarOpen ? "w-64" : "w-16")}>
        <div className="flex w-16 shrink-0 flex-col items-center border-r border-border bg-surface py-3">
          <Link to="/control-center" aria-label="Control Centre home" className="mb-5 grid size-9 place-items-center rounded-md bg-primary text-primary-foreground shadow-sm"><Layers className="size-4" /></Link>
          <nav aria-label="Primary navigation" className="flex flex-col items-center gap-0.5">
            {NAV_ITEMS.map((item) => item.to ? (
              <Button key={item.label} asChild variant="ghost" size="icon" className={cn("size-9 text-muted-foreground", item.to === "/schedules" && "bg-primary/15 text-primary hover:bg-primary/20 hover:text-primary")}>
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
              <Button key={item.label} asChild variant="ghost" className={cn("h-9 w-full justify-start gap-3 px-2 text-sm font-normal text-muted-foreground", item.to === "/schedules" && "bg-primary/15 font-semibold text-primary hover:bg-primary/20 hover:text-primary")}>
                <Link to={item.to}><item.icon className="size-4 shrink-0" />{item.label}</Link>
              </Button>
            ) : (
              <Button key={item.label} variant="ghost" onClick={() => navAction(item.label)} className="h-9 w-full justify-start gap-3 px-2 text-sm font-normal text-muted-foreground"><item.icon className="size-4 shrink-0" />{item.label}</Button>
            ))}
          </nav>
          <section className="mt-5 border-t border-border pt-5 px-2">
            <p className="label-caps">Playing now · {fmt(NOW)}</p>
            <ul className="mt-3 space-y-2">
              {nowPlaying.map((s) => (
                <li key={s.id}><button onClick={() => setSelectedId(s.id)} className="flex w-full items-center gap-2 text-left text-xs"><span className={cn("size-2 shrink-0 rounded-full", TONES[s.tone])} /><span className="truncate font-medium">{s.title}</span><span className="ml-auto truncate text-muted-foreground">{CHANNELS[s.channel]?.split(" ")[0]}</span></button></li>
              ))}
            </ul>
          </section>
        </div>}
        {!sidebarOpen && <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(true)} aria-label="Expand sidebar" className="absolute left-11 top-3 size-7 border border-border bg-card text-muted-foreground shadow-sm"><ChevronRight className="size-3.5" /></Button>}
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 shrink-0 items-center gap-3 border-b border-border bg-card px-6">
          <div><h1 className="font-display text-base font-semibold leading-tight">Schedules</h1><p className="text-xs text-muted-foreground">Week of 12 October · drag to move, pull the right edge to resize</p></div>
          <div className="ml-auto flex items-center gap-2">
            <Button variant="outline" size="sm" className="h-8" onClick={() => toast("Schedule duplicated to next week")}><Copy className="size-3.5" />Copy week</Button>
            <Button size="sm" className="h-8" onClick={() => addSlot({})}><Plus className="size-3.5" />New slot</Button>
          </div>
        </header>

        <div className="flex min-h-0 flex-1">
          <main className="min-w-0 flex-1 overflow-y-auto px-6 py-5">
            {/* Natural-language composer */}
            <form onSubmit={(e) => { e.preventDefault(); runCommand(); }} className="panel flex items-center gap-3 rounded-md border border-border bg-card p-2 pl-3">
              <Sparkles className="size-4 shrink-0 text-primary" />
              <Input value={command} onChange={(e) => setCommand(e.target.value)} aria-label="Describe a schedule" placeholder="Describe it: “Happy hour promo 17-20 at Atrium daily”" className="h-9 border-0 bg-transparent shadow-none focus-visible:ring-0" />
              <Button type="submit" size="sm" className="h-8"><Wand2 className="size-3.5" />Schedule</Button>
            </form>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {["Lunch specials 11-14 at Cafeteria weekdays", "Safety notice 8-9 at Lobby daily", "Weekend sale 10-18 at Street window weekends"].map((ex) => (
                <button key={ex} type="button" onClick={() => setCommand(ex)} className="rounded-sm border border-border bg-card px-2 py-1 text-[11px] text-muted-foreground hover:border-primary hover:text-foreground">{ex}</button>
              ))}
            </div>

            {/* Health strip */}
            <section className="mt-5 grid grid-cols-3 gap-3">
              <div className="panel rounded-md border border-border bg-card p-4"><p className="label-caps">Coverage</p><p className="mt-1 font-display text-2xl font-semibold">{coverage}%</p><div className="mt-2 h-1.5 rounded-full bg-secondary"><div className="h-full rounded-full bg-accent" style={{ width: `${coverage}%` }} /></div></div>
              <div className={cn("panel rounded-md border bg-card p-4", conflicts.size ? "border-destructive/40" : "border-border")}>
                <p className="label-caps">Conflicts</p>
                <div className="mt-1 flex items-end justify-between"><p className={cn("font-display text-2xl font-semibold", conflicts.size && "text-destructive")}>{conflicts.size}</p>{conflicts.size > 0 && <Button size="sm" variant="outline" className="h-7 text-xs" onClick={autoResolve}><Wand2 className="size-3" />Auto-resolve</Button>}</div>
                <p className="mt-1 text-[11px] text-muted-foreground">{conflicts.size ? "Overlapping campaigns on the same screens" : "Every screen has a clear plan"}</p>
              </div>
              <div className="panel rounded-md border border-border bg-card p-4">
                <p className="label-caps">Empty airtime</p>
                <div className="mt-1 flex items-end justify-between"><p className="font-display text-2xl font-semibold">{totalGap}h</p>{totalGap > 0 && <Button size="sm" variant="outline" className="h-7 text-xs" onClick={fillGaps}><Sparkles className="size-3" />Fill gaps</Button>}</div>
                <p className="mt-1 text-[11px] text-muted-foreground">Blank screens across all groups today</p>
              </div>
            </section>

            {/* Day picker */}
            <div className="mt-5 flex items-center gap-1 rounded-md border border-border bg-card p-1">
              {DAYS.map((d, i) => (
                <button key={d} onClick={() => setDay(i)} className={cn("flex-1 rounded-sm py-1.5 text-xs font-medium transition-colors", day === i ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-secondary", i === 0 && day !== 0 && "text-primary")}>{d}{i === 0 && " · Today"}</button>
              ))}
            </div>

            {/* Timeline */}
            <section className="panel mt-3 overflow-hidden rounded-md border border-border bg-card">
              <div className="flex border-b border-border">
                <div className="w-36 shrink-0 border-r border-border px-3 py-2 label-caps">Screen group</div>
                <div className="relative h-8 flex-1">
                  {Array.from({ length: SPAN / 2 + 1 }, (_, i) => START + i * 2).map((h) => (
                    <span key={h} className="absolute top-2 -translate-x-1/2 font-mono text-[10px] text-muted-foreground first:translate-x-0 last:-translate-x-full" style={{ left: `${((h - START) / SPAN) * 100}%` }}>{fmt(h)}</span>
                  ))}
                </div>
              </div>
              {CHANNELS.map((channel, c) => (
                <div key={channel} className="flex border-b border-border last:border-0">
                  <div className="flex w-36 shrink-0 flex-col justify-center border-r border-border px-3">
                    <p className="truncate text-xs font-medium">{channel}</p>
                    <p className="font-mono text-[10px] text-muted-foreground">{gaps[c] ? `${gaps[c]}h empty` : "Fully covered"}</p>
                  </div>
                  <div ref={c === 0 ? trackRef : undefined} className="relative h-16 flex-1 select-none" onDoubleClick={(e) => {
                    const r = e.currentTarget.getBoundingClientRect();
                    const s = Math.min(END - 1, START + Math.floor(((e.clientX - r.left) / r.width) * SPAN * 2) / 2);
                    addSlot({ channel: c, start: s, end: s + 1 });
                  }}>
                    {Array.from({ length: SPAN }, (_, i) => <div key={i} className="absolute inset-y-0 border-l border-grid-line" style={{ left: `${(i / SPAN) * 100}%` }} />)}
                    {day === 0 && <div className="pointer-events-none absolute inset-y-0 z-20 w-px bg-destructive" style={{ left: `${((NOW - START) / SPAN) * 100}%` }} />}
                    {slots.filter((s) => s.channel === c).map((s) => (
                      <div key={s.id} onPointerDown={(e) => startDrag(e, s, "move")} title={`${s.title} · ${fmt(s.start)}–${fmt(s.end)}`}
                        className={cn("absolute inset-y-2 flex cursor-grab items-center overflow-hidden rounded-sm px-2 text-primary-foreground shadow-sm ring-offset-1 ring-offset-card active:cursor-grabbing", TONES[s.tone],
                          conflicts.has(s.id) && "ring-2 ring-destructive [background-image:repeating-linear-gradient(135deg,transparent_0_6px,oklch(0_0_0/12%)_6px_8px)]",
                          selectedId === s.id && "z-10 ring-2 ring-foreground")}
                        style={{ left: `${((s.start - START) / SPAN) * 100}%`, width: `${((s.end - s.start) / SPAN) * 100}%` }}>
                        <div className="min-w-0 pointer-events-none">
                          <p className="flex items-center gap-1 truncate text-[11px] font-semibold">{conflicts.has(s.id) && <AlertTriangle className="size-3 shrink-0" />}{s.priority === "High" && "★ "}{s.title}</p>
                          <p className="truncate font-mono text-[9px] opacity-80">{fmt(s.start)}–{fmt(s.end)}</p>
                        </div>
                        <span onPointerDown={(e) => startDrag(e, s, "resize")} className="absolute inset-y-0 right-0 w-2 cursor-ew-resize bg-foreground/10 hover:bg-foreground/30" />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </section>
            <p className="mt-2 text-[11px] text-muted-foreground">Tip: double-click an empty spot on a row to add a one-hour slot there. Snaps to 30 minutes.</p>
          </main>

          {/* Inspector */}
          <aside className="w-72 shrink-0 overflow-y-auto border-l border-border bg-card p-4">
            {selected ? (
              <div className="space-y-5">
                <div>
                  <p className="label-caps">Selected slot</p>
                  <Input value={selected.title} onChange={(e) => update(selected.id, { title: e.target.value })} aria-label="Campaign name" className="mt-2 h-9 font-display font-semibold" />
                </div>
                <div>
                  <p className="label-caps mb-2">Screen group</p>
                  <select value={selected.channel} onChange={(e) => update(selected.id, { channel: +e.target.value })} className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm">
                    {CHANNELS.map((c, i) => <option key={c} value={i}>{c}</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {(["start", "end"] as const).map((k) => (
                    <label key={k} className="text-xs"><span className="label-caps flex items-center gap-1"><Clock className="size-3" />{k}</span>
                      <select value={selected[k]} onChange={(e) => {
                        const v = +e.target.value;
                        if (k === "start" ? v < selected.end : v > selected.start) update(selected.id, { [k]: v });
                        else toast("End time must be after start time");
                      }} className="mt-1 h-9 w-full rounded-md border border-input bg-background px-2 font-mono text-sm">
                        {Array.from({ length: SPAN * 2 + 1 }, (_, i) => START + i / 2).map((h) => <option key={h} value={h}>{fmt(h)}</option>)}
                      </select>
                    </label>
                  ))}
                </div>
                <div>
                  <p className="label-caps mb-2 flex items-center gap-1"><Repeat className="size-3" />Repeats</p>
                  <div className="grid grid-cols-2 gap-1">
                    {RECUR.map((r) => <Button key={r} size="sm" variant={selected.recur === r ? "default" : "outline"} className="h-8 text-xs" onClick={() => update(selected.id, { recur: r })}>{r}</Button>)}
                  </div>
                </div>
                <div>
                  <p className="label-caps mb-2">Priority</p>
                  <div className="grid grid-cols-2 gap-1">
                    {(["Normal", "High"] as const).map((p) => <Button key={p} size="sm" variant={selected.priority === p ? "default" : "outline"} className="h-8 text-xs" onClick={() => update(selected.id, { priority: p })}>{p}</Button>)}
                  </div>
                  <p className="mt-1.5 text-[11px] text-muted-foreground">High priority wins when slots overlap.</p>
                </div>
                <div>
                  <p className="label-caps mb-2">Colour</p>
                  <div className="flex gap-2">{TONES.map((t, i) => <button key={t} aria-label={`Colour ${i + 1}`} onClick={() => update(selected.id, { tone: i })} className={cn("size-6 rounded-full", t, selected.tone === i && "ring-2 ring-foreground ring-offset-2 ring-offset-card")} />)}</div>
                </div>
                {conflicts.has(selected.id) && (
                  <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-xs">
                    <p className="flex items-center gap-1.5 font-semibold text-destructive"><AlertTriangle className="size-3.5" />Overlaps with {slots.filter((o) => overlaps(selected, o)).map((o) => o.title).join(", ")}</p>
                    <Button size="sm" variant="outline" className="mt-2 h-7 w-full text-xs" onClick={autoResolve}>Resolve for me</Button>
                  </div>
                )}
                <div className="rounded-md bg-secondary p-3 text-xs">
                  <p className="font-medium">{(selected.end - selected.start).toFixed(1).replace(".0", "")}h of airtime · {selected.recur.toLowerCase()}</p>
                  <p className="mt-0.5 text-muted-foreground">≈ {Math.round((selected.end - selected.start) * 120)} plays per screen per day</p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1" onClick={() => { const { id: _id, ...rest } = selected; addSlot({ ...rest, title: `${selected.title} copy` }); }}><Copy className="size-3.5" />Duplicate</Button>
                  <Button variant="outline" size="sm" className="flex-1 text-destructive hover:text-destructive" onClick={() => { setSlots((all) => all.filter((s) => s.id !== selected.id)); setSelectedId(null); toast("Slot removed"); }}><Trash2 className="size-3.5" />Delete</Button>
                </div>
              </div>
            ) : (
              <div className="grid h-full place-items-center text-center text-sm text-muted-foreground"><div><CalendarDays className="mx-auto mb-2 size-6" />Select a slot on the timeline to edit it.</div></div>
            )}
          </aside>
        </div>
      </div>
    </div>
  );
}
