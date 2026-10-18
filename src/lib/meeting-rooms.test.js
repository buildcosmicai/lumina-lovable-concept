import { describe, expect, test } from "bun:test";
import { DEFAULT_MEETING, getMeetingState, getRoomPhase, meetingConfig, visibleMeetingTitle, visibleOrganizer, MEETING_TEMPLATES } from "./meeting-rooms";

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
  test("library preserves existing designs and adds two futuristic designs", () => {
    expect(MEETING_TEMPLATES.length).toBe(8);
    expect(MEETING_TEMPLATES.map((entry) => entry.config.design)).toEqual(["atelier", "panorama", "signal", "prism", "orbit", "vector", "tempo", "meridian"]);
  });
  test("new designs preserve calendar privacy and offline safety", () => {
    for (const design of ["signal", "prism", "orbit", "vector", "tempo", "meridian"]) {
      const state = getMeetingState({ design, hideTitles: true });
      expect(state.config.design).toBe(design);
      expect(visibleMeetingTitle(state.current, state.config)).toBe("Reserved meeting");
      expect(visibleOrganizer(state.current, state.config)).toBe("");
      expect(getMeetingState({ design, demoState: "offline" }).events).toEqual([]);
    }
  });
  test("both Forum-inspired templates retain the Forum room", () => {
    for (const id of ["orbit", "vector"]) {
      const template = MEETING_TEMPLATES.find(entry => entry.id === id);
      expect(template.config.roomId).toBe("ms-forum");
      expect(getMeetingState(template.config).room.name).toBe("Forum");
    }
  });
  test("one room has available, starting-soon and occupied calendar phases", () => {
    for (const [demoState, expected] of [["available", "available"], ["soon", "soon"], ["busy", "busy"]]) {
      expect(getRoomPhase({ roomId: "ms-forum", design: "tempo", demoState })).toBe(expected);
      expect(getMeetingState({ roomId: "ms-forum", demoState }).room.name).toBe("Forum");
    }
    const soon = getMeetingState({ demoState: "soon" });
    expect(soon.current).toBeUndefined();
    expect(soon.upcoming[0].start - soon.now).toBe(5);
  });
  test("unknown and empty calendars do not become starting-soon or busy", () => {
    expect(getRoomPhase({ demoState: "offline" })).toBe("offline");
    expect(getRoomPhase({ demoState: "empty" })).toBe("available");
  });
  test("Meridian uses one selected room across all three adaptive states", () => {
    for (const [demoState, phase] of [["available", "available"], ["soon", "soon"], ["busy", "busy"]]) {
      const config = { design: "meridian", roomId: "g-horizon", provider: "google", demoState };
      expect(getRoomPhase(config)).toBe(phase);
      expect(getMeetingState(config).room.name).toBe("Horizon");
    }
  });
});