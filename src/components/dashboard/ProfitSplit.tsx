import { motion } from "framer-motion";
import { Users } from "lucide-react";
import { mockSocios, formatCurrency } from "@/lib/mockDashboardData";

const waterfall = [
  { label: "Receita Líquida", value: 29500, type: "positive" },
  { label: "Custo Peças Compradas", value: -5904, type: "negative" },
  { label: "Custo Peças Fabricadas", value: -2775, type: "negative" },
  { label: "Despesas Operacionais", value: -5550, type: "negative" },
  { label: "Taxas de Máquina", value: -955, type: "negative" },
  { label: "LUCRO LÍQUIDO", value: 14316, type: "total" },
  { label: "Reserva Caixa (15%)", value: -2147, type: "negative" },
  { label: "PARA DISTRIBUIR", value: 12169, type: "result" },
];

const ProfitSplit = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.75, duration: 0.4 }}
      className="rounded-2xl p-6 transition-all duration-300"
      style={{
        background: "rgba(14,20,35,0.85)",
        backdropFilter: "blur(16px)",
        border: "1px solid rgba(245,158,11,0.15)",
        boxShadow: "0 4px 24px rgba(0,0,0,0.3), 0 0 0 1px rgba(255,255,255,0.03)",
      }}
    >
      <div className="flex items-center gap-2 mb-6">
        <Users className="h-4 w-4 text-primary" />
        <h3 className="text-[11px] uppercase tracking-[0.05em] text-muted-foreground font-medium">Distribuição de Lucros</h3>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Waterfall */}
        <div className="space-y-1">
          {waterfall.map((w, i) => (
            <motion.div
              key={w.label}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.8 + i * 0.05 }}
              className={`flex items-center justify-between py-1.5 px-2 rounded text-xs ${
                w.type === "total" || w.type === "result" ? "bg-secondary/50" : ""
              }`}
            >
              <span className={`${w.type === "total" || w.type === "result" ? "text-foreground font-bold" : "text-muted-foreground"}`}>
                {w.type === "negative" ? "→ " : ""}{w.label}
              </span>
              <span className={`font-medium ${
                w.type === "negative" ? "text-red-400" : w.type === "result" ? "text-primary font-bold" : "text-emerald-500"
              }`}>
                {w.value >= 0 ? formatCurrency(w.value) : `-${formatCurrency(Math.abs(w.value))}`}
              </span>
            </motion.div>
          ))}
        </div>

        {/* Sócios */}
        <div className="space-y-3">
          {mockSocios.map((s) => (
            <div key={s.nome} className="rounded-lg p-3 bg-secondary/20 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">
                    {s.nome[0]}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{s.nome}</p>
                    <p className="text-[11px] text-muted-foreground">{s.filiais} • {s.percent}%</p>
                  </div>
                </div>
                <p className="text-sm font-bold text-primary">{formatCurrency(s.valorBruto)}</p>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-[11px]">
                  <span className="text-muted-foreground">Retirado: {formatCurrency(s.retiradas)}</span>
                  <span className="text-emerald-500">Saldo: {formatCurrency(s.saldo)}</span>
                </div>
                <div className="h-1.5 rounded-full bg-secondary/50 overflow-hidden">
                  <div className="h-full rounded-full bg-primary" style={{ width: `${(s.retiradas / s.valorBruto) * 100}%` }} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

export default ProfitSplit;
