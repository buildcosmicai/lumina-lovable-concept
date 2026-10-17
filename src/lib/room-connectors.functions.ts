import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { roomCredentialSchema, serviceAccountSchema, type ConnectorRoom, type RoomConnection } from "./room-connectors";

export const listRoomConnections = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).handler(async ({ context }) => {
  const { data, error } = await context.supabase.from("room_connections").select("*").order("created_at", { ascending: false });
  if (error) throw new Error("Could not load your room connections.");
  return (data ?? []) as unknown as RoomConnection[];
});

export const saveRoomConnection = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth])
  .inputValidator(input => z.object({ id: z.string().uuid().optional(), name: z.string().trim().min(1).max(100), readerEmail: z.string().email(), credential: roomCredentialSchema }).parse(input))
  .handler(async ({ data, context }) => {
    const secret = process.env['ROOM_CONNECTOR_ENCRYPTION_SECRET'];
    if (!secret) throw new Error("Secure credential storage is not ready. Please try again later.");
    if (data.credential.provider === "google") {
      try { serviceAccountSchema.parse(JSON.parse(data.credential.keyJson)); }
      catch { throw new Error("Upload a valid Google service-account JSON containing type, client_email, client_id and private_key."); }
    }
    if (data.id) {
      const { data: existing } = await context.supabase.from("room_connections").select("id,provider").eq("id", data.id).single();
      if (!existing || existing.provider !== data.credential.provider) throw new Error("This connection is not available in your account.");
    }
    const { sealCredential } = await import("./room-connectors.server");
    const ciphertext = sealCredential(data.credential, secret);
    const values = { name: data.name, provider: data.credential.provider, reader_email: data.readerEmail, status: "unverified", last_error: null, verified_at: null, user_id: context.userId };
    const result = data.id
      ? await context.supabase.from("room_connections").update(values).eq("id", data.id).select("id").single()
      : await context.supabase.from("room_connections").insert(values).select("id").single();
    if (result.error || !result.data) throw new Error("Could not save the connection.");
    // The owner was established through RLS above; only encrypted credentials use privileged storage.
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("room_connection_credentials").upsert({ connection_id: result.data.id, user_id: context.userId, ciphertext, updated_at: new Date().toISOString() });
    if (error) {
      if (!data.id) await context.supabase.from("room_connections").delete().eq("id", result.data.id);
      throw new Error("Could not store the credential securely. Please try again.");
    }
    return { id: result.data.id };
  });

export const roomConnectionAction = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth])
  .inputValidator(input => z.object({ id: z.string().uuid(), action: z.enum(["verify", "discover", "select", "remove"]), roomIds: z.array(z.string()).optional() }).parse(input))
  .handler(async ({ data, context }) => {
    const { data: connection, error } = await context.supabase.from("room_connections").select("*").eq("id", data.id).single();
    if (error || !connection) throw new Error("This connection is not available in your account.");
    if (data.action === "remove") {
      const { error: removalError } = await context.supabase.from("room_connections").delete().eq("id", data.id);
      if (removalError) throw new Error("Could not remove the connection.");
      return { ok: true, rooms: [] as ConnectorRoom[], message: "Connection and stored credentials removed." };
    }
    const secret = process.env['ROOM_CONNECTOR_ENCRYPTION_SECRET'];
    if (!secret) throw new Error("Secure credential storage is not ready.");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: stored } = await supabaseAdmin.from("room_connection_credentials").select("ciphertext").eq("connection_id", data.id).eq("user_id", context.userId).single();
    if (!stored) throw new Error("No credential is stored. Replace the key and verify again.");
    const { openCredential, accessToken, checkCalendar, discoverProviderRooms } = await import("./room-connectors.server");
    let credential;
    try { credential = roomCredentialSchema.parse(openCredential(stored.ciphertext, secret)); }
    catch { throw new Error("The stored credential could not be opened. Replace it and verify again."); }
    try {
      const rooms = await discoverProviderRooms(credential, connection.reader_email);
      if (data.action === "discover") return { ok: true, rooms, message: rooms.length ? `${rooms.length} rooms discovered.` : "Connected to the directory, but no room resources were found." };
      const selected = data.action === "select" ? rooms.filter(room => data.roomIds?.includes(room.id)) : (connection.rooms as unknown as ConnectorRoom[]);
      if (data.action === "select" && (new Set(data.roomIds).size !== selected.length)) throw new Error("The selected rooms changed in the directory. Discover rooms again.");
      const token = await accessToken(credential, connection.reader_email);
      // Verify a real calendar read, not just token issuance or directory access.
      if (!selected.length) await checkCalendar(credential, token, connection.reader_email, credential.provider === "google");
      for (const room of selected) {
        try { await checkCalendar(credential, token, room.email); }
        catch (problem) { throw new Error(`${room.name}: ${problem instanceof Error ? problem.message : "Calendar access could not be verified."}`); }
      }
      const update = { status: "connected", last_error: null, verified_at: new Date().toISOString(), ...(data.action === "select" ? { rooms: selected } : {}) };
      const { error: updateError } = await context.supabase.from("room_connections").update(update).eq("id", data.id);
      if (updateError) throw new Error("Verification succeeded but its result could not be saved.");
      return { ok: true, rooms, message: data.action === "select" ? `${selected.length} managed rooms saved; calendar access verified.` : "Connected. Directory and calendar read access verified." };
    } catch (problem) {
      const message = problem instanceof Error ? problem.message : "Verification failed. Check the provider setup.";
      await context.supabase.from("room_connections").update({ status: "error", last_error: message }).eq("id", data.id);
      return { ok: false, rooms: [] as ConnectorRoom[], message };
    }
  });