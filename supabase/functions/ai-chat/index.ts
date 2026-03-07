import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { message, history } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const sb = createClient(supabaseUrl, supabaseKey);

    const now = new Date();
    const thirtyDaysAgo = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 30).toISOString();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();

    const [lancRes, despRes, fechRes, sociosRes, filiaisRes] = await Promise.all([
      sb.from("lancamentos").select("valor_bruto, custo_total, lucro, desconto, taxa_valor, metodo_pagamento, cliente_nome, veiculo_desc, created_at, filial_id").gte("created_at", thirtyDaysAgo).order("created_at", { ascending: false }).limit(500),
      sb.from("despesas").select("valor, categoria, subcategoria, created_at").gte("created_at", thirtyDaysAgo).limit(300),
      sb.from("fechamentos_diarios").select("*").order("data", { ascending: false }).limit(30),
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
    const lucroBruto = totalReceita - totalCusto;
    const lucroLiquido = totalReceita - totalCusto - totalDespesas - totalTaxas - totalDesconto;
    const totalServicos = lancamentos.length;

    const lancHoje = lancamentos.filter(l => l.created_at >= today);
    const receitaHoje = lancHoje.reduce((s, l) => s + Number(l.valor_bruto), 0);
    const servicosHoje = lancHoje.length;

    const catMap = new Map<string, number>();
    despesas.forEach(d => catMap.set(d.categoria, (catMap.get(d.categoria) || 0) + Number(d.valor)));
    const despCategories = Array.from(catMap.entries()).map(([c, v]) => `${c}: R$${v.toFixed(2)}`).join(", ");

    const pmMap = new Map<string, { qty: number; total: number }>();
    lancamentos.forEach(l => {
      const m = l.metodo_pagamento || "Outro";
      const c = pmMap.get(m) || { qty: 0, total: 0 };
      c.qty++; c.total += Number(l.valor_bruto);
      pmMap.set(m, c);
    });
    const pmBreakdown = Array.from(pmMap.entries()).map(([m, v]) => `${m}: ${v.qty}x R$${v.total.toFixed(2)}`).join(", ");

    const context = `DADOS FINANCEIROS (últimos 30 dias):
- Receita bruta: R$${totalReceita.toFixed(2)}
- Custo total: R$${totalCusto.toFixed(2)}
- Lucro bruto: R$${lucroBruto.toFixed(2)}
- Despesas: R$${totalDespesas.toFixed(2)}
- Taxas de máquina: R$${totalTaxas.toFixed(2)}
- Descontos: R$${totalDesconto.toFixed(2)}
- Lucro líquido: R$${lucroLiquido.toFixed(2)}
- Total de serviços: ${totalServicos}
- Ticket médio: R$${totalServicos > 0 ? (totalReceita / totalServicos).toFixed(2) : "0.00"}
- Margem bruta: ${totalReceita > 0 ? ((lucroBruto / totalReceita) * 100).toFixed(1) : "0"}%

HOJE:
- Receita: R$${receitaHoje.toFixed(2)} (${servicosHoje} serviços)

DESPESAS POR CATEGORIA: ${despCategories || "Nenhuma"}
MÉTODOS DE PAGAMENTO: ${pmBreakdown || "Nenhum"}
FILIAIS: ${filiais.map(f => f.nome).join(", ") || "Nenhuma"}
SÓCIOS: ${socios.map(s => `${s.nome} (${s.percentual_lucro}%)`).join(", ") || "Nenhum"}
FECHAMENTOS RECENTES: ${fechamentos.slice(0, 7).map(f => `${f.data}: Receita R$${Number(f.receita_bruta).toFixed(2)}, Lucro R$${Number(f.lucro_liquido).toFixed(2)}`).join(" | ") || "Nenhum"}`;

    const messages = [
      {
        role: "system",
        content: `Você é o assistente financeiro inteligente da "Oficina da Borracha", uma rede de oficinas mecânicas especializadas em borrachas automotivas (buchas, coxins, bieletas, pivôs, etc). Responda sempre em português brasileiro, de forma clara e direta. Use dados reais para embasar suas respostas. Formate com markdown quando útil (negrito, listas, tabelas simples). Seja proativo com insights e sugestões práticas.

${context}`
      },
      ...(history || []).map((h: any) => ({ role: h.role, content: h.content })),
      { role: "user", content: message },
    ];

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

    if (!response.ok) {
      const status = response.status;
      if (status === 429) return new Response(JSON.stringify({ error: "Limite de requisições. Tente novamente em alguns segundos." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (status === 402) return new Response(JSON.stringify({ error: "Créditos insuficientes." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      return new Response(JSON.stringify({ error: "Erro ao processar sua pergunta." }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("ai-chat error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
