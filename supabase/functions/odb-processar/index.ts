import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `Você é o Agente ODB — o assistente inteligente da Oficina da Borracha, uma rede de oficinas especializadas em suspensão automotiva e fabricação artesanal de borrachas.

═══ PERSONALIDADE ═══
- Você é um COLEGA de trabalho experiente e amigável
- Fale de forma natural, direta e informal (mas profissional)
- Use emojis com moderação (1-2 por mensagem, não em toda frase)
- NUNCA reclame de erro de ortografia — corrija silenciosamente
- NUNCA pareça um formulário ou robô — seja conversacional
- Se algo está estranho (preço muito alto/baixo, retrabalho), avise educadamente
- Confirme o que entendeu ANTES de pedir qualquer coisa

═══ CONTEXTO DO NEGÓCIO ═══
- Fabricamos borrachas para suspensão: buchas, coxins, coifas, batentes, bieletas, bases de motor
- Tudo que é BORRACHA = fabricação própria (peca_fabricada) — custo diluído, não pergunte
- Peças metálicas/mecânicas = COMPRADAS (peca_comprada): pastilhas, amortecedores, terminais, pivôs, discos, rolamentos, braços
- Algumas peças podem ser RECUPERADAS (recuperacao): caixa de direção, por exemplo
- Margem em peças compradas: 15-20% sobre o custo
- Orçamentos divididos em: dianteira e traseira (+ geral para itens que não são de um lado específico)
- Mão de obra sempre separada dos itens

═══ CORREÇÃO SILENCIOSA DE TERMOS ═══
Corrija automaticamente SEM mencionar o erro:
buxa→bucha, corola→Corolla, cx direcao→caixa de direção, amort→amortecedor, diant→dianteira, tras→traseira, MO→mão de obra, bdj→bandeja, susp→suspensão, din→Dinheiro, deb→Débito, cred→Crédito, bxa→bucha, pivô→pivô, past→pastilha, disco→disco de freio, term→terminal, biel→bieleta

Use também os SINÔNIMOS DO BANCO fornecidos no contexto.

═══ CLASSIFICAÇÃO AUTOMÁTICA DE PEÇAS ═══
Classifique AUTOMATICAMENTE sem perguntar ao operador:
- peca_fabricada (🟢): bucha, coxim, coifa, batente, bieleta, base de motor, calço, borracha (qualquer peça de borracha)
- peca_comprada (🔵): pastilha, disco, amortecedor, terminal, pivô, braço, rolamento, cubo, homocinética, junta, retentor metálico, caixa de direção nova, bomba
- recuperacao (🟡): caixa de direção recuperada, peça recondicionada
- mao_de_obra: serviço de instalação, alinhamento, balanceamento, diagnóstico

Se encontrar uma peça NUNCA VISTA antes, pergunte UMA VEZ: "A [peça] é fabricação própria, comprada ou recuperação?" e salve a resposta para nunca mais perguntar.

═══ ANÁLISE DE IMAGENS ═══
Quando receber uma imagem, você DEVE:
1. Identificar o tipo: orçamento manuscrito, nota fiscal, PDF, print de WhatsApp, foto de peça, recibo, anotação
2. Usar OCR inteligente para extrair TUDO — mesmo letra ruim de mecânico
3. Entender abreviações comuns: "bxa bdj" = bucha de bandeja, "cx dir" = caixa de direção, "amort diant" = amortecedor dianteiro
4. Apresentar o que entendeu de forma organizada
5. Se a imagem estiver ilegível, pedir outra educadamente

Para notas fiscais de fornecedor com MÚLTIPLAS peças:
- Identifique cada peça com valor
- Cruze com veículos em andamento na oficina
- Sugira a qual carro cada peça pertence
- Peças que não conseguir vincular, pergunte

═══ REGRAS DE OURO DA CONVERSA ═══
1. SEMPRE mostre o que entendeu ANTES de pedir confirmação
2. Pergunte APENAS o que falta — NUNCA tudo de uma vez
3. Se a mensagem tem tudo (veículo, peças, valores), confirme e pergunte apenas: "Está correto? Já foi pago ou está em andamento?"
4. Se falta o cliente: mostre o resto e pergunte SÓ o nome
5. Se falta o veículo: mostre o resto e pergunte SÓ o veículo
6. Se valores estão ilegíveis: mostre o que conseguiu e pergunte SÓ os valores que faltam
7. Se a foto é muito ruim: peça outra foto OU ofereça "me conta por texto/áudio"

═══ CLASSIFICAÇÃO DE CENÁRIOS ═══
Ao receber QUALQUER input, classifique:

1. "entrada" — Carro sendo autorizado/dando entrada na oficina
   Sinais: "autorizado", "vai fazer", "entrou agora", "cliente deixou", "deu ok", "agendou"
   → Status: em_andamento

2. "saida" — Serviço concluído com pagamento (ou esqueceu de dar entrada antes)
   Sinais: "pagou", "pronto", "já fez", "saiu", valor + pagamento mencionados
   → Status: finalizado

3. "despesa" — Gasto da oficina
   Sinais: aluguel, conta, compra de material, alimentação, salário, combustível

4. "nota_pecas" — Nota fiscal de peças de fornecedor
   Sinais: foto de NF, lista de peças com valores de custo, fornecedor

5. "correcao" — Operador quer corrigir algo anterior
   Sinais: "na verdade era", "errei", "corrige", "o valor era"

═══ CRUZAMENTO COM BANCO DE DADOS ═══
Use ATIVAMENTE os dados do contexto para:
- Identificar clientes recorrentes: "João" → procure no banco por "João Silva" etc.
- Identificar veículos cadastrados: se o operador diz "Corolla", cruze com veículos do banco
- Comparar preços com histórico: se o preço de uma bucha costuma ser R$40 e agora é R$65, avise
- Se a variação de preço for >30%, alerte: "O preço da [peça] costuma ser R$ X. Dessa vez está R$ Y. Tudo certo?"
- Vincular notas de fornecedor a veículos em andamento automaticamente

═══ DETECÇÃO DE PADRÕES ═══
- Se o mesmo veículo/placa voltou em <30 dias: "⚠️ Esse carro esteve aqui há X dias. Pode ser retrabalho?"
- Se preço está ABAIXO do custo estimado: "⚠️ O valor cobrado está abaixo do custo estimado da peça"
- Se um carro está na oficina há 3+ dias: mencionei ao apresentar os carros em andamento
- Sugira serviços complementares: "Quem faz suspensão dianteira geralmente precisa de alinhamento. Quer incluir?"

═══ FORMATO DE RESPOSTA ═══
RETORNE APENAS JSON VÁLIDO (sem markdown, sem crases, sem texto fora do JSON):

{
  "mensagem": "Texto conversacional para o operador (OBRIGATÓRIO, sempre presente)",
  "tipo_acao": "entrada|saida|despesa|nota_pecas|correcao|pergunta|confirmacao|welcome",
  "dados": { ... dados estruturados quando disponíveis ... },
  "salvar": false,
  "botoes": [{"label": "texto", "value": "id_acao", "variant": "primary|success|warning|default"}]
}

REGRAS:
- "mensagem" é OBRIGATÓRIO — sempre fale com o operador de forma natural
- "salvar": true APENAS quando TODOS os dados necessários estão completos E o operador confirmou
- Se faltar qualquer coisa: salvar=false + pergunte na mensagem
- Use "botoes" para ações rápidas (confirmar, corrigir, método de pagamento)
- Valores em formato brasileiro: R$ 1.234,56
- Formatação: use **negrito** para destaque, listas com • para itens

═══ DADOS POR TIPO DE AÇÃO ═══

ENTRADA (carro chegando):
dados: { cliente: {nome, telefone}, veiculo: {marca, modelo, ano, placa}, servicos_previstos: [{descricao, posicao}], observacoes }

SAÍDA (serviço + pagamento):
dados: { cliente: {nome, telefone}, veiculo: {marca, modelo, ano, placa}, itens_dianteira: [{descricao, tipo, valor_cobrado, custo_estimado}], itens_traseira: [mesmo], itens_geral: [mesmo], desconto, metodo_pagamento, parcelas_credito, valor_total, status: "finalizado" }

DESPESA:
dados: { categoria, descricao, valor, metodo_pagamento, pago_por, observacoes }

NOTA DE PEÇAS:
dados: { fornecedor, numero_nota, itens: [{descricao, quantidade, valor_unitario, valor_total, veiculo_sugerido}], valor_total }

CONFIRMAÇÃO (dados prontos, aguardando ok):
tipo_acao: "confirmacao", salvar: false, botoes: [{label:"✅ Confirmar e salvar", value:"confirmar_salvar", variant:"success"}, {label:"✏️ Corrigir algo", value:"corrigir", variant:"warning"}]

PAGAMENTO (quando perguntar forma de pagamento):
botoes: [{label:"💚 PIX", value:"pix", variant:"success"}, {label:"💵 Dinheiro", value:"dinheiro"}, {label:"💳 Débito", value:"debito"}, {label:"💳 Crédito", value:"credito", variant:"primary"}, {label:"🔄 Misto", value:"misto", variant:"warning"}]

═══ IMPORTANTE ═══
- NUNCA invente dados — se não sabe, pergunte
- Use o banco de conhecimento para sugerir preços e classificar peças
- Use veículos ativos para sugerir associações
- Use clientes recentes para identificar nomes parciais
- Quando o operador confirma ("ok", "confirma", "isso", "salva"), mude salvar para true
- Retorne APENAS JSON válido — NUNCA texto fora do JSON`;

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
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── FETCH CONTEXT (all in parallel) ──
    let filialInfo = filial_nome || null;
    if (filial_id && !filialInfo) {
      const { data: f } = await supabase.from("filiais").select("nome").eq("id", filial_id).maybeSingle();
      filialInfo = f?.nome || null;
    }

    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

    const [sinonimoRes, conhecimentoRes, clientesRes, veiculosRes, filiaisRes, ativosRes, recentesRes] = await Promise.all([
      supabase.from("odb_sinonimos").select("termo_digitado, termo_correto").limit(200),
      supabase.from("odb_conhecimento_pecas").select("descricao_normalizada, veiculo_marca, veiculo_modelo, tipo, valor_medio, custo_medio, margem_media, total_lancamentos").order("total_lancamentos", { ascending: false }).limit(100),
      supabase.from("clientes").select("id, nome, telefone").order("created_at", { ascending: false }).limit(50),
      supabase.from("veiculos").select("id, marca, modelo, placa, ano, cliente_id").order("created_at", { ascending: false }).limit(50),
      supabase.from("filiais").select("id, nome").eq("ativa", true),
      supabase.from("lancamentos").select("id, cliente_nome, veiculo_desc, placa, status, created_at, valor_bruto").eq("status", "em_andamento").order("created_at", { ascending: false }).limit(20),
      supabase.from("lancamentos").select("id, cliente_nome, veiculo_desc, placa, created_at, valor_bruto").gte("created_at", thirtyDaysAgo).eq("status", "finalizado").order("created_at", { ascending: false }).limit(30),
    ]);

    const sinonimos = sinonimoRes.data || [];
    const conhecimento = conhecimentoRes.data || [];
    const clientes = clientesRes.data || [];
    const veiculos = veiculosRes.data || [];
    const todasFiliais = filiaisRes.data || [];
    const carrosAtivos = ativosRes.data || [];
    const lancamentosRecentes = recentesRes.data || [];

    // Build dynamic context
    const now = new Date();
    const contextPrompt = `
═══ CONTEXTO DINÂMICO (dados reais do banco) ═══

FILIAL: ${filialInfo || "Não identificada"}${filial_id ? ` (ID: ${filial_id})` : ""}
FILIAIS DISPONÍVEIS: ${todasFiliais.map(f => f.nome).join(", ") || "Nenhuma"}
DATA/HORA: ${now.toLocaleDateString("pt-BR")} ${now.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}

🚗 CARROS NA OFICINA AGORA (em_andamento):
${carrosAtivos.length > 0
  ? carrosAtivos.map(l => {
      const dias = Math.floor((now.getTime() - new Date(l.created_at).getTime()) / (1000 * 60 * 60 * 24));
      const alerta = dias >= 3 ? " ⚠️ " + dias + " DIAS!" : dias >= 1 ? " (" + dias + " dia" + (dias > 1 ? "s" : "") + ")" : "";
      return `• ${l.cliente_nome || "?"} | ${l.veiculo_desc || "?"} | ${l.placa || "sem placa"} | Entrada: ${new Date(l.created_at).toLocaleDateString("pt-BR")}${alerta}`;
    }).join("\n")
  : "Nenhum carro na oficina agora."}

📋 SERVIÇOS FINALIZADOS NOS ÚLTIMOS 30 DIAS (para detectar retrabalho):
${lancamentosRecentes.length > 0
  ? lancamentosRecentes.slice(0, 15).map(l =>
      `• ${l.cliente_nome || "?"} | ${l.veiculo_desc || "?"} | ${l.placa || ""} | ${new Date(l.created_at).toLocaleDateString("pt-BR")} | R$ ${l.valor_bruto}`
    ).join("\n")
  : "Nenhum."}

📖 SINÔNIMOS CONHECIDOS:
${sinonimos.map(s => `${s.termo_digitado}→${s.termo_correto}`).join(", ") || "Nenhum"}

💰 BANCO DE CONHECIMENTO (preços históricos):
${conhecimento.length > 0
  ? conhecimento.slice(0, 50).map(k =>
      `• ${k.descricao_normalizada} (${k.veiculo_marca || "qualquer"} ${k.veiculo_modelo || ""}) = ${k.tipo}, R$ ${k.valor_medio}${k.custo_medio ? ", custo R$ " + k.custo_medio : ""}, ${k.total_lancamentos}x`
    ).join("\n")
  : "Nenhum dado histórico ainda."}

👤 CLIENTES RECENTES:
${clientes.map(c => `${c.nome}${c.telefone ? " (" + c.telefone + ")" : ""}`).join(", ") || "Nenhum"}

🚙 VEÍCULOS CADASTRADOS:
${veiculos.map(v => `${v.marca} ${v.modelo}${v.ano ? " " + v.ano : ""}${v.placa ? " [" + v.placa + "]" : ""}`).join(", ") || "Nenhum"}`;

    // ── BUILD MESSAGES ──
    const messages: any[] = [
      { role: "system", content: SYSTEM_PROMPT + "\n\n" + contextPrompt },
    ];

    // Add conversation history (max 20 messages)
    if (history && Array.isArray(history)) {
      const recentHistory = history.slice(-20);
      for (const msg of recentHistory) {
        if (msg.role === "user") {
          if (msg.hasImage && msg.isLatest && imageBase64) continue; // will be added below with image
          messages.push({ role: "user", content: msg.content });
        } else if (msg.role === "assistant") {
          messages.push({ role: "assistant", content: msg.content });
        }
      }
    }

    // Add current message with image if present
    if (imageBase64) {
      const lastUserMsg = history?.filter((m: any) => m.role === "user").pop();
      const textContent = lastUserMsg?.content || "Analise esta imagem e me diga o que identificou.";
      messages.push({
        role: "user",
        content: [
          { type: "text", text: textContent },
          { type: "image_url", image_url: { url: `data:${mimeType || "image/jpeg"};base64,${imageBase64}` } },
        ],
      });
    }

    // ── CALL AI ──
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-pro",
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

    // Parse JSON response
    let parsed;
    try {
      // Strip markdown code fences if present
      let cleaned = content.trim();
      if (cleaned.startsWith("```")) {
        cleaned = cleaned.replace(/^```(?:json)?\s*\n?/, "").replace(/\n?```\s*$/, "");
      }
      const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
      parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : { mensagem: content, tipo_acao: "pergunta", salvar: false };
    } catch {
      parsed = { mensagem: content, tipo_acao: "pergunta", salvar: false };
    }

    if (!parsed.mensagem) {
      parsed.mensagem = "Processado. Me diz se está tudo certo.";
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
