ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'categories' AND policyname = 'Enable public read access for categories'
    ) THEN
        CREATE POLICY "Enable public read access for categories"
        ON "public"."categories"
        FOR SELECT USING (true);
    END IF;
END
$$;
