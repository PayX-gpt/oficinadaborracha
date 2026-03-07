import { motion } from "framer-motion";
import { AreaChart, Area, ResponsiveContainer } from "recharts";
import type { DashboardData } from "@/hooks/useDashboardData";

const formatCurrency = (v: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

const FinancialHealth = ({ data }: { data?: DashboardData }) => {
  const totalReceita = data?.totalReceita ?? 0;
  const totalCusto = data?.totalCusto ?? 0;
  const totalDespesas = data?.totalDespesas ?? 0;
  const lucroLiquido = data?.lucroLiquido ?? 0;
  const totalTaxas = data?.totalTaxas ?? 0;

  const margem = totalReceita > 0 ? (lucroLiquido / totalReceita) * 100 : 0;
  const score = Math.min(100, Math.max(0, Math.round(margem * 1.5 + 30)));
  const caixa = totalReceita - totalDespesas - totalTaxas;

  const cashData = data?.profitByDay?.map((d, i) => ({ day: i, value: Math.max(0, d.lucroLiquido) })) ||
    Array.from({ length: 7 }, (_, i) => ({ day: i, value: 0 }));

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5, duration: 0.4 }}
      className="rounded-xl p-3 md:p-6 transition-all duration-300 overflow-hidden"
      style={{ background: "rgba(14,20,35,0.85)", backdropFilter: "blur(16px)", border: "1px solid rgba(245,158,11,0.15)", boxShadow: "0 4px 24px rgba(0,0,0,0.3), 0 0 0 1px rgba(255,255,255,0.03)" }}>
      <h3 className="text-[11px] uppercase tracking-[0.05em] text-muted-foreground font-medium mb-3">Saúde Financeira</h3>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3 md:gap-6">
        {/* Score */}
        <div className="text-center space-y-2">
          <div className="relative w-28 h-14 mx-auto">
            <svg viewBox="0 0 120 60" className="w-full h-full">
              <path d="M10 55 A50 50 0 0 1 110 55" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8" strokeLinecap="round" />
              <path d="M10 55 A50 50 0 0 1 110 55" fill="none"
                stroke={score > 60 ? "#10B981" : score > 30 ? "#F59E0B" : "#EF4444"}
                strokeWidth="8" strokeLinecap="round" strokeDasharray={`${(score / 100) * 157} 157`} />
            </svg>
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2">
              <span className="text-xl font-bold text-foreground">{score}</span>
              <span className="text-[10px] text-muted-foreground">/100</span>
            </div>
          </div>
          <p className="text-[10px] uppercase tracking-[0.05em] text-muted-foreground font-medium">Score de Saúde</p>
          <p className="text-[10px] text-muted-foreground leading-relaxed">
            {score > 60 ? "Oficina saudável." : score > 30 ? "Margem pode melhorar." : "Margem muito baixa."}
            {` ${margem.toFixed(1)}% margem.`}
          </p>
        </div>

        {/* Fluxo de Caixa */}
        <div className="space-y-2">
          <p className="text-[10px] uppercase tracking-[0.05em] text-muted-foreground font-medium">Fluxo de Caixa</p>
          <p className="text-xl font-bold text-foreground">{formatCurrency(caixa)}</p>
          <div className="h-10">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={cashData}>
                <defs>
                  <linearGradient id="cashGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Area type="monotone" dataKey="value" stroke="#10B981" fill="url(#cashGrad)" strokeWidth={1.5} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-[10px]">
            <span className="text-emerald-500">+{formatCurrency(totalReceita)}</span>
            <span className="text-red-500">-{formatCurrency(totalDespesas + totalTaxas)}</span>
          </div>
        </div>

        {/* Resumo */}
        <div className="space-y-2">
          <p className="text-[10px] uppercase tracking-[0.05em] text-muted-foreground font-medium">Resumo</p>
          <p className="text-xl font-bold text-foreground">{formatCurrency(totalReceita)}</p>
          <p className="text-[10px] text-muted-foreground">Lucro líquido: {formatCurrency(lucroLiquido)}</p>
          <div className="space-y-1">
            <div className="flex justify-between text-[10px]">
              <span className="text-muted-foreground">Margem</span>
              <span className="text-foreground font-medium">{margem.toFixed(1)}%</span>
            </div>
            <div className="h-1.5 rounded-full bg-secondary/50 overflow-hidden">
              <motion.div initial={{ width: 0 }} animate={{ width: `${Math.min(100, Math.max(0, margem))}%` }}
                transition={{ duration: 1, delay: 0.8 }}
                className="h-full rounded-full bg-gradient-to-r from-primary to-amber-400" />
            </div>
          </div>
          <p className="text-[10px] text-muted-foreground">Custo: {formatCurrency(totalCusto)}</p>
        </div>
      </div>
    </motion.div>
  );
};

export default FinancialHealth;
