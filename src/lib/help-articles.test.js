import { expect, test } from "bun:test";
import { searchHelpArticles } from "./help-articles.ts";
test("help search matches article content and preserves the selected topic", () => {
  expect(searchHelpArticles("delegation", "rooms").map((a) => a.slug)).toEqual([
    "connect-room-calendars",
  ]);
  expect(searchHelpArticles("delegation", "screens")).toEqual([]);
  expect(searchHelpArticles("not-an-existing-topic")).toEqual([]);
});
