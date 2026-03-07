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

FORMATO DE RETORNO:
{
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
}`;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { tipo, conteudo, imageBase64, mimeType } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    // Fetch context from DB
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get synonyms and knowledge base in parallel
    const [sinonimoRes, conhecimentoRes, clientesRes] = await Promise.all([
      supabase.from("odb_sinonimos").select("termo_digitado, termo_correto").limit(200),
      supabase.from("odb_conhecimento_pecas").select("descricao_normalizada, veiculo_marca, veiculo_modelo, tipo, valor_medio, total_lancamentos").order("total_lancamentos", { ascending: false }).limit(100),
      supabase.from("clientes").select("id, nome, telefone").order("created_at", { ascending: false }).limit(50),
    ]);

    const sinonimos = sinonimoRes.data || [];
    const conhecimento = conhecimentoRes.data || [];
    const clientes = clientesRes.data || [];

    const contextPrompt = `
SINÔNIMOS CONHECIDOS:
${sinonimos.map(s => `${s.termo_digitado} → ${s.termo_correto}`).join(", ")}

BANCO DE CONHECIMENTO (peças que já conheço):
${conhecimento.map(k => `${k.descricao_normalizada} (${k.veiculo_marca} ${k.veiculo_modelo}) = ${k.tipo}, média R$ ${k.valor_medio}, ${k.total_lancamentos}x`).join("\n")}

CLIENTES RECENTES:
${clientes.map(c => `${c.nome} (${c.telefone || "sem tel"})`).join(", ")}`;

    // Build messages based on input type
    const messages: any[] = [
      { role: "system", content: SYSTEM_PROMPT + "\n\n" + contextPrompt },
    ];

    if (tipo === "foto" && imageBase64) {
      messages.push({
        role: "user",
        content: [
          { type: "text", text: "Analise esta foto de orçamento/nota de serviço e extraia todos os dados estruturados. Retorne JSON." },
          { type: "image_url", image_url: { url: `data:${mimeType || "image/jpeg"};base64,${imageBase64}` } },
        ],
      });
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
