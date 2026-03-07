
-- Add missing columns to lancamentos
ALTER TABLE public.lancamentos 
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'finalizado',
  ADD COLUMN IF NOT EXISTS tipo text NOT NULL DEFAULT 'servico',
  ADD COLUMN IF NOT EXISTS descricao_resumo text,
  ADD COLUMN IF NOT EXISTS custo_pecas_compradas numeric(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS custo_pecas_fabricadas_estimado numeric(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS metodo_pagamento_secundario text,
  ADD COLUMN IF NOT EXISTS valor_pagamento_principal numeric(10,2),
  ADD COLUMN IF NOT EXISTS valor_pagamento_secundario numeric(10,2),
  ADD COLUMN IF NOT EXISTS hora_entrada timestamptz,
  ADD COLUMN IF NOT EXISTS hora_saida timestamptz,
  ADD COLUMN IF NOT EXISTS tempo_servico_minutos integer,
  ADD COLUMN IF NOT EXISTS ganho_por_hora numeric(10,2),
  ADD COLUMN IF NOT EXISTS transcricao_ia text;

ALTER TABLE public.lancamento_items
  ADD COLUMN IF NOT EXISTS posicao text DEFAULT 'geral',
  ADD COLUMN IF NOT EXISTS margem_percentual numeric(5,2);

ALTER TABLE public.filiais
  ADD COLUMN IF NOT EXISTS porcentagem_caixa numeric(5,2) DEFAULT 25.00;

ALTER TABLE public.despesas
  ADD COLUMN IF NOT EXISTS descricao text,
  ADD COLUMN IF NOT EXISTS socio_id uuid,
  ADD COLUMN IF NOT EXISTS registrado_por uuid,
  ADD COLUMN IF NOT EXISTS recorrente boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS data_despesa date DEFAULT current_date;

ALTER TABLE public.socios
  ADD COLUMN IF NOT EXISTS telefone text,
  ADD COLUMN IF NOT EXISTS email text,
  ADD COLUMN IF NOT EXISTS ativo boolean DEFAULT true;

ALTER TABLE public.socio_filiais
  ADD COLUMN IF NOT EXISTS porcentagem_lucro numeric(5,2) NOT NULL DEFAULT 0;

ALTER TABLE public.clientes
  ADD COLUMN IF NOT EXISTS cpf_cnpj text,
  ADD COLUMN IF NOT EXISTS observacoes text;

ALTER TABLE public.veiculos
  ADD COLUMN IF NOT EXISTS cor text;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS ativo boolean DEFAULT true;

-- funcionarios
CREATE TABLE IF NOT EXISTS public.funcionarios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  filial_id uuid REFERENCES public.filiais(id),
  nome text NOT NULL,
  cargo text,
  salario_semanal numeric(10,2),
  dia_pagamento text DEFAULT 'sabado',
  metodo_pagamento_preferido text,
  chave_pix text,
  ativo boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.funcionarios ENABLE ROW LEVEL SECURITY;
CREATE POLICY "funcionarios_select" ON public.funcionarios FOR SELECT TO authenticated USING (true);
CREATE POLICY "funcionarios_insert" ON public.funcionarios FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "funcionarios_update" ON public.funcionarios FOR UPDATE TO authenticated USING (true);
CREATE POLICY "funcionarios_delete" ON public.funcionarios FOR DELETE TO authenticated USING (true);

-- pagamentos_funcionarios
CREATE TABLE IF NOT EXISTS public.pagamentos_funcionarios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  funcionario_id uuid REFERENCES public.funcionarios(id) NOT NULL,
  filial_id uuid REFERENCES public.filiais(id) NOT NULL,
  valor numeric(10,2) NOT NULL,
  metodo_pagamento text NOT NULL,
  semana_referencia date NOT NULL,
  status text DEFAULT 'pago',
  valor_pendente numeric(10,2) DEFAULT 0,
  observacoes text,
  pago_por uuid,
  comprovante_url text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(funcionario_id, semana_referencia)
);
ALTER TABLE public.pagamentos_funcionarios ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pf_select" ON public.pagamentos_funcionarios FOR SELECT TO authenticated USING (true);
CREATE POLICY "pf_insert" ON public.pagamentos_funcionarios FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "pf_update" ON public.pagamentos_funcionarios FOR UPDATE TO authenticated USING (true);

-- fechamentos_diarios
CREATE TABLE IF NOT EXISTS public.fechamentos_diarios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  filial_id uuid REFERENCES public.filiais(id) NOT NULL,
  data date NOT NULL,
  total_servicos integer DEFAULT 0,
  receita_bruta numeric(10,2) DEFAULT 0,
  total_descontos numeric(10,2) DEFAULT 0,
  total_taxas_maquina numeric(10,2) DEFAULT 0,
  receita_liquida numeric(10,2) DEFAULT 0,
  custo_pecas_compradas numeric(10,2) DEFAULT 0,
  custo_pecas_fabricadas numeric(10,2) DEFAULT 0,
  total_despesas numeric(10,2) DEFAULT 0,
  lucro_bruto numeric(10,2) DEFAULT 0,
  lucro_liquido numeric(10,2) DEFAULT 0,
  valor_caixa_filial numeric(10,2) DEFAULT 0,
  valor_distribuir_socios numeric(10,2) DEFAULT 0,
  metodo_pagamento_breakdown jsonb,
  tempo_total_servicos_minutos integer,
  ganho_medio_por_hora numeric(10,2),
  fechado_por uuid,
  created_at timestamptz DEFAULT now(),
  UNIQUE(filial_id, data)
);
ALTER TABLE public.fechamentos_diarios ENABLE ROW LEVEL SECURITY;
CREATE POLICY "fd_select" ON public.fechamentos_diarios FOR SELECT TO authenticated USING (true);
CREATE POLICY "fd_insert" ON public.fechamentos_diarios FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "fd_update" ON public.fechamentos_diarios FOR UPDATE TO authenticated USING (true);

