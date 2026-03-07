import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BarChart, Bar, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Line, ComposedChart } from "recharts";
import type { DashboardData } from "@/hooks/useDashboardData";

const formatCurrency = (v: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);
const tabs = ["Receita", "Lucro", "Despesas"];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg px-3 py-2 text-xs border shadow-xl" style={{ background: "rgba(14,20,35,0.95)", borderColor: "rgba(245,158,11,0.3)" }}>
      <p className="text-foreground font-medium mb-1">{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} style={{ color: p.color }}>{p.name}: {formatCurrency(p.value)}</p>
      ))}
    </div>
  );
};

const PerformanceCharts = ({ data }: { data?: DashboardData }) => {
  const [activeTab, setActiveTab] = useState("Receita");
  const revenueByDay = data?.revenueByDay ?? [];
  const profitByDay = data?.profitByDay ?? [];
  const expenseCategories = data?.expenseCategories ?? [];

  const totalMO = revenueByDay.reduce((s, d) => s + d.maoDeObra, 0);
  const totalFab = revenueByDay.reduce((s, d) => s + d.fabricadas, 0);
  const totalComp = revenueByDay.reduce((s, d) => s + d.compradas, 0);
  const totalAll = totalMO + totalFab + totalComp || 1;

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6, duration: 0.4 }}
      className="rounded-2xl p-6 transition-all duration-300"
      style={{ background: "rgba(14,20,35,0.85)", backdropFilter: "blur(16px)", border: "1px solid rgba(245,158,11,0.08)", boxShadow: "0 4px 24px rgba(0,0,0,0.3), 0 0 0 1px rgba(255,255,255,0.03)" }}>
      <div className="flex flex-wrap gap-1 mb-6 p-1 rounded-lg bg-secondary/30">
        {tabs.map((t) => (
          <button key={t} onClick={() => setActiveTab(t)}
            className={`relative px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200 ${activeTab === t ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}>
            {activeTab === t && <motion.div layoutId="chartTab" className="absolute inset-0 bg-secondary/80 rounded-md border border-primary/20" transition={{ type: "spring", bounce: 0.2, duration: 0.4 }} />}
            <span className="relative z-10">{t}</span>
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={activeTab} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
          {activeTab === "Receita" && (
            <div className="space-y-4">
              <ResponsiveContainer width="100%" height={300}>
                <ComposedChart data={revenueByDay}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="day" tick={{ fill: "#64748B", fontSize: 11 }} />
                  <YAxis tick={{ fill: "#64748B", fontSize: 11 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="maoDeObra" stackId="a" fill="#F59E0B" name="Mão de Obra" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="fabricadas" stackId="a" fill="#10B981" name="Fabricadas" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="compradas" stackId="a" fill="#3B82F6" name="Compradas" radius={[4, 4, 0, 0]} />
                  <Line type="monotone" dataKey="total" stroke="rgba(255,255,255,0.8)" strokeWidth={2} dot={false} name="Total" />
                </ComposedChart>
              </ResponsiveContainer>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: "Mão de Obra", value: totalMO, pct: Math.round((totalMO / totalAll) * 100), color: "bg-primary" },
                  { label: "Fabricadas", value: totalFab, pct: Math.round((totalFab / totalAll) * 100), color: "bg-emerald-500" },
                  { label: "Compradas", value: totalComp, pct: Math.round((totalComp / totalAll) * 100), color: "bg-blue-500" },
                ].map((m) => (
                  <div key={m.label} className="rounded-lg p-3 bg-secondary/30 text-center">
                    <div className={`h-1 w-6 rounded-full ${m.color} mx-auto mb-2`} />
                    <p className="text-xs text-muted-foreground">{m.label}</p>
                    <p className="text-sm font-bold text-foreground">{formatCurrency(m.value)}</p>
                    <p className="text-[11px] text-muted-foreground">{m.pct}%</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "Lucro" && (
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={profitByDay}>
                <defs>
                  <linearGradient id="profitGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="day" tick={{ fill: "#64748B", fontSize: 11 }} />
                <YAxis tick={{ fill: "#64748B", fontSize: 11 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="lucroBruto" stroke="#86EFAC" fill="url(#profitGrad)" strokeWidth={2} name="Lucro Bruto" />
                <Area type="monotone" dataKey="lucroLiquido" stroke="#10B981" fill="transparent" strokeWidth={2} name="Lucro Líquido" />
              </AreaChart>
            </ResponsiveContainer>
          )}

          {activeTab === "Despesas" && (
            <div className="space-y-2">
              {expenseCategories.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-8">Nenhuma despesa no período</p>
              ) : expenseCategories.map((e) => (
                <div key={e.category} className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: e.color }} />
                  <span className="text-xs text-muted-foreground w-48 truncate">{e.category}</span>
                  <div className="flex-1 h-3 rounded-full bg-secondary/30 overflow-hidden">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${e.percent}%` }} transition={{ duration: 0.8, delay: 0.2 }} className="h-full rounded-full" style={{ backgroundColor: e.color }} />
                  </div>
                  <span className="text-xs font-medium text-foreground w-24 text-right">{formatCurrency(e.value)}</span>
                  <span className="text-[11px] text-muted-foreground w-10 text-right">{e.percent}%</span>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
};

export default PerformanceCharts;
