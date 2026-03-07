export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      clientes: {
        Row: {
          cpf_cnpj: string | null
          created_at: string
          created_by: string | null
          email: string | null
          id: string
          nome: string
          observacoes: string | null
          telefone: string | null
        }
        Insert: {
          cpf_cnpj?: string | null
          created_at?: string
          created_by?: string | null
          email?: string | null
          id?: string
          nome: string
          observacoes?: string | null
          telefone?: string | null
        }
        Update: {
          cpf_cnpj?: string | null
          created_at?: string
          created_by?: string | null
          email?: string | null
          id?: string
          nome?: string
          observacoes?: string | null
          telefone?: string | null
        }
        Relationships: []
      }
      configuracoes: {
        Row: {
          chave: string
          descricao: string | null
          id: string
          updated_at: string | null
          valor: string
        }
        Insert: {
          chave: string
          descricao?: string | null
          id?: string
          updated_at?: string | null
          valor: string
        }
        Update: {
          chave?: string
          descricao?: string | null
          id?: string
          updated_at?: string | null
          valor?: string
        }
        Relationships: []
      }
      custos_fixos: {
        Row: {
          ativo: boolean | null
          categoria: string | null
          created_at: string | null
          descricao: string
          dia_lancamento: number | null
          filial_id: string | null
          id: string
          valor: number
        }
        Insert: {
          ativo?: boolean | null
          categoria?: string | null
          created_at?: string | null
          descricao: string
          dia_lancamento?: number | null
          filial_id?: string | null
          id?: string
          valor: number
        }
        Update: {
          ativo?: boolean | null
          categoria?: string | null
          created_at?: string | null
          descricao?: string
          dia_lancamento?: number | null
          filial_id?: string | null
          id?: string
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "custos_fixos_filial_id_fkey"
            columns: ["filial_id"]
            isOneToOne: false
            referencedRelation: "filiais"
            referencedColumns: ["id"]
          },
        ]
      }
      despesas: {
        Row: {
          categoria: string
          comprovante_url: string | null
          created_at: string
          data_despesa: string | null
          descricao: string | null
          filial_id: string | null
          id: string
          metodo_pagamento: string | null
          observacoes: string | null
          pago_por: string | null
          recorrente: boolean | null
          registrado_por: string | null
          socio_id: string | null
          subcategoria: string | null
          user_id: string
          valor: number
        }
        Insert: {
          categoria: string
          comprovante_url?: string | null
          created_at?: string
          data_despesa?: string | null
          descricao?: string | null
          filial_id?: string | null
          id?: string
          metodo_pagamento?: string | null
          observacoes?: string | null
          pago_por?: string | null
          recorrente?: boolean | null
          registrado_por?: string | null
          socio_id?: string | null
          subcategoria?: string | null
          user_id: string
          valor: number
        }
        Update: {
          categoria?: string
          comprovante_url?: string | null
          created_at?: string
          data_despesa?: string | null
          descricao?: string | null
          filial_id?: string | null
          id?: string
          metodo_pagamento?: string | null
          observacoes?: string | null
          pago_por?: string | null
          recorrente?: boolean | null
          registrado_por?: string | null
          socio_id?: string | null
          subcategoria?: string | null
          user_id?: string
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "despesas_filial_id_fkey"
            columns: ["filial_id"]
            isOneToOne: false
            referencedRelation: "filiais"
            referencedColumns: ["id"]
          },
        ]
      }
      distribuicao_socios: {
        Row: {
          created_at: string | null
          fechamento_id: string | null
          filial_id: string | null
          id: string
          porcentagem: number | null
          socio_id: string | null
          valor: number | null
        }
        Insert: {
          created_at?: string | null
          fechamento_id?: string | null
          filial_id?: string | null
          id?: string
          porcentagem?: number | null
          socio_id?: string | null
          valor?: number | null
        }
        Update: {
          created_at?: string | null
          fechamento_id?: string | null
          filial_id?: string | null
          id?: string
          porcentagem?: number | null
          socio_id?: string | null
          valor?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "distribuicao_socios_fechamento_id_fkey"
            columns: ["fechamento_id"]
            isOneToOne: false
            referencedRelation: "fechamentos_diarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "distribuicao_socios_filial_id_fkey"
            columns: ["filial_id"]
            isOneToOne: false
            referencedRelation: "filiais"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "distribuicao_socios_socio_id_fkey"
            columns: ["socio_id"]
            isOneToOne: false
            referencedRelation: "socios"
            referencedColumns: ["id"]
          },
        ]
      }
      fechamentos_diarios: {
        Row: {
          created_at: string | null
          custo_pecas_compradas: number | null
          custo_pecas_fabricadas: number | null
          data: string
          fechado_por: string | null
          filial_id: string
          ganho_medio_por_hora: number | null
          id: string
          lucro_bruto: number | null
          lucro_liquido: number | null
          metodo_pagamento_breakdown: Json | null
          receita_bruta: number | null
          receita_liquida: number | null
          tempo_total_servicos_minutos: number | null
          total_descontos: number | null
          total_despesas: number | null
          total_servicos: number | null
          total_taxas_maquina: number | null
          valor_caixa_filial: number | null
          valor_distribuir_socios: number | null
        }
        Insert: {
          created_at?: string | null
          custo_pecas_compradas?: number | null
          custo_pecas_fabricadas?: number | null
          data: string
          fechado_por?: string | null
          filial_id: string
          ganho_medio_por_hora?: number | null
          id?: string
          lucro_bruto?: number | null
          lucro_liquido?: number | null
          metodo_pagamento_breakdown?: Json | null
          receita_bruta?: number | null
          receita_liquida?: number | null
          tempo_total_servicos_minutos?: number | null
          total_descontos?: number | null
          total_despesas?: number | null
          total_servicos?: number | null
          total_taxas_maquina?: number | null
          valor_caixa_filial?: number | null
          valor_distribuir_socios?: number | null
        }
        Update: {
          created_at?: string | null
          custo_pecas_compradas?: number | null
          custo_pecas_fabricadas?: number | null
          data?: string
          fechado_por?: string | null
          filial_id?: string
          ganho_medio_por_hora?: number | null
          id?: string
          lucro_bruto?: number | null
          lucro_liquido?: number | null
          metodo_pagamento_breakdown?: Json | null
          receita_bruta?: number | null
          receita_liquida?: number | null
          tempo_total_servicos_minutos?: number | null
          total_descontos?: number | null
          total_despesas?: number | null
          total_servicos?: number | null
          total_taxas_maquina?: number | null
          valor_caixa_filial?: number | null
          valor_distribuir_socios?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "fechamentos_diarios_filial_id_fkey"
            columns: ["filial_id"]
            isOneToOne: false
            referencedRelation: "filiais"
            referencedColumns: ["id"]
          },
        ]
      }
      filiais: {
        Row: {
          ativa: boolean
          created_at: string
          endereco: string | null
          id: string
          nome: string
          porcentagem_caixa: number | null
          telefone: string | null
        }
        Insert: {
          ativa?: boolean
          created_at?: string
          endereco?: string | null
          id?: string
          nome: string
          porcentagem_caixa?: number | null
          telefone?: string | null
        }
        Update: {
          ativa?: boolean
          created_at?: string
          endereco?: string | null
          id?: string
          nome?: string
          porcentagem_caixa?: number | null
          telefone?: string | null
        }
        Relationships: []
      }
      funcionarios: {
        Row: {
          ativo: boolean | null
          cargo: string | null
          chave_pix: string | null
          created_at: string | null
          dia_pagamento: string | null
          filial_id: string | null
          id: string
          metodo_pagamento_preferido: string | null
          nome: string
          salario_semanal: number | null
        }
        Insert: {
          ativo?: boolean | null
          cargo?: string | null
          chave_pix?: string | null
          created_at?: string | null
          dia_pagamento?: string | null
          filial_id?: string | null
          id?: string
          metodo_pagamento_preferido?: string | null
          nome: string
          salario_semanal?: number | null
        }
        Update: {
          ativo?: boolean | null
          cargo?: string | null
          chave_pix?: string | null
          created_at?: string | null
          dia_pagamento?: string | null
          filial_id?: string | null
          id?: string
          metodo_pagamento_preferido?: string | null
          nome?: string
          salario_semanal?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "funcionarios_filial_id_fkey"
            columns: ["filial_id"]
            isOneToOne: false
            referencedRelation: "filiais"
            referencedColumns: ["id"]
          },
        ]
      }
      lancamento_items: {
        Row: {
          created_at: string
          custo: number
          descricao: string
          id: string
          lancamento_id: string
          margem_percentual: number | null
          posicao: string | null
          tipo: string
          valor_cobrado: number
        }
        Insert: {
          created_at?: string
          custo?: number
          descricao?: string
          id?: string
          lancamento_id: string
          margem_percentual?: number | null
          posicao?: string | null
          tipo?: string
          valor_cobrado?: number
        }
        Update: {
          created_at?: string
          custo?: number
          descricao?: string
          id?: string
          lancamento_id?: string
          margem_percentual?: number | null
          posicao?: string | null
          tipo?: string
          valor_cobrado?: number
        }
        Relationships: [
          {
            foreignKeyName: "lancamento_items_lancamento_id_fkey"
            columns: ["lancamento_id"]
            isOneToOne: false
            referencedRelation: "lancamentos"
            referencedColumns: ["id"]
          },
        ]
      }
      lancamentos: {
        Row: {
          ai_data: Json | null
          audio_url: string | null
          cliente_id: string | null
          cliente_nome: string | null
          created_at: string
          custo_pecas_compradas: number | null
          custo_pecas_fabricadas_estimado: number | null
          custo_total: number
          desconto: number
          descricao_resumo: string | null
          filial_id: string | null
          fonte: string
          foto_url: string | null
          ganho_por_hora: number | null
          hora_entrada: string | null
          hora_saida: string | null
          id: string
          lucro: number
          metodo_pagamento: string | null
          metodo_pagamento_secundario: string | null
          observacoes: string | null
          placa: string | null
          status: string
          taxa_percentual: number
          taxa_valor: number
          tempo_servico_minutos: number | null
          tipo: string
          transcricao_ia: string | null
          user_id: string
          valor_bruto: number
          valor_liquido: number
          valor_pagamento_principal: number | null
          valor_pagamento_secundario: number | null
          veiculo_desc: string | null
          veiculo_id: string | null
        }
        Insert: {
          ai_data?: Json | null
          audio_url?: string | null
          cliente_id?: string | null
          cliente_nome?: string | null
          created_at?: string
          custo_pecas_compradas?: number | null
          custo_pecas_fabricadas_estimado?: number | null
          custo_total?: number
          desconto?: number
          descricao_resumo?: string | null
          filial_id?: string | null
          fonte?: string
          foto_url?: string | null
          ganho_por_hora?: number | null
          hora_entrada?: string | null
          hora_saida?: string | null
          id?: string
          lucro?: number
          metodo_pagamento?: string | null
          metodo_pagamento_secundario?: string | null
          observacoes?: string | null
          placa?: string | null
          status?: string
          taxa_percentual?: number
          taxa_valor?: number
          tempo_servico_minutos?: number | null
          tipo?: string
          transcricao_ia?: string | null
          user_id: string
          valor_bruto?: number
          valor_liquido?: number
          valor_pagamento_principal?: number | null
          valor_pagamento_secundario?: number | null
          veiculo_desc?: string | null
          veiculo_id?: string | null
        }
        Update: {
          ai_data?: Json | null
          audio_url?: string | null
          cliente_id?: string | null
          cliente_nome?: string | null
          created_at?: string
          custo_pecas_compradas?: number | null
          custo_pecas_fabricadas_estimado?: number | null
          custo_total?: number
          desconto?: number
          descricao_resumo?: string | null
          filial_id?: string | null
          fonte?: string
          foto_url?: string | null
          ganho_por_hora?: number | null
          hora_entrada?: string | null
          hora_saida?: string | null
          id?: string
          lucro?: number
          metodo_pagamento?: string | null
          metodo_pagamento_secundario?: string | null
          observacoes?: string | null
          placa?: string | null
          status?: string
          taxa_percentual?: number
          taxa_valor?: number
          tempo_servico_minutos?: number | null
          tipo?: string
          transcricao_ia?: string | null
          user_id?: string
          valor_bruto?: number
          valor_liquido?: number
          valor_pagamento_principal?: number | null
          valor_pagamento_secundario?: number | null
          veiculo_desc?: string | null
          veiculo_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lancamentos_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lancamentos_filial_id_fkey"
            columns: ["filial_id"]
            isOneToOne: false
            referencedRelation: "filiais"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lancamentos_veiculo_id_fkey"
            columns: ["veiculo_id"]
            isOneToOne: false
            referencedRelation: "veiculos"
            referencedColumns: ["id"]
          },
        ]
      }
      nota_fiscal_items: {
        Row: {
          created_at: string
          descricao: string
          id: string
          lancamento_id: string | null
          nota_fiscal_id: string
          quantidade: number
          status: string
          valor_total: number
          valor_unitario: number
          veiculo_desc: string | null
          veiculo_id: string | null
        }
        Insert: {
          created_at?: string
          descricao: string
          id?: string
          lancamento_id?: string | null
          nota_fiscal_id: string
          quantidade?: number
          status?: string
          valor_total?: number
          valor_unitario?: number
          veiculo_desc?: string | null
          veiculo_id?: string | null
        }
        Update: {
          created_at?: string
          descricao?: string
          id?: string
          lancamento_id?: string | null
          nota_fiscal_id?: string
          quantidade?: number
          status?: string
          valor_total?: number
          valor_unitario?: number
          veiculo_desc?: string | null
          veiculo_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "nota_fiscal_items_lancamento_id_fkey"
            columns: ["lancamento_id"]
            isOneToOne: false
            referencedRelation: "lancamentos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "nota_fiscal_items_nota_fiscal_id_fkey"
            columns: ["nota_fiscal_id"]
            isOneToOne: false
            referencedRelation: "notas_fiscais_pecas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "nota_fiscal_items_veiculo_id_fkey"
            columns: ["veiculo_id"]
            isOneToOne: false
            referencedRelation: "veiculos"
            referencedColumns: ["id"]
          },
        ]
      }
      notas_fiscais_pecas: {
        Row: {
          created_at: string
          data_recebimento: string
          filial_id: string | null
          fornecedor: string | null
          id: string
          numero_nota: string | null
          observacoes: string | null
          registrado_por: string | null
          status: string
          valor_total: number
        }
        Insert: {
          created_at?: string
          data_recebimento?: string
          filial_id?: string | null
          fornecedor?: string | null
          id?: string
          numero_nota?: string | null
          observacoes?: string | null
          registrado_por?: string | null
          status?: string
          valor_total?: number
        }
        Update: {
          created_at?: string
          data_recebimento?: string
          filial_id?: string | null
          fornecedor?: string | null
          id?: string
          numero_nota?: string | null
          observacoes?: string | null
          registrado_por?: string | null
          status?: string
          valor_total?: number
        }
        Relationships: [
          {
            foreignKeyName: "notas_fiscais_pecas_filial_id_fkey"
            columns: ["filial_id"]
            isOneToOne: false
            referencedRelation: "filiais"
            referencedColumns: ["id"]
          },
        ]
      }
      notificacoes: {
        Row: {
          created_at: string | null
          dados: Json | null
          id: string
          lida: boolean | null
          mensagem: string
          tipo: string
          titulo: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          dados?: Json | null
          id?: string
          lida?: boolean | null
          mensagem: string
          tipo: string
          titulo: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          dados?: Json | null
          id?: string
          lida?: boolean | null
          mensagem?: string
          tipo?: string
          titulo?: string
          user_id?: string | null
        }
        Relationships: []
      }
      odb_clientes_contexto: {
        Row: {
          cliente_id: string | null
          id: string
          observacoes_ia: string | null
          preferencia_pagamento: string | null
          servicos_frequentes: Json | null
          ultimo_servico_data: string | null
          updated_at: string | null
          veiculo_id: string | null
        }
        Insert: {
          cliente_id?: string | null
          id?: string
          observacoes_ia?: string | null
          preferencia_pagamento?: string | null
          servicos_frequentes?: Json | null
          ultimo_servico_data?: string | null
          updated_at?: string | null
          veiculo_id?: string | null
        }
        Update: {
          cliente_id?: string | null
          id?: string
          observacoes_ia?: string | null
          preferencia_pagamento?: string | null
          servicos_frequentes?: Json | null
          ultimo_servico_data?: string | null
          updated_at?: string | null
          veiculo_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "odb_clientes_contexto_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "odb_clientes_contexto_veiculo_id_fkey"
            columns: ["veiculo_id"]
            isOneToOne: false
            referencedRelation: "veiculos"
            referencedColumns: ["id"]
          },
        ]
      }
      odb_conhecimento_pecas: {
        Row: {
          custo_medio: number | null
          descricao_normalizada: string
          id: string
          margem_media: number | null
          tipo: string | null
          total_lancamentos: number | null
          updated_at: string | null
          valor_maximo: number | null
          valor_medio: number | null
          valor_minimo: number | null
          veiculo_marca: string | null
          veiculo_modelo: string | null
        }
        Insert: {
          custo_medio?: number | null
          descricao_normalizada: string
          id?: string
          margem_media?: number | null
          tipo?: string | null
          total_lancamentos?: number | null
          updated_at?: string | null
          valor_maximo?: number | null
          valor_medio?: number | null
          valor_minimo?: number | null
          veiculo_marca?: string | null
          veiculo_modelo?: string | null
        }
        Update: {
          custo_medio?: number | null
          descricao_normalizada?: string
          id?: string
          margem_media?: number | null
          tipo?: string | null
          total_lancamentos?: number | null
          updated_at?: string | null
          valor_maximo?: number | null
          valor_medio?: number | null
          valor_minimo?: number | null
          veiculo_marca?: string | null
          veiculo_modelo?: string | null
        }
        Relationships: []
      }
      odb_conhecimento_servicos: {
        Row: {
          descricao_normalizada: string | null
          id: string
          itens_comuns: Json | null
          tempo_medio_minutos: number | null
          total_lancamentos: number | null
          updated_at: string | null
          valor_medio_total: number | null
          veiculo_marca: string | null
          veiculo_modelo: string | null
        }
        Insert: {
          descricao_normalizada?: string | null
          id?: string
          itens_comuns?: Json | null
          tempo_medio_minutos?: number | null
          total_lancamentos?: number | null
          updated_at?: string | null
          valor_medio_total?: number | null
          veiculo_marca?: string | null
          veiculo_modelo?: string | null
        }
        Update: {
          descricao_normalizada?: string | null
          id?: string
          itens_comuns?: Json | null
          tempo_medio_minutos?: number | null
          total_lancamentos?: number | null
          updated_at?: string | null
          valor_medio_total?: number | null
          veiculo_marca?: string | null
          veiculo_modelo?: string | null
        }
        Relationships: []
      }
      odb_sinonimos: {
        Row: {
          categoria: string | null
          created_at: string | null
          id: string
          termo_correto: string
          termo_digitado: string
        }
        Insert: {
          categoria?: string | null
          created_at?: string | null
          id?: string
          termo_correto: string
          termo_digitado: string
        }
        Update: {
          categoria?: string | null
          created_at?: string | null
          id?: string
          termo_correto?: string
          termo_digitado?: string
        }
        Relationships: []
      }
      pagamentos_funcionarios: {
        Row: {
          comprovante_url: string | null
          created_at: string | null
          filial_id: string
          funcionario_id: string
          id: string
          metodo_pagamento: string
          observacoes: string | null
          pago_por: string | null
          semana_referencia: string
          status: string | null
          valor: number
          valor_pendente: number | null
        }
        Insert: {
          comprovante_url?: string | null
          created_at?: string | null
          filial_id: string
          funcionario_id: string
          id?: string
          metodo_pagamento: string
          observacoes?: string | null
          pago_por?: string | null
          semana_referencia: string
          status?: string | null
          valor: number
          valor_pendente?: number | null
        }
        Update: {
          comprovante_url?: string | null
          created_at?: string | null
          filial_id?: string
          funcionario_id?: string
          id?: string
          metodo_pagamento?: string
          observacoes?: string | null
          pago_por?: string | null
          semana_referencia?: string
          status?: string | null
          valor?: number
          valor_pendente?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "pagamentos_funcionarios_filial_id_fkey"
            columns: ["filial_id"]
            isOneToOne: false
            referencedRelation: "filiais"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pagamentos_funcionarios_funcionario_id_fkey"
            columns: ["funcionario_id"]
            isOneToOne: false
            referencedRelation: "funcionarios"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          ativo: boolean | null
          avatar_url: string | null
          created_at: string
          email: string | null
          filial_id: string | null
          id: string
          nome: string
          role: string
        }
        Insert: {
          ativo?: boolean | null
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          filial_id?: string | null
          id: string
          nome?: string
          role?: string
        }
        Update: {
          ativo?: boolean | null
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          filial_id?: string | null
          id?: string
          nome?: string
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_filial_id_fkey"
            columns: ["filial_id"]
            isOneToOne: false
            referencedRelation: "filiais"
            referencedColumns: ["id"]
          },
        ]
      }
      retiradas: {
        Row: {
          created_at: string
          descricao: string | null
          id: string
          socio_id: string
          valor: number
        }
        Insert: {
          created_at?: string
          descricao?: string | null
          id?: string
          socio_id: string
          valor: number
        }
        Update: {
          created_at?: string
          descricao?: string | null
          id?: string
          socio_id?: string
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "retiradas_socio_id_fkey"
            columns: ["socio_id"]
            isOneToOne: false
            referencedRelation: "socios"
            referencedColumns: ["id"]
          },
        ]
      }
      socio_filiais: {
        Row: {
          filial_id: string
          id: string
          porcentagem_lucro: number
          socio_id: string
        }
        Insert: {
          filial_id: string
          id?: string
          porcentagem_lucro?: number
          socio_id: string
        }
        Update: {
          filial_id?: string
          id?: string
          porcentagem_lucro?: number
          socio_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "socio_filiais_filial_id_fkey"
            columns: ["filial_id"]
            isOneToOne: false
            referencedRelation: "filiais"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "socio_filiais_socio_id_fkey"
            columns: ["socio_id"]
            isOneToOne: false
            referencedRelation: "socios"
            referencedColumns: ["id"]
          },
        ]
      }
      socios: {
        Row: {
          ativo: boolean | null
          created_at: string
          email: string | null
          id: string
          nome: string
          percentual_lucro: number
          telefone: string | null
          user_id: string | null
        }
        Insert: {
          ativo?: boolean | null
          created_at?: string
          email?: string | null
          id?: string
          nome: string
          percentual_lucro?: number
          telefone?: string | null
          user_id?: string | null
        }
        Update: {
          ativo?: boolean | null
          created_at?: string
          email?: string | null
          id?: string
          nome?: string
          percentual_lucro?: number
          telefone?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      solicitacoes_pecas: {
        Row: {
          atendida_at: string | null
          created_at: string
          id: string
          itens: Json
          lancamento_id: string | null
          observacoes: string | null
          placa: string | null
          solicitado_por: string | null
          status: string
          veiculo_desc: string | null
        }
        Insert: {
          atendida_at?: string | null
          created_at?: string
          id?: string
          itens?: Json
          lancamento_id?: string | null
          observacoes?: string | null
          placa?: string | null
          solicitado_por?: string | null
          status?: string
          veiculo_desc?: string | null
        }
        Update: {
          atendida_at?: string | null
          created_at?: string
          id?: string
          itens?: Json
          lancamento_id?: string | null
          observacoes?: string | null
          placa?: string | null
          solicitado_por?: string | null
          status?: string
          veiculo_desc?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "solicitacoes_pecas_lancamento_id_fkey"
            columns: ["lancamento_id"]
            isOneToOne: false
            referencedRelation: "lancamentos"
            referencedColumns: ["id"]
          },
        ]
      }
      taxas_maquina: {
        Row: {
          created_at: string
          id: string
          metodo: string
          taxa_percentual: number
        }
        Insert: {
          created_at?: string
          id?: string
          metodo: string
          taxa_percentual?: number
        }
        Update: {
          created_at?: string
          id?: string
          metodo?: string
          taxa_percentual?: number
        }
        Relationships: []
      }
      veiculos: {
        Row: {
          ano: string | null
          cliente_id: string | null
          cor: string | null
          created_at: string
          id: string
          marca: string
          modelo: string
          placa: string | null
        }
        Insert: {
          ano?: string | null
          cliente_id?: string | null
          cor?: string | null
          created_at?: string
          id?: string
          marca?: string
          modelo?: string
          placa?: string | null
        }
        Update: {
          ano?: string | null
          cliente_id?: string | null
          cor?: string | null
          created_at?: string
          id?: string
          marca?: string
          modelo?: string
          placa?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "veiculos_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
