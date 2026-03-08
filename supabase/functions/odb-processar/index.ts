import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `Você é o Agente ODB, o assistente inteligente da Oficina da Borracha — uma rede de oficinas especializadas em suspensão automotiva e fabricação artesanal de borrachas.

PERSONALIDADE:
- Você é um COLEGA de trabalho experiente, fala de forma natural e direta
- Use linguagem informal mas profissional, como um mecânico experiente
- Sempre confirme o que entendeu antes de salvar
- Se faltar informação, PERGUNTE de forma clara e objetiva
- Nunca retorne apenas JSON — sempre inclua uma mensagem conversacional

CONTEXTO DO NEGÓCIO:
- Fabricamos borrachas para suspensão: buchas, coxins, coifas, batentes, bieletas, bases de motor
- Tudo que é BORRACHA é fabricação própria (custo de matéria-prima diluído)
- Peças metálicas/mecânicas são COMPRADAS: pastilhas, amortecedores, terminais, pivôs, discos, rolamentos
- Algumas peças são RECUPERADAS (ex: caixa de direção)
- Margem em peças compradas: 15-20% em cima do custo
- Orçamentos divididos em: dianteira e traseira

CORREÇÃO AUTOMÁTICA:
- buxa→bucha, corola→Corolla, cx direcao→caixa de direção, amort→amortecedor, din→dinheiro
- Use os SINÔNIMOS CONHECIDOS do banco para corrigir termos

CLASSIFICAÇÃO INTELIGENTE — Ao receber QUALQUER input (texto, áudio, foto, PDF), classifique:

1. "entrada" — Carro sendo autorizado/dando entrada na oficina. Status: em_andamento
   Sinais: "autorizado", "vai fazer", "entrou agora", "cliente deixou", "deu ok"
   
2. "saida" — Serviço pronto, pagamento feito (ou esqueceu de dar entrada antes)
   Sinais: "pagou", "pronto", "já fez", "saiu", valor + pagamento mencionados
   
3. "despesa" — Saída/gasto da oficina
   Sinais: aluguel, conta, compra de material, alimentação, salário, etc.
   
4. "nota_pecas" — Nota fiscal de peças compradas de fornecedor
   Sinais: foto de NF, lista de peças com valores de custo, fornecedor
   
5. "correcao" — Operador quer corrigir algo de um serviço anterior
   Sinais: "na verdade era", "errei", "corrige", "o valor era"

Para IMAGENS: identifique se é orçamento manuscrito, nota fiscal, foto de peça, recibo, anotação. Descreva o que viu.

FORMATO DE RESPOSTA — SEMPRE retorne este JSON:
{
  "mensagem": "Texto conversacional para mostrar ao operador",
  "tipo_acao": "entrada|saida|despesa|nota_pecas|correcao|pergunta|confirmacao",
  "dados": { ... dados estruturados quando disponíveis ... },
  "salvar": false,
  "botoes": [{"label": "texto", "value": "id_acao", "variant": "primary|success|warning|default"}]
}

REGRAS DE RESPOSTA:
- "mensagem" é OBRIGATÓRIO — sempre fale com o operador
- "salvar": true APENAS quando todos os dados necessários estão completos E confirmados
- Se faltar qualquer coisa, salvar=false e pergunte na mensagem
- "botoes" são opcionais — use para oferecer ações rápidas
- "dados" contém os dados estruturados conforme o tipo

DADOS PARA ENTRADA (carro chegando):
{
  "tipo_acao": "entrada",
  "dados": {
    "cliente": {"nome": string|null, "telefone": string|null},
    "veiculo": {"marca": string, "modelo": string, "ano": number|null, "placa": string|null},
    "servicos_previstos": [{"descricao": string, "posicao": "dianteira|traseira|geral"}],
    "observacoes": string|null
  }
}

DADOS PARA SAÍDA (serviço + pagamento):
{
  "tipo_acao": "saida",
  "dados": {
    "cliente": {"nome": string|null, "telefone": string|null},
    "veiculo": {"marca": string|null, "modelo": string|null, "ano": number|null, "placa": string|null},
    "itens_dianteira": [{"descricao": string, "tipo": "mao_de_obra|peca_fabricada|peca_comprada|recuperacao", "valor_cobrado": number, "custo_estimado": number|null}],
    "itens_traseira": [mesmo formato],
    "itens_geral": [mesmo formato],
    "desconto": number,
    "metodo_pagamento": string|null,
    "parcelas_credito": number|null,
    "valor_total": number|null,
    "status": "finalizado"
  }
}

DADOS PARA DESPESA:
{
  "tipo_acao": "despesa",
  "dados": {
    "categoria": string,
    "descricao": string,
    "valor": number|null,
    "metodo_pagamento": string|null,
    "pago_por": string|null,
    "observacoes": string|null
  }
}

DADOS PARA NOTA DE PEÇAS:
{
  "tipo_acao": "nota_pecas",
  "dados": {
    "fornecedor": string|null,
    "numero_nota": string|null,
    "itens": [{"descricao": string, "quantidade": number, "valor_unitario": number, "valor_total": number}],
    "valor_total": number,
    "veiculo_sugerido": {"marca": string|null, "modelo": string|null, "placa": string|null}|null
  }
}

DADOS PARA PERGUNTA (quando precisa de mais info):
{
  "tipo_acao": "pergunta",
  "dados": {
    "dados_parciais": { qualquer dado que já identificou },
    "campos_faltando": ["lista do que falta"]
  }
}

DADOS PARA CONFIRMAÇÃO (todos dados prontos, aguardando ok do operador):
{
  "tipo_acao": "confirmacao",
  "dados": { ... todos os dados completos ... },
  "salvar": false,
  "botoes": [{"label": "Confirmar e salvar", "value": "confirmar_salvar", "variant": "success"}, {"label": "Corrigir", "value": "corrigir", "variant": "warning"}]
}

IMPORTANTE:
- Use o BANCO DE CONHECIMENTO para sugerir preços e classificar peças
- Use VEÍCULOS ATIVOS para sugerir associações ("Isso é pro Corolla do João que tá na oficina?")
- Use CLIENTES RECENTES para identificar nomes parciais
- Quando o operador confirma, mude salvar para true e retorne os dados finais
- Se o operador diz "confirma" ou "salva", retorne salvar: true com os dados da conversa
- NUNCA invente dados — se não sabe, pergunte
- Retorne APENAS JSON válido (sem markdown, sem crases, sem texto fora do JSON)`;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { history, imageBase64, mimeType, filial_id, filial_nome, salvar_aprendizado, itens_confirmados, veiculo_info } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // ── LEARNING MODE ──
    if (salvar_aprendizado && itens_confirmados) {
      await saveLearnedCosts(supabase, itens_confirmados, veiculo_info);
      return new Response(JSON.stringify({ success: true, message: "Aprendizado salvo" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── FETCH CONTEXT ──
    let filialInfo = filial_nome || null;
    if (filial_id && !filialInfo) {
      const { data: filialData } = await supabase.from("filiais").select("nome").eq("id", filial_id).maybeSingle();
      filialInfo = filialData?.nome || null;
    }

    const [sinonimoRes, conhecimentoRes, clientesRes, veiculosRes, filiaisRes, lancamentosAtivosRes] = await Promise.all([
      supabase.from("odb_sinonimos").select("termo_digitado, termo_correto").limit(200),
      supabase.from("odb_conhecimento_pecas").select("descricao_normalizada, veiculo_marca, veiculo_modelo, tipo, valor_medio, custo_medio, margem_media, total_lancamentos").order("total_lancamentos", { ascending: false }).limit(100),
      supabase.from("clientes").select("id, nome, telefone").order("created_at", { ascending: false }).limit(50),
      supabase.from("veiculos").select("id, marca, modelo, placa, ano, cliente_id").order("created_at", { ascending: false }).limit(50),
      supabase.from("filiais").select("id, nome").eq("ativa", true),
      supabase.from("lancamentos").select("id, cliente_nome, veiculo_desc, placa, status, created_at, valor_bruto").eq("status", "em_andamento").order("created_at", { ascending: false }).limit(20),
    ]);

    const sinonimos = sinonimoRes.data || [];
    const conhecimento = conhecimentoRes.data || [];
    const clientes = clientesRes.data || [];
    const veiculos = veiculosRes.data || [];
    const todasFiliais = filiaisRes.data || [];
    const carrosNaOficina = lancamentosAtivosRes.data || [];

    const contextPrompt = `
FILIAL DO OPERADOR: ${filialInfo || "Não identificada"}
${filial_id ? `ID da filial: ${filial_id}` : ""}
FILIAIS DISPONÍVEIS: ${todasFiliais.map(f => f.nome).join(", ") || "Nenhuma"}

CARROS ATUALMENTE NA OFICINA (em_andamento):
${carrosNaOficina.length > 0
  ? carrosNaOficina.map(l => `- ${l.cliente_nome || "?"} | ${l.veiculo_desc || "?"} | ${l.placa || "sem placa"} | Entrada: ${new Date(l.created_at).toLocaleDateString("pt-BR")}`).join("\n")
  : "Nenhum carro na oficina agora."}

SINÔNIMOS CONHECIDOS:
${sinonimos.map(s => `${s.termo_digitado} → ${s.termo_correto}`).join(", ")}

BANCO DE CONHECIMENTO (histórico de preços):
${conhecimento.length > 0
  ? conhecimento.map(k =>
      `- ${k.descricao_normalizada} (${k.veiculo_marca || "qualquer"} ${k.veiculo_modelo || ""}) = ${k.tipo}, preço médio R$ ${k.valor_medio}, custo médio R$ ${k.custo_medio || "?"}, ${k.total_lancamentos}x usado`
    ).join("\n")
  : "Nenhum dado histórico ainda."}

CLIENTES RECENTES:
${clientes.map(c => `${c.nome} (${c.telefone || "sem tel"})`).join(", ")}

VEÍCULOS CADASTRADOS:
${veiculos.map(v => `${v.marca} ${v.modelo} ${v.ano || ""} ${v.placa || ""}`).join(", ") || "Nenhum"}`;

    // ── BUILD MESSAGES ARRAY ──
    const messages: any[] = [
      { role: "system", content: SYSTEM_PROMPT + "\n\n" + contextPrompt },
    ];

    // Add conversation history (max 20 messages, skip image base64 from old messages)
    if (history && Array.isArray(history)) {
      const recentHistory = history.slice(-20);
      for (const msg of recentHistory) {
        if (msg.role === "user") {
          if (msg.hasImage && msg.isLatest && imageBase64) {
            // Current message with image — will be added below
            continue;
          }
          messages.push({ role: "user", content: msg.content });
        } else if (msg.role === "assistant") {
          messages.push({ role: "assistant", content: msg.content });
        }
      }
    }

    // Add current message with image if present
    if (imageBase64) {
      const lastUserMsg = history?.filter((m: any) => m.role === "user").pop();
      const textContent = lastUserMsg?.content || "Analise esta imagem.";
      messages.push({
        role: "user",
        content: [
          { type: "text", text: textContent },
          { type: "image_url", image_url: { url: `data:${mimeType || "image/jpeg"};base64,${imageBase64}` } },
        ],
      });
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages,
      }),
    });

    if (!response.ok) {
      const status = response.status;
      if (status === 429) return new Response(JSON.stringify({ error: "Muitas requisições. Aguarde alguns segundos." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (status === 402) return new Response(JSON.stringify({ error: "Créditos de IA insuficientes." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      const t = await response.text();
      console.error("AI error:", status, t);
      return new Response(JSON.stringify({ error: "Erro na análise da IA" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";

    let parsed;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : { mensagem: content, tipo_acao: "pergunta", salvar: false };
    } catch {
      parsed = { mensagem: content, tipo_acao: "pergunta", salvar: false };
    }

    // Ensure mensagem always exists
    if (!parsed.mensagem) {
      parsed.mensagem = "Processado. Verifique os dados.";
    }

    return new Response(JSON.stringify({ result: parsed }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("odb-processar error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

// ── LEARNING FUNCTION ──
async function saveLearnedCosts(
  supabase: any,
  itens: Array<{ descricao: string; tipo: string; valor_cobrado: number; custo: number }>,
  veiculo?: { marca?: string; modelo?: string }
) {
  for (const item of itens) {
    if (!item.descricao || item.valor_cobrado <= 0) continue;
    const descNorm = item.descricao.toLowerCase().trim();
    const marca = veiculo?.marca?.toLowerCase().trim() || null;
    const modelo = veiculo?.modelo?.toLowerCase().trim() || null;
    const margem = item.custo > 0 ? ((item.valor_cobrado - item.custo) / item.custo) * 100 : null;

    let query = supabase.from("odb_conhecimento_pecas").select("*").eq("descricao_normalizada", descNorm);
    if (marca) query = query.eq("veiculo_marca", marca); else query = query.is("veiculo_marca", null);
    if (modelo) query = query.eq("veiculo_modelo", modelo); else query = query.is("veiculo_modelo", null);
    const { data: existing } = await query.maybeSingle();

    if (existing) {
      const count = (existing.total_lancamentos || 0) + 1;
      const newValorMedio = ((existing.valor_medio || 0) * (count - 1) + item.valor_cobrado) / count;
      const newCustoMedio = item.custo > 0 ? ((existing.custo_medio || 0) * (count - 1) + item.custo) / count : existing.custo_medio;
      const newMargemMedia = margem !== null ? ((existing.margem_media || 0) * (count - 1) + margem) / count : existing.margem_media;
      await supabase.from("odb_conhecimento_pecas").update({
        valor_medio: Math.round(newValorMedio * 100) / 100,
        custo_medio: newCustoMedio ? Math.round(newCustoMedio * 100) / 100 : null,
        margem_media: newMargemMedia ? Math.round(newMargemMedia * 100) / 100 : null,
        valor_minimo: Math.min(existing.valor_minimo || item.valor_cobrado, item.valor_cobrado),
        valor_maximo: Math.max(existing.valor_maximo || item.valor_cobrado, item.valor_cobrado),
        total_lancamentos: count,
        updated_at: new Date().toISOString(),
      }).eq("id", existing.id);
    } else {
      await supabase.from("odb_conhecimento_pecas").insert({
        descricao_normalizada: descNorm,
        tipo: item.tipo || null,
        veiculo_marca: marca,
        veiculo_modelo: modelo,
        valor_medio: item.valor_cobrado,
        custo_medio: item.custo > 0 ? item.custo : null,
        margem_media: margem,
        valor_minimo: item.valor_cobrado,
        valor_maximo: item.valor_cobrado,
        total_lancamentos: 1,
      });
    }
  }
}
