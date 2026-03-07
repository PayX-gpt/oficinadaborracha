import { motion } from "framer-motion";
import { Factory } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Line, ComposedChart } from "recharts";
import type { DashboardData } from "@/hooks/useDashboardData";

const formatCurrency = (v: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

const ManufacturingAnalysis = ({ data }: { data?: DashboardData }) => {
  const m = data?.manufacturing ?? { receita: 0, custoMP: 0, margem: 0, pecas: 0, custoMedioPeca: 0, precoMedioCobrado: 0, roi: 0, timeline: [] };

  const kpis = [
    { label: "Receita Fabricação", value: formatCurrency(m.receita), color: "text-emerald-500" },
    { label: "Custo Matéria-Prima", value: formatCurrency(m.custoMP), color: "text-red-400" },
    { label: "Margem Fabricação", value: `${m.margem}%`, color: "text-primary" },
    { label: "Peças Fabricadas", value: `${m.pecas} un`, color: "text-foreground" },
    { label: "Custo Médio/Peça", value: formatCurrency(m.custoMedioPeca), color: "text-muted-foreground" },
    { label: "Preço Médio Cobrado", value: formatCurrency(m.precoMedioCobrado), color: "text-foreground" },
    { label: "ROI Fabricação", value: `${m.roi}x`, color: "text-primary" },
  ];

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.9, duration: 0.4 }}
      className="rounded-2xl p-4 md:p-6 transition-all duration-300"
      style={{ background: "rgba(14,20,35,0.85)", backdropFilter: "blur(16px)", border: "1px solid rgba(245,158,11,0.15)", boxShadow: "0 4px 24px rgba(0,0,0,0.3), 0 0 0 1px rgba(255,255,255,0.03)" }}>
      <h3 className="text-[11px] uppercase tracking-[0.05em] text-muted-foreground font-medium mb-4 flex items-center gap-2">
        <Factory className="h-4 w-4 text-primary" />
        Análise de Fabricação de Borrachas
      </h3>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ResponsiveContainer width="100%" height={220}>
          <ComposedChart data={m.timeline}>
            <defs>
              <linearGradient id="mfgGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="day" tick={{ fill: "#64748B", fontSize: 11 }} />
            <YAxis tick={{ fill: "#64748B", fontSize: 11 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
            <Tooltip content={({ active, payload, label }) => {
              if (!active || !payload?.length) return null;
              return (
                <div className="rounded-lg px-3 py-2 text-xs border shadow-xl" style={{ background: "rgba(14,20,35,0.95)", borderColor: "rgba(245,158,11,0.3)" }}>
                  <p className="text-foreground font-medium">{label}</p>
                  <p className="text-emerald-500">Receita: {formatCurrency(payload[0]?.value as number)}</p>
                  <p className="text-red-400">Custo: {formatCurrency(payload[1]?.value as number)}</p>
                </div>
              );
            }} />
            <Area type="monotone" dataKey="receita" stroke="#10B981" fill="url(#mfgGrad)" strokeWidth={2} name="Receita" />
            <Line type="monotone" dataKey="custo" stroke="#EF4444" strokeWidth={2} dot={false} name="Custo MP" />
          </ComposedChart>
        </ResponsiveContainer>
        <div className="grid grid-cols-2 gap-2">
          {kpis.map((k) => (
            <div key={k.label} className="rounded-lg p-3 bg-secondary/20 space-y-1">
              <p className="text-[11px] text-muted-foreground">{k.label}</p>
              <p className={`text-sm font-bold ${k.color}`}>{k.value}</p>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

export default ManufacturingAnalysis;
