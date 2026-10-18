import { createFileRoute } from "@tanstack/react-router";
import { ArrowUpRight } from "lucide-react";
import { RoomViewerShell } from "@/components/room-viewer-shell";
import { agendaEvents, agendaOrganizer, agendaTitle, SAMPLE_DATE, SAMPLE_ROOM } from "@/lib/room-viewer-sample";

export const Route = createFileRoute("/room-preview")({
  head: () => ({ meta: [
    { title: "Charlie Brown — Room display concept | Signage CMS" },
    { name: "description", content: "A photo-free room display concept with clear availability, a countdown and a read-only timetable." },
    { property: "og:title", content: "Charlie Brown — Room display concept" },
    { property: "og:description", content: "Explore a distinctive room display and its day, week and month agenda." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: RoomPreview,
});

function RoomPreview() {
  const upcoming = agendaEvents(SAMPLE_DATE, "day").filter(event => event.start >= "14:00");
  const next = upcoming[0];
  if (!next) return null;
  return <RoomViewerShell>
    <section className="room-concept-identity"><div><p className="room-concept-label">LEVEL 02 / EAST WING</p><h1>{SAMPLE_ROOM.name}<span>.</span></h1></div><div className="room-concept-clock"><strong>13:50</strong><span>Monday, 19 October</span></div></section>
    <section className="room-concept-main">
      <div className="room-concept-message"><div className="room-concept-status"><i />Starting soon<span>Available until 14:00</span></div><h2>A moment<br />before the<br /><em>next idea.</em></h2><div className="room-concept-next"><p className="room-concept-label">UP NEXT / {next.start} — {next.end}</p><h3>{agendaTitle(next)}</h3><p>Hosted by {agendaOrganizer(next)}<ArrowUpRight aria-hidden="true" /></p></div></div>
      <div className="room-concept-instrument" role="img" aria-label="Next meeting starts in 10 minutes, at 14:00">
        <svg viewBox="0 0 480 480" className="room-concept-dial" aria-hidden="true">
          <circle className="room-dial-guide" cx="240" cy="240" r="231" /><circle className="room-dial-track" cx="240" cy="240" r="202" />
          <circle className="room-dial-progress" cx="240" cy="240" r="202" pathLength="100" strokeDasharray="68 32" transform="rotate(-90 240 240)" />
          {Array.from({ length: 60 }, (_, i) => <line key={i} className={i < 41 ? "room-dial-tick active" : "room-dial-tick"} x1="240" y1="57" x2="240" y2={i % 5 === 0 ? "73" : "65"} transform={`rotate(${i * 6} 240 240)`} />)}
          <circle className="room-dial-inner" cx="240" cy="240" r="152" /><path className="room-dial-cross" d="M235 35h10M240 30v10M235 445h10M240 440v10M30 240h10M35 235v10M440 240h10M445 235v10" />
        </svg>
        <div className="room-concept-readout"><span>NEXT MEETING IN</span><strong>10<span>min</span></strong><p><span />Starting soon</p></div>
        <div className="room-concept-instrument-caption"><span>13:50 / NOW</span><span>14:00 / START</span></div>
      </div>
    </section>
    <section className="room-concept-runway"><div className="room-concept-runway-heading"><span className="room-concept-label">THE REST OF TODAY</span><span>3 meetings · 2h 30m of open space</span></div><div className="room-concept-runway-events">{upcoming.map((event, i) => <article key={event.id}><span className="room-concept-event-index">0{i + 1}</span><div><p>{event.start}<span>— {event.end}</span></p><h3>{agendaTitle(event)}</h3><small>{agendaOrganizer(event)}</small></div><span className={`room-concept-event-line ${i === 0 ? "next" : ""}`} /></article>)}</div></section>
  </RoomViewerShell>;
}