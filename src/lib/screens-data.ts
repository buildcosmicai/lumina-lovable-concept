export type ScreenStatus = "online" | "attention" | "offline";

export type ScreenRecord = {
  id: string;
  name: string;
  location: string;
  area: string;
  status: ScreenStatus;
  orientation: "Landscape" | "Portrait" | "Ultrawide";
  resolution: string;
  currentContent: string;
  layout: string;
  lastSeen: string;
  player: string;
  ip: string;
  uptime: string;
  storage: number;
  cpu: number;
  memory: number;
  temperature: number;
  signal: number;
  nextItem: string;
};

export const SCREENS: ScreenRecord[] = [
  { id: "lobby-east", name: "Lobby East", location: "London HQ", area: "Ground floor", status: "online", orientation: "Landscape", resolution: "3840 × 2160", currentContent: "Autumn launch", layout: "Lobby — Morning loop", lastSeen: "8 sec ago", player: "Player 4.8.2", ip: "10.24.8.41", uptime: "18d 6h", storage: 31, cpu: 24, memory: 42, temperature: 46, signal: 99, nextItem: "Visitor welcome · 10:45" },
  { id: "atrium-wall", name: "Atrium video wall", location: "London HQ", area: "Floor 01", status: "offline", orientation: "Ultrawide", resolution: "7680 × 2160", currentContent: "Evening ambience", layout: "Reception video wall", lastSeen: "14 min ago", player: "Player 4.8.1", ip: "10.24.8.56", uptime: "—", storage: 58, cpu: 0, memory: 0, temperature: 0, signal: 0, nextItem: "Town Hall takeover · 12:00" },
  { id: "reception-portrait", name: "Reception portrait", location: "London HQ", area: "Reception", status: "attention", orientation: "Portrait", resolution: "1080 × 1920", currentContent: "Visitor welcome", layout: "Elevator portrait", lastSeen: "21 sec ago", player: "Player 4.8.2", ip: "10.24.8.63", uptime: "6d 11h", storage: 76, cpu: 48, memory: 67, temperature: 61, signal: 92, nextItem: "Brand stories · 11:00" },
  { id: "cafeteria-04", name: "Cafeteria 04", location: "London HQ", area: "Floor 02", status: "online", orientation: "Landscape", resolution: "1920 × 1080", currentContent: "Lunch menu", layout: "Cafeteria menu board", lastSeen: "4 sec ago", player: "Player 4.8.2", ip: "10.24.9.18", uptime: "31d 4h", storage: 22, cpu: 19, memory: 36, temperature: 43, signal: 100, nextItem: "Afternoon menu · 14:30" },
  { id: "meeting-suite", name: "Meeting suite", location: "Manchester", area: "Floor 03", status: "online", orientation: "Landscape", resolution: "1920 × 1080", currentContent: "Room availability", layout: "Meeting rooms", lastSeen: "11 sec ago", player: "Player 4.8.2", ip: "10.31.4.22", uptime: "12d 9h", storage: 18, cpu: 16, memory: 34, temperature: 41, signal: 98, nextItem: "Company updates · 12:00" },
  { id: "street-window", name: "Street window", location: "Manchester", area: "Ground floor", status: "attention", orientation: "Portrait", resolution: "2160 × 3840", currentContent: "City campaign", layout: "Window portrait", lastSeen: "48 sec ago", player: "Player 4.7.9", ip: "10.31.4.09", uptime: "3d 2h", storage: 84, cpu: 52, memory: 71, temperature: 58, signal: 88, nextItem: "Autumn launch · 10:50" },
  { id: "bristol-welcome", name: "Bristol welcome", location: "Bristol", area: "Main entrance", status: "online", orientation: "Landscape", resolution: "2560 × 1440", currentContent: "Visitor welcome", layout: "Lobby — Morning loop", lastSeen: "7 sec ago", player: "Player 4.8.2", ip: "10.42.2.11", uptime: "22d 1h", storage: 27, cpu: 21, memory: 39, temperature: 44, signal: 99, nextItem: "Local news · 11:15" },
  { id: "town-hall", name: "Town Hall display", location: "Bristol", area: "Auditorium", status: "online", orientation: "Landscape", resolution: "3840 × 2160", currentContent: "Company pulse", layout: "Town hall all-hands", lastSeen: "12 sec ago", player: "Player 4.8.2", ip: "10.42.2.34", uptime: "9d 16h", storage: 46, cpu: 32, memory: 51, temperature: 49, signal: 97, nextItem: "Town Hall takeover · 12:00" },
];

export const getScreen = (screenId: string) => SCREENS.find((screen) => screen.id === screenId);
