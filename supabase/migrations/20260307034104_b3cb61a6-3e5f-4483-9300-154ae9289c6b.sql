
-- Allow admin to delete fechamentos_diarios (reopen)
CREATE POLICY "fd_delete" ON public.fechamentos_diarios FOR DELETE TO authenticated USING (true);

-- Allow admin to delete distribuicao_socios (when reopening)
CREATE POLICY "ds_delete" ON public.distribuicao_socios FOR DELETE TO authenticated USING (true);
