import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const sb = createClient(supabaseUrl, supabaseKey);

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    const sevenDaysAgo = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7).toISOString();

    const [lancRes, despRes, fechRes] = await Promise.all([
      sb.from("lancamentos").select("valor_bruto, custo_total, lucro, desconto, taxa_valor, metodo_pagamento, created_at").gte("created_at", sevenDaysAgo).order("created_at", { ascending: false }),
      sb.from("despesas").select("valor, categoria, created_at").gte("created_at", sevenDaysAgo),
      sb.from("fechamentos_diarios").select("data, lucro_liquido, receita_bruta").order("data", { ascending: false }).limit(14),
    ]);

    const lancamentos = lancRes.data || [];
    const despesas = despRes.data || [];
    const fechamentos = fechRes.data || [];
    const alerts: { tipo: string; titulo: string; mensagem: string }[] = [];

    // 1. Check if today has zero revenue
    const lancHoje = lancamentos.filter(l => l.created_at >= today);
    if (lancHoje.length === 0 && now.getHours() >= 12) {
      alerts.push({ tipo: "alerta", titulo: "Sem faturamento hoje", mensagem: `Já são ${now.getHours()}h e nenhum serviço foi registrado. Verifique a operação.` });
    }

    // 2. Low margin alert
    const totalReceita7d = lancamentos.reduce((s, l) => s + Number(l.valor_bruto), 0);
    const totalCusto7d = lancamentos.reduce((s, l) => s + Number(l.custo_total), 0);
    const margem7d = totalReceita7d > 0 ? ((totalReceita7d - totalCusto7d) / totalReceita7d) * 100 : 0;
    if (margem7d < 30 && totalReceita7d > 0) {
      alerts.push({ tipo: "alerta", titulo: "Margem bruta abaixo de 30%", mensagem: `Margem dos últimos 7 dias: ${margem7d.toFixed(1)}%. Revise os preços cobrados e custos de peças.` });
    }

    // 3. High discount rate
    const totalDesconto = lancamentos.reduce((s, l) => s + Number(l.desconto), 0);
    const descontoPercent = totalReceita7d > 0 ? (totalDesconto / totalReceita7d) * 100 : 0;
    if (descontoPercent > 10 && totalReceita7d > 0) {
      alerts.push({ tipo: "insight", titulo: "Taxa de desconto elevada", mensagem: `${descontoPercent.toFixed(1)}% da receita está sendo dada em desconto. Considere reduzir promoções.` });
    }

    // 4. Expense spike
    const totalDesp = despesas.reduce((s, d) => s + Number(d.valor), 0);
    if (totalDesp > totalReceita7d * 0.4 && totalReceita7d > 0) {
      alerts.push({ tipo: "alerta", titulo: "Despesas acima de 40% da receita", mensagem: `Despesas (R$${totalDesp.toFixed(2)}) representam ${((totalDesp / totalReceita7d) * 100).toFixed(0)}% da receita. Analise as categorias.` });
    }

    // 5. Positive trend
    if (fechamentos.length >= 3) {
      const last3 = fechamentos.slice(0, 3);
      const allPositive = last3.every(f => Number(f.lucro_liquido) > 0);
      if (allPositive) {
        alerts.push({ tipo: "sucesso", titulo: "Sequência positiva!", mensagem: `Os últimos ${last3.length} fechamentos tiveram lucro líquido positivo. Continue assim!` });
      }
    }

    // Insert new alerts (avoid duplicates by checking recent)
    const { data: recent } = await sb.from("notificacoes").select("titulo").gte("created_at", today).limit(50);
    const existingTitles = new Set((recent || []).map((r: any) => r.titulo));

    let inserted = 0;
    for (const alert of alerts) {
      if (!existingTitles.has(alert.titulo)) {
        await sb.from("notificacoes").insert({
          tipo: alert.tipo,
          titulo: alert.titulo,
          mensagem: alert.mensagem,
          user_id: null, // Global alert
        });
        inserted++;
      }
    }

    return new Response(JSON.stringify({ checked: alerts.length, inserted, alerts }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("smart-alerts error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
