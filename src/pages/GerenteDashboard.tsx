import { useAuth } from "@/hooks/useAuth";
import Dashboard from "./Dashboard";
import { motion } from "framer-motion";
import { ClipboardList, DollarSign, Car, Users } from "lucide-react";

const GerenteDashboard = () => {
  const { profile } = useAuth();

  // Simplified dashboard for gerente - no lucro/sócios data
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-bold text-foreground">Resumo da Filial</h2>
        <p className="text-xs text-muted-foreground">Visão operacional do dia</p>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ staggerChildren: 0.05 }}
        className="grid grid-cols-2 gap-3"
      >
        {[
          { label: "Serviços Hoje", value: "0", icon: ClipboardList, color: "text-primary" },
          { label: "Receita Bruta", value: "R$ 0", icon: DollarSign, color: "text-emerald-400" },
          { label: "Em Andamento", value: "0", icon: Car, color: "text-blue-400" },
          { label: "Despesas Hoje", value: "R$ 0", icon: Users, color: "text-red-400" },
        ].map((card, i) => {
          const Icon = card.icon;
          return (
            <motion.div
              key={card.label}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="rounded-xl p-3.5 border"
              style={{
                background: "rgba(14,20,35,0.85)",
                backdropFilter: "blur(16px)",
                borderColor: "rgba(245,158,11,0.08)",
              }}
            >
              <div className="flex items-center gap-2 mb-2">
                <Icon className={`h-4 w-4 ${card.color}`} />
                <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">{card.label}</span>
              </div>
              <p className="text-xl font-bold text-foreground tabular-nums">{card.value}</p>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Saturday payroll banner */}
      {new Date().getDay() === 6 && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl p-4 border border-primary/20 bg-primary/5"
        >
          <p className="text-sm font-bold text-primary">💰 Dia de Pagamento!</p>
          <p className="text-[11px] text-muted-foreground mt-1">Funcionários aguardando pagamento semanal.</p>
        </motion.div>
      )}

      <div className="rounded-xl p-4 border" style={{ background: "rgba(14,20,35,0.85)", borderColor: "rgba(245,158,11,0.08)" }}>
        <p className="text-xs font-bold text-foreground mb-3">Serviços de Hoje</p>
        <div className="flex flex-col items-center py-8 text-center">
          <ClipboardList className="h-8 w-8 text-muted-foreground/30 mb-2" />
          <p className="text-[11px] text-muted-foreground">Nenhum serviço hoje — que tal lançar pelo ODB?</p>
        </div>
      </div>
    </div>
  );
};

export default GerenteDashboard;