-- distribuicao_socios
CREATE TABLE IF NOT EXISTS public.distribuicao_socios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  fechamento_id uuid REFERENCES public.fechamentos_diarios(id),
  socio_id uuid REFERENCES public.socios(id),
  filial_id uuid REFERENCES public.filiais(id),
  porcentagem numeric(5,2),
  valor numeric(10,2),
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.distribuicao_socios ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ds_select" ON public.distribuicao_socios FOR SELECT TO authenticated USING (true);
CREATE POLICY "ds_insert" ON public.distribuicao_socios FOR INSERT TO authenticated WITH CHECK (true);

-- odb_conhecimento_pecas
CREATE TABLE IF NOT EXISTS public.odb_conhecimento_pecas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  descricao_normalizada text NOT NULL,
  veiculo_marca text,
  veiculo_modelo text,
  tipo text,
  valor_medio numeric(10,2),
  valor_minimo numeric(10,2),
  valor_maximo numeric(10,2),
  custo_medio numeric(10,2),
  margem_media numeric(5,2),
  total_lancamentos integer DEFAULT 0,
  updated_at timestamptz DEFAULT now(),
  UNIQUE(descricao_normalizada, veiculo_marca, veiculo_modelo)
);
ALTER TABLE public.odb_conhecimento_pecas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "okp_select" ON public.odb_conhecimento_pecas FOR SELECT TO authenticated USING (true);
CREATE POLICY "okp_insert" ON public.odb_conhecimento_pecas FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "okp_update" ON public.odb_conhecimento_pecas FOR UPDATE TO authenticated USING (true);

-- odb_conhecimento_servicos
CREATE TABLE IF NOT EXISTS public.odb_conhecimento_servicos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  descricao_normalizada text,
  veiculo_marca text,
  veiculo_modelo text,
  itens_comuns jsonb,
  valor_medio_total numeric(10,2),
  tempo_medio_minutos integer,
  total_lancamentos integer DEFAULT 0,
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.odb_conhecimento_servicos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "oks_select" ON public.odb_conhecimento_servicos FOR SELECT TO authenticated USING (true);
CREATE POLICY "oks_insert" ON public.odb_conhecimento_servicos FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "oks_update" ON public.odb_conhecimento_servicos FOR UPDATE TO authenticated USING (true);

