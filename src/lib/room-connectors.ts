import { z } from "zod";

export const GOOGLE_ROOM_SCOPES = [
  "https://www.googleapis.com/auth/calendar.readonly",
  "https://www.googleapis.com/auth/admin.directory.resource.calendar.readonly",
] as const;

export const roomCredentialSchema = z.discriminatedUnion("provider", [
  z.object({ provider: z.literal("google"), keyJson: z.string().min(1).max(50000), directoryEmail: z.string().email() }),
  z.object({ provider: z.literal("microsoft"), tenantId: z.string().uuid(), clientId: z.string().uuid(), clientSecret: z.string().min(1).max(5000) }),
]);
export type RoomCredential = z.infer<typeof roomCredentialSchema>;
export type ConnectorRoom = { id: string; name: string; email: string; capacity: number | null; location: string };
export type RoomConnection = {
  id: string; provider: "google" | "microsoft"; name: string; reader_email: string;
  status: "unverified" | "connected" | "error"; last_error: string | null;
  verified_at: string | null; rooms: ConnectorRoom[]; created_at: string;
};
export const serviceAccountSchema = z.object({
  type: z.literal("service_account"), client_email: z.string().email(),
  private_key: z.string().refine(value => value.includes("-----BEGIN PRIVATE KEY-----"), "The JSON must contain a service-account private key."),
  client_id: z.string().min(1),
});

export function providerProblem(provider: "google" | "microsoft", status: number, code: string, operation: string) {
  if (code === "unauthorized_client") return "Domain-wide delegation is not authorised. Add the service account client ID and both read-only scopes in Google Workspace Admin → API controls.";
  if (code === "invalid_grant") return "Google could not impersonate the reader. Check the reader email, domain-wide delegation and whether the service-account key is still active.";
  if (code === "invalid_client") return "Microsoft rejected the app credentials. Check the tenant ID, application ID and client secret value (not its secret ID).";
  if (status === 401) return "The credentials were rejected or have expired. Replace the key or client secret and verify again.";
  if (status === 403) return provider === "google"
    ? `Google denied ${operation}. Check that Calendar API and Admin SDK API are enabled, both delegation scopes are authorised, the directory account can read room resources, and the reader has room-calendar access.`
    : `Microsoft denied ${operation}. Check Place.Read.All, calendar-read permissions, admin consent and the Exchange room-mailbox access scope.`;
  if (status === 404) return "The reader mailbox or room calendar could not be found. Check the email and calendar sharing.";
  if (status === 429) return "The calendar provider is limiting requests. Wait a moment and verify again.";
  return `${provider === "google" ? "Google" : "Microsoft"} could not complete ${operation} (HTTP ${status}). Check the provider configuration and try again.`;
}