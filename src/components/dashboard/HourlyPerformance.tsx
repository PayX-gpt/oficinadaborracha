import { motion } from "framer-motion";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Clock, TrendingUp, Activity, BarChart3 } from "lucide-react";
import type { DashboardData } from "@/hooks/useDashboardData";

const formatCurrency = (v: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

const ODBTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="rounded-lg px-3 py-2 text-xs border border-border bg-card shadow-xl">
      <p className="text-foreground font-medium">{label}</p>
      <p className="text-muted-foreground">{d.services} serviços — {formatCurrency(d.value)}</p>
    </div>
  );
};

const HourlyPerformance = ({ data }: { data?: DashboardData }) => {
  const hourly = data?.hourlyRevenue ?? [];
  const peakHour = hourly.length > 0 ? hourly.reduce((max, h) => h.value > max.value ? h : max, hourly[0]) : { hour: "—", value: 0 };
  const busiestHour = hourly.length > 0 ? hourly.reduce((max, h) => h.services > max.services ? h : max, hourly[0]) : { hour: "—", services: 0 };
  const totalServices = hourly.reduce((s, h) => s + h.services, 0);

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.85, duration: 0.4 }}
      className="rounded-xl p-3 md:p-6 transition-all duration-300 overflow-hidden bg-card border border-border">
      <h3 className="text-[11px] uppercase tracking-[0.05em] text-muted-foreground font-medium mb-3">Performance por Hora</h3>
      <div className="space-y-3">
        <ResponsiveContainer width="100%" height={180}>
          <AreaChart data={hourly}>
            <defs>
              <linearGradient id="hourGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#C9A84C" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#C9A84C" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="hour" tick={{ fill: "#666", fontSize: 10 }} />
            <YAxis tick={{ fill: "#666", fontSize: 10 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} width={35} />
            <Tooltip content={<ODBTooltip />} />
            <Area type="monotone" dataKey="value" stroke="#C9A84C" fill="url(#hourGrad)" strokeWidth={2} dot={false} />
          </AreaChart>
        </ResponsiveContainer>
        <div className="grid grid-cols-2 gap-2">
          {[
            { icon: TrendingUp, label: "Mais Lucrativa", value: peakHour.hour, sub: formatCurrency(peakHour.value), color: "text-gold" },
            { icon: Activity, label: "Mais Movimentada", value: busiestHour.hour, sub: `${busiestHour.services} serv.`, color: "text-chrome" },
            { icon: Clock, label: "Total Serviços", value: String(totalServices), sub: "", color: "text-primary" },
            { icon: BarChart3, label: "Média/Hora", value: totalServices > 0 ? (totalServices / 12).toFixed(1) : "0", sub: "", color: "text-gold" },
          ].map((m) => (
            <div key={m.label} className="rounded-lg p-2.5 bg-secondary/20 space-y-0.5">
              <m.icon className={`h-3 w-3 ${m.color}`} />
              <p className="text-[10px] text-muted-foreground">{m.label}</p>
              <p className="text-xs font-bold text-foreground">{m.value}</p>
              {m.sub && <p className="text-[10px] text-muted-foreground">{m.sub}</p>}
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

export default HourlyPerformance;
