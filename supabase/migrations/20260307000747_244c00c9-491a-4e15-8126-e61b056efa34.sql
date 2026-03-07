
-- =============================================
-- FASE 2: Schema completo Oficina da Borracha
-- =============================================

-- 1. Filiais
CREATE TABLE public.filiais (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  endereco TEXT,
  telefone TEXT,
  ativa BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.filiais ENABLE ROW LEVEL SECURITY;

-- 2. Profiles (linked to auth.users)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT NOT NULL DEFAULT '',
  email TEXT,
  role TEXT NOT NULL DEFAULT 'operador',
  filial_id UUID REFERENCES public.filiais(id),
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 3. Clientes
CREATE TABLE public.clientes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  telefone TEXT,
  email TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;

-- 4. Veículos
CREATE TABLE public.veiculos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id UUID REFERENCES public.clientes(id) ON DELETE CASCADE,
  marca TEXT NOT NULL DEFAULT '',
  modelo TEXT NOT NULL DEFAULT '',
  ano TEXT,
  placa TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.veiculos ENABLE ROW LEVEL SECURITY;

-- 5. Lançamentos (serviços)
CREATE TABLE public.lancamentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  filial_id UUID REFERENCES public.filiais(id),
  cliente_id UUID REFERENCES public.clientes(id),
  veiculo_id UUID REFERENCES public.veiculos(id),
  cliente_nome TEXT,
  veiculo_desc TEXT,
  placa TEXT,
  fonte TEXT NOT NULL DEFAULT 'manual',
  metodo_pagamento TEXT,
  valor_bruto NUMERIC(12,2) NOT NULL DEFAULT 0,
  custo_total NUMERIC(12,2) NOT NULL DEFAULT 0,
  desconto NUMERIC(12,2) NOT NULL DEFAULT 0,
  taxa_percentual NUMERIC(5,2) NOT NULL DEFAULT 0,
  taxa_valor NUMERIC(12,2) NOT NULL DEFAULT 0,
  valor_liquido NUMERIC(12,2) NOT NULL DEFAULT 0,
  lucro NUMERIC(12,2) NOT NULL DEFAULT 0,
  observacoes TEXT,
  foto_url TEXT,
  audio_url TEXT,
  ai_data JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.lancamentos ENABLE ROW LEVEL SECURITY;

-- Enable realtime for lancamentos
ALTER PUBLICATION supabase_realtime ADD TABLE public.lancamentos;

-- 6. Itens do lançamento
CREATE TABLE public.lancamento_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lancamento_id UUID NOT NULL REFERENCES public.lancamentos(id) ON DELETE CASCADE,
  descricao TEXT NOT NULL DEFAULT '',
  tipo TEXT NOT NULL DEFAULT 'mao_de_obra',
  valor_cobrado NUMERIC(12,2) NOT NULL DEFAULT 0,
  custo NUMERIC(12,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.lancamento_items ENABLE ROW LEVEL SECURITY;

-- 7. Despesas
CREATE TABLE public.despesas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  filial_id UUID REFERENCES public.filiais(id),
  categoria TEXT NOT NULL,
  subcategoria TEXT,
  valor NUMERIC(12,2) NOT NULL,
  pago_por TEXT,
  metodo_pagamento TEXT,
  comprovante_url TEXT,
  observacoes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.despesas ENABLE ROW LEVEL SECURITY;

-- Enable realtime for despesas
ALTER PUBLICATION supabase_realtime ADD TABLE public.despesas;

-- 8. Sócios
CREATE TABLE public.socios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  percentual_lucro NUMERIC(5,2) NOT NULL DEFAULT 0,
  user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.socios ENABLE ROW LEVEL SECURITY;

-- 9. Sócio-Filial (many-to-many)
CREATE TABLE public.socio_filiais (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  socio_id UUID NOT NULL REFERENCES public.socios(id) ON DELETE CASCADE,
  filial_id UUID NOT NULL REFERENCES public.filiais(id) ON DELETE CASCADE,
  UNIQUE(socio_id, filial_id)
);

ALTER TABLE public.socio_filiais ENABLE ROW LEVEL SECURITY;

-- 10. Retiradas de sócios
CREATE TABLE public.retiradas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  socio_id UUID NOT NULL REFERENCES public.socios(id) ON DELETE CASCADE,
  valor NUMERIC(12,2) NOT NULL,
  descricao TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.retiradas ENABLE ROW LEVEL SECURITY;

-- =============================================
-- RLS POLICIES
-- =============================================

-- Filiais: authenticated users can read
CREATE POLICY "filiais_select" ON public.filiais FOR SELECT TO authenticated USING (true);

-- Profiles: users can read all, update own
CREATE POLICY "profiles_select" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE TO authenticated USING (id = auth.uid());
CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT TO authenticated WITH CHECK (id = auth.uid());

-- Clientes: authenticated can CRUD
CREATE POLICY "clientes_select" ON public.clientes FOR SELECT TO authenticated USING (true);
CREATE POLICY "clientes_insert" ON public.clientes FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "clientes_update" ON public.clientes FOR UPDATE TO authenticated USING (true);

-- Veiculos: authenticated can CRUD
CREATE POLICY "veiculos_select" ON public.veiculos FOR SELECT TO authenticated USING (true);
CREATE POLICY "veiculos_insert" ON public.veiculos FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "veiculos_update" ON public.veiculos FOR UPDATE TO authenticated USING (true);

-- Lancamentos: authenticated can CRUD
CREATE POLICY "lancamentos_select" ON public.lancamentos FOR SELECT TO authenticated USING (true);
CREATE POLICY "lancamentos_insert" ON public.lancamentos FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "lancamentos_update" ON public.lancamentos FOR UPDATE TO authenticated USING (user_id = auth.uid());
CREATE POLICY "lancamentos_delete" ON public.lancamentos FOR DELETE TO authenticated USING (user_id = auth.uid());

-- Lancamento items: authenticated can CRUD
CREATE POLICY "items_select" ON public.lancamento_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "items_insert" ON public.lancamento_items FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "items_update" ON public.lancamento_items FOR UPDATE TO authenticated USING (true);
CREATE POLICY "items_delete" ON public.lancamento_items FOR DELETE TO authenticated USING (true);

-- Despesas: authenticated can CRUD
CREATE POLICY "despesas_select" ON public.despesas FOR SELECT TO authenticated USING (true);
CREATE POLICY "despesas_insert" ON public.despesas FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "despesas_update" ON public.despesas FOR UPDATE TO authenticated USING (user_id = auth.uid());
CREATE POLICY "despesas_delete" ON public.despesas FOR DELETE TO authenticated USING (user_id = auth.uid());

-- Socios: authenticated can read
CREATE POLICY "socios_select" ON public.socios FOR SELECT TO authenticated USING (true);

-- Socio filiais: authenticated can read
CREATE POLICY "socio_filiais_select" ON public.socio_filiais FOR SELECT TO authenticated USING (true);

-- Retiradas: authenticated can read
CREATE POLICY "retiradas_select" ON public.retiradas FOR SELECT TO authenticated USING (true);

-- =============================================
-- TRIGGER: Auto-create profile on signup
-- =============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, nome, email, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nome', NEW.email),
    NEW.email,
    'operador'
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
