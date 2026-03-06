import { motion } from "framer-motion";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { mockHourlyRevenue, formatCurrency } from "@/lib/mockDashboardData";
import { Clock, TrendingUp, Activity, BarChart3 } from "lucide-react";

const HourlyPerformance = () => {
  const peakHour = mockHourlyRevenue.reduce((max, h) => h.value > max.value ? h : max, mockHourlyRevenue[0]);
  const busiestHour = mockHourlyRevenue.reduce((max, h) => h.services > max.services ? h : max, mockHourlyRevenue[0]);
  const totalServices = mockHourlyRevenue.reduce((s, h) => s + h.services, 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.85, duration: 0.4 }}
      className="rounded-2xl p-6 transition-all duration-300"
      style={{
        background: "rgba(14,20,35,0.85)",
        backdropFilter: "blur(16px)",
        border: "1px solid rgba(245,158,11,0.08)",
        boxShadow: "0 4px 24px rgba(0,0,0,0.3), 0 0 0 1px rgba(255,255,255,0.03)",
      }}
    >
      <h3 className="text-[11px] uppercase tracking-[0.05em] text-muted-foreground font-medium mb-4">Performance por Hora</h3>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={mockHourlyRevenue}>
              <defs>
                <linearGradient id="hourGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10B981" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="hour" tick={{ fill: "#64748B", fontSize: 11 }} />
              <YAxis tick={{ fill: "#64748B", fontSize: 11 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
              <Tooltip content={({ active, payload, label }) => {
                if (!active || !payload?.length) return null;
                const d = payload[0].payload;
                return (
                  <div className="rounded-lg px-3 py-2 text-xs border shadow-xl" style={{ background: "rgba(14,20,35,0.95)", borderColor: "rgba(245,158,11,0.3)" }}>
                    <p className="text-foreground font-medium">{label}</p>
                    <p className="text-muted-foreground">{d.services} serviços — {formatCurrency(d.value)}</p>
                  </div>
                );
              }} />
              <Area type="monotone" dataKey="value" stroke="#10B981" fill="url(#hourGrad)" strokeWidth={2} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-1 gap-3">
          {[
            { icon: TrendingUp, label: "Hora Mais Lucrativa", value: peakHour.hour, sub: formatCurrency(peakHour.value), color: "text-emerald-500" },
            { icon: Activity, label: "Hora Mais Movimentada", value: busiestHour.hour, sub: `${busiestHour.services} serviços`, color: "text-blue-500" },
            { icon: Clock, label: "Tempo Médio/Serviço", value: "1h 20min", sub: "", color: "text-primary" },
            { icon: BarChart3, label: "Serviços/Dia (média)", value: String(totalServices), sub: "", color: "text-violet-500" },
          ].map((m) => (
            <div key={m.label} className="rounded-lg p-3 bg-secondary/20 space-y-1">
              <m.icon className={`h-3.5 w-3.5 ${m.color}`} />
              <p className="text-[11px] text-muted-foreground">{m.label}</p>
              <p className="text-sm font-bold text-foreground">{m.value}</p>
              {m.sub && <p className="text-[11px] text-muted-foreground">{m.sub}</p>}
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

export default HourlyPerformance;
