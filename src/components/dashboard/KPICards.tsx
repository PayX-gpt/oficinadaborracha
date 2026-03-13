import { motion } from "framer-motion";
import { DollarSign, TrendingUp, TrendingDown, Wallet, ArrowDownCircle, Receipt, Clock } from "lucide-react";
import AnimatedCounter from "./AnimatedCounter";
import SparklineChart from "./SparklineChart";
import type { DashboardData } from "@/hooks/useDashboardData";

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.05 } } };
const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { duration: 0.4 } } };

function comparativePercent(current: number, previous: number): { pct: number; isUp: boolean } {
  if (previous === 0) return { pct: current > 0 ? 100 : 0, isUp: current >= 0 };
  const pct = ((current - previous) / Math.abs(previous)) * 100;
  return { pct: Math.abs(pct), isUp: pct >= 0 };
}

const KPICards = ({ data }: { data?: DashboardData }) => {
  const ganhoHora = data?.totalServicos ? (data.lucroLiquido / (data.totalServicos * 0.5)) : 0;
  const prevGanhoHora = data?.prevServicos ? ((data.prevLucroLiquido ?? 0) / (data.prevServicos * 0.5)) : 0;

  const kpis = [
    {
      label: "RECEITA BRUTA", icon: DollarSign, color: "text-primary",
      value: data?.totalReceita ?? 0, prefix: "R$ ",
      sub: `${data?.totalServicos ?? 0} serviços`,
      spark: data?.sparkReceita ?? [],
      sparkColor: "#D20A0A",
      comp: comparativePercent(data?.totalReceita ?? 0, data?.prevReceita ?? 0),
    },
    {
      label: "LUCRO BRUTO", icon: TrendingUp, color: "text-success",
      value: data?.lucroBruto ?? 0, prefix: "R$ ",
      sub: data?.totalReceita ? `Margem: ${((data.lucroBruto / data.totalReceita) * 100).toFixed(1)}%` : "Margem: —",
      spark: data?.sparkLucroBruto ?? [],
      sparkColor: "#33A833",
      comp: comparativePercent(data?.lucroBruto ?? 0, data?.prevLucroBruto ?? 0),
    },
    {
      label: "LUCRO LÍQUIDO", icon: Wallet, color: "text-gold",
      value: data?.lucroLiquido ?? 0, prefix: "R$ ",
      sub: "Após despesas, taxas e custos", glow: true,
      spark: data?.sparkLucroLiquido ?? [],
      sparkColor: "#C9A84C",
      comp: comparativePercent(data?.lucroLiquido ?? 0, data?.prevLucroLiquido ?? 0),
    },
    {
      label: "DESPESAS TOTAIS", icon: ArrowDownCircle, color: "text-primary",
      value: data?.totalDespesas ?? 0, prefix: "R$ ",
      sub: `${data?.despesas?.length ?? 0} lançamentos`,
      spark: data?.sparkDespesas ?? [],
      sparkColor: "#EF4444",
      comp: comparativePercent(data?.totalDespesas ?? 0, data?.prevDespesas ?? 0),
      invertComp: true,
    },
    {
      label: "TICKET MÉDIO", icon: Receipt, color: "text-chrome",
      value: data?.ticketMedio ?? 0, prefix: "R$ ",
      sub: "Receita ÷ serviços",
      spark: data?.sparkTicket ?? [],
      sparkColor: "#BEBEBE",
      comp: comparativePercent(data?.ticketMedio ?? 0, data?.prevTicketMedio ?? 0),
    },
    {
      label: "GANHO POR HORA", icon: Clock, color: "text-gold",
      value: ganhoHora, prefix: "R$ ", suffix: "/h",
      sub: "Base: 8h/dia útil",
      spark: data?.sparkGanhoHora ?? [],
      sparkColor: "#C9A84C",
      comp: comparativePercent(ganhoHora, prevGanhoHora),
    },
  ];

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 md:gap-3">
      {kpis.map((kpi) => {
        const isPositive = kpi.value >= 0;
        const glowColor = kpi.glow ? (isPositive ? "rgba(201,168,76,0.15)" : "rgba(210,10,10,0.15)") : undefined;
        const compIsGood = kpi.invertComp ? !kpi.comp.isUp : kpi.comp.isUp;
        return (
          <motion.div key={kpi.label} variants={item}
            className="group relative rounded-xl md:rounded-2xl p-3 md:p-4 space-y-1.5 md:space-y-2 transition-all duration-300 bg-card border border-border"
            style={{
              boxShadow: glowColor
                ? `0 4px 24px rgba(0,0,0,0.3), 0 0 20px ${glowColor}`
                : "0 4px 24px rgba(0,0,0,0.3)",
            }}
            whileHover={{ borderColor: "rgba(210,10,10,0.2)" }}>
            <div className="flex items-center justify-between">
              <span className="text-[9px] md:text-[11px] uppercase tracking-[0.05em] text-muted-foreground font-medium leading-tight">{kpi.label}</span>
              <kpi.icon className={`h-3.5 w-3.5 md:h-4 md:w-4 ${kpi.color}`} />
            </div>
            <div className="text-lg md:text-[28px] font-bold text-foreground leading-none tabular-nums">
              <AnimatedCounter value={kpi.value} prefix={kpi.prefix} suffix={kpi.suffix || ""} />
            </div>
            <div className="flex items-center justify-between gap-1">
              <div className="flex items-center gap-1 min-w-0">
                {kpi.comp.pct > 0 && (
                  <span className={`flex items-center gap-0.5 text-[9px] md:text-[10px] font-medium shrink-0 ${compIsGood ? "text-success" : "text-primary"}`}>
                    {kpi.comp.isUp ? <TrendingUp className="h-2.5 w-2.5" /> : <TrendingDown className="h-2.5 w-2.5" />}
                    {kpi.comp.pct.toFixed(0)}%
                  </span>
                )}
                <p className="text-[9px] md:text-[10px] text-muted-foreground truncate">{kpi.sub}</p>
              </div>
              {kpi.spark.length > 0 && kpi.spark.some(v => v > 0) && (
                <div className="shrink-0">
                  <SparklineChart data={kpi.spark} color={kpi.sparkColor} height={24} />
                </div>
              )}
            </div>
          </motion.div>
        );
      })}
    </motion.div>
  );
};

export default KPICards;
