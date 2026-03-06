import { motion } from "framer-motion";
import { DollarSign, TrendingUp, Wallet, ArrowDownCircle, Receipt, Clock, ArrowUp, ArrowDown } from "lucide-react";
import AnimatedCounter from "./AnimatedCounter";
import SparklineChart from "./SparklineChart";
import { mockKPIs, calcChange } from "@/lib/mockDashboardData";

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.05 } } };
const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { duration: 0.4 } } };

const kpiConfig = [
  { key: "receitaBruta" as const, label: "RECEITA BRUTA", icon: DollarSign, color: "text-primary", prefix: "R$ ", sub: (d: typeof mockKPIs.receitaBruta) => `${d.services} serviços | ${d.pecasAvulsas} peças avulsas` },
  { key: "lucroBruto" as const, label: "LUCRO BRUTO", icon: TrendingUp, color: "text-emerald-500", prefix: "R$ ", sub: (d: typeof mockKPIs.lucroBruto) => `Margem: ${d.margin}%` },
  { key: "lucroLiquido" as const, label: "LUCRO LÍQUIDO", icon: Wallet, color: "text-blue-500", prefix: "R$ ", sub: () => "Após despesas, taxas e custos" },
  { key: "despesas" as const, label: "DESPESAS TOTAIS", icon: ArrowDownCircle, color: "text-red-500", prefix: "R$ ", sub: (d: typeof mockKPIs.despesas) => `${d.count} lançamentos | Maior: ${d.maiorCategoria}` },
  { key: "ticketMedio" as const, label: "TICKET MÉDIO", icon: Receipt, color: "text-cyan-500", prefix: "R$ ", sub: () => "Receita ÷ serviços" },
  { key: "ganhoPorHora" as const, label: "GANHO POR HORA", icon: Clock, color: "text-violet-500", prefix: "R$ ", suffix: "/h", sub: () => "Base: 8h/dia útil" },
];

const KPICards = () => {
  return (
    <motion.div variants={container} initial="hidden" animate="show" className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
      {kpiConfig.map((kpi) => {
        const data = mockKPIs[kpi.key];
        const change = calcChange(data.value, data.prev);
        const isLucroLiquido = kpi.key === "lucroLiquido";
        const glowColor = isLucroLiquido ? (data.value >= 0 ? "rgba(16,185,129,0.15)" : "rgba(239,68,68,0.15)") : undefined;

        return (
          <motion.div
            key={kpi.key}
            variants={item}
            className="group relative rounded-2xl p-4 space-y-2 transition-all duration-300"
            style={{
              background: "rgba(14,20,35,0.85)",
              backdropFilter: "blur(16px)",
              border: "1px solid rgba(245,158,11,0.08)",
              boxShadow: glowColor
                ? `0 4px 24px rgba(0,0,0,0.3), 0 0 0 1px rgba(255,255,255,0.03), 0 0 20px ${glowColor}`
                : "0 4px 24px rgba(0,0,0,0.3), 0 0 0 1px rgba(255,255,255,0.03)",
            }}
            whileHover={{ borderColor: "rgba(245,158,11,0.2)" }}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] uppercase tracking-[0.05em] text-muted-foreground font-medium">{kpi.label}</span>
              <kpi.icon className={`h-4 w-4 ${kpi.color}`} />
            </div>

            <div className="text-[28px] font-bold text-foreground leading-none">
              <AnimatedCounter value={data.value} prefix={kpi.prefix} suffix={kpi.suffix || ""} />
            </div>

            <p className="text-xs text-muted-foreground">{kpi.sub(data as any)}</p>

            <div className="h-px bg-border/50" />

            <div className="flex items-center justify-between">
              <div className={`flex items-center gap-1 text-[11px] font-medium ${change.positive ? "text-emerald-500" : "text-red-500"}`}>
                {change.positive ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
                {change.percent.toFixed(1)}%
                <span className="text-muted-foreground font-normal">vs anterior</span>
              </div>
              <SparklineChart data={data.sparkline} color={change.positive ? "#10B981" : "#EF4444"} />
            </div>
          </motion.div>
        );
      })}
    </motion.div>
  );
};

export default KPICards;
