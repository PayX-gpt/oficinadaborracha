import { motion } from "framer-motion";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import type { DashboardData } from "@/hooks/useDashboardData";

const formatCurrency = (v: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

const PaymentMethods = ({ data }: { data?: DashboardData }) => {
  const methods = data?.paymentMethods ?? [];
  const total = methods.reduce((s, m) => s + m.bruto, 0);

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7, duration: 0.4 }}
      className="rounded-xl p-3 md:p-6 transition-all duration-300 overflow-hidden"
      style={{ background: "rgba(9,9,9,0.85)", border: "1px solid rgba(210,10,10,0.08)", boxShadow: "0 4px 24px rgba(0,0,0,0.3)" }}>
      <h3 className="text-[11px] uppercase tracking-[0.05em] text-muted-foreground font-medium mb-3">Receita por Método de Pagamento</h3>
      {methods.length === 0 ? (
        <p className="text-xs text-muted-foreground text-center py-8">Nenhum dado no período</p>
      ) : (
        <div className="space-y-4">
          <div className="relative">
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie data={methods} cx="50%" cy="50%" innerRadius={50} outerRadius={75} dataKey="bruto" stroke="none">
                  {methods.map((m) => <Cell key={m.method} fill={m.color} />)}
                </Pie>
                <Tooltip content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const d = payload[0].payload;
                  return (
                    <div className="rounded-lg px-3 py-2 text-xs border shadow-xl" style={{ background: "rgba(14,20,35,0.95)", borderColor: "rgba(245,158,11,0.3)" }}>
                      <p className="text-foreground font-medium">{d.method}</p>
                      <p className="text-muted-foreground">{formatCurrency(d.bruto)} ({d.percent}%)</p>
                    </div>
                  );
                }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="text-center">
                <p className="text-sm font-bold text-foreground">{formatCurrency(total)}</p>
                <p className="text-[10px] text-muted-foreground">Total</p>
              </div>
            </div>
          </div>
          {/* Mobile-friendly list instead of table */}
          <div className="space-y-1.5">
            {methods.map((m) => (
              <div key={m.method} className="flex items-center gap-2 py-1.5 px-2 rounded-lg bg-secondary/20 text-[11px]">
                <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: m.color }} />
                <span className="text-foreground flex-1 min-w-0 truncate">{m.method}</span>
                <span className="text-muted-foreground shrink-0">{m.qty}x</span>
                <span className="text-foreground font-medium shrink-0">{formatCurrency(m.bruto)}</span>
                <span className="text-muted-foreground shrink-0">{m.percent}%</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default PaymentMethods;
