import { describe, test, expect } from "bun:test";
import { GOOGLE_ROOM_SCOPES, providerProblem, roomCredentialSchema, serviceAccountSchema } from "./room-connectors";

describe("room connector rules", () => {
  test("Google delegation includes calendar and room directory read scopes", () => {
    expect(GOOGLE_ROOM_SCOPES).toEqual(["https://www.googleapis.com/auth/calendar.readonly", "https://www.googleapis.com/auth/admin.directory.resource.calendar.readonly"]);
  });
  test("Google credential uploads must be service-account JSON", () => {
    expect(serviceAccountSchema.safeParse({ type: "authorized_user", client_email: "reader@example.com", private_key: "not a key", client_id: "123" }).success).toBe(false);
  });
  test("both providers can be configured independently", () => {
    expect(roomCredentialSchema.safeParse({ provider: "google", keyJson: "{}", directoryEmail: "admin@example.com" }).success).toBe(true);
    expect(roomCredentialSchema.safeParse({ provider: "microsoft", tenantId: "12345678-1234-1234-1234-123456789abc", clientId: "12345678-1234-1234-1234-123456789abc", clientSecret: "test-only" }).success).toBe(true);
  });
  test("delegation rejection stays an actionable failure, never connected", () => {
    expect(providerProblem("google", 400, "unauthorized_client", "verification")).toContain("Domain-wide delegation is not authorised");
  });
});