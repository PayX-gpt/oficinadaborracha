import { useState } from "react";
import { motion } from "framer-motion";
import { Bot, Sparkles, AlertTriangle, TrendingUp, BarChart3, PiggyBank, Lightbulb, Loader2, CheckCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useDashboardData } from "@/hooks/useDashboardData";
import { toast } from "sonner";

const typeConfig: Record<string, { icon: any; label: string; border: string; bg: string }> = {
  alert: { icon: AlertTriangle, label: "ALERTA", border: "border-red-500/30", bg: "bg-red-500/10" },
  opportunity: { icon: TrendingUp, label: "OPORTUNIDADE", border: "border-emerald-500/30", bg: "bg-emerald-500/10" },
  trend: { icon: BarChart3, label: "TENDÊNCIA", border: "border-blue-500/30", bg: "bg-blue-500/10" },
  savings: { icon: PiggyBank, label: "ECONOMIA", border: "border-primary/30", bg: "bg-primary/10" },
  recommendation: { icon: Lightbulb, label: "RECOMENDAÇÃO", border: "border-violet-500/30", bg: "bg-violet-500/10" },
};

interface AIInsight {
  type: string;
  title: string;
  description: string;
  action: string;
}

const AIInsights = () => {
  const { data: dashData } = useDashboardData("30 Dias");
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [summary, setSummary] = useState("");
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [dismissed, setDismissed] = useState<Set<number>>(new Set());

  const generateInsights = async () => {
    if (!dashData) { toast.error("Carregando dados..."); return; }
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("ai-insights", {
        body: {
          financialData: {
            totalReceita: dashData.totalReceita,
            totalCusto: dashData.totalCusto,
            totalDespesas: dashData.totalDespesas,
            lucroBruto: dashData.lucroBruto,
            lucroLiquido: dashData.lucroLiquido,
            totalServicos: dashData.totalServicos,
            ticketMedio: dashData.ticketMedio,
            totalTaxas: dashData.totalTaxas,
            totalDesconto: dashData.totalDesconto,
          }
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setInsights(data.result?.insights || []);
      setSummary(data.result?.summary || "");
      setLoaded(true);
      toast.success("Insights gerados pela IA!");
    } catch (err: any) {
      toast.error("Erro: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.0, duration: 0.4 }}
      className="rounded-2xl p-4 md:p-6 transition-all duration-300"
      style={{ background: "rgba(14,20,35,0.85)", backdropFilter: "blur(16px)", border: "1px solid rgba(245,158,11,0.08)", boxShadow: "0 4px 24px rgba(0,0,0,0.3), 0 0 0 1px rgba(255,255,255,0.03)" }}>
      
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-[11px] uppercase tracking-[0.05em] text-muted-foreground font-medium flex items-center gap-2">
          <Bot className="h-4 w-4 text-primary" />
          Inteligência Artificial — Análise do Período
        </h3>
        <button onClick={generateInsights} disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-primary/20 text-primary border border-primary/30 hover:bg-primary/30 transition-colors disabled:opacity-50">
          {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
          {loading ? "Analisando..." : loaded ? "Atualizar" : "Gerar Insights"}
        </button>
      </div>

      {!loaded && !loading ? (
        <div className="text-center py-8 space-y-3">
          <Sparkles className="h-10 w-10 text-primary/30 mx-auto" />
          <p className="text-sm text-muted-foreground">Clique em "Gerar Insights" para a IA analisar seus dados financeiros</p>
        </div>
      ) : loading ? (
        <div className="text-center py-8 space-y-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
          <p className="text-sm text-muted-foreground">Analisando dados financeiros...</p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {insights.filter((_, i) => !dismissed.has(i)).map((insight, i) => {
              const config = typeConfig[insight.type] || typeConfig.recommendation;
              const Icon = config.icon;
              return (
                <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
                  className={`rounded-xl p-4 border ${config.border} space-y-2`} style={{ background: "rgba(14,20,35,0.5)" }}>
                  <div className="flex items-center justify-between">
                    <span className={`flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase ${config.bg}`}>
                      <Icon className="h-3 w-3" />{config.label}
                    </span>
                    <button onClick={() => setDismissed((p) => new Set(p).add(i))} className="text-[10px] text-muted-foreground hover:text-foreground flex items-center gap-1">
                      <CheckCircle className="h-3 w-3" /> Entendi
                    </button>
                  </div>
                  <p className="text-sm font-semibold text-foreground">{insight.title}</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">{insight.description}</p>
                  <p className="text-xs text-primary font-medium">{insight.action}</p>
                </motion.div>
              );
            })}
          </div>
          {summary && (
            <div className="rounded-xl p-4 bg-secondary/20 border border-border/30">
              <p className="text-[11px] uppercase tracking-[0.05em] text-muted-foreground font-medium mb-2">Resumo Executivo</p>
              <p className="text-xs text-foreground leading-relaxed">{summary}</p>
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
};

export default AIInsights;
