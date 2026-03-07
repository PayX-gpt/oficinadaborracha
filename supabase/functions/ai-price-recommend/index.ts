import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { servicoDescricao, veiculoDescricao } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    // Fetch historical data for similar services
    const { data: items } = await sb.from("lancamento_items").select("descricao, valor_cobrado, custo, tipo, lancamento_id").limit(1000);
    const { data: lancamentos } = await sb.from("lancamentos").select("id, veiculo_desc, valor_bruto, custo_total, lucro, tempo_servico_minutos").limit(1000);

    // Build context
    const lancMap = new Map<string, any>();
    (lancamentos || []).forEach(l => lancMap.set(l.id, l));

    const relevantItems = (items || []).map(it => ({
      ...it,
      lancamento: lancMap.get(it.lancamento_id),
    }));

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        tools: [{
          type: "function",
          function: {
            name: "recommend_price",
            description: "Recomenda preços para serviços da oficina",
            parameters: {
              type: "object",
              properties: {
                precoSugerido: { type: "number", description: "Preço sugerido em R$" },
                precoMinimo: { type: "number", description: "Preço mínimo aceitável em R$" },
                precoMaximo: { type: "number", description: "Preço máximo praticável em R$" },
                margemEstimada: { type: "number", description: "Margem estimada em %" },
                justificativa: { type: "string", description: "Explicação da recomendação" },
                servicosSimilares: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      descricao: { type: "string" },
                      preco: { type: "number" },
                      margem: { type: "number" },
                    },
                    required: ["descricao", "preco", "margem"],
                    additionalProperties: false,
                  },
                },
              },
              required: ["precoSugerido", "precoMinimo", "precoMaximo", "margemEstimada", "justificativa", "servicosSimilares"],
              additionalProperties: false,
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "recommend_price" } },
        messages: [
          {
            role: "system",
            content: `Você é um consultor de preços da "Oficina da Borracha" (borrachas automotivas). Analise o histórico e recomende preços competitivos com boa margem. Considere: preços históricos, margem média, tipo de veículo e complexidade do serviço.`,
          },
          {
            role: "user",
            content: `Preciso de recomendação de preço para:
Serviço: ${servicoDescricao || "Não especificado"}
Veículo: ${veiculoDescricao || "Não especificado"}

Histórico de itens (últimos registros):
${JSON.stringify(relevantItems.slice(0, 100), null, 2)}`,
          },
        ],
      }),
    });

    if (!response.ok) {
      const status = response.status;
      if (status === 429) return new Response(JSON.stringify({ error: "Rate limit" }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (status === 402) return new Response(JSON.stringify({ error: "Créditos insuficientes" }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      return new Response(JSON.stringify({ error: "Erro ao gerar recomendação" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    let result;
    if (toolCall?.function?.arguments) {
      try { result = JSON.parse(toolCall.function.arguments); } catch { result = null; }
    }
    if (!result) {
      result = { precoSugerido: 0, precoMinimo: 0, precoMaximo: 0, margemEstimada: 0, justificativa: "Não foi possível gerar recomendação.", servicosSimilares: [] };
    }

    return new Response(JSON.stringify({ result }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("ai-price-recommend error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
