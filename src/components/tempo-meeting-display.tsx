import { ArrowUpRight, Monitor, Users, Video, WifiOff } from "lucide-react";
import { getMeetingState, getRoomPhase, meetingTime, visibleMeetingTitle, visibleOrganizer, type MeetingConfig } from "@/lib/meeting-rooms";

export function TempoMeetingDisplay({ config: value }: { config?: Partial<MeetingConfig> }) {
  const state = getMeetingState(value);
  const { config, room, now, current, upcoming, events, offline } = state;
  const phase = getRoomPhase(config);
  const next = upcoming[0];
  const time = (n: number) => meetingTime(n, config.use24h);
  const remaining = current ? current.end - now : next ? next.start - now : undefined;
  const focus = current ?? (phase === "soon" ? next : undefined);
  const featured = focus ?? next;
  const status = offline ? "Status unknown" : current ? "In a meeting" : phase === "soon" ? "Starting soon" : "Available";
  return <div className={`tempo-display tempo-${phase}`} data-testid="meeting-display" data-phase={phase}>
    <div className="tempo-shell">
      <header className="tempo-header"><span className="tempo-brand"><span aria-hidden="true">⌑</span> TEMPO <small>WORKPLACE / 07</small></span><div className="tempo-clock"><strong>{time(now)}</strong><small>16 OCT · {config.timezone.split("/").at(-1)?.replaceAll("_", " ")}</small></div></header>
      <div className="tempo-main">
        <section className="tempo-identity"><span className="tempo-label">{room.location}</span><h2>{room.name}<ArrowUpRight /></h2><div className="tempo-equipment"><span><Users />{room.capacity} people</span><span><Monitor />Display</span><span><Video />Video call</span></div>
          <div className="tempo-message"><p className="tempo-status"><i />{status}</p><h3>{offline ? "Check the calendar." : current ? `Free at ${time(current.end)}.` : phase === "soon" ? `Starts in ${remaining} minutes.` : remaining === undefined ? "The day is yours." : `Yours for ${remaining} minutes.`}</h3><p>{offline ? "Availability cannot be confirmed" : current ? "A little focus. A lot of possibility." : phase === "soon" ? `Still available · booked from ${time(next?.start ?? now)}` : next ? `Next booking at ${time(next.start)}` : "No more meetings today"}</p></div>
          <div className="tempo-focus"><span className="tempo-label">{offline ? "CONNECTION NEEDED" : current ? "HAPPENING NOW" : phase === "soon" ? "GETTING READY FOR" : "UP NEXT"}</span><h4>{offline ? "Calendar unavailable" : featured ? visibleMeetingTitle(featured, config) : "An open horizon"}</h4><p>{featured && !offline ? `${time(featured.start)} — ${time(featured.end)}` : ""}{featured && visibleOrganizer(featured, config) ? ` · ${visibleOrganizer(featured, config)}` : ""}</p></div>
        </section>
        <section className="tempo-portal" aria-label={status}><svg viewBox="0 0 360 340" aria-hidden="true">{[0, 1, 2, 3, 4, 5].map(i => <rect key={i} className="tempo-door" x={30 + i * 18} y={8 + i * 16} width={300 - i * 36} height={320 - i * 32} rx={100 - i * 12} />)}<path className="tempo-axis" d="M0 170H360M180 0V340" /></svg><div className="tempo-readout"><span className="tempo-label">{offline ? "CALENDAR" : current ? "TIME TO OPEN" : phase === "soon" ? "NEXT BOOKING" : "OPEN WINDOW"}</span>{offline ? <WifiOff /> : <strong>{remaining ?? "∞"}</strong>}<span className="tempo-label">{offline ? "NOT CONNECTED" : remaining === undefined ? "REST OF TODAY" : "MINUTES"}</span></div><p>{status}<span> / </span>{offline ? "No calendar signal" : current ? "Focus mode" : phase === "soon" ? "Handover mode" : "Open mode"}</p></section>
      </div>
      <section className="tempo-day" aria-label="Day ribbon"><div className="tempo-day-heading"><span className="tempo-label">THE DAY IN MOTION</span><span>{offline ? "CALENDAR UNAVAILABLE" : `${upcoming.length} UPCOMING`}</span></div><div className="tempo-ribbon"><span className="tempo-now">NOW / {time(now)}</span>{events.map(event => <div key={event.id} className={`tempo-booking ${event.id === current?.id ? "tempo-booking-current" : ""}`} style={{ left: `${22 + (event.start - now) / 4}%`, width: `${(event.end - event.start) / 4}%` }}><span>{time(event.start)}</span></div>)}{!offline && <i className="tempo-now-line" />}</div><div className="tempo-agenda">{upcoming.slice(0, 3).map(event => <div key={event.id}><span>{time(event.start)}</span><h4>{visibleMeetingTitle(event, config)}</h4><ArrowUpRight /></div>)}{!upcoming.length && <p>{offline ? "Waiting for calendar connection" : "Nothing else booked. Space for possibility."}</p>}</div></section>
      <footer className="tempo-footer"><span>ROOM / {room.id.split("-").at(-1)?.toUpperCase()}</span><span>SAMPLE CALENDAR · {config.provider === "google" ? "GOOGLE WORKSPACE" : "MICROSOFT 365"}</span><span>DEMO / {config.use24h ? "24H" : "12H"}</span></footer>
    </div>
  </div>;
}