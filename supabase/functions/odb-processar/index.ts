import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `Você é o Agente ODB, o assistente inteligente da Oficina da Borracha — uma rede de oficinas especializadas em suspensão automotiva e fabricação artesanal de borrachas.

CONTEXTO DO NEGÓCIO:
- Fabricamos borrachas para suspensão: buchas, coxins, coifas, batentes, bieletas, bases de motor
- Tudo que é BORRACHA é fabricação própria (custo de matéria-prima diluído)
- Peças metálicas/mecânicas são COMPRADAS: pastilhas, amortecedores, terminais, pivôs, discos, rolamentos
- Algumas peças são RECUPERADAS (ex: caixa de direção)
- Margem em peças compradas: 15-20% em cima do custo
- Orçamentos divididos em: dianteira e traseira

REGRAS:
1. Extraia: cliente (nome, telefone), veículo (marca, modelo, ano, placa), itens separados por dianteira/traseira com valores, método de pagamento, desconto
2. Classifique cada peça: peca_fabricada (borrachas), peca_comprada (metálicas), recuperacao, mao_de_obra
3. CORRIJA erros: buxa→bucha, corola→Corolla, cx direcao→caixa de direção, amort→amortecedor, din→dinheiro
4. Se não identificar algo com certeza, marque confiança como 'media' ou 'baixa'
5. Retorne APENAS JSON válido (sem markdown, sem crases)
6. Para peças compradas, ESTIME o custo se souber (o valor_cobrado é o preço ao cliente, custo_estimado é quanto a oficina pagou)
7. Use o BANCO DE CONHECIMENTO abaixo para estimar custos com base no histórico de preços

DETECÇÃO DE TIPO DE DOCUMENTO:
- Se a imagem contém uma NOTA FISCAL DE PEÇAS (NF, nota de compra de peças de fornecedor), retorne com "tipo_documento": "nota_pecas"
- Se é um ORÇAMENTO ou NOTA DE SERVIÇO da oficina, retorne com "tipo_documento": "orcamento"
- Se não conseguir identificar o tipo, retorne com "tipo_documento": "desconhecido" e pergunte ao usuário

FORMATO PARA ORÇAMENTO/SERVIÇO:
{
  "tipo_documento": "orcamento",
  "confianca_geral": "alta|media|baixa",
  "cliente": {"nome": string|null, "telefone": string|null, "confianca": "alta|media|baixa", "cliente_existente_id": string|null},
  "veiculo": {"marca": string|null, "modelo": string|null, "ano": number|null, "placa": string|null, "confianca": "alta|media|baixa"},
  "itens_dianteira": [{"descricao": string, "tipo": "mao_de_obra|peca_fabricada|peca_comprada|recuperacao", "valor_cobrado": number|null, "custo_estimado": number|null, "confianca": "alta|media|baixa"}],
  "itens_traseira": [mesmo formato],
  "itens_geral": [mesmo formato],
  "desconto": number,
  "metodo_pagamento": string|null,
  "parcelas_credito": number|null,
  "valor_total": number|null,
  "observacoes": string|null,
  "campos_faltando": ["lista do que não identificou"],
  "correcoes_feitas": [{"original": string, "corrigido": string}],
  "transcricao": string|null
}

FORMATO PARA NOTA FISCAL DE PEÇAS:
{
  "tipo_documento": "nota_pecas",
  "fornecedor": string|null,
  "numero_nota": string|null,
  "itens": [{"descricao": string, "quantidade": number, "valor_unitario": number, "valor_total": number}],
  "valor_total": number,
  "veiculo_sugerido": {"marca": string|null, "modelo": string|null, "placa": string|null, "confianca": "alta|media|baixa"} | null,
  "confianca_veiculo": "alta|media|baixa",
  "observacoes": string|null
}

FORMATO PARA DOCUMENTO DESCONHECIDO:
{
  "tipo_documento": "desconhecido",
  "descricao_conteudo": string,
  "observacoes": string
}`;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { tipo, conteudo, imageBase64, mimeType, observacao, salvar_aprendizado, itens_confirmados, veiculo_info } = await req.json();
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

    // ── ANALYSIS MODE ──
    const [sinonimoRes, conhecimentoRes, clientesRes, veiculosRes] = await Promise.all([
      supabase.from("odb_sinonimos").select("termo_digitado, termo_correto").limit(200),
      supabase.from("odb_conhecimento_pecas").select("descricao_normalizada, veiculo_marca, veiculo_modelo, tipo, valor_medio, custo_medio, margem_media, total_lancamentos").order("total_lancamentos", { ascending: false }).limit(100),
      supabase.from("clientes").select("id, nome, telefone").order("created_at", { ascending: false }).limit(50),
      supabase.from("veiculos").select("id, marca, modelo, placa, ano, cliente_id").order("created_at", { ascending: false }).limit(50),
    ]);

    const sinonimos = sinonimoRes.data || [];
    const conhecimento = conhecimentoRes.data || [];
    const clientes = clientesRes.data || [];
    const veiculos = veiculosRes.data || [];

    const contextPrompt = `
SINÔNIMOS CONHECIDOS:
${sinonimos.map(s => `${s.termo_digitado} → ${s.termo_correto}`).join(", ")}

BANCO DE CONHECIMENTO (peças com histórico de preços):
${conhecimento.length > 0 
  ? conhecimento.map(k => 
      `- ${k.descricao_normalizada} (${k.veiculo_marca || "qualquer"} ${k.veiculo_modelo || ""}) = ${k.tipo}, preço médio R$ ${k.valor_medio}, custo médio R$ ${k.custo_medio || "?"}, ${k.total_lancamentos}x usado`
    ).join("\n")
  : "Nenhum dado histórico ainda."}

CLIENTES RECENTES:
${clientes.map(c => `${c.nome} (${c.telefone || "sem tel"})`).join(", ")}

VEÍCULOS ATIVOS NA OFICINA:
${veiculos.map(v => `${v.marca} ${v.modelo} ${v.ano || ""} ${v.placa || ""}`).join(", ") || "Nenhum"}`;

    const messages: any[] = [
      { role: "system", content: SYSTEM_PROMPT + "\n\n" + contextPrompt },
    ];

    if (tipo === "foto" && imageBase64) {
      const userContent: any[] = [
        { type: "text", text: `Analise esta imagem. Identifique se é um orçamento/nota de serviço ou uma nota fiscal de peças de fornecedor. Extraia todos os dados estruturados conforme o formato apropriado.${observacao ? ` Observação do operador: "${observacao}"` : ""} Retorne JSON.` },
        { type: "image_url", image_url: { url: `data:${mimeType || "image/jpeg"};base64,${imageBase64}` } },
      ];
      messages.push({ role: "user", content: userContent });
    } else if (tipo === "audio" && conteudo) {
      messages.push({
        role: "user",
        content: `Transcrição do operador (pode ter erros, abreviações, gírias): "${conteudo}"\n\nExtraia os dados estruturados. Inclua o campo "transcricao" com a versão corrigida do texto. Retorne JSON.`,
      });
    } else if (tipo === "texto" && conteudo) {
      messages.push({
        role: "user",
        content: `Texto do operador (pode ter erros, abreviações, gírias): "${conteudo}"\n\nExtraia os dados estruturados. Retorne JSON.`,
      });
    } else {
      return new Response(JSON.stringify({ error: "Tipo ou conteúdo inválido" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
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
      parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : { raw: content };
    } catch {
      parsed = { raw: content };
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

    let query = supabase
      .from("odb_conhecimento_pecas")
      .select("*")
      .eq("descricao_normalizada", descNorm);

    if (marca) query = query.eq("veiculo_marca", marca);
    else query = query.is("veiculo_marca", null);
    if (modelo) query = query.eq("veiculo_modelo", modelo);
    else query = query.is("veiculo_modelo", null);

    const { data: existing } = await query.maybeSingle();

    if (existing) {
      const count = (existing.total_lancamentos || 0) + 1;
      const newValorMedio = ((existing.valor_medio || 0) * (count - 1) + item.valor_cobrado) / count;
      const newCustoMedio = item.custo > 0
        ? ((existing.custo_medio || 0) * (count - 1) + item.custo) / count
        : existing.custo_medio;
      const newMargemMedia = margem !== null
        ? ((existing.margem_media || 0) * (count - 1) + margem) / count
        : existing.margem_media;

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
