import { describe, expect, test } from "bun:test";
import { DEFAULT_MEETING, getMeetingState, meetingConfig, visibleMeetingTitle, visibleOrganizer, MEETING_TEMPLATES } from "./meeting-rooms";

describe("meeting room signage", () => {
  test("selecting a Microsoft room displays its own meeting", () => {
    const state = getMeetingState({ roomId: "ms-forum" });
    expect(state.room.name).toBe("Forum");
    expect(state.current.title).toBe("Team all-hands");
  });
  test("Google room selection cannot reuse a Microsoft room", () => {
    const config = meetingConfig({ provider: "google", roomId: "ms-forum" });
    expect(config.roomId).toBe("g-garden");
    expect(getMeetingState(config).current.title).toBe("Ideas in bloom");
  });
  test("private events never expose meeting details", () => {
    const event = getMeetingState().upcoming.find((event) => event.private);
    expect(visibleMeetingTitle(event, DEFAULT_MEETING)).toBe("Reserved meeting");
    expect(visibleOrganizer(event, DEFAULT_MEETING)).toBe("");
  });
  test("title privacy hides titles and organisers", () => {
    const event = getMeetingState().current;
    const config = { ...DEFAULT_MEETING, hideTitles: true };
    expect(visibleMeetingTitle(event, config)).toBe("Reserved meeting");
    expect(visibleOrganizer(event, config)).toBe("");
  });
  test("upcoming count controls the number of displayed meetings", () => {
    expect(getMeetingState({ upcomingCount: 1 }).upcoming.length).toBe(1);
    expect(getMeetingState({ upcomingCount: 3 }).upcoming.length).toBe(3);
  });
  test("offline state never supplies availability events", () => {
    const state = getMeetingState({ demoState: "offline" });
    expect(state.offline).toBe(true);
    expect(state.events.length).toBe(0);
    expect(state.current).toBeUndefined();
  });
  test("library contains exactly two distinct meeting room designs", () => {
    expect(MEETING_TEMPLATES.length).toBe(2);
    expect(MEETING_TEMPLATES.map((entry) => entry.config.design)).toEqual(["atelier", "panorama"]);
  });
});