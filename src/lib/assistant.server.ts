import { createClient } from "@supabase/supabase-js";
import { convertToModelMessages, validateUIMessages, type UIMessage } from "ai";
import { z } from "zod";
import type { Database, Json } from "@/integrations/supabase/types";
import { ownsConversation, conversationTitle } from "./assistant-policy";
import { createResponsesCall } from "./assistant/responses.server.ts";
import { withLovableAiGatewayRunIdHeader } from "./assistant/run-id.server.ts";

const instructions = `You are Relay, the digital signage CMS assistant. Be concise, useful and practical. Help operators draft screen copy, structure layouts and playlists, troubleshoot playback, plan schedules, and configure meeting-room calendars. You have no live screen telemetry, workspace files, calendar access or deployment tools. Never invent account records, screen status, licences or successful actions. Ask for relevant details when needed. Clearly distinguish guidance and drafts from executed changes. This CMS supports layouts, media, playlists, screens, schedules, partners, settings, and meeting-room designs Atelier, Panorama, Signal, Prism, Orbit, Vector, Tempo and Meridian. Meeting-room calendars support Microsoft 365 and Google Workspace. Publishing uses a Where to publish dialog combining screens, groups and sites with deduplicated totals; delivery remains a demo. Partners cannot issue licences: PO request then vendor approval. Never expose partner margins. Room signage uses explicit Available, Starting soon, In a meeting statuses; no check-in or search, but information and timetable controls are permitted. Do not claim to have changed any CMS content.`;

const fail = (message: string, status: number) => new Response(message, { status, headers: { "Content-Type": "text/plain", "Cache-Control": "no-store" } });

export async function handleAssistant(request: Request): Promise<Response> {
  try {
    const origin = request.headers.get("origin");
    if (origin && origin !== new URL(request.url).origin) return fail("This request is not allowed.", 403);
    const url = process.env['SUPABASE_URL'];
    const key = process.env['SUPABASE_PUBLISHABLE_KEY'];
    const aiKey = process.env['LOVABLE_API_KEY'];
    if (!url || !key || !aiKey) return fail("The assistant is not configured yet.", 401);
    const authorization = request.headers.get("authorization");
    if (!authorization?.startsWith("Bearer ")) return fail("Sign in to chat with Relay.", 401);
    const token = authorization.slice(7);
    const client = createClient<Database>(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: { headers: { Authorization: authorization }, fetch: (input, init) => {
        const headers = new Headers(init?.headers);
        headers.set("apikey", key);
        if (headers.get("Authorization") === `Bearer ${key}`) headers.delete("Authorization");
        return fetch(input, { ...init, headers });
      } },
    });
    const { data: auth, error: authError } = await client.auth.getUser(token);
    if (authError || !auth.user) return fail("Your session has ended. Sign in again.", 401);
    const body = z.object({ threadId: z.string().uuid(), messages: z.array(z.unknown()).min(1) }).parse(await request.json());
    const { data: thread, error } = await client.from("assistant_threads").select("id,owner_id,title,messages").eq("id", body.threadId).eq("owner_id", auth.user.id).single();
    if (error || !thread || !ownsConversation(thread.owner_id, auth.user.id)) return fail("This conversation is unavailable.", 404);
    // The server transcript is authoritative; accept only the new user message.
    const incoming = await validateUIMessages({ messages: body.messages });
    const latest = incoming.at(-1);
    if (!latest || latest.role !== "user" || !latest.parts.some(part => part.type === "text" && part.text.trim())) return fail("Enter a message to continue.", 400);
    const previous = await validateUIMessages({ messages: thread.messages as unknown[] });
    const messages: UIMessage[] = previous.some(message => message.id === latest.id) ? previous : [...previous, latest];
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: block, error: blockError } = await supabaseAdmin.from("assistant_access_blocks").select("status,reason").eq("id", "provider:openai").maybeSingle();
    if (blockError) return fail("Assistant availability could not be checked.", 503);
    if (block) return fail(block.reason, block.status);
    const text = latest.parts.filter(p => p.type === "text").map(p => p.text).join(" ");
    const { error: saveError } = await client.from("assistant_threads").update({ messages: messages as unknown as Json, title: thread.title === "New conversation" ? conversationTitle(text) : thread.title, updated_at: new Date().toISOString() }).eq("id", thread.id).eq("owner_id", auth.user.id);
    if (saveError) return fail("Your message could not be saved. Please try again.", 500);
    let upstreamFailure: { status: number; message: string } | undefined;
    const call = createResponsesCall(request, {
      baseURL: "https://ai.gateway.lovable.dev/v1", apiKey: aiKey, model: "openai/gpt-6-astra",
      onResponse: async response => {
        if (response.ok) return;
        const raw = await response.clone().text();
        let message = "The AI service is temporarily unavailable.";
        let type = "";
        try { const payload = JSON.parse(raw); message = payload.message ?? payload.error?.message ?? message; type = payload.type ?? payload.error?.type ?? ""; } catch { /* Do not forward unknown upstream bodies. */ }
        upstreamFailure = { status: response.status, message };
        if (response.status === 403 && !["credit_limit_reached", "ai_disabled", "provider_not_available_in_region", "model_requires_retention_consent", "model_vendor_not_enabled"].includes(type)) {
          const { error: persistError } = await supabaseAdmin.from("assistant_access_blocks").upsert({ id: "provider:openai", status: 403, reason: message });
          if (persistError) throw new Error("Could not record assistant access restriction.");
        }
      },
    }, await convertToModelMessages(messages), instructions);
    const response = await withLovableAiGatewayRunIdHeader(call.result.toUIMessageStreamResponse({
      originalMessages: messages, sendReasoning: true,
      onError: error => error instanceof Error ? error.message : "The answer could not be completed.",
      onFinish: async ({ messages: completed }) => {
        const { error: persistError } = await client.from("assistant_threads").update({ messages: completed as unknown as Json, updated_at: new Date().toISOString() }).eq("id", thread.id).eq("owner_id", auth.user.id);
        if (persistError) throw new Error("Your answer could not be saved. Keep this page open and copy the answer.");
      },
    }), { getRunId: () => undefined, waitForRunId: async () => undefined }, { "Cache-Control": "no-store" }, { waitForUpstreamHeaders: false });
    // The Responses helper starts its upstream call eagerly; the SDK streams safe failures.
    if (upstreamFailure) return fail(upstreamFailure.message, upstreamFailure.status);
    return response;
  } catch (error) {
    if (request.signal.aborted) return fail("Stopped.", 499);
    if (error instanceof z.ZodError) return fail("The conversation request is invalid.", 400);
    return fail(error instanceof Error ? error.message : "The assistant could not respond.", 500);
  }
}