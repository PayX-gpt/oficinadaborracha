import { useState } from "react";
import { motion } from "framer-motion";
import { Bot, Sparkles, AlertTriangle, TrendingUp, BarChart3, PiggyBank, Lightbulb, Loader2, CheckCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useDashboardData } from "@/hooks/useDashboardData";
import { toast } from "sonner";

const typeConfig: Record<string, { icon: any; label: string; border: string; bg: string }> = {
  alert: { icon: AlertTriangle, label: "ALERTA", border: "border-primary/30", bg: "bg-primary/10" },
  opportunity: { icon: TrendingUp, label: "OPORTUNIDADE", border: "border-success/30", bg: "bg-success/10" },
  trend: { icon: BarChart3, label: "TENDÊNCIA", border: "border-chrome/30", bg: "bg-chrome/10" },
  savings: { icon: PiggyBank, label: "ECONOMIA", border: "border-gold/30", bg: "bg-gold/10" },
  recommendation: { icon: Lightbulb, label: "DICA", border: "border-gold/30", bg: "bg-gold/10" },
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
      toast.success("Insights gerados!");
    } catch (err: any) {
      toast.error("Erro: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.0, duration: 0.4 }}
      className="rounded-xl p-3 md:p-6 transition-all duration-300 overflow-hidden"
      style={{ background: "rgba(14,20,35,0.85)", backdropFilter: "blur(16px)", border: "1px solid rgba(245,158,11,0.08)", boxShadow: "0 4px 24px rgba(0,0,0,0.3), 0 0 0 1px rgba(255,255,255,0.03)" }}>
      
      <div className="flex items-center justify-between gap-2 mb-3">
        <h3 className="text-[11px] uppercase tracking-[0.05em] text-muted-foreground font-medium flex items-center gap-1.5 min-w-0">
          <Bot className="h-3.5 w-3.5 text-primary shrink-0" />
          <span className="truncate">IA — Análise</span>
        </h3>
        <button onClick={generateInsights} disabled={loading}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-medium bg-primary/20 text-primary border border-primary/30 hover:bg-primary/30 transition-colors disabled:opacity-50 shrink-0 whitespace-nowrap">
          {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
          {loading ? "Analisando..." : loaded ? "Atualizar" : "Gerar Insights"}
        </button>
      </div>

      {!loaded && !loading ? (
        <div className="text-center py-6 space-y-2">
          <Sparkles className="h-8 w-8 text-primary/30 mx-auto" />
          <p className="text-xs text-muted-foreground">Clique para a IA analisar seus dados</p>
        </div>
      ) : loading ? (
        <div className="text-center py-6 space-y-2">
          <Loader2 className="h-6 w-6 animate-spin text-primary mx-auto" />
          <p className="text-xs text-muted-foreground">Analisando...</p>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="space-y-2">
            {insights.filter((_, i) => !dismissed.has(i)).map((insight, i) => {
              const config = typeConfig[insight.type] || typeConfig.recommendation;
              const Icon = config.icon;
              return (
                <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
                  className={`rounded-xl p-3 border ${config.border} space-y-1.5`} style={{ background: "rgba(14,20,35,0.5)" }}>
                  <div className="flex items-center justify-between">
                    <span className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${config.bg}`}>
                      <Icon className="h-3 w-3" />{config.label}
                    </span>
                    <button onClick={() => setDismissed((p) => new Set(p).add(i))} className="text-[9px] text-muted-foreground hover:text-foreground flex items-center gap-0.5">
                      <CheckCircle className="h-3 w-3" /> OK
                    </button>
                  </div>
                  <p className="text-xs font-semibold text-foreground">{insight.title}</p>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">{insight.description}</p>
                  <p className="text-[11px] text-primary font-medium">{insight.action}</p>
                </motion.div>
              );
            })}
          </div>
          {summary && (
            <div className="rounded-xl p-3 bg-secondary/20 border border-border/30">
              <p className="text-[10px] uppercase tracking-[0.05em] text-muted-foreground font-medium mb-1.5">Resumo Executivo</p>
              <p className="text-[11px] text-foreground leading-relaxed">{summary}</p>
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
};

export default AIInsights;
