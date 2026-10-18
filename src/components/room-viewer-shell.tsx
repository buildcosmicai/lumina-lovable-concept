import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowLeft, CalendarDays, Info, Monitor, Users, Wifi } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { SAMPLE_ROOM } from "@/lib/room-viewer-sample";

export function RoomViewerShell({ children, timetable = false }: { children: ReactNode; timetable?: boolean }) {
  return <main className="room-concept">
    <header className="room-concept-header">
      <div className="room-concept-brand"><span className="room-concept-mark" aria-hidden="true"><i /><i /><i /></span><span>ROOM / {SAMPLE_ROOM.number}</span><span className="room-concept-sample">Sample calendar</span></div>
      <div className="room-concept-tools">
        {timetable ? <Button variant="ghost" asChild className="room-concept-control"><Link to="/room-preview"><ArrowLeft />Room display</Link></Button> : <Button variant="ghost" asChild className="room-concept-control"><Link to="/room-preview/timetable" title="Open timetable"><CalendarDays />Timetable</Link></Button>}
        <Dialog><DialogTrigger asChild><Button variant="ghost" size="icon" className="room-concept-control" aria-label="Room information" title="Room information"><Info /></Button></DialogTrigger>
          <DialogContent className="room-concept-info"><DialogTitle>{SAMPLE_ROOM.name}</DialogTitle><DialogDescription>Room {SAMPLE_ROOM.number} · {SAMPLE_ROOM.location}</DialogDescription><div className="grid gap-4 py-4"><p className="flex items-center gap-3"><Users className="size-5" />Up to {SAMPLE_ROOM.capacity} people</p><p className="flex items-center gap-3"><Monitor className="size-5" />Presentation display</p><p className="flex items-center gap-3"><Wifi className="size-5" />Video conferencing</p></div><p className="text-sm text-muted-foreground">Sample room details · Europe/Berlin</p></DialogContent>
        </Dialog>
      </div>
    </header>
    {children}
    <footer className="room-concept-footer"><span><i />Read-only calendar</span><span>MON 19 OCT 2026 · EUROPE / BERLIN</span><span className="room-concept-signature">A little space. A bigger idea.</span></footer>
  </main>;
}