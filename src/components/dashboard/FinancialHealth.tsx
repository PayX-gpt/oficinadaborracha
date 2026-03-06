import { motion } from "framer-motion";
import { formatCurrency } from "@/lib/mockDashboardData";
import { AreaChart, Area, ResponsiveContainer } from "recharts";

const cashData = Array.from({ length: 30 }, (_, i) => ({ day: i, value: 15000 + Math.sin(i * 0.3) * 5000 + i * 200 }));

const FinancialHealth = () => {
  const score = 78;
  const caixa = 22450;
  const projecaoReceita = 38500;
  const projecaoLucro = 16200;
  const progressPercent = 77;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5, duration: 0.4 }}
      className="rounded-2xl p-6 transition-all duration-300"
      style={{
        background: "rgba(14,20,35,0.85)",
        backdropFilter: "blur(16px)",
        border: "1px solid rgba(245,158,11,0.15)",
        boxShadow: "0 4px 24px rgba(0,0,0,0.3), 0 0 0 1px rgba(255,255,255,0.03)",
      }}
    >
      <h3 className="text-[11px] uppercase tracking-[0.05em] text-muted-foreground font-medium mb-4">Saúde Financeira da Empresa</h3>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Score */}
        <div className="text-center space-y-3">
          <div className="relative w-32 h-16 mx-auto">
            <svg viewBox="0 0 120 60" className="w-full h-full">
              <path d="M10 55 A50 50 0 0 1 110 55" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8" strokeLinecap="round" />
              <path
                d="M10 55 A50 50 0 0 1 110 55"
                fill="none"
                stroke={score > 60 ? "#10B981" : score > 30 ? "#F59E0B" : "#EF4444"}
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={`${(score / 100) * 157} 157`}
              />
            </svg>
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2">
              <span className="text-2xl font-bold text-foreground">{score}</span>
              <span className="text-xs text-muted-foreground">/100</span>
            </div>
          </div>
          <p className="text-[11px] uppercase tracking-[0.05em] text-muted-foreground font-medium">Score de Saúde</p>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Sua oficina está saudável. Margem líquida de 42% acima da média do setor.
          </p>
        </div>

        {/* Caixa */}
        <div className="space-y-3">
          <p className="text-[11px] uppercase tracking-[0.05em] text-muted-foreground font-medium">Caixa da Empresa</p>
          <p className="text-2xl font-bold text-foreground">{formatCurrency(caixa)}</p>
          <div className="h-12">
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
          <div className="flex flex-wrap gap-2 text-[11px]">
            <span className="text-emerald-500">+{formatCurrency(29850)} entradas</span>
            <span className="text-red-500">-{formatCurrency(8850)} saídas</span>
          </div>
        </div>

        {/* Projeção */}
        <div className="space-y-3">
          <p className="text-[11px] uppercase tracking-[0.05em] text-muted-foreground font-medium">Projeção do Mês</p>
          <p className="text-2xl font-bold text-foreground">{formatCurrency(projecaoReceita)}</p>
          <p className="text-xs text-muted-foreground">Lucro projetado: {formatCurrency(projecaoLucro)}</p>
          <div className="space-y-1">
            <div className="flex justify-between text-[11px]">
              <span className="text-muted-foreground">Progresso</span>
              <span className="text-foreground font-medium">{progressPercent}%</span>
            </div>
            <div className="h-2 rounded-full bg-secondary/50 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progressPercent}%` }}
                transition={{ duration: 1, delay: 0.8 }}
                className="h-full rounded-full bg-gradient-to-r from-primary to-amber-400"
              />
            </div>
          </div>
          <p className="text-xs text-muted-foreground">Mês anterior: {formatCurrency(31200)}</p>
        </div>
      </div>
    </motion.div>
  );
};

export default FinancialHealth;
