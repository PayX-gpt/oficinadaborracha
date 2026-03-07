
-- Notas fiscais de peças recebidas
CREATE TABLE public.notas_fiscais_pecas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  data_recebimento DATE NOT NULL DEFAULT CURRENT_DATE,
  fornecedor TEXT,
  numero_nota TEXT,
  valor_total NUMERIC NOT NULL DEFAULT 0,
  observacoes TEXT,
  filial_id UUID REFERENCES public.filiais(id),
  registrado_por UUID,
  status TEXT NOT NULL DEFAULT 'pendente'
);

-- Itens da nota fiscal
CREATE TABLE public.nota_fiscal_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nota_fiscal_id UUID NOT NULL REFERENCES public.notas_fiscais_pecas(id) ON DELETE CASCADE,
  descricao TEXT NOT NULL,
  quantidade INTEGER NOT NULL DEFAULT 1,
  valor_unitario NUMERIC NOT NULL DEFAULT 0,
  valor_total NUMERIC NOT NULL DEFAULT 0,
  lancamento_id UUID REFERENCES public.lancamentos(id),
  veiculo_id UUID REFERENCES public.veiculos(id),
  veiculo_desc TEXT,
  status TEXT NOT NULL DEFAULT 'pendente',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Solicitações de peças para carros na oficina
CREATE TABLE public.solicitacoes_pecas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lancamento_id UUID REFERENCES public.lancamentos(id),
  veiculo_desc TEXT,
  placa TEXT,
  itens JSONB NOT NULL DEFAULT '[]'::jsonb,
  status TEXT NOT NULL DEFAULT 'pendente',
  observacoes TEXT,
  solicitado_por UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  atendida_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE public.notas_fiscais_pecas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nota_fiscal_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.solicitacoes_pecas ENABLE ROW LEVEL SECURITY;

-- RLS policies for notas_fiscais_pecas
CREATE POLICY "nfp_select" ON public.notas_fiscais_pecas FOR SELECT TO authenticated USING (true);
CREATE POLICY "nfp_insert" ON public.notas_fiscais_pecas FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "nfp_update" ON public.notas_fiscais_pecas FOR UPDATE TO authenticated USING (true);
CREATE POLICY "nfp_delete" ON public.notas_fiscais_pecas FOR DELETE TO authenticated USING (true);

-- RLS policies for nota_fiscal_items
CREATE POLICY "nfi_select" ON public.nota_fiscal_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "nfi_insert" ON public.nota_fiscal_items FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "nfi_update" ON public.nota_fiscal_items FOR UPDATE TO authenticated USING (true);
CREATE POLICY "nfi_delete" ON public.nota_fiscal_items FOR DELETE TO authenticated USING (true);

-- RLS policies for solicitacoes_pecas
CREATE POLICY "sp_select" ON public.solicitacoes_pecas FOR SELECT TO authenticated USING (true);
CREATE POLICY "sp_insert" ON public.solicitacoes_pecas FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "sp_update" ON public.solicitacoes_pecas FOR UPDATE TO authenticated USING (true);
