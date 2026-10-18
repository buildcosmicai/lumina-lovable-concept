import { useEffect, useState } from "react";
import { Maximize2, Pause, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { MeetingRoomDisplay } from "@/components/meeting-room-display";
import { DEFAULT_MEETING, type MeetingConfig } from "@/lib/meeting-rooms";

const phases = ["available", "soon", "busy"] as const;
export function TempoTemplatePreview({ design = "tempo", onUse }: { design?: "tempo" | "meridian"; onUse?: () => void }) {
  const name = design === "meridian" ? "Meridian" : "Tempo";
  const [phase, setPhase] = useState<MeetingConfig["demoState"]>("available");
  const [playing, setPlaying] = useState(false);
  const [expanded, setExpanded] = useState(false);
  useEffect(() => {
    if (!playing) return;
    const timer = setInterval(() => setPhase(previous => phases[(phases.findIndex(p => p === previous) + 1) % phases.length] ?? "available"), 4500);
    return () => clearInterval(timer);
  }, [playing]);
  const controls = <div className="flex flex-wrap items-center gap-2" role="group" aria-label={`${name} preview states`}>{phases.map(p => <Button key={p} size="sm" variant={phase === p ? "secondary" : "ghost"} aria-pressed={phase === p} onClick={() => { setPhase(p); setPlaying(false); }}>{p === "available" ? "Available" : p === "soon" ? "Starting soon" : "In a meeting"}</Button>)}<Button variant="outline" size="icon" aria-label={playing ? "Pause transitions" : "Play transitions"} title={playing ? "Pause transitions" : "Play transitions"} onClick={() => setPlaying(!playing)}>{playing ? <Pause className="size-4" /> : <Play className="size-4" />}</Button>{onUse && <Button size="sm" onClick={onUse}>Use {name}</Button>}</div>;
  const display = <div className="aspect-video w-full overflow-hidden"><MeetingRoomDisplay config={{ ...DEFAULT_MEETING, roomId: "ms-forum", design, demoState: phase }} /></div>;
  return <section className="mb-8 border-b border-border pb-8" aria-label={`${name} adaptive preview`}><div className="mb-4 flex flex-wrap items-center justify-between gap-3"><div><p className="label-caps mb-1">ADAPTIVE ROOM DISPLAY</p><h3 className="text-xl font-semibold">{name} — {design === "meridian" ? "A little space. A bigger idea." : "One room. Three rhythms."}</h3></div><Button variant="outline" size="icon" aria-label={`Expand ${name} preview`} title={`Expand ${name} preview`} onClick={() => setExpanded(true)}><Maximize2 className="size-4" /></Button></div>{display}<div className="mt-3">{controls}</div><Dialog open={expanded} onOpenChange={setExpanded}><DialogContent className="w-[94vw] max-w-6xl sm:max-w-6xl"><DialogTitle>{name} · Forum</DialogTitle>{display}{controls}</DialogContent></Dialog></section>;
}