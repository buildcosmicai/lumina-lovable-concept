CREATE TABLE public.room_connections (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 user_id uuid NOT NULL,
 provider text NOT NULL CHECK (provider IN ('google','microsoft')),
 name text NOT NULL CHECK (char_length(name) BETWEEN 1 AND 100),
 reader_email text NOT NULL,
 status text NOT NULL DEFAULT 'unverified' CHECK (status IN ('unverified','connected','error')),
 last_error text,
 verified_at timestamptz,
 rooms jsonb NOT NULL DEFAULT '[]'::jsonb,
 created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.room_connections TO authenticated;
GRANT ALL ON public.room_connections TO service_role;
ALTER TABLE public.room_connections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners manage room connections" ON public.room_connections FOR ALL TO authenticated USING (user_id = (SELECT auth.uid())) WITH CHECK (user_id = (SELECT auth.uid()));
CREATE TABLE public.room_connection_credentials (
 connection_id uuid PRIMARY KEY REFERENCES public.room_connections(id) ON DELETE CASCADE,
 user_id uuid NOT NULL,
 ciphertext text NOT NULL,
 updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.room_connection_credentials TO service_role;
ALTER TABLE public.room_connection_credentials ENABLE ROW LEVEL SECURITY;
COMMENT ON TABLE public.room_connection_credentials IS 'Server-only encrypted provider credentials; no browser or authenticated grants.';