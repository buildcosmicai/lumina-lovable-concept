import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { addDays, addMonths, format, getDaysInMonth, startOfMonth, startOfWeek } from "date-fns";
import { ChevronLeft, ChevronRight, LockKeyhole } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RoomViewerShell } from "@/components/room-viewer-shell";
import { agendaEvents, agendaOrganizer, agendaTitle, SAMPLE_DATE, SAMPLE_ROOM, type AgendaPeriod, type RoomAgendaEvent } from "@/lib/room-viewer-sample";

export const Route = createFileRoute("/room-preview_/timetable")({
  head: () => ({ meta: [
    { title: "Charlie Brown — Timetable concept | Signage CMS" },
    { name: "description", content: "Read-only day, week and month agendas for the Charlie Brown room display sample." },
    { property: "og:title", content: "Charlie Brown — Room timetable" },
    { property: "og:description", content: "Browse the room's sample day, week and month schedule." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: RoomTimetable,
});

function EventDetail({ event }: { event: RoomAgendaEvent }) {
  return <><p className="room-agenda-event-time">{event.start}<span>— {event.end}</span></p><h3>{event.private && <LockKeyhole className="size-3" />}{agendaTitle(event)}</h3>{agendaOrganizer(event) && <small>{agendaOrganizer(event)}</small>}</>;
}

function RoomTimetable() {
  const [period, setPeriod] = useState<AgendaPeriod>("day");
  const [date, setDate] = useState(SAMPLE_DATE);
  const events = agendaEvents(date, period);
  const [chosenDay, setChosenDay] = useState("2026-10-19");
  const weekStart = startOfWeek(date, { weekStartsOn: 1 });
  const days = period === "week" ? Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)) : Array.from({ length: getDaysInMonth(date) }, (_, i) => addDays(startOfMonth(date), i));
  const move = (direction: number) => { const next = period === "month" ? addMonths(date, direction) : addDays(date, direction * (period === "week" ? 7 : 1)); setDate(next); setChosenDay(format(next, "yyyy-MM-dd")); };
  const monthEvents = events.filter(event => event.date === chosenDay);
  return <RoomViewerShell timetable>
    <section className="room-agenda-title"><div><p className="room-concept-label">ROOM {SAMPLE_ROOM.number} / TIMETABLE</p><h1>{SAMPLE_ROOM.name}<span> / The agenda</span></h1></div><p>Space for what’s next.</p></section>
    <div className="room-agenda-toolbar"><div className="room-agenda-periods" aria-label="Agenda view">{(["day", "week", "month"] as const).map(view => <Button key={view} variant="ghost" className={`room-concept-control ${period === view ? "selected" : ""}`} aria-pressed={period === view} onClick={() => setPeriod(view)}>{view.charAt(0).toUpperCase() + view.slice(1)}</Button>)}</div><div className="room-agenda-date"><Button size="icon" variant="ghost" className="room-concept-control" aria-label="Previous period" title="Previous period" onClick={() => move(-1)}><ChevronLeft /></Button><h2>{period === "month" ? format(date, "MMMM yyyy") : period === "week" ? `${format(weekStart, "d")}–${format(addDays(weekStart, 6), "d MMMM yyyy")}` : format(date, "EEEE, d MMMM")}</h2><Button size="icon" variant="ghost" className="room-concept-control" aria-label="Next period" title="Next period" onClick={() => move(1)}><ChevronRight /></Button><Button variant="ghost" className="room-concept-control" onClick={() => { setDate(SAMPLE_DATE); setChosenDay("2026-10-19"); }}>Today</Button></div></div>
    {period === "day" && <section className="room-agenda-day"><div className="room-agenda-day-heading"><span>{events.length} scheduled meetings</span><span>All times Europe/Berlin</span></div>{events.length === 0 ? <p className="room-agenda-empty">No meetings scheduled. A little room to think.</p> : events.map(event => <article key={event.id} className={`room-agenda-day-event ${event.date === "2026-10-19" && event.start === "14:00" ? "up-next" : ""}`}><div className="room-agenda-day-time"><strong>{event.start}</strong><span>{event.end}</span></div><div><EventDetail event={event} /></div><span className="room-agenda-duration">{event.date === "2026-10-19" && event.start === "14:00" ? "UP NEXT" : "SCHEDULED"}</span></article>)}</section>}
    {period === "week" && <section className="room-agenda-week" aria-label="Week agenda">{days.map(day => <div key={format(day, "yyyy-MM-dd")} className={`room-agenda-week-day ${format(day, "yyyy-MM-dd") === "2026-10-19" ? "today" : ""}`}><header><span>{format(day, "EEE")}</span><strong>{format(day, "dd")}</strong></header>{events.filter(event => event.date === format(day, "yyyy-MM-dd")).map(event => <article key={event.id}><EventDetail event={event} /></article>)}{!events.some(event => event.date === format(day, "yyyy-MM-dd")) && <p className="room-agenda-empty">Open all day</p>}</div>)}</section>}
    {period === "month" && <section className="room-agenda-month"><div><div className="room-agenda-month-labels">{["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(day => <span key={day}>{day}</span>)}</div><div className="room-agenda-month-grid">{Array.from({ length: (startOfMonth(date).getDay() + 6) % 7 }, (_, i) => <div className="room-agenda-month-blank" key={`blank-${i}`} />)}{days.map(day => { const key = format(day, "yyyy-MM-dd"); const daily = events.filter(event => event.date === key); return <Button variant="ghost" key={key} className={`room-agenda-month-cell ${chosenDay === key ? "selected" : ""}`} onClick={() => setChosenDay(key)} aria-label={`Show agenda for ${format(day, "d MMMM")}`} aria-pressed={chosenDay === key}><strong>{format(day, "d")}</strong><span>{daily.length ? `${daily.length} meetings` : "Open"}</span><i className={daily.length ? "booked" : ""} /></Button>; })}</div></div><aside className="room-agenda-month-detail"><p className="room-concept-label">SELECTED DAY</p><h2>{format(new Date(`${chosenDay}T12:00:00`), "d MMMM")}</h2>{monthEvents.map(event => <article key={event.id}><EventDetail event={event} /></article>)}{monthEvents.length === 0 && <p className="room-agenda-empty">No meetings scheduled.</p>}</aside></section>}
  </RoomViewerShell>;
}