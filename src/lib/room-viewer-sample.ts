import { addDays, format, startOfMonth, startOfWeek } from "date-fns";

export const SAMPLE_ROOM = { name: "Charlie Brown", number: "04", location: "Level 02 · East wing", capacity: 12 };
export const SAMPLE_DATE = new Date(2026, 9, 19, 13, 50);
export type AgendaPeriod = "day" | "week" | "month";
export type RoomAgendaEvent = { id: string; date: string; start: string; end: string; title: string; organizer: string; private: boolean };
const sessions = [
  { start: "09:00", end: "10:00", title: "Creative sync", organizer: "Jamie Chen", private: false },
  { start: "11:00", end: "12:00", title: "Leadership review", organizer: "Sam Rivera", private: true },
  { start: "14:00", end: "15:00", title: "Project Planning", organizer: "Amanda", private: false },
  { start: "15:30", end: "16:15", title: "Design review", organizer: "Alex Morgan", private: false },
  { start: "17:00", end: "17:45", title: "Tomorrow, together", organizer: "Taylor Brooks", private: false },
];
export const ROOM_AGENDA: RoomAgendaEvent[] = Array.from({ length: 31 }, (_, i) => new Date(2026, 9, i + 1))
  .filter(date => date.getDay() !== 0 && date.getDay() !== 6)
  .flatMap(date => sessions.map((session, i) => ({ ...session, date: format(date, "yyyy-MM-dd"), id: `${format(date, "yyyy-MM-dd")}-${i}` })));
export function agendaEvents(date: Date, period: AgendaPeriod) {
  const from = period === "week" ? startOfWeek(date, { weekStartsOn: 1 }) : period === "month" ? startOfMonth(date) : date;
  const start = format(from, "yyyy-MM-dd");
  const end = period === "week" ? format(addDays(from, 7), "yyyy-MM-dd") : period === "month" ? format(new Date(date.getFullYear(), date.getMonth() + 1, 1), "yyyy-MM-dd") : format(addDays(from, 1), "yyyy-MM-dd");
  return ROOM_AGENDA.filter(event => event.date >= start && event.date < end);
}
export function agendaTitle(event: RoomAgendaEvent) { return event.private ? "Reserved meeting" : event.title; }
export function agendaOrganizer(event: RoomAgendaEvent) { return event.private ? "" : event.organizer; }