import { motion } from "framer-motion";
import { DollarSign, TrendingUp, Wallet, ArrowDownCircle, Receipt, Clock } from "lucide-react";
import AnimatedCounter from "./AnimatedCounter";
import type { DashboardData } from "@/hooks/useDashboardData";

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.05 } } };
const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { duration: 0.4 } } };

const KPICards = ({ data }: { data?: DashboardData }) => {
  const kpis = [
    { label: "RECEITA BRUTA", icon: DollarSign, color: "text-primary", value: data?.totalReceita ?? 0, prefix: "R$ ", sub: `${data?.totalServicos ?? 0} serviços` },
    { label: "LUCRO BRUTO", icon: TrendingUp, color: "text-emerald-500", value: data?.lucroBruto ?? 0, prefix: "R$ ", sub: data?.totalReceita ? `Margem: ${((data.lucroBruto / data.totalReceita) * 100).toFixed(1)}%` : "Margem: —" },
    { label: "LUCRO LÍQUIDO", icon: Wallet, color: "text-blue-500", value: data?.lucroLiquido ?? 0, prefix: "R$ ", sub: "Após despesas, taxas e custos", glow: true },
    { label: "DESPESAS TOTAIS", icon: ArrowDownCircle, color: "text-red-500", value: data?.totalDespesas ?? 0, prefix: "R$ ", sub: `${data?.despesas?.length ?? 0} lançamentos` },
    { label: "TICKET MÉDIO", icon: Receipt, color: "text-cyan-500", value: data?.ticketMedio ?? 0, prefix: "R$ ", sub: "Receita ÷ serviços" },
    { label: "GANHO POR HORA", icon: Clock, color: "text-violet-500", value: data?.totalServicos ? (data.lucroLiquido / (data.totalServicos * 0.5)) : 0, prefix: "R$ ", suffix: "/h", sub: "Base: 8h/dia útil" },
  ];

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
      {kpis.map((kpi) => {
        const isPositive = kpi.value >= 0;
        const glowColor = kpi.glow ? (isPositive ? "rgba(16,185,129,0.15)" : "rgba(239,68,68,0.15)") : undefined;
        return (
          <motion.div key={kpi.label} variants={item}
            className="group relative rounded-2xl p-4 space-y-2 transition-all duration-300"
            style={{
              background: "rgba(14,20,35,0.85)", backdropFilter: "blur(16px)", border: "1px solid rgba(245,158,11,0.08)",
              boxShadow: glowColor
                ? `0 4px 24px rgba(0,0,0,0.3), 0 0 0 1px rgba(255,255,255,0.03), 0 0 20px ${glowColor}`
                : "0 4px 24px rgba(0,0,0,0.3), 0 0 0 1px rgba(255,255,255,0.03)",
            }}
            whileHover={{ borderColor: "rgba(245,158,11,0.2)" }}>
            <div className="flex items-center justify-between">
              <span className="text-[11px] uppercase tracking-[0.05em] text-muted-foreground font-medium">{kpi.label}</span>
              <kpi.icon className={`h-4 w-4 ${kpi.color}`} />
            </div>
            <div className="text-[28px] font-bold text-foreground leading-none">
              <AnimatedCounter value={kpi.value} prefix={kpi.prefix} suffix={kpi.suffix || ""} />
            </div>
            <p className="text-xs text-muted-foreground">{kpi.sub}</p>
          </motion.div>
        );
      })}
    </motion.div>
  );
};

export default KPICards;
