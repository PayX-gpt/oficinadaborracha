
-- Add missing CRUD policies for settings management
CREATE POLICY "filiais_insert" ON public.filiais FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "filiais_update" ON public.filiais FOR UPDATE TO authenticated USING (true);
CREATE POLICY "filiais_delete" ON public.filiais FOR DELETE TO authenticated USING (true);

CREATE POLICY "socios_insert" ON public.socios FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "socios_update" ON public.socios FOR UPDATE TO authenticated USING (true);
CREATE POLICY "socios_delete" ON public.socios FOR DELETE TO authenticated USING (true);

CREATE POLICY "retiradas_insert" ON public.retiradas FOR INSERT TO authenticated WITH CHECK (true);
