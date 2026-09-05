import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useMemo, useRef, useState } from "react";
import {
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

const uid = () => Math.random().toString(36).slice(2, 9);

const START: Zone[] = [
  { id: uid(), name: "Main feature", kind: "video", x: 0, y: 0, w: 70, h: 78, locked: false, opacity: 100 },
  { id: uid(), name: "Promo panel", kind: "image", x: 70, y: 0, w: 30, h: 44, locked: false, opacity: 100 },
  { id: uid(), name: "Local weather", kind: "weather", x: 70, y: 44, w: 30, h: 34, locked: false, opacity: 100 },
  { id: uid(), name: "News ticker", kind: "ticker", x: 0, y: 78, w: 80, h: 22, locked: false, opacity: 100 },
  { id: uid(), name: "Clock", kind: "clock", x: 80, y: 78, w: 20, h: 22, locked: false, opacity: 100 },
];

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

function LayoutEditor() {
  const [zones, setZones] = useState<Zone[]>(START);
  const [selectedId, setSelectedId] = useState<string | null>(START[0]!.id);
  const [preset, setPreset] = useState<Preset>(PRESETS[0]!);
  const [snap, setSnap] = useState(true);
  const [showGrid, setShowGrid] = useState(true);
  const [name, setName] = useState("Lobby — Morning loop");
  const stageRef = useRef<HTMLDivElement>(null);

  const selected = useMemo(() => zones.find((z) => z.id === selectedId) ?? null, [zones, selectedId]);
  const coverage = useMemo(
    () => Math.min(100, Math.round(zones.reduce((a, z) => a + (z.w * z.h) / 100, 0))),
    [zones],
  );

  const update = useCallback((id: string, patch: Partial<Zone>) => {
    setZones((prev) => prev.map((z) => (z.id === id ? { ...z, ...patch } : z)));
  }, []);

  const snapVal = useCallback((v: number) => (snap ? Math.round(v / 2.5) * 2.5 : Math.round(v * 10) / 10), [snap]);

  const startDrag = (e: React.PointerEvent, zone: Zone, mode: "move" | "resize") => {
    e.stopPropagation();
    setSelectedId(zone.id);
    if (zone.locked) return;
    const stage = stageRef.current;
    if (!stage) return;
    const rect = stage.getBoundingClientRect();
    const startX = e.clientX;
    const startY = e.clientY;
    const base = { ...zone };
    (e.target as Element).setPointerCapture(e.pointerId);

    const onMove = (ev: PointerEvent) => {
      const dx = ((ev.clientX - startX) / rect.width) * 100;
      const dy = ((ev.clientY - startY) / rect.height) * 100;
      if (mode === "move") {
        update(zone.id, {
          x: clamp(snapVal(base.x + dx), 0, 100 - base.w),
          y: clamp(snapVal(base.y + dy), 0, 100 - base.h),
        });
      } else {
        update(zone.id, {
          w: clamp(snapVal(base.w + dx), 5, 100 - base.x),
          h: clamp(snapVal(base.h + dy), 5, 100 - base.y),
        });
      }
    };
    const onUp = () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  };

  const addZone = (kind: ZoneKind, label: string) => {
    const zone: Zone = {
      id: uid(),
      name: label,
      kind,
      x: 10,
      y: 10,
      w: 30,
      h: 25,
      locked: false,
      opacity: 100,
    };
    setZones((p) => [...p, zone]);
    setSelectedId(zone.id);
  };

  const duplicate = (zone: Zone) => {
    const copy = { ...zone, id: uid(), name: `${zone.name} copy`, x: clamp(zone.x + 5, 0, 100 - zone.w), y: clamp(zone.y + 5, 0, 100 - zone.h) };
    setZones((p) => [...p, copy]);
    setSelectedId(copy.id);
  };

  const remove = (id: string) => {
    setZones((p) => p.filter((z) => z.id !== id));
    setSelectedId((s) => (s === id ? null : s));
  };

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
          className="h-8 w-full max-w-64 bg-secondary text-sm sm:w-64"
        />
        <div className="ml-auto flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={() => toast("Preview started", { description: `${zones.length} zones · ${preset.label}` })}>
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
                  onClick={() => addZone(k.kind, k.label)}
                  className="flex flex-col items-start gap-1.5 rounded-md border border-border bg-secondary/40 px-2.5 py-2 text-left text-xs transition-colors hover:border-primary/50 hover:bg-secondary"
                >
                  <k.icon className="size-4" style={{ color: ZONE_TONE[k.kind] }} />
                  {k.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <p className="label-caps">Canvas</p>
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-2"><Grid2x2 className="size-4 text-muted-foreground" /> Grid</span>
              <Switch checked={showGrid} onCheckedChange={setShowGrid} />
            </div>
            <div className="flex items-center justify-between text-xs">
              <span>Snap to 2.5%</span>
              <Switch checked={snap} onCheckedChange={setSnap} />
            </div>
          </div>
        </aside>

        {/* Stage */}
        <main className="flex min-w-0 flex-1 flex-col gap-3 bg-surface p-4">
          <div className="flex shrink-0 items-center justify-between">
            <p className="label-caps">Canvas · {preset.label}</p>
            <p className="label-caps">Coverage {coverage}%</p>
          </div>
          <div className="flex min-h-0 flex-1 items-center justify-center rounded-md border border-border bg-background/50 p-4">
            <div
              ref={stageRef}
              onPointerDown={() => setSelectedId(null)}
              className="relative max-h-full overflow-hidden rounded-md border border-border bg-background"
              style={{
                aspectRatio: String(preset.ratio),
                width: `min(100%, calc((100vh - 150px) * ${preset.ratio}))`,
              }}
            >
              {showGrid && (
                <div
                  className="pointer-events-none absolute inset-0 opacity-70"
                  style={{
                    backgroundImage:
                      "linear-gradient(to right, var(--grid-line) 1px, transparent 1px), linear-gradient(to bottom, var(--grid-line) 1px, transparent 1px)",
                    backgroundSize: "10% 10%",
                  }}
                />
              )}
              {zones.map((z) => {
                const active = z.id === selectedId;
                const Icon = KINDS.find((k) => k.kind === z.kind)!.icon;
                return (
                  <div
                    key={z.id}
                    onPointerDown={(e) => startDrag(e, z, "move")}
                    className={cn(
                      "group absolute select-none rounded-sm border transition-shadow",
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
                  onClick={() => setSelectedId(z.id)}
                  className={cn(
                    "flex cursor-pointer items-center gap-2 rounded-md border border-transparent px-2 py-1.5 text-xs hover:bg-secondary",
                    z.id === selectedId && "border-border bg-secondary",
                  )}
                >
                  <span className="size-2 rounded-full" style={{ background: ZONE_TONE[z.kind] }} />
                  <span className="flex-1 truncate">{z.name}</span>
                  <button aria-label="Toggle lock" onClick={(e) => { e.stopPropagation(); update(z.id, { locked: !z.locked }); }} className="text-muted-foreground hover:text-foreground">
                    {z.locked ? <Lock className="size-3.5" /> : <Unlock className="size-3.5" />}
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-3 border-t border-border pt-4">
            <p className="label-caps">Inspector</p>
            {!selected ? (
              <p className="text-xs text-muted-foreground">Select a zone on the canvas to edit its placement.</p>
            ) : (
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
                        value={Math.round(selected[k] * 10) / 10}
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
                  <Button variant="secondary" size="sm" className="flex-1" onClick={() => duplicate(selected)}>
                    <Copy className="size-3.5" /> Duplicate
                  </Button>
                  <Button variant="destructive" size="sm" onClick={() => remove(selected.id)} aria-label="Delete zone">
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
