import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { financialData } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        tools: [
          {
            type: "function",
            function: {
              name: "generate_insights",
              description: "Gera insights financeiros acionáveis para a oficina",
              parameters: {
                type: "object",
                properties: {
                  insights: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        type: { type: "string", enum: ["alert", "opportunity", "trend", "savings", "recommendation"] },
                        title: { type: "string" },
                        description: { type: "string" },
                        action: { type: "string" }
                      },
                      required: ["type", "title", "description", "action"],
                      additionalProperties: false
                    }
                  },
                  summary: { type: "string" },
                  healthScore: { type: "number" }
                },
                required: ["insights", "summary", "healthScore"],
                additionalProperties: false
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "generate_insights" } },
        messages: [
          {
            role: "system",
            content: `Você é um consultor financeiro especializado em oficinas mecânicas de borrachas automotivas. Analise os dados financeiros e gere insights acionáveis. Foque em: margens, tendências, oportunidades de economia, alertas de despesas, e recomendações estratégicas. Seja específico com números.`
          },
          {
            role: "user",
            content: `Dados financeiros do período:\n${JSON.stringify(financialData, null, 2)}\n\nGere 3-5 insights acionáveis, um resumo executivo e um score de saúde financeira (0-100).`
          }
        ],
      }),
    });

    if (!response.ok) {
      const status = response.status;
      if (status === 429) return new Response(JSON.stringify({ error: "Rate limit exceeded." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (status === 402) return new Response(JSON.stringify({ error: "Créditos insuficientes." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      return new Response(JSON.stringify({ error: "Erro ao gerar insights" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const data = await response.json();
    
    // Extract from tool call
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    let result;
    if (toolCall?.function?.arguments) {
      try {
        result = JSON.parse(toolCall.function.arguments);
      } catch {
        result = { insights: [], summary: "Erro ao processar análise.", healthScore: 50 };
      }
    } else {
      // Fallback: try to parse content
      const content = data.choices?.[0]?.message?.content || "";
      try {
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        result = jsonMatch ? JSON.parse(jsonMatch[0]) : { insights: [], summary: content, healthScore: 50 };
      } catch {
        result = { insights: [], summary: content || "Análise indisponível.", healthScore: 50 };
      }
    }

    return new Response(JSON.stringify({ result }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("ai-insights error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
