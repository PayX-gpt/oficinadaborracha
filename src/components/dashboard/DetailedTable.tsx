import { motion } from "framer-motion";
import { Download, Search, Pencil, Camera, Mic } from "lucide-react";
import { mockTransactions, formatCurrency } from "@/lib/mockDashboardData";
import type { ComponentType } from "react";

const sourceConfig: Record<string, { icon: ComponentType<{ className?: string }>; color: string }> = {
  manual: { icon: Pencil, color: "text-primary" },
  foto: { icon: Camera, color: "text-blue-400" },
  audio: { icon: Mic, color: "text-violet-400" },
};

const DetailedTable = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 1.05, duration: 0.4 }}
      className="rounded-2xl p-4 md:p-6 transition-all duration-300"
      style={{
        background: "rgba(14,20,35,0.85)",
        backdropFilter: "blur(16px)",
        border: "1px solid rgba(245,158,11,0.08)",
        boxShadow: "0 4px 24px rgba(0,0,0,0.3), 0 0 0 1px rgba(255,255,255,0.03)",
      }}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <h3 className="text-[11px] uppercase tracking-[0.05em] text-muted-foreground font-medium">Lançamentos Detalhados</h3>
          <p className="text-xs text-muted-foreground">{mockTransactions.length} registros</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Buscar..."
              className="pl-8 pr-3 py-1.5 text-xs rounded-lg bg-secondary/30 border border-border/50 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/30 w-full sm:w-48"
            />
          </div>
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-secondary/30 text-muted-foreground hover:text-foreground border border-border/50 transition-colors">
            <Download className="h-3.5 w-3.5" />
            CSV
          </button>
        </div>
      </div>

      {/* Desktop table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="text-muted-foreground border-b border-border/50">
              {["#", "Hora", "Operador", "Cliente", "Veículo", "Tipo", "Bruto", "Custo", "Desc.", "Taxa", "Líquido", "Margem", "Pgto", "Fonte"].map((h) => (
                <th key={h} className="text-left py-2 font-medium whitespace-nowrap px-1">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {mockTransactions.map((t) => {
              const src = sourceConfig[t.fonte];
              const SrcIcon = src?.icon || Pencil;
              return (
                <tr key={t.id} className="border-b border-border/30 hover:bg-secondary/10 transition-colors">
                  <td className="py-2 px-1 text-muted-foreground">{t.id}</td>
                  <td className="py-2 px-1 text-foreground">{t.hora}</td>
                  <td className="py-2 px-1 text-foreground">{t.operador}</td>
                  <td className="py-2 px-1 text-foreground">{t.cliente}</td>
                  <td className="py-2 px-1 text-foreground whitespace-nowrap">{t.veiculo}</td>
                  <td className="py-2 px-1">
                    <span className={`px-1.5 py-0.5 rounded text-[10px] ${t.tipo === "Despesa" ? "bg-red-500/20 text-red-400" : "bg-emerald-500/20 text-emerald-400"}`}>{t.tipo}</span>
                  </td>
                  <td className="py-2 px-1 text-foreground">{t.bruto > 0 ? formatCurrency(t.bruto) : "—"}</td>
                  <td className="py-2 px-1 text-red-400">{formatCurrency(t.custo)}</td>
                  <td className="py-2 px-1 text-foreground">{t.desconto > 0 ? formatCurrency(t.desconto) : "—"}</td>
                  <td className="py-2 px-1 text-foreground">{t.taxa > 0 ? formatCurrency(t.taxa) : "—"}</td>
                  <td className={`py-2 px-1 font-medium ${t.liquido >= 0 ? "text-emerald-500" : "text-red-400"}`}>{formatCurrency(t.liquido)}</td>
                  <td className="py-2 px-1">
                    <span className={`${t.margem > 50 ? "text-emerald-500" : t.margem > 20 ? "text-primary" : "text-red-400"}`}>
                      {t.margem > 0 ? `${t.margem}%` : "—"}
                    </span>
                  </td>
                  <td className="py-2 px-1">
                    <span className="px-1.5 py-0.5 rounded text-[10px] bg-secondary/30 text-muted-foreground">{t.pagamento}</span>
                  </td>
                  <td className="py-2 px-1">
                    <SrcIcon className={`h-3.5 w-3.5 ${src?.color || "text-muted-foreground"}`} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden space-y-2">
        {mockTransactions.map((t) => {
          const src = sourceConfig[t.fonte];
          const SrcIcon = src?.icon || Pencil;
          return (
            <div key={t.id} className="rounded-lg p-3 bg-secondary/20 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">{t.hora}</span>
                  <span className={`px-1.5 py-0.5 rounded text-[10px] ${t.tipo === "Despesa" ? "bg-red-500/20 text-red-400" : "bg-emerald-500/20 text-emerald-400"}`}>{t.tipo}</span>
                  <SrcIcon className={`h-3 w-3 ${src?.color || "text-muted-foreground"}`} />
                </div>
                <span className={`text-sm font-bold ${t.liquido >= 0 ? "text-emerald-500" : "text-red-400"}`}>
                  {formatCurrency(t.liquido)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-foreground">{t.cliente} — {t.veiculo}</p>
                  <p className="text-[11px] text-muted-foreground">{t.operador} • {t.pagamento}</p>
                </div>
                {t.margem > 0 && (
                  <span className={`text-[11px] font-medium ${t.margem > 50 ? "text-emerald-500" : t.margem > 20 ? "text-primary" : "text-red-400"}`}>
                    {t.margem}%
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
};

export default DetailedTable;
