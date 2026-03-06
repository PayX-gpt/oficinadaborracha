import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { mockTopServices, mockLowMarginServices, mockVehicleRanking, formatCurrency } from "@/lib/mockDashboardData";

const tabs = ["Mais Lucrativos", "Menor Margem", "Por Veículo"];
const medals = ["🥇", "🥈", "🥉"];

const ServiceIntelligence = () => {
  const [tab, setTab] = useState("Mais Lucrativos");

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.8, duration: 0.4 }}
      className="rounded-2xl p-6 transition-all duration-300"
      style={{
        background: "rgba(14,20,35,0.85)",
        backdropFilter: "blur(16px)",
        border: "1px solid rgba(245,158,11,0.08)",
        boxShadow: "0 4px 24px rgba(0,0,0,0.3), 0 0 0 1px rgba(255,255,255,0.03)",
      }}
    >
      <h3 className="text-[11px] uppercase tracking-[0.05em] text-muted-foreground font-medium mb-4">Inteligência de Serviços</h3>

      <div className="flex gap-1 mb-4 p-1 rounded-lg bg-secondary/30">
        {tabs.map((t) => (
          <button key={t} onClick={() => setTab(t)} className={`relative px-3 py-1.5 rounded-md text-xs font-medium transition-all ${tab === t ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}>
            {tab === t && <motion.div layoutId="svcTab" className="absolute inset-0 bg-secondary/80 rounded-md border border-primary/20" transition={{ type: "spring", bounce: 0.2, duration: 0.4 }} />}
            <span className="relative z-10">{t}</span>
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={tab} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          {tab === "Mais Lucrativos" && (
            <div className="space-y-2">
              {mockTopServices.map((s) => (
                <div key={s.pos} className="rounded-lg p-3 bg-secondary/20 flex flex-col md:flex-row md:items-center gap-3">
                  <span className="text-lg">{s.pos <= 3 ? medals[s.pos - 1] : `#${s.pos}`}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">{s.nome}</p>
                    <p className="text-[11px] text-muted-foreground">Mais feito em: {s.veiculo}</p>
                  </div>
                  <div className="flex flex-wrap gap-3 text-[11px]">
                    <span className="text-muted-foreground">{s.qty}x</span>
                    <span className="text-foreground">{formatCurrency(s.receita)}</span>
                    <span className="text-emerald-500">{s.margem}%</span>
                    <span className="text-primary font-medium">{formatCurrency(s.lucro)}</span>
                  </div>
                  <div className="flex gap-1">
                    {s.badge.map((b, i) => (
                      <span key={i} className="px-1.5 py-0.5 rounded text-[10px] bg-secondary/50">{b}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {tab === "Menor Margem" && (
            <div className="space-y-2">
              {mockLowMarginServices.map((s) => (
                <div key={s.pos} className="rounded-lg p-3 bg-red-500/5 border border-red-500/10 flex flex-col md:flex-row md:items-center gap-3">
                  <span className="text-lg text-red-400">#{s.pos}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">{s.nome}</p>
                    <p className="text-[11px] text-red-400">⚠️ Avaliar Preço — Margem de apenas {s.margem}%</p>
                  </div>
                  <div className="flex flex-wrap gap-3 text-[11px]">
                    <span className="text-muted-foreground">{s.qty}x</span>
                    <span className="text-foreground">{formatCurrency(s.receita)}</span>
                    <span className="text-red-400">{s.margem}%</span>
                    <span className="text-foreground">{formatCurrency(s.lucro)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {tab === "Por Veículo" && (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-muted-foreground border-b border-border/50">
                    <th className="text-left py-2 font-medium">Veículo</th>
                    <th className="text-right py-2 font-medium">Serviços</th>
                    <th className="text-right py-2 font-medium">Receita</th>
                    <th className="text-right py-2 font-medium">Ticket</th>
                    <th className="text-left py-2 font-medium pl-4">Serviço Comum</th>
                  </tr>
                </thead>
                <tbody>
                  {mockVehicleRanking.map((v) => (
                    <tr key={v.veiculo} className="border-b border-border/30">
                      <td className="py-2 text-foreground font-medium">{v.veiculo}</td>
                      <td className="py-2 text-right text-foreground">{v.servicos}</td>
                      <td className="py-2 text-right text-foreground">{formatCurrency(v.receita)}</td>
                      <td className="py-2 text-right text-foreground">{formatCurrency(v.ticket)}</td>
                      <td className="py-2 text-left pl-4 text-muted-foreground">{v.servicoComum}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
};

export default ServiceIntelligence;
