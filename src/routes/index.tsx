import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Check,
  Clock,
  CloudSun,
  Copy,
  Grid2x2,
  Image as ImageIcon,
  Layers,
  Lock,
  Monitor,
  Play,
  RectangleHorizontal,
  RectangleVertical,
  RotateCcw,
  Save,
  Trash2,
  Type as TypeIcon,
  Unlock,
  Video,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Signage Layout Editor — Zone Composer" },
      {
        name: "description",
        content:
          "Compose digital signage screen layouts: drag, resize and snap zones for video, tickers, images and live widgets on any display orientation.",
      },
      { property: "og:title", content: "Signage Layout Editor — Zone Composer" },
      {
        property: "og:description",
        content:
          "Drag, resize and snap zones for video, tickers, images and live widgets on any display orientation.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: LayoutEditor,
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

const KINDS: { kind: ZoneKind; label: string; icon: typeof Video }[] = [
  { kind: "video", label: "Video", icon: Video },
  { kind: "image", label: "Image", icon: ImageIcon },
  { kind: "ticker", label: "Ticker", icon: TypeIcon },
  { kind: "clock", label: "Clock", icon: Clock },
  { kind: "weather", label: "Weather", icon: CloudSun },
  { kind: "web", label: "Web page", icon: Monitor },
];

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

const GRID_SIZES = [2.5, 5, 10, 20];

const uid = () => Math.random().toString(36).slice(2, 9);

const START: Zone[] = [
  { id: uid(), name: "Main feature", kind: "video", x: 0, y: 0, w: 70, h: 78, locked: false, opacity: 100 },
  { id: uid(), name: "Promo panel", kind: "image", x: 70, y: 0, w: 30, h: 44, locked: false, opacity: 100 },
  { id: uid(), name: "Local weather", kind: "weather", x: 70, y: 44, w: 30, h: 34, locked: false, opacity: 100 },
  { id: uid(), name: "News ticker", kind: "ticker", x: 0, y: 78, w: 80, h: 22, locked: false, opacity: 100 },
  { id: uid(), name: "Clock", kind: "clock", x: 80, y: 78, w: 20, h: 22, locked: false, opacity: 100 },
];

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));
const round1 = (v: number) => Math.round(v * 10) / 10;

const STORAGE_KEY = "signage-layout-editor:v1";

type Settings = {
  snapToGrid: boolean;
  gridSize: number;
  showGrid: boolean;
  alignSnap: boolean;
  threshold: number;
};

type Saved = {
  zones: Zone[];
  name: string;
  presetId: string;
  settings: Settings;
};

type Guide = { axis: "v" | "h"; pos: number };
type Gap = { axis: "v" | "h"; from: number; to: number; at: number; value: number };

