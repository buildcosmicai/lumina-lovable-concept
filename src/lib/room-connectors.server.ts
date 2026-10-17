import { createCipheriv, createDecipheriv, createHash, randomBytes, createSign } from "node:crypto";
import { GOOGLE_ROOM_SCOPES, serviceAccountSchema, providerProblem, type RoomCredential, type ConnectorRoom } from "./room-connectors";

export function sealCredential(value: RoomCredential, secret: string) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", createHash("sha256").update(secret).digest(), iv);
  const content = Buffer.concat([cipher.update(JSON.stringify(value), "utf8"), cipher.final()]);
  return Buffer.concat([iv, cipher.getAuthTag(), content]).toString("base64");
}
export function openCredential(value: string, secret: string): RoomCredential {
  const bytes = Buffer.from(value, "base64");
  const cipher = createDecipheriv("aes-256-gcm", createHash("sha256").update(secret).digest(), bytes.subarray(0, 12));
  cipher.setAuthTag(bytes.subarray(12, 28));
  return JSON.parse(Buffer.concat([cipher.update(bytes.subarray(28)), cipher.final()]).toString("utf8"));
}
type ProviderResponse = Record<string, any>;
async function request(url: string, provider: RoomCredential["provider"], operation: string, init?: RequestInit): Promise<ProviderResponse> {
  let response: Response;
  try { response = await fetch(url, { ...init, signal: AbortSignal.timeout(15000) }); }
  catch { throw new Error("The calendar provider could not be reached. Try again shortly."); }
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    // Never persist or return unfiltered responses: token errors may echo credentials.
    const code = typeof body.error === "string" ? body.error : String(body.error?.code ?? "unknown");
    throw new Error(providerProblem(provider, response.status, code, operation));
  }
  return body;
}
export async function accessToken(credential: RoomCredential, reader: string, directory = false): Promise<string> {
  if (credential.provider === "google") {
    const key = serviceAccountSchema.parse(JSON.parse(credential.keyJson));
    const now = Math.floor(Date.now() / 1000);
    const encode = (value: unknown) => Buffer.from(JSON.stringify(value)).toString("base64url");
    const payload = `${encode({ alg: "RS256", typ: "JWT" })}.${encode({ iss: key.client_email, sub: directory ? credential.directoryEmail : reader, scope: GOOGLE_ROOM_SCOPES.join(" "), aud: "https://oauth2.googleapis.com/token", iat: now, exp: now + 3600 })}`;
    let signature: string;
    try { const sign = createSign("RSA-SHA256"); sign.update(payload); signature = sign.sign(key.private_key, "base64url"); }
    catch { throw new Error("The service-account private key is invalid. Upload a new JSON key downloaded from Google Cloud."); }
    const body = await request("https://oauth2.googleapis.com/token", "google", "delegated authorisation", { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion: `${payload}.${signature}` }) });
    if (typeof body.access_token !== "string") throw new Error("Google did not issue an access token. Check domain-wide delegation.");
    return body.access_token;
  }
  const body = await request(`https://login.microsoftonline.com/${credential.tenantId}/oauth2/v2.0/token`, "microsoft", "app authorisation", { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: new URLSearchParams({ client_id: credential.clientId, client_secret: credential.clientSecret, scope: "https://graph.microsoft.com/.default", grant_type: "client_credentials" }) });
  if (typeof body.access_token !== "string") throw new Error("Microsoft did not issue an access token. Check app registration and admin consent.");
  return body.access_token;
}
export async function checkCalendar(credential: RoomCredential, token: string, email: string, primary = false) {
  const url = credential.provider === "google"
    ? `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(primary ? "primary" : email)}/events?maxResults=1&timeMin=${encodeURIComponent(new Date().toISOString())}`
    : `https://graph.microsoft.com/v1.0/users/${encodeURIComponent(email)}/calendar/events?$top=1&$select=id`;
  await request(url, credential.provider, "calendar read access", { headers: { Authorization: `Bearer ${token}` } });
}
export async function discoverProviderRooms(credential: RoomCredential, reader: string): Promise<ConnectorRoom[]> {
  const token = await accessToken(credential, reader, true);
  const rooms: ConnectorRoom[] = [];
  let next: string | undefined = credential.provider === "google"
    ? "https://admin.googleapis.com/admin/directory/v1/customer/my_customer/resources/calendars?maxResults=100"
    : "https://graph.microsoft.com/v1.0/places/microsoft.graph.room?$top=100";
  // Bound pagination; never report a silently truncated inventory as complete.
  for (let page = 0; next && page < 20; page++) {
    const url = new URL(next);
    const expected = credential.provider === "google" ? "admin.googleapis.com" : "graph.microsoft.com";
    if (url.hostname !== expected || url.protocol !== "https:") throw new Error("The provider returned an invalid room-directory continuation.");
    const body = await request(next, credential.provider, "room discovery", { headers: { Authorization: `Bearer ${token}` } });
    const items: ProviderResponse[] = credential.provider === "google" ? body.items ?? [] : body.value ?? [];
    for (const room of items) {
      if (credential.provider === "google" && room.resourceCategory && room.resourceCategory !== "CONFERENCE_ROOM") continue;
      const email = credential.provider === "google" ? room.resourceEmail : room.emailAddress;
      if (typeof email !== "string" || !email.includes("@")) continue;
      rooms.push({ id: String(room.resourceId ?? room.id ?? email), name: String(room.resourceName ?? room.displayName ?? email), email, capacity: Number(room.capacity) || null, location: credential.provider === "google" ? [room.buildingId, room.floorName].filter(Boolean).join(" · ") : [room.building, room.floorLabel].filter(Boolean).join(" · ") });
    }
    next = credential.provider === "google"
      ? body.nextPageToken ? `https://admin.googleapis.com/admin/directory/v1/customer/my_customer/resources/calendars?maxResults=100&pageToken=${encodeURIComponent(body.nextPageToken)}` : undefined
      : body["@odata.nextLink"];
  }
  if (next) throw new Error("More than 2,000 rooms were found. Narrow the directory scope before importing rooms.");
  return rooms;
}