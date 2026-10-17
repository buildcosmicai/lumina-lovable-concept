import { ArrowUpRight, CalendarDays, Users, WifiOff } from "lucide-react";
import roomImage from "@/assets/meeting-room.jpg";
import { getMeetingState, meetingTime, visibleMeetingTitle, visibleOrganizer, type MeetingConfig } from "@/lib/meeting-rooms";
import { cn } from "@/lib/utils";
import { FuturisticMeetingDisplay } from "@/components/futuristic-meeting-display";
import { InstrumentMeetingDisplay } from "@/components/instrument-meeting-display";
import { TempoMeetingDisplay } from "@/components/tempo-meeting-display";

export function MeetingRoomDisplay({ config: value }: { config?: Partial<MeetingConfig> | undefined }) {
  const { config, room, now, current, upcoming, offline } = getMeetingState(value);
  const time = (minutes: number) => meetingTime(minutes, config.use24h);
  const available = !current;
  if (config.design === "tempo") return <TempoMeetingDisplay config={config} />;
  if (config.design === "orbit" || config.design === "vector") return <InstrumentMeetingDisplay config={config} />;
  if (config.design === "signal" || config.design === "prism") return <FuturisticMeetingDisplay config={config} />;
  return (
    <div className={cn("meeting-display", config.design === "panorama" && "meeting-panorama")} data-testid="meeting-display">
      <div className="meeting-content">
        <header className="meeting-header">
          <span className="meeting-brand"><CalendarDays /> ROOM / {config.design === "atelier" ? "01" : "02"}</span>
          <span>WORKPLACE COLLECTION</span>
          <div className="meeting-clock"><strong>{time(now)}</strong><span>FRIDAY, 16 OCT · {config.timezone.split("/").at(-1)?.replaceAll("_", " ")}</span></div>
        </header>
        <div className="meeting-body">
          <section className={cn("meeting-spotlight", current ? "meeting-busy" : "meeting-free")}>
            {config.design === "panorama" && <img src={roomImage} alt="Bright meeting room with a round table and garden views" width={1280} height={720} loading="lazy" className="meeting-photo" />}
            <div className="meeting-room-name"><span>{room.location}</span><h2>{room.name}</h2><span className="meeting-capacity"><Users /> {room.capacity} people · Display · Video call</span></div>
            <div className="meeting-availability"><span className="meeting-status-dot" />{offline ? "Calendar unavailable" : current ? "In a meeting" : "Available"}<ArrowUpRight /></div>
            <div className="meeting-focus">
              <span className="meeting-eyebrow">{offline ? "CONNECTION NEEDED" : current ? "HAPPENING NOW" : "MAKE ROOM FOR IDEAS"}</span>
              <h3>{offline ? "Status unknown" : current ? visibleMeetingTitle(current, config) : "Space to think."}</h3>
              <p>{offline ? "Availability cannot be confirmed" : current ? `${time(current.start)} – ${time(current.end)}` : upcoming[0] ? `Free for ${upcoming[0].start - now} minutes · until ${time(upcoming[0].start)}` : "No more meetings today"}</p>
              {current && visibleOrganizer(current, config) && <p className="meeting-organizer">Hosted by {visibleOrganizer(current, config)}</p>}
            </div>
            {!offline && <div className="meeting-progress"><span>{current ? `${current.end - now} min remaining` : "Your next great idea starts here"}</span><div><i style={{ width: current ? `${((now - current.start) / (current.end - current.start)) * 100}%` : "100%" }} /></div></div>}
          </section>
          <section className="meeting-agenda">
            <div className="meeting-agenda-title"><h3>Coming up</h3><span>TODAY</span></div>
            {upcoming.length ? upcoming.map((event, i) => <div className="meeting-event" key={event.id}>
              <span className="meeting-event-time">{time(event.start)}<small>{time(event.end)}</small></span>
              <div><span className="meeting-eyebrow">{i === 0 ? "UP NEXT" : event.private ? "PRIVATE" : "LATER TODAY"}</span><h4>{visibleMeetingTitle(event, config)}</h4>{visibleOrganizer(event, config) && <p>{visibleOrganizer(event, config)}</p>}</div>
            </div>) : <div className="meeting-empty">{offline ? <WifiOff /> : <CalendarDays />}<h4>{offline ? "Waiting for calendar" : "A little breathing room."}</h4><p>{offline ? "Check the calendar connection" : "The room is clear for the rest of the day"}</p></div>}
            <div className="meeting-agenda-footer"><span className={cn("meeting-status-dot", offline && "opacity-40")} />{offline ? "Not connected" : "Sample room calendar"}<span>{config.provider === "microsoft" ? "Microsoft 365" : "Google Workspace"}</span></div>
          </section>
        </div>
        <footer className="meeting-footer"><span>{room.name.toUpperCase()} / {room.location.toUpperCase()}</span><span>{available && !offline ? "OPEN SPACE. FRESH PERSPECTIVES." : "GOOD MEETINGS START ON TIME."}</span><span>DEMO · {config.use24h ? "24H" : "12H"}</span></footer>
      </div>
    </div>
  );
}