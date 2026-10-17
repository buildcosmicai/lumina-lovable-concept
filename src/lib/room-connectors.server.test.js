import { test, expect } from "bun:test";
import { sealCredential, openCredential, discoverProviderRooms, checkCalendar } from "./room-connectors.server";

test("stored connector credentials are encrypted and recoverable only with the encryption secret", () => {
  const credential = { provider: "microsoft", tenantId: "test-tenant", clientId: "test-client", clientSecret: "fixture-not-a-credential" };
  const stored = sealCredential(credential, "fixture-only-encryption-secret");
  expect(stored.includes(credential.clientSecret)).toBe(false);
  expect(openCredential(stored, "fixture-only-encryption-secret")).toEqual(credential);
  expect(() => openCredential(stored, "wrong-fixture-secret")).toThrow();
});

test("Microsoft discovery preserves room identities for the managed-room checklist", async () => {
  const original = globalThis.fetch;
  globalThis.fetch = async url => String(url).includes("/token")
    ? Response.json({ access_token: "fixture-only-token" })
    : Response.json({ value: [{ id: "room-1", displayName: "Forum", emailAddress: "forum@example.com", capacity: 12, building: "HQ" }] });
  try {
    expect(await discoverProviderRooms({ provider: "microsoft", tenantId: "fixture", clientId: "fixture", clientSecret: "fixture" }, "forum@example.com")).toEqual([{ id: "room-1", name: "Forum", email: "forum@example.com", capacity: 12, location: "HQ" }]);
  } finally { globalThis.fetch = original; }
});

test("calendar access denial never verifies a room as connected", async () => {
  const original = globalThis.fetch;
  globalThis.fetch = async () => Response.json({ error: { code: "ErrorAccessDenied" } }, { status: 403 });
  try {
    await expect(checkCalendar({ provider: "microsoft", tenantId: "fixture", clientId: "fixture", clientSecret: "fixture" }, "fixture-only-token", "forum@example.com")).rejects.toThrow("Microsoft denied calendar read access");
  } finally { globalThis.fetch = original; }
});