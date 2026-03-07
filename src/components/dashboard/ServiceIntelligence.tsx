import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy, Medal, Award, AlertTriangle } from "lucide-react";
import type { DashboardData } from "@/hooks/useDashboardData";
import type { ComponentType } from "react";

const formatCurrency = (v: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);
const tabs = ["Lucrativos", "Menor Margem", "Veículos"];
const medalIcons: ComponentType<{ className?: string }>[] = [Trophy, Medal, Award];

const ServiceIntelligence = ({ data }: { data?: DashboardData }) => {
  const [tab, setTab] = useState("Lucrativos");
  const topServices = data?.topServices ?? [];
  const lowMargin = data?.lowMarginServices ?? [];
  const vehicles = data?.vehicleRanking ?? [];

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8, duration: 0.4 }}
      className="rounded-xl p-3 md:p-6 transition-all duration-300 overflow-hidden"
      style={{ background: "rgba(14,20,35,0.85)", backdropFilter: "blur(16px)", border: "1px solid rgba(245,158,11,0.08)", boxShadow: "0 4px 24px rgba(0,0,0,0.3), 0 0 0 1px rgba(255,255,255,0.03)" }}>
      <h3 className="text-[11px] uppercase tracking-[0.05em] text-muted-foreground font-medium mb-3">Inteligência de Serviços</h3>
      <div className="flex gap-1 mb-3 p-1 rounded-lg bg-secondary/30 overflow-x-auto scrollbar-none">
        {tabs.map((t) => (
          <button key={t} onClick={() => setTab(t)} className={`relative px-3 py-1.5 rounded-md text-[11px] font-medium transition-all whitespace-nowrap shrink-0 ${tab === t ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}>
            {tab === t && <motion.div layoutId="svcTab" className="absolute inset-0 bg-secondary/80 rounded-md border border-primary/20" transition={{ type: "spring", bounce: 0.2, duration: 0.4 }} />}
            <span className="relative z-10">{t}</span>
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={tab} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          {tab === "Lucrativos" && (
            <div className="space-y-2">
              {topServices.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-6">Nenhum serviço no período</p>
              ) : topServices.map((s) => {
                const MedalIcon = s.pos <= 3 ? medalIcons[s.pos - 1] : null;
                const medalColors = ["text-amber-400", "text-slate-400", "text-amber-700"];
                return (
                  <div key={s.pos} className="rounded-lg p-2.5 bg-secondary/20 space-y-1.5">
                    <div className="flex items-center gap-2">
                      {MedalIcon ? <MedalIcon className={`h-4 w-4 shrink-0 ${medalColors[s.pos - 1]}`} /> : <span className="text-xs font-bold text-muted-foreground w-4 text-center shrink-0">#{s.pos}</span>}
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-medium text-foreground truncate">{s.nome}</p>
                        <p className="text-[10px] text-muted-foreground truncate">{s.veiculo}</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-[10px]">
                      <span className="text-muted-foreground">{s.qty}x</span>
                      <span className="text-foreground">{formatCurrency(s.receita)}</span>
                      <span className="text-emerald-500">{s.margem}%</span>
                      <span className="text-primary font-medium">{formatCurrency(s.lucro)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {tab === "Menor Margem" && (
            <div className="space-y-2">
              {lowMargin.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-6">Nenhum serviço com margem baixa</p>
              ) : lowMargin.map((s) => (
                <div key={s.pos} className="rounded-lg p-2.5 bg-red-500/5 border border-red-500/10 space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-red-400 font-bold shrink-0">#{s.pos}</span>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium text-foreground truncate">{s.nome}</p>
                      <p className="text-[10px] text-red-400 flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3 shrink-0" />Margem {s.margem}%
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-[10px]">
                    <span className="text-muted-foreground">{s.qty}x</span>
                    <span className="text-foreground">{formatCurrency(s.receita)}</span>
                    <span className="text-foreground">{formatCurrency(s.lucro)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {tab === "Veículos" && (
            <div className="space-y-2">
              {vehicles.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-6">Nenhum veículo no período</p>
              ) : vehicles.map((v) => (
                <div key={v.veiculo} className="rounded-lg p-2.5 bg-secondary/20 flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-foreground truncate">{v.veiculo}</p>
                    <p className="text-[10px] text-muted-foreground truncate">{v.servicoComum}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs font-medium text-foreground">{formatCurrency(v.receita)}</p>
                    <p className="text-[10px] text-muted-foreground">{v.servicos}x • {formatCurrency(v.ticket)}/serv</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
};

export default ServiceIntelligence;
