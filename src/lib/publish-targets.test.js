import { describe, expect, it } from "vitest";
import { resolveTargets } from "./publish-targets";

const ids = (t) => resolveTargets({ screenIds: [], groupIds: [], sites: [], ...t }).map((s) => s.id);

describe("resolveTargets", () => {
  it("combines screens, groups and sites without duplicates", () => {
    expect(ids({ screenIds: ["cafeteria-04"], groupIds: ["food"], sites: ["Manchester"] }).sort()).toEqual(["cafeteria-04", "meeting-suite", "street-window"]);
  });
  it("narrows sites by group", () => {
    expect(ids({ sites: ["London HQ"], siteGroupId: "lobbies" }).sort()).toEqual(["atrium-wall", "lobby-east", "reception-portrait"]);
  });
  it("empty selection targets nothing", () => {
    expect(ids({})).toEqual([]);
  });
});
