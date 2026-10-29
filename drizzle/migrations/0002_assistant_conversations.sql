CREATE TABLE public.assistant_threads (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 owner_id uuid NOT NULL,
 title text NOT NULL DEFAULT 'New conversation',
 messages jsonb NOT NULL DEFAULT '[]'::jsonb,
 created_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.assistant_threads TO authenticated;
GRANT ALL ON public.assistant_threads TO service_role;
ALTER TABLE public.assistant_threads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners read conversations" ON public.assistant_threads FOR SELECT TO authenticated USING (owner_id = auth.uid());
CREATE POLICY "Owners create conversations" ON public.assistant_threads FOR INSERT TO authenticated WITH CHECK (owner_id = auth.uid());
CREATE POLICY "Owners update conversations" ON public.assistant_threads FOR UPDATE TO authenticated USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());
CREATE POLICY "Owners delete conversations" ON public.assistant_threads FOR DELETE TO authenticated USING (owner_id = auth.uid());
CREATE INDEX assistant_threads_owner_updated ON public.assistant_threads(owner_id, updated_at DESC);
CREATE TABLE public.assistant_access_blocks (
 id text PRIMARY KEY,
 status integer NOT NULL,
 reason text NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.assistant_access_blocks TO service_role;
ALTER TABLE public.assistant_access_blocks ENABLE ROW LEVEL SECURITY;