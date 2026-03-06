import { motion } from "framer-motion";
import { DollarSign, TrendingUp, Wallet, ArrowDownCircle, Receipt, Clock } from "lucide-react";

const kpis = [
  { label: "Receita Bruta", value: "R$ 0,00", icon: DollarSign, sub: "0 serviços", color: "text-primary" },
  { label: "Lucro Bruto", value: "R$ 0,00", icon: TrendingUp, sub: "0%", color: "text-success" },
  { label: "Lucro Líquido", value: "R$ 0,00", icon: Wallet, sub: "—", color: "text-info" },
  { label: "Despesas", value: "R$ 0,00", icon: ArrowDownCircle, sub: "0 lançamentos", color: "text-destructive" },
  { label: "Ticket Médio", value: "R$ 0,00", icon: Receipt, sub: "—", color: "text-foreground" },
  { label: "Ganho/Hora", value: "R$ 0/h", icon: Clock, sub: "—", color: "text-info" },
];

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

const Dashboard = () => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-foreground">Dashboard</h2>
        <p className="text-sm text-muted-foreground">Visão geral do dia</p>
      </div>

      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6"
      >
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <motion.div key={kpi.label} variants={item} className="glass-card p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground font-medium">{kpi.label}</span>
                <Icon className={`h-4 w-4 ${kpi.color}`} />
              </div>
              <p className="text-lg font-bold text-foreground">{kpi.value}</p>
              <p className="text-[11px] text-muted-foreground">{kpi.sub}</p>
            </motion.div>
          );
        })}
      </motion.div>

      <div className="glass-card p-6 text-center">
        <p className="text-muted-foreground text-sm">
          Comece fazendo lançamentos para ver seus dados aqui.
        </p>
      </div>
    </div>
  );
};

export default Dashboard;
