import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

export const listAssistantThreads = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("assistant_threads")
      .select("id,title,updated_at")
      .eq("owner_id", context.userId)
      .order("updated_at", { ascending: false });
    if (error) throw new Error("Your conversations could not be loaded.");
    return data;
  });

export const getAssistantThread = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { data: thread, error } = await context.supabase
      .from("assistant_threads")
      .select("id,title,messages")
      .eq("id", data.id)
      .eq("owner_id", context.userId)
      .single();
    if (error || !thread) throw new Error("This conversation is unavailable.");
    return thread;
  });

export const createAssistantThread = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("assistant_threads")
      .insert({ owner_id: context.userId })
      .select("id")
      .single();
    if (error || !data) throw new Error("The conversation could not be created.");
    return data;
  });

export const editAssistantThread = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        action: z.enum(["rename", "delete"]),
        title: z.string().trim().min(1).max(120).optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    if (data.action === "rename" && !data.title) throw new Error("Enter a conversation name.");
    const query =
      data.action === "delete"
        ? context.supabase.from("assistant_threads").delete()
        : context.supabase
            .from("assistant_threads")
            .update({
              title: data.title ?? "New conversation",
              updated_at: new Date().toISOString(),
            });
    const { error } = await query.eq("id", data.id).eq("owner_id", context.userId);
    if (error) throw new Error("The conversation could not be updated.");
    return { ok: true };
  });
