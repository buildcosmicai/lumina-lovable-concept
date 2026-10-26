import { SCREENS, type ScreenRecord } from "@/lib/screens-data";

export type ScreenGroup = { id: string; name: string; screenIds: string[] };

export const SCREEN_GROUPS: ScreenGroup[] = [
  { id: "lobbies", name: "Lobbies & receptions", screenIds: ["lobby-east", "reception-portrait", "bristol-welcome", "atrium-wall"] },
  { id: "food", name: "Food & beverage", screenIds: ["cafeteria-04"] },
  { id: "rooms", name: "Meeting rooms", screenIds: ["meeting-suite"] },
  { id: "retail", name: "Street & windows", screenIds: ["street-window"] },
  { id: "events", name: "All-hands & events", screenIds: ["town-hall", "atrium-wall"] },
];

export const SITES = Array.from(new Set(SCREENS.map((s) => s.location)));

export type PublishTargets = { screenIds: string[]; groupIds: string[]; sites: string[]; siteGroupId?: string | null };

/** Union of every chosen target, de-duplicated. Sites can be narrowed to one group. */
export function resolveTargets(t: PublishTargets, screens: ScreenRecord[] = SCREENS): ScreenRecord[] {
  const ids = new Set(t.screenIds);
  for (const g of SCREEN_GROUPS) if (t.groupIds.includes(g.id)) g.screenIds.forEach((id) => ids.add(id));
  const narrow = t.siteGroupId ? SCREEN_GROUPS.find((g) => g.id === t.siteGroupId) : undefined;
  for (const s of screens) if (t.sites.includes(s.location) && (!narrow || narrow.screenIds.includes(s.id))) ids.add(s.id);
  return screens.filter((s) => ids.has(s.id));
}
