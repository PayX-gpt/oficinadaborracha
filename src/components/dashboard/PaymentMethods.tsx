import { motion } from "framer-motion";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import type { DashboardData } from "@/hooks/useDashboardData";

const formatCurrency = (v: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

const PaymentMethods = ({ data }: { data?: DashboardData }) => {
  const methods = data?.paymentMethods ?? [];
  const total = methods.reduce((s, m) => s + m.bruto, 0);

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7, duration: 0.4 }}
      className="rounded-2xl p-6 transition-all duration-300"
      style={{ background: "rgba(14,20,35,0.85)", backdropFilter: "blur(16px)", border: "1px solid rgba(245,158,11,0.08)", boxShadow: "0 4px 24px rgba(0,0,0,0.3), 0 0 0 1px rgba(255,255,255,0.03)" }}>
      <h3 className="text-[11px] uppercase tracking-[0.05em] text-muted-foreground font-medium mb-4">Receita por Método de Pagamento</h3>
      {methods.length === 0 ? (
        <p className="text-xs text-muted-foreground text-center py-8">Nenhum dado no período</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="relative">
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={methods} cx="50%" cy="50%" innerRadius={60} outerRadius={90} dataKey="bruto" stroke="none">
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
                <p className="text-lg font-bold text-foreground">{formatCurrency(total)}</p>
                <p className="text-[11px] text-muted-foreground">Total</p>
              </div>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-muted-foreground border-b border-border/50">
                  <th className="text-left py-2 font-medium">Método</th>
                  <th className="text-right py-2 font-medium">Qtd</th>
                  <th className="text-right py-2 font-medium">Bruto</th>
                  <th className="text-right py-2 font-medium">Taxas</th>
                  <th className="text-right py-2 font-medium">Líquido</th>
                  <th className="text-right py-2 font-medium">%</th>
                </tr>
              </thead>
              <tbody>
                {methods.map((m) => (
                  <tr key={m.method} className="border-b border-border/30">
                    <td className="py-2"><div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full" style={{ backgroundColor: m.color }} /><span className="text-foreground">{m.method}</span></div></td>
                    <td className="py-2 text-right text-foreground">{m.qty}</td>
                    <td className="py-2 text-right text-foreground">{formatCurrency(m.bruto)}</td>
                    <td className="py-2 text-right text-red-400">{formatCurrency(m.taxas)}</td>
                    <td className="py-2 text-right text-emerald-500">{formatCurrency(m.liquido)}</td>
                    <td className="py-2 text-right text-foreground">{m.percent}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default PaymentMethods;
