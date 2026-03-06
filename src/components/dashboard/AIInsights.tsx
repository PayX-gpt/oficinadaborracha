import { motion } from "framer-motion";
import { Sparkles, AlertTriangle, TrendingUp, BarChart3, Lightbulb } from "lucide-react";
import { PiggyBank } from "lucide-react";
import { mockAIInsights } from "@/lib/mockDashboardData";

const typeConfig = {
  alert: { icon: AlertTriangle, border: "border-red-500/30", bg: "bg-red-500/5", badge: "bg-red-500/20 text-red-400", label: "ALERTA" },
  opportunity: { icon: TrendingUp, border: "border-emerald-500/30", bg: "bg-emerald-500/5", badge: "bg-emerald-500/20 text-emerald-400", label: "OPORTUNIDADE" },
  trend: { icon: BarChart3, border: "border-blue-500/30", bg: "bg-blue-500/5", badge: "bg-blue-500/20 text-blue-400", label: "TENDÊNCIA" },
  savings: { icon: PiggyBank, border: "border-primary/30", bg: "bg-primary/5", badge: "bg-primary/20 text-primary", label: "ECONOMIA" },
  recommendation: { icon: Lightbulb, border: "border-violet-500/30", bg: "bg-violet-500/5", badge: "bg-violet-500/20 text-violet-400", label: "RECOMENDAÇÃO" },
};

const AIInsights = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 1, duration: 0.4 }}
      className="rounded-2xl p-6 transition-all duration-300"
      style={{
        background: "rgba(14,20,35,0.85)",
        backdropFilter: "blur(16px)",
        border: "1px solid rgba(245,158,11,0.08)",
        boxShadow: "0 4px 24px rgba(0,0,0,0.3), 0 0 0 1px rgba(255,255,255,0.03)",
      }}
    >
      <div className="flex items-center gap-2 mb-4">
        <motion.div animate={{ rotate: [0, 15, -15, 0] }} transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}>
          <Sparkles className="h-4 w-4 text-primary" />
        </motion.div>
        <h3 className="text-[11px] uppercase tracking-[0.05em] text-muted-foreground font-medium">🤖 Inteligência Artificial — Análise do Período</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
        {mockAIInsights.map((insight, i) => {
          const cfg = typeConfig[insight.type];
          const Icon = cfg.icon;
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 1.1 + i * 0.05 }}
              className={`rounded-xl p-4 border ${cfg.border} ${cfg.bg} space-y-2`}
            >
              <div className="flex items-center gap-2">
                <Icon className="h-3.5 w-3.5" />
                <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${cfg.badge}`}>{cfg.label}</span>
              </div>
              <p className="text-sm font-medium text-foreground">{insight.title}</p>
              <p className="text-xs text-muted-foreground leading-relaxed">{insight.desc}</p>
              <p className="text-[11px] text-primary">💡 {insight.action}</p>
            </motion.div>
          );
        })}
      </div>

      <div className="rounded-xl p-4 bg-secondary/20 border border-border/50">
        <p className="text-[11px] uppercase tracking-[0.05em] text-muted-foreground font-medium mb-2">Resumo Executivo da IA</p>
        <p className="text-xs text-muted-foreground leading-relaxed">
          A Oficina da Borracha está operando com saúde financeira acima da média. A fabricação própria de borrachas é o principal diferencial competitivo, com ROI de 6.7x. Recomenda-se atenção ao aumento de despesas com energia e renegociação de preços em serviços de baixa margem como pastilhas de freio.
        </p>
      </div>
    </motion.div>
  );
};

export default AIInsights;
