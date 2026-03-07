import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { tipo } = await req.json(); // "semanal" or "mensal"
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const now = new Date();
    const dias = tipo === "mensal" ? 30 : 7;
    const startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - dias).toISOString();

    const [lancRes, despRes, fechRes, sociosRes, filiaisRes] = await Promise.all([
      sb.from("lancamentos").select("valor_bruto, custo_total, lucro, desconto, taxa_valor, metodo_pagamento, veiculo_desc, created_at, filial_id, tempo_servico_minutos").gte("created_at", startDate).order("created_at", { ascending: false }).limit(1000),
      sb.from("despesas").select("valor, categoria, subcategoria, created_at").gte("created_at", startDate).limit(500),
      sb.from("fechamentos_diarios").select("*").order("data", { ascending: false }).limit(dias),
      sb.from("socios").select("nome, percentual_lucro").eq("ativo", true),
      sb.from("filiais").select("id, nome").eq("ativa", true),
    ]);

    const lancamentos = lancRes.data || [];
    const despesas = despRes.data || [];
    const fechamentos = fechRes.data || [];
    const socios = sociosRes.data || [];
    const filiais = filiaisRes.data || [];

    const totalReceita = lancamentos.reduce((s, l) => s + Number(l.valor_bruto), 0);
    const totalCusto = lancamentos.reduce((s, l) => s + Number(l.custo_total), 0);
    const totalDespesas = despesas.reduce((s, d) => s + Number(d.valor), 0);
    const totalTaxas = lancamentos.reduce((s, l) => s + Number(l.taxa_valor), 0);
    const totalDesconto = lancamentos.reduce((s, l) => s + Number(l.desconto), 0);

    const catMap = new Map<string, number>();
    despesas.forEach(d => catMap.set(d.categoria, (catMap.get(d.categoria) || 0) + Number(d.valor)));

    const pmMap = new Map<string, { qty: number; total: number }>();
    lancamentos.forEach(l => {
      const m = l.metodo_pagamento || "Outro";
      const c = pmMap.get(m) || { qty: 0, total: 0 };
      c.qty++; c.total += Number(l.valor_bruto);
      pmMap.set(m, c);
    });

    const context = `RELATÓRIO ${tipo === "mensal" ? "MENSAL" : "SEMANAL"} - Últimos ${dias} dias:
- Receita: R$${totalReceita.toFixed(2)}
- Custo: R$${totalCusto.toFixed(2)}
- Lucro bruto: R$${(totalReceita - totalCusto).toFixed(2)}
- Despesas: R$${totalDespesas.toFixed(2)}
- Taxas: R$${totalTaxas.toFixed(2)}
- Descontos: R$${totalDesconto.toFixed(2)}
- Lucro líquido: R$${(totalReceita - totalCusto - totalDespesas - totalTaxas - totalDesconto).toFixed(2)}
- Serviços: ${lancamentos.length}
- Ticket médio: R$${lancamentos.length > 0 ? (totalReceita / lancamentos.length).toFixed(2) : "0"}
- Margem bruta: ${totalReceita > 0 ? (((totalReceita - totalCusto) / totalReceita) * 100).toFixed(1) : "0"}%

DESPESAS POR CATEGORIA: ${Array.from(catMap.entries()).map(([c, v]) => `${c}: R$${v.toFixed(2)}`).join(", ") || "Nenhuma"}
PAGAMENTOS: ${Array.from(pmMap.entries()).map(([m, v]) => `${m}: ${v.qty}x R$${v.total.toFixed(2)}`).join(", ") || "Nenhum"}
FILIAIS: ${filiais.map(f => f.nome).join(", ") || "Nenhuma"}
SÓCIOS: ${socios.map(s => `${s.nome} (${s.percentual_lucro}%)`).join(", ") || "Nenhum"}
FECHAMENTOS: ${fechamentos.map(f => `${f.data}: R$${Number(f.receita_bruta).toFixed(2)} receita, R$${Number(f.lucro_liquido).toFixed(2)} lucro`).join(" | ") || "Nenhum"}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages,
        stream: true,
      }),
    });

    // Build messages for streaming
    const messages = [
      {
        role: "system",
        content: `Você é o consultor financeiro da "Oficina da Borracha". Gere um relatório ${tipo === "mensal" ? "mensal" : "semanal"} completo em markdown. Inclua:
1. **Resumo Executivo** (3-4 linhas)
2. **Indicadores Principais** (tabela com receita, custos, lucro, margem, ticket médio)
3. **Análise de Despesas** (categorias, tendências)
4. **Performance por Filial** (se houver dados)
5. **Métodos de Pagamento** (distribuição)
6. **Pontos de Atenção** (alertas, riscos)
7. **Recomendações** (3-5 ações concretas)
8. **Projeção** (estimativa para próximo período)

Use emojis moderadamente. Seja objetivo e use dados reais.`
      },
      { role: "user", content: context },
    ];

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages,
        stream: true,
      }),
    });

    if (!aiResponse.ok) {
      const status = aiResponse.status;
      if (status === 429) return new Response(JSON.stringify({ error: "Rate limit" }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (status === 402) return new Response(JSON.stringify({ error: "Créditos insuficientes" }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      return new Response(JSON.stringify({ error: "Erro ao gerar relatório" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    return new Response(aiResponse.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("ai-report error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
