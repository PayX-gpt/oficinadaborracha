
CREATE TABLE public.taxas_maquina (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  metodo text NOT NULL UNIQUE,
  taxa_percentual numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.taxas_maquina ENABLE ROW LEVEL SECURITY;

CREATE POLICY "taxas_select" ON public.taxas_maquina FOR SELECT TO authenticated USING (true);
CREATE POLICY "taxas_insert" ON public.taxas_maquina FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "taxas_update" ON public.taxas_maquina FOR UPDATE TO authenticated USING (true);
CREATE POLICY "taxas_delete" ON public.taxas_maquina FOR DELETE TO authenticated USING (true);

INSERT INTO public.taxas_maquina (metodo, taxa_percentual) VALUES
  ('PIX', 0),
  ('Dinheiro', 0),
  ('Débito', 1.5),
  ('Crédito 1x', 2.5),
  ('Crédito 2x', 3.5),
  ('Crédito 3x', 4.5);
