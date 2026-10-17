export type CalendarProvider = "microsoft" | "google";
export type MeetingConfig = {
  provider: CalendarProvider;
  roomId: string;
  design: "atelier" | "panorama" | "signal" | "prism";
  timezone: string;
  use24h: boolean;
  showOrganizer: boolean;
  hideTitles: boolean;
  upcomingCount: number;
  demoState: "busy" | "available" | "empty" | "offline";
  refreshSeconds: number;
};

export const ROOMS = [
  { id: "ms-atelier", provider: "microsoft", name: "Atelier", location: "Level 02 · East wing", capacity: 8 },
  { id: "ms-forum", provider: "microsoft", name: "Forum", location: "Level 01 · South wing", capacity: 12 },
  { id: "ms-studio", provider: "microsoft", name: "Studio", location: "Level 03 · West wing", capacity: 4 },
  { id: "g-garden", provider: "google", name: "Garden", location: "Level 01 · Courtyard", capacity: 6 },
  { id: "g-horizon", provider: "google", name: "Horizon", location: "Level 04 · North wing", capacity: 10 },
  { id: "g-nest", provider: "google", name: "Nest", location: "Level 02 · West wing", capacity: 4 },
] as const;

export const DEFAULT_MEETING: MeetingConfig = {
  provider: "microsoft", roomId: "ms-atelier", design: "atelier", timezone: "Europe/Berlin",
  use24h: true, showOrganizer: true, hideTitles: false, upcomingCount: 3,
  demoState: "busy", refreshSeconds: 60,
};

export type MeetingEvent = { id: string; title: string; organizer: string; start: number; end: number; private: boolean };
const EVENTS: MeetingEvent[] = [
  { id: "e1", title: "Design sync", organizer: "Alex Morgan", start: 600, end: 660, private: false },
  { id: "e2", title: "Product roadmap", organizer: "Jamie Chen", start: 690, end: 750, private: false },
  { id: "e3", title: "Leadership review", organizer: "Sam Rivera", start: 810, end: 855, private: true },
  { id: "e4", title: "Creative workshop", organizer: "Taylor Brooks", start: 900, end: 960, private: false },
];

export function meetingConfig(value?: Partial<MeetingConfig>): MeetingConfig {
  const config = { ...DEFAULT_MEETING, ...value };
  const room = ROOMS.find((r) => r.id === config.roomId && r.provider === config.provider)
    ?? ROOMS.find((r) => r.provider === config.provider) ?? ROOMS[0];
  return { ...config, roomId: room.id, upcomingCount: Math.max(1, Math.min(4, config.upcomingCount)) };
}

export function getMeetingState(value?: Partial<MeetingConfig>) {
  const config = meetingConfig(value);
  const room = ROOMS.find((r) => r.id === config.roomId) ?? ROOMS[0];
  const now = config.demoState === "available" ? 675 : config.demoState === "empty" ? 1050 : 615;
  const events = config.demoState === "empty" || config.demoState === "offline" ? [] : EVENTS.map((event, i) => ({
    ...event,
    title: room.id === "ms-forum" && i === 0 ? "Team all-hands" : room.id === "g-garden" && i === 0 ? "Ideas in bloom" : event.title,
  }));
  const current = events.find((event) => event.start <= now && event.end > now);
  const upcoming = events.filter((event) => event.start > now).slice(0, config.upcomingCount);
  return { config, room, now, events, current, upcoming, offline: config.demoState === "offline" };
}

export function visibleMeetingTitle(event: MeetingEvent, config: MeetingConfig) {
  return event.private || config.hideTitles ? "Reserved meeting" : event.title;
}

export function visibleOrganizer(event: MeetingEvent, config: MeetingConfig) {
  return config.showOrganizer && !config.hideTitles && !event.private ? event.organizer : "";
}

export function meetingTime(minutes: number, use24h: boolean) {
  const hour = Math.floor(minutes / 60);
  const minute = String(minutes % 60).padStart(2, "0");
  return use24h ? `${String(hour).padStart(2, "0")}:${minute}` : `${hour % 12 || 12}:${minute} ${hour < 12 ? "AM" : "PM"}`;
}

export const MEETING_TEMPLATES = [
  { id: "atelier", name: "Atelier — The room companion", subtitle: "A clear status signal, a generous meeting spotlight and an at-a-glance day plan.", config: DEFAULT_MEETING },
  { id: "panorama", name: "Panorama — Space to think", subtitle: "An architectural room portrait with open-space availability and a calm meeting agenda.", config: { ...DEFAULT_MEETING, provider: "google", roomId: "g-garden", design: "panorama", demoState: "available" } as MeetingConfig },
  { id: "signal", name: "Signal — Ahead of time", subtitle: "A luminous status dial, oversized room identity and a precision day timeline on a graphite canvas.", config: { ...DEFAULT_MEETING, roomId: "ms-forum", design: "signal" } as MeetingConfig },
  { id: "prism", name: "Prism — A clearer dimension", subtitle: "Light-filled architecture meets crystalline calendar panels and an unmistakable availability signal.", config: { ...DEFAULT_MEETING, provider: "google", roomId: "g-horizon", design: "prism", demoState: "available" } as MeetingConfig },
] as const;