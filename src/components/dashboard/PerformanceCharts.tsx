import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BarChart, Bar, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Line, ComposedChart, Cell } from "recharts";
import { Trophy } from "lucide-react";
import type { DashboardData } from "@/hooks/useDashboardData";

const formatCurrency = (v: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);
const tabs = ["Receita", "Lucro", "Despesas", "Filiais"];
const BRANCH_COLORS = ["#F59E0B", "#10B981", "#3B82F6", "#8B5CF6", "#EC4899", "#06B6D4"];

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
  const branchComparison = data?.branchComparison ?? [];

  const totalMO = revenueByDay.reduce((s, d) => s + d.maoDeObra, 0);
  const totalFab = revenueByDay.reduce((s, d) => s + d.fabricadas, 0);
  const totalComp = revenueByDay.reduce((s, d) => s + d.compradas, 0);
  const totalAll = totalMO + totalFab + totalComp || 1;

  const bestBranch = branchComparison.length > 0 ? branchComparison[0] : null;

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6, duration: 0.4 }}
      className="rounded-xl p-3 md:p-6 transition-all duration-300 overflow-hidden"
      style={{ background: "rgba(14,20,35,0.85)", backdropFilter: "blur(16px)", border: "1px solid rgba(245,158,11,0.08)", boxShadow: "0 4px 24px rgba(0,0,0,0.3), 0 0 0 1px rgba(255,255,255,0.03)" }}>
      <div className="flex gap-1 mb-4 p-1 rounded-lg bg-secondary/30 overflow-x-auto scrollbar-none">
        {tabs.map((t) => (
          <button key={t} onClick={() => setActiveTab(t)}
            className={`relative px-3 py-1.5 rounded-md text-[11px] font-medium transition-all whitespace-nowrap shrink-0 ${activeTab === t ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}>
            {activeTab === t && <motion.div layoutId="chartTab" className="absolute inset-0 bg-secondary/80 rounded-md border border-primary/20" transition={{ type: "spring", bounce: 0.2, duration: 0.4 }} />}
            <span className="relative z-10">{t}</span>
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={activeTab} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
          {activeTab === "Receita" && (
            <div className="space-y-3">
              <ResponsiveContainer width="100%" height={200}>
                <ComposedChart data={revenueByDay}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="day" tick={{ fill: "#64748B", fontSize: 10 }} />
                  <YAxis tick={{ fill: "#64748B", fontSize: 10 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} width={35} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="maoDeObra" stackId="a" fill="#F59E0B" name="Mão de Obra" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="fabricadas" stackId="a" fill="#10B981" name="Fabricadas" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="compradas" stackId="a" fill="#3B82F6" name="Compradas" radius={[4, 4, 0, 0]} />
                  <Line type="monotone" dataKey="total" stroke="rgba(255,255,255,0.8)" strokeWidth={2} dot={false} name="Total" />
                </ComposedChart>
              </ResponsiveContainer>
              <div className="grid grid-cols-3 gap-1.5">
                {[
                  { label: "Mão de Obra", value: totalMO, pct: Math.round((totalMO / totalAll) * 100), color: "bg-primary" },
                  { label: "Fabricadas", value: totalFab, pct: Math.round((totalFab / totalAll) * 100), color: "bg-emerald-500" },
                  { label: "Compradas", value: totalComp, pct: Math.round((totalComp / totalAll) * 100), color: "bg-blue-500" },
                ].map((m) => (
                  <div key={m.label} className="rounded-lg p-2 bg-secondary/30 text-center">
                    <div className={`h-1 w-5 rounded-full ${m.color} mx-auto mb-1.5`} />
                    <p className="text-[10px] text-muted-foreground truncate">{m.label}</p>
                    <p className="text-xs font-bold text-foreground tabular-nums">{formatCurrency(m.value)}</p>
                    <p className="text-[10px] text-muted-foreground">{m.pct}%</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "Lucro" && (
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={profitByDay}>
                <defs>
                  <linearGradient id="profitGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="day" tick={{ fill: "#64748B", fontSize: 10 }} />
                <YAxis tick={{ fill: "#64748B", fontSize: 10 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} width={35} />
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
                <div key={e.category} className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: e.color }} />
                  <span className="text-[10px] text-muted-foreground flex-1 min-w-0 truncate">{e.category}</span>
                  <div className="w-12 sm:w-20 h-2.5 rounded-full bg-secondary/30 overflow-hidden shrink-0">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${e.percent}%` }} transition={{ duration: 0.8, delay: 0.2 }} className="h-full rounded-full" style={{ backgroundColor: e.color }} />
                  </div>
                  <span className="text-[10px] font-medium text-foreground shrink-0 tabular-nums">{formatCurrency(e.value)}</span>
                  <span className="text-[10px] text-muted-foreground shrink-0">{e.percent}%</span>
                </div>
              ))}
            </div>
          )}

          {activeTab === "Filiais" && (
            <div className="space-y-3">
              {branchComparison.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-8">Nenhuma filial cadastrada</p>
              ) : (
                <>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={branchComparison}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                      <XAxis dataKey="filial" tick={{ fill: "#64748B", fontSize: 10 }} />
                      <YAxis tick={{ fill: "#64748B", fontSize: 10 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} width={35} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="receita" name="Receita" radius={[4, 4, 0, 0]}>
                        {branchComparison.map((_, i) => <Cell key={i} fill={BRANCH_COLORS[i % BRANCH_COLORS.length]} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                  <div className="space-y-1.5">
                    {branchComparison.map((b, i) => (
                      <div key={b.filialId} className="flex items-center gap-2 py-1.5 px-2 rounded-lg bg-secondary/20 text-[11px]">
                        <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: BRANCH_COLORS[i % BRANCH_COLORS.length] }} />
                        <span className="text-foreground flex-1 min-w-0 truncate font-medium">{b.filial}</span>
                        {i === 0 && bestBranch && (
                          <span className="flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-bold bg-primary/20 text-primary shrink-0">
                            <Trophy className="h-2.5 w-2.5" /> #1
                          </span>
                        )}
                        <span className="text-muted-foreground shrink-0 tabular-nums">{b.servicos}x</span>
                        <span className="text-foreground font-medium shrink-0 tabular-nums">{formatCurrency(b.receita)}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
};

export default PerformanceCharts;