-- odb_sinonimos
CREATE TABLE IF NOT EXISTS public.odb_sinonimos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  termo_digitado text NOT NULL UNIQUE,
  termo_correto text NOT NULL,
  categoria text,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.odb_sinonimos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "os_select" ON public.odb_sinonimos FOR SELECT TO authenticated USING (true);
CREATE POLICY "os_insert" ON public.odb_sinonimos FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "os_update" ON public.odb_sinonimos FOR UPDATE TO authenticated USING (true);

-- odb_clientes_contexto
CREATE TABLE IF NOT EXISTS public.odb_clientes_contexto (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id uuid REFERENCES public.clientes(id),
  veiculo_id uuid REFERENCES public.veiculos(id),
  ultimo_servico_data timestamptz,
  servicos_frequentes jsonb,
  preferencia_pagamento text,
  observacoes_ia text,
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.odb_clientes_contexto ENABLE ROW LEVEL SECURITY;
CREATE POLICY "occ_select" ON public.odb_clientes_contexto FOR SELECT TO authenticated USING (true);
CREATE POLICY "occ_insert" ON public.odb_clientes_contexto FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "occ_update" ON public.odb_clientes_contexto FOR UPDATE TO authenticated USING (true);

-- configuracoes
CREATE TABLE IF NOT EXISTS public.configuracoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chave text UNIQUE NOT NULL,
  valor text NOT NULL,
  descricao text,
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.configuracoes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cfg_select" ON public.configuracoes FOR SELECT TO authenticated USING (true);
CREATE POLICY "cfg_insert" ON public.configuracoes FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "cfg_update" ON public.configuracoes FOR UPDATE TO authenticated USING (true);

-- notificacoes
CREATE TABLE IF NOT EXISTS public.notificacoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  tipo text NOT NULL,
  titulo text NOT NULL,
  mensagem text NOT NULL,
  dados jsonb,
  lida boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.notificacoes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "notif_select" ON public.notificacoes FOR SELECT TO authenticated USING (user_id = auth.uid() OR user_id IS NULL);
CREATE POLICY "notif_insert" ON public.notificacoes FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "notif_update" ON public.notificacoes FOR UPDATE TO authenticated USING (user_id = auth.uid() OR user_id IS NULL);

-- custos_fixos
CREATE TABLE IF NOT EXISTS public.custos_fixos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  filial_id uuid REFERENCES public.filiais(id),
  descricao text NOT NULL,
  valor numeric(10,2) NOT NULL,
  categoria text,
  dia_lancamento integer DEFAULT 5,
  ativo boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.custos_fixos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cf_select" ON public.custos_fixos FOR SELECT TO authenticated USING (true);
CREATE POLICY "cf_insert" ON public.custos_fixos FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "cf_update" ON public.custos_fixos FOR UPDATE TO authenticated USING (true);
CREATE POLICY "cf_delete" ON public.custos_fixos FOR DELETE TO authenticated USING (true);

-- Seed synonyms
INSERT INTO public.odb_sinonimos (termo_digitado, termo_correto, categoria) VALUES
  ('buxa', 'bucha', 'peca'),
  ('corola', 'Corolla', 'veiculo'),
  ('cx direcao', 'caixa de direção', 'peca'),
  ('amort', 'amortecedor', 'peca'),
  ('din', 'dinheiro', 'pagamento'),
  ('deb', 'débito', 'pagamento'),
  ('cred', 'crédito', 'pagamento'),
  ('pastilha', 'pastilha de freio', 'peca'),
  ('terminal', 'terminal de direção', 'peca'),
  ('pivo', 'pivô', 'peca'),
  ('hb20', 'HB20', 'veiculo'),
  ('hilux', 'Hilux', 'veiculo'),
  ('gol', 'Gol', 'veiculo')
ON CONFLICT (termo_digitado) DO NOTHING;
