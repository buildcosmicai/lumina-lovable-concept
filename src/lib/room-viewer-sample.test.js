import { describe, expect, test } from "bun:test";
import { agendaEvents, agendaTitle, agendaOrganizer, SAMPLE_DATE } from "./room-viewer-sample";
describe("room viewer sample agenda", () => {
  test("day shows only the selected date", () => {
    const events = agendaEvents(SAMPLE_DATE, "day");
    expect(events.length).toBe(5);
    expect(events.every(event => event.date === "2026-10-19")).toBe(true);
  });
  test("week starts Monday and excludes the following Monday", () => {
    const events = agendaEvents(SAMPLE_DATE, "week");
    expect(events.length).toBe(25);
    expect(events[0].date).toBe("2026-10-19");
    expect(events.at(-1).date).toBe("2026-10-23");
  });
  test("month includes only October bookings", () => {
    const events = agendaEvents(SAMPLE_DATE, "month");
    expect(events.length).toBe(110);
    expect(events[0].date).toBe("2026-10-01");
    expect(events.at(-1).date).toBe("2026-10-30");
  });
  test("private meetings hide both title and organizer", () => {
    const event = agendaEvents(SAMPLE_DATE, "day").find(event => event.private);
    expect(agendaTitle(event)).toBe("Reserved meeting");
    expect(agendaOrganizer(event)).toBe("");
  });
});