function LayoutEditor() {
  const [zones, setZones] = useState<Zone[]>(START);
  const [selectedIds, setSelectedIds] = useState<string[]>(START[0] ? [START[0].id] : []);
  const [preset, setPreset] = useState<Preset>(PRESETS[0]!);
  const [name, setName] = useState("Lobby — Morning loop");
  const [settings, setSettings] = useState<Settings>({
    snapToGrid: true,
    gridSize: 2.5,
    showGrid: true,
    alignSnap: true,
    threshold: 8,
  });
  const [guides, setGuides] = useState<Guide[]>([]);
  const [gaps, setGaps] = useState<Gap[]>([]);
  const [marquee, setMarquee] = useState<{ x: number; y: number; w: number; h: number } | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const stageRef = useRef<HTMLDivElement>(null);

  // ---- persistence -------------------------------------------------------
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const data = JSON.parse(raw) as Partial<Saved>;
        if (Array.isArray(data.zones) && data.zones.length) setZones(data.zones);
        if (typeof data.name === "string") setName(data.name);
        const p = PRESETS.find((x) => x.id === data.presetId);
        if (p) setPreset(p);
        if (data.settings) setSettings((s) => ({ ...s, ...data.settings }));
        if (Array.isArray(data.zones) && data.zones[0]) setSelectedIds([data.zones[0].id]);
      }
    } catch {
      /* ignore corrupted storage */
    }
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    const payload: Saved = { zones, name, presetId: preset.id, settings };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
      setSavedAt(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
    } catch {
      /* storage full or unavailable */
    }
  }, [zones, name, preset, settings, loaded]);

  const resetLayout = () => {
    setZones(START);
    setSelectedIds(START[0] ? [START[0].id] : []);
    toast("Layout reset to the starter arrangement");
  };

  // ---- derived -----------------------------------------------------------
  const selected = useMemo(
    () => (selectedIds.length === 1 ? (zones.find((z) => z.id === selectedIds[0]) ?? null) : null),
    [zones, selectedIds],
  );
  const selectedZones = useMemo(() => zones.filter((z) => selectedIds.includes(z.id)), [zones, selectedIds]);
  const coverage = useMemo(
    () => Math.min(100, Math.round(zones.reduce((a, z) => a + (z.w * z.h) / 100, 0))),
    [zones],
  );

  const update = useCallback((id: string, patch: Partial<Zone>) => {
    setZones((prev) => prev.map((z) => (z.id === id ? { ...z, ...patch } : z)));
  }, []);

  const updateMany = useCallback((patches: Record<string, Partial<Zone>>) => {
    setZones((prev) => prev.map((z) => (patches[z.id] ? { ...z, ...patches[z.id] } : z)));
  }, []);

  const snapVal = useCallback(
    (v: number) => (settings.snapToGrid ? Math.round(v / settings.gridSize) * settings.gridSize : round1(v)),
    [settings.snapToGrid, settings.gridSize],
  );

  // ---- alignment helpers -------------------------------------------------
  const alignSnapX = useCallback(
    (x: number, w: number, others: Zone[], tol: number) => {
      if (!settings.alignSnap) return { x, guides: [] as Guide[] };
      const targets: number[] = [0, 50, 100];
      others.forEach((o) => targets.push(o.x, o.x + o.w / 2, o.x + o.w));
      const edges: { own: number; delta: number }[] = [
        { own: x, delta: 0 },
        { own: x + w / 2, delta: w / 2 },
        { own: x + w, delta: w },
      ];
      let best: { x: number; pos: number; d: number } | null = null;
      for (const e of edges)
        for (const t of targets) {
          const d = Math.abs(e.own - t);
          if (d <= tol && (!best || d < best.d)) best = { x: t - e.delta, pos: t, d };
        }
      return best ? { x: best.x, guides: [{ axis: "v" as const, pos: best.pos }] } : { x, guides: [] as Guide[] };
    },
    [settings.alignSnap],
  );

  const alignSnapY = useCallback(
    (y: number, h: number, others: Zone[], tol: number) => {
      if (!settings.alignSnap) return { y, guides: [] as Guide[] };
      const targets: number[] = [0, 50, 100];
      others.forEach((o) => targets.push(o.y, o.y + o.h / 2, o.y + o.h));
      const edges: { own: number; delta: number }[] = [
        { own: y, delta: 0 },
        { own: y + h / 2, delta: h / 2 },
        { own: y + h, delta: h },
      ];
      let best: { y: number; pos: number; d: number } | null = null;
      for (const e of edges)
        for (const t of targets) {
          const d = Math.abs(e.own - t);
          if (d <= tol && (!best || d < best.d)) best = { y: t - e.delta, pos: t, d };
        }
      return best ? { y: best.y, guides: [{ axis: "h" as const, pos: best.pos }] } : { y, guides: [] as Guide[] };
    },
    [settings.alignSnap],
  );

  const computeGaps = (zone: Zone, others: Zone[]): Gap[] => {
    const out: Gap[] = [];
    const midY = zone.y + zone.h / 2;
    const midX = zone.x + zone.w / 2;
    const vOverlap = others.filter((o) => o.y < zone.y + zone.h && o.y + o.h > zone.y);
    const hOverlap = others.filter((o) => o.x < zone.x + zone.w && o.x + o.w > zone.x);

    const left = vOverlap.filter((o) => o.x + o.w <= zone.x + 0.01).sort((a, b) => b.x + b.w - (a.x + a.w))[0];
    if (left) out.push({ axis: "v", from: left.x + left.w, to: zone.x, at: midY, value: zone.x - (left.x + left.w) });
    const right = vOverlap.filter((o) => o.x >= zone.x + zone.w - 0.01).sort((a, b) => a.x - b.x)[0];
    if (right) out.push({ axis: "v", from: zone.x + zone.w, to: right.x, at: midY, value: right.x - (zone.x + zone.w) });
    const above = hOverlap.filter((o) => o.y + o.h <= zone.y + 0.01).sort((a, b) => b.y + b.h - (a.y + a.h))[0];
    if (above) out.push({ axis: "h", from: above.y + above.h, to: zone.y, at: midX, value: zone.y - (above.y + above.h) });
    const below = hOverlap.filter((o) => o.y >= zone.y + zone.h - 0.01).sort((a, b) => a.y - b.y)[0];
    if (below) out.push({ axis: "h", from: zone.y + zone.h, to: below.y, at: midX, value: below.y - (zone.y + zone.h) });

    return out.filter((g) => g.value >= 0);
  };

  const clearOverlays = () => {
    setGuides([]);
    setGaps([]);
  };

  // ---- interactions ------------------------------------------------------
  const selectZone = (id: string, shift: boolean) => {
    setSelectedIds((prev) => {
      if (shift) return prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id];
      return prev.includes(id) ? prev : [id];
    });
  };

  const startDrag = (e: React.PointerEvent, zone: Zone, mode: "move" | "resize") => {
    e.stopPropagation();
    const shift = e.shiftKey;
    selectZone(zone.id, shift);
    if (zone.locked) return;
    const stage = stageRef.current;
    if (!stage) return;
    const rect = stage.getBoundingClientRect();
    const startX = e.clientX;
    const startY = e.clientY;
    const group = (selectedIds.includes(zone.id) && !shift ? selectedIds : [zone.id])
      .map((id) => zones.find((z) => z.id === id))
      .filter((z): z is Zone => !!z && !z.locked);
    const bases = new Map(group.map((z) => [z.id, { ...z }]));
    const others = zones.filter((z) => !bases.has(z.id));
    (e.target as Element).setPointerCapture(e.pointerId);

    const onMove = (ev: PointerEvent) => {
      const tol = (settings.threshold / rect.width) * 100;
      let dx = ((ev.clientX - startX) / rect.width) * 100;
      let dy = ((ev.clientY - startY) / rect.height) * 100;
      const base = bases.get(zone.id)!;
      const nextGuides: Guide[] = [];

      if (mode === "move") {
        let px = clamp(snapVal(base.x + dx), 0, 100 - base.w);
        let py = clamp(snapVal(base.y + dy), 0, 100 - base.h);
        const sx = alignSnapX(px, base.w, others, tol);
        const sy = alignSnapY(py, base.h, others, tol);
        px = clamp(sx.x, 0, 100 - base.w);
        py = clamp(sy.y, 0, 100 - base.h);
        nextGuides.push(...sx.guides, ...sy.guides);
        dx = px - base.x;
        dy = py - base.y;

        const patches: Record<string, Partial<Zone>> = {};
        bases.forEach((b, id) => {
          patches[id] = {
            x: clamp(round1(b.x + dx), 0, 100 - b.w),
            y: clamp(round1(b.y + dy), 0, 100 - b.h),
          };
        });
        updateMany(patches);
        setGuides(nextGuides);
        setGaps(computeGaps({ ...base, x: px, y: py }, others));
      } else {
        let nw = clamp(snapVal(base.w + dx), 5, 100 - base.x);
        let nh = clamp(snapVal(base.h + dy), 5, 100 - base.y);
        const sx = alignSnapX(base.x, nw, others, tol);
        const sy = alignSnapY(base.y, nh, others, tol);
        if (sx.guides.length) {
          nw = clamp(round1(nw + (base.x - sx.x)), 5, 100 - base.x);
          nextGuides.push(...sx.guides);
        }
        if (sy.guides.length) {
          nh = clamp(round1(nh + (base.y - sy.y)), 5, 100 - base.y);
          nextGuides.push(...sy.guides);
        }
        const ddw = nw - base.w;
        const ddh = nh - base.h;
        const patches: Record<string, Partial<Zone>> = {};
        bases.forEach((b, id) => {
          patches[id] = {
            w: clamp(round1(b.w + ddw), 5, 100 - b.x),
            h: clamp(round1(b.h + ddh), 5, 100 - b.y),
          };
        });
        updateMany(patches);
        setGuides(nextGuides);
        setGaps(computeGaps({ ...base, w: nw, h: nh }, others));
      }
    };
    const onUp = () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      clearOverlays();
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  };

  const startMarquee = (e: React.PointerEvent) => {
    const stage = stageRef.current;
    if (!stage) return;
    const rect = stage.getBoundingClientRect();
    const additive = e.shiftKey;
    if (!additive) setSelectedIds([]);
    const sx = ((e.clientX - rect.left) / rect.width) * 100;
    const sy = ((e.clientY - rect.top) / rect.height) * 100;
    const baseSel = additive ? selectedIds : [];

    const onMove = (ev: PointerEvent) => {
      const cx = clamp(((ev.clientX - rect.left) / rect.width) * 100, 0, 100);
      const cy = clamp(((ev.clientY - rect.top) / rect.height) * 100, 0, 100);
      const box = { x: Math.min(sx, cx), y: Math.min(sy, cy), w: Math.abs(cx - sx), h: Math.abs(cy - sy) };
      setMarquee(box);
      const hits = zones
        .filter((z) => z.x < box.x + box.w && z.x + z.w > box.x && z.y < box.y + box.h && z.y + z.h > box.y)
        .map((z) => z.id);
      setSelectedIds([...new Set([...baseSel, ...hits])]);
    };
    const onUp = () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      setMarquee(null);
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  };

  const startLibraryDrag = (e: React.PointerEvent, kind: ZoneKind, label: string) => {
    e.preventDefault();
    const W = 30;
    const H = 25;
    let created: Zone | null = null;
    let overStage = false;

    const positionFromPointer = (ev: PointerEvent): { x: number; y: number } | null => {
      const stage = stageRef.current;
      if (!stage) return null;
      const rect = stage.getBoundingClientRect();
      if (ev.clientX < rect.left || ev.clientX > rect.right || ev.clientY < rect.top || ev.clientY > rect.bottom)
        return null;
      const px = ((ev.clientX - rect.left) / rect.width) * 100;
      const py = ((ev.clientY - rect.top) / rect.height) * 100;
      const tol = (settings.threshold / rect.width) * 100;
      let x = clamp(snapVal(px - W / 2), 0, 100 - W);
      let y = clamp(snapVal(py - H / 2), 0, 100 - H);
      const others = zones.filter((z) => z.id !== created?.id);
      const sx = alignSnapX(x, W, others, tol);
      const sy = alignSnapY(y, H, others, tol);
      x = clamp(sx.x, 0, 100 - W);
      y = clamp(sy.y, 0, 100 - H);
      setGuides([...sx.guides, ...sy.guides]);
      setGaps(computeGaps({ id: "tmp", name: "", kind, x, y, w: W, h: H, locked: false, opacity: 100 }, others));
      return { x, y };
    };

    const onMove = (ev: PointerEvent) => {
      const pos = positionFromPointer(ev);
      overStage = pos !== null;
      if (!pos) {
        clearOverlays();
        return;
      }
      if (!created) {
        const zone: Zone = { id: uid(), name: label, kind, x: pos.x, y: pos.y, w: W, h: H, locked: false, opacity: 100 };
        created = zone;
        setZones((p) => [...p, zone]);
        setSelectedIds([zone.id]);
      } else {
        update(created.id, pos);
      }
    };

    const onUp = (ev: PointerEvent) => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      clearOverlays();
      const moved = Math.abs(ev.clientX - e.clientX) + Math.abs(ev.clientY - e.clientY) > 4;
      if (!moved) {
        if (created) remove([created.id]);
        addZone(kind, label);
        return;
      }
      if (created && !overStage) remove([created.id]);
    };

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  };

  const addZone = (kind: ZoneKind, label: string) => {
    const zone: Zone = { id: uid(), name: label, kind, x: 10, y: 10, w: 30, h: 25, locked: false, opacity: 100 };
    setZones((p) => [...p, zone]);
    setSelectedIds([zone.id]);
  };

  const duplicate = (list: Zone[]) => {
    const copies = list.map((zone) => ({
      ...zone,
      id: uid(),
      name: `${zone.name} copy`,
      x: clamp(zone.x + 5, 0, 100 - zone.w),
      y: clamp(zone.y + 5, 0, 100 - zone.h),
    }));
    setZones((p) => [...p, ...copies]);
    setSelectedIds(copies.map((c) => c.id));
  };

  const remove = (ids: string[]) => {
    setZones((p) => p.filter((z) => !ids.includes(z.id)));
    setSelectedIds((s) => s.filter((id) => !ids.includes(id)));
  };

  // keyboard: delete / duplicate / select all
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable)) return;
      if ((e.key === "Delete" || e.key === "Backspace") && selectedIds.length) {
        e.preventDefault();
        remove(selectedIds);
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "d" && selectedIds.length) {
        e.preventDefault();
        duplicate(zones.filter((z) => selectedIds.includes(z.id)));
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "a") {
        e.preventDefault();
        setSelectedIds(zones.map((z) => z.id));
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selectedIds, zones]);

  const set = <K extends keyof Settings>(key: K, value: Settings[K]) => setSettings((s) => ({ ...s, [key]: value }));

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-surface text-foreground">
      <Toaster />
      <header className="flex shrink-0 items-center gap-3 border-b border-border bg-card px-4 py-2.5">
        <div className="flex items-center gap-2">
          <span className="grid size-8 place-items-center rounded-md bg-primary text-primary-foreground">
            <Layers className="size-4" />
          </span>
          <div>
            <h1 className="text-sm font-semibold leading-tight">Signage Layout Editor</h1>
            <p className="label-caps">Zone composer</p>
          </div>
        </div>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          aria-label="Layout name"
          className="h-8 w-64 bg-secondary text-sm"
        />
        {savedAt && (
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <Check className="size-3.5 text-accent" /> Saved {savedAt}
          </span>
        )}
        <div className="ml-auto flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={resetLayout}>
            <RotateCcw className="size-4" /> Reset
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => toast("Preview started", { description: `${zones.length} zones · ${preset.label}` })}
          >
            <Play className="size-4" /> Preview
          </Button>
          <Button size="sm" onClick={() => toast.success("Layout saved", { description: name })}>
            <Save className="size-4" /> Save layout
          </Button>
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        {/* Left: library + screen */}
        <aside className="w-56 shrink-0 space-y-5 overflow-y-auto border-r border-border bg-card p-4">
          <div className="space-y-2">
            <p className="label-caps">Screen</p>
            <div className="grid gap-1.5">
              {PRESETS.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setPreset(p)}
                  className={cn(
                    "flex items-center gap-2 rounded-md border border-border px-2.5 py-2 text-left text-xs transition-colors hover:bg-secondary",
                    preset.id === p.id && "border-primary/60 bg-secondary text-primary",
                  )}
                >
                  <p.icon className="size-4 shrink-0" />
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <p className="label-caps">Add zone</p>
            <div className="grid grid-cols-2 gap-1.5">
              {KINDS.map((k) => (
                <button
                  key={k.kind}
                  onPointerDown={(e) => startLibraryDrag(e, k.kind, k.label)}
                  title="Drag onto the canvas or click to add"
                  className="flex cursor-grab touch-none flex-col items-start gap-1.5 rounded-md border border-border bg-secondary/40 px-2.5 py-2 text-left text-xs transition-colors select-none hover:border-primary/50 hover:bg-secondary active:cursor-grabbing"
                >
                  <k.icon className="size-4" style={{ color: ZONE_TONE[k.kind] }} />
                  {k.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3 border-t border-border pt-4">
            <p className="label-caps">Grid &amp; snapping</p>
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-2">
                <Grid2x2 className="size-4 text-muted-foreground" /> Show grid
              </span>
              <Switch checked={settings.showGrid} onCheckedChange={(v) => set("showGrid", v)} />
            </div>
            <div className="space-y-1.5">
              <span className="label-caps">Grid size</span>
              <div className="grid grid-cols-4 gap-1">
                {GRID_SIZES.map((g) => (
                  <button
                    key={g}
                    onClick={() => set("gridSize", g)}
                    className={cn(
                      "rounded-md border border-border py-1 font-mono text-[11px] transition-colors hover:bg-secondary",
                      settings.gridSize === g && "border-primary/60 bg-secondary text-primary",
                    )}
                  >
                    {g}%
                  </button>
                ))}
              </div>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span>Snap to grid</span>
              <Switch checked={settings.snapToGrid} onCheckedChange={(v) => set("snapToGrid", v)} />
            </div>
            <div className="flex items-center justify-between text-xs">
              <span>Alignment snap</span>
              <Switch checked={settings.alignSnap} onCheckedChange={(v) => set("alignSnap", v)} />
            </div>
            <div className="space-y-2">
              <span className="label-caps">Snap threshold {settings.threshold}px</span>
              <Slider
                value={[settings.threshold]}
                min={2}
                max={24}
                step={1}
                disabled={!settings.alignSnap}
                onValueChange={([v]) => set("threshold", v ?? settings.threshold)}
              />
            </div>
          </div>
        </aside>

        {/* Stage */}
        <main className="flex min-w-0 flex-1 flex-col gap-3 bg-surface p-4">
          <div className="flex shrink-0 items-center justify-between">
            <p className="label-caps">Canvas · {preset.label}</p>
            <p className="label-caps">
              {selectedIds.length > 1 ? `${selectedIds.length} selected · ` : ""}Coverage {coverage}%
            </p>
          </div>
          <div className="flex min-h-0 flex-1 items-center justify-center rounded-md border border-border bg-background/50 p-4">
            <div
              ref={stageRef}
              onPointerDown={startMarquee}
              className="relative max-h-full touch-none overflow-hidden rounded-md border border-border bg-background"
              style={{
                aspectRatio: String(preset.ratio),
                width: `min(100%, calc((100vh - 150px) * ${preset.ratio}))`,
              }}
            >
              {settings.showGrid && (
                <div
                  className="pointer-events-none absolute inset-0 opacity-70"
                  style={{
                    backgroundImage:
                      "linear-gradient(to right, var(--grid-line) 1px, transparent 1px), linear-gradient(to bottom, var(--grid-line) 1px, transparent 1px)",
                    backgroundSize: `${settings.gridSize * 2}% ${settings.gridSize * 2}%`,
                  }}
                />
              )}
              {zones.map((z) => {
                const active = selectedIds.includes(z.id);
                const Icon = KINDS.find((k) => k.kind === z.kind)!.icon;
                return (
                  <div
                    key={z.id}
                    onPointerDown={(e) => startDrag(e, z, "move")}
                    className={cn(
                      "group absolute touch-none select-none rounded-sm border transition-shadow",
                      z.locked ? "cursor-not-allowed" : "cursor-grab active:cursor-grabbing",
                      active ? "z-10 border-2" : "border-dashed",
                    )}
                    style={{
                      left: `${z.x}%`,
                      top: `${z.y}%`,
                      width: `${z.w}%`,
                      height: `${z.h}%`,
                      borderColor: ZONE_TONE[z.kind],
                      background: `color-mix(in oklch, ${ZONE_TONE[z.kind]} ${active ? 26 : 14}%, transparent)`,
                      opacity: z.opacity / 100,
                    }}
                  >
                    <div className="pointer-events-none flex h-full flex-col items-center justify-center gap-1 overflow-hidden p-1 text-center">
                      <Icon className="size-4" style={{ color: ZONE_TONE[z.kind] }} />
                      <span className="truncate text-[11px] font-medium">{z.name}</span>
                      <span className="font-mono text-[9px] text-muted-foreground">
                        {Math.round(z.w)}×{Math.round(z.h)}
                      </span>
                    </div>
                    {active && !z.locked && (
                      <span
                        onPointerDown={(e) => startDrag(e, z, "resize")}
                        className="absolute -bottom-1 -right-1 size-3 cursor-se-resize rounded-sm border border-background"
                        style={{ background: ZONE_TONE[z.kind] }}
                      />
                    )}
                  </div>
                );
              })}

              {/* smart alignment guides */}
              {guides.map((g, i) => (
                <div
                  key={`g${i}`}
                  className="pointer-events-none absolute z-20 bg-accent"
                  style={
                    g.axis === "v"
                      ? { left: `${g.pos}%`, top: 0, bottom: 0, width: 1 }
                      : { top: `${g.pos}%`, left: 0, right: 0, height: 1 }
                  }
                />
              ))}

              {/* distance indicators */}
              {gaps.map((gap, i) =>
                gap.axis === "v" ? (
                  <div
                    key={`d${i}`}
                    className="pointer-events-none absolute z-20 flex items-center justify-center border-y border-accent/70"
                    style={{ left: `${gap.from}%`, width: `${gap.to - gap.from}%`, top: `${gap.at}%`, height: 0 }}
                  >
                    <span className="rounded-sm bg-accent px-1 font-mono text-[9px] leading-4 text-accent-foreground">
                      {round1(gap.value)}%
                    </span>
                  </div>
                ) : (
                  <div
                    key={`d${i}`}
                    className="pointer-events-none absolute z-20 flex items-center justify-center border-x border-accent/70"
                    style={{ top: `${gap.from}%`, height: `${gap.to - gap.from}%`, left: `${gap.at}%`, width: 0 }}
                  >
                    <span className="rounded-sm bg-accent px-1 font-mono text-[9px] leading-4 text-accent-foreground">
                      {round1(gap.value)}%
                    </span>
                  </div>
                ),
              )}

              {/* marquee selection */}
              {marquee && (
                <div
                  className="pointer-events-none absolute z-30 rounded-sm border border-primary bg-primary/10"
                  style={{
                    left: `${marquee.x}%`,
                    top: `${marquee.y}%`,
                    width: `${marquee.w}%`,
                    height: `${marquee.h}%`,
                  }}
                />
              )}
            </div>
          </div>
        </main>

        {/* Right: layers + inspector */}
        <aside className="w-72 shrink-0 space-y-5 overflow-y-auto border-l border-border bg-card p-4">
          <div className="space-y-2">
            <p className="label-caps">Layers ({zones.length})</p>
            <div className="space-y-1">
              {[...zones].reverse().map((z) => (
                <div
                  key={z.id}
                  onClick={(e) => selectZone(z.id, e.shiftKey)}
                  className={cn(
                    "flex cursor-pointer items-center gap-2 rounded-md border border-transparent px-2 py-1.5 text-xs hover:bg-secondary",
                    selectedIds.includes(z.id) && "border-border bg-secondary",
                  )}
                >
                  <span className="size-2 rounded-full" style={{ background: ZONE_TONE[z.kind] }} />
                  <span className="flex-1 truncate">{z.name}</span>
                  <button
                    aria-label="Toggle lock"
                    onClick={(e) => {
                      e.stopPropagation();
                      update(z.id, { locked: !z.locked });
                    }}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    {z.locked ? <Lock className="size-3.5" /> : <Unlock className="size-3.5" />}
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-3 border-t border-border pt-4">
            <p className="label-caps">Inspector</p>
            {selectedZones.length === 0 ? (
              <p className="text-xs text-muted-foreground">
                Select a zone, shift-click to add more, or drag on empty canvas to select several.
              </p>
            ) : selected ? (
              <div className="space-y-3">
                <Input
                  value={selected.name}
                  aria-label="Zone name"
                  onChange={(e) => update(selected.id, { name: e.target.value })}
                  className="h-8 bg-secondary text-sm"
                />
                <div className="grid grid-cols-2 gap-2">
                  {(["x", "y", "w", "h"] as const).map((k) => (
                    <label key={k} className="space-y-1">
                      <span className="label-caps">{k}</span>
                      <Input
                        type="number"
                        value={round1(selected[k])}
                        onChange={(e) => {
                          const v = clamp(Number(e.target.value) || 0, k === "w" || k === "h" ? 5 : 0, 100);
                          update(selected.id, { [k]: v } as Partial<Zone>);
                        }}
                        className="h-8 bg-secondary font-mono text-xs"
                      />
                    </label>
                  ))}
                </div>
                <div className="space-y-2">
                  <span className="label-caps">Opacity {selected.opacity}%</span>
                  <Slider
                    value={[selected.opacity]}
                    min={10}
                    max={100}
                    step={5}
                    onValueChange={([v]) => update(selected.id, { opacity: v ?? selected.opacity })}
                  />
                </div>
                <div className="flex gap-2">
                  <Button variant="secondary" size="sm" className="flex-1" onClick={() => duplicate([selected])}>
                    <Copy className="size-3.5" /> Duplicate
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => remove([selected.id])}
                    aria-label="Delete zone"
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-xs text-muted-foreground">{selectedZones.length} zones selected</p>
                <div className="space-y-2">
                  <span className="label-caps">Opacity</span>
                  <Slider
                    value={[Math.round(selectedZones.reduce((a, z) => a + z.opacity, 0) / selectedZones.length)]}
                    min={10}
                    max={100}
                    step={5}
                    onValueChange={([v]) => {
                      if (v == null) return;
                      const patches: Record<string, Partial<Zone>> = {};
                      selectedZones.forEach((z) => (patches[z.id] = { opacity: v }));
                      updateMany(patches);
                    }}
                  />
                </div>
                <div className="flex gap-2">
                  <Button variant="secondary" size="sm" className="flex-1" onClick={() => duplicate(selectedZones)}>
                    <Copy className="size-3.5" /> Duplicate all
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => remove(selectedZones.map((z) => z.id))}
                    aria-label="Delete selected zones"
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
