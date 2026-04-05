-- ============================================
-- ODB Sistema - Tabelas Iniciais
-- Oficina da Borracha
-- ============================================

-- Clientes
CREATE TABLE IF NOT EXISTS clientes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nome VARCHAR(255) NOT NULL,
  cpf_cnpj VARCHAR(18) UNIQUE,
  telefone VARCHAR(20),
  email VARCHAR(255),
  endereco TEXT,
  cidade VARCHAR(100),
  estado VARCHAR(2),
  cep VARCHAR(10),
  observacoes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Veiculos
CREATE TABLE IF NOT EXISTS veiculos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  cliente_id UUID NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
  placa VARCHAR(10) NOT NULL,
  marca VARCHAR(100),
  modelo VARCHAR(100),
  ano INTEGER,
  cor VARCHAR(50),
  km_atual INTEGER,
  observacoes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Servicos (catálogo de serviços)
CREATE TABLE IF NOT EXISTS servicos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nome VARCHAR(255) NOT NULL,
  descricao TEXT,
  preco_base DECIMAL(10, 2) NOT NULL DEFAULT 0,
  tempo_estimado_min INTEGER,
  ativo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ordens de Serviço
CREATE TABLE IF NOT EXISTS ordens_servico (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  numero SERIAL,
  cliente_id UUID NOT NULL REFERENCES clientes(id),
  veiculo_id UUID NOT NULL REFERENCES veiculos(id),
  status VARCHAR(30) DEFAULT 'aberta' CHECK (status IN ('aberta', 'em_andamento', 'aguardando_peca', 'finalizada', 'cancelada')),
  km_entrada INTEGER,
  diagnostico TEXT,
  observacoes TEXT,
  valor_total DECIMAL(10, 2) DEFAULT 0,
  desconto DECIMAL(10, 2) DEFAULT 0,
  forma_pagamento VARCHAR(50),
  data_entrada TIMESTAMPTZ DEFAULT NOW(),
  data_previsao TIMESTAMPTZ,
  data_conclusao TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Itens da Ordem de Serviço
CREATE TABLE IF NOT EXISTS itens_ordem (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ordem_id UUID NOT NULL REFERENCES ordens_servico(id) ON DELETE CASCADE,
  servico_id UUID REFERENCES servicos(id),
  descricao VARCHAR(255) NOT NULL,
  quantidade INTEGER DEFAULT 1,
  valor_unitario DECIMAL(10, 2) NOT NULL,
  valor_total DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Financeiro (entradas e saídas)
CREATE TABLE IF NOT EXISTS financeiro (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tipo VARCHAR(10) NOT NULL CHECK (tipo IN ('entrada', 'saida')),
  categoria VARCHAR(100),
  descricao VARCHAR(255) NOT NULL,
  valor DECIMAL(10, 2) NOT NULL,
  ordem_id UUID REFERENCES ordens_servico(id),
  data_vencimento DATE,
  data_pagamento DATE,
  status VARCHAR(20) DEFAULT 'pendente' CHECK (status IN ('pendente', 'pago', 'atrasado', 'cancelado')),
  forma_pagamento VARCHAR(50),
  observacoes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_veiculos_cliente ON veiculos(cliente_id);
CREATE INDEX IF NOT EXISTS idx_veiculos_placa ON veiculos(placa);
CREATE INDEX IF NOT EXISTS idx_ordens_cliente ON ordens_servico(cliente_id);
CREATE INDEX IF NOT EXISTS idx_ordens_veiculo ON ordens_servico(veiculo_id);
CREATE INDEX IF NOT EXISTS idx_ordens_status ON ordens_servico(status);
CREATE INDEX IF NOT EXISTS idx_itens_ordem ON itens_ordem(ordem_id);
CREATE INDEX IF NOT EXISTS idx_financeiro_tipo ON financeiro(tipo);
CREATE INDEX IF NOT EXISTS idx_financeiro_status ON financeiro(status);
CREATE INDEX IF NOT EXISTS idx_financeiro_data_vencimento ON financeiro(data_vencimento);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_clientes_updated_at BEFORE UPDATE ON clientes FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_veiculos_updated_at BEFORE UPDATE ON veiculos FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_ordens_updated_at BEFORE UPDATE ON ordens_servico FOR EACH ROW EXECUTE FUNCTION update_updated_at();
