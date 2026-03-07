import { motion } from "framer-motion";
import { Building2 } from "lucide-react";

interface DashboardHeaderProps {
  selectedBranch: string;
  onBranchChange: (branch: string) => void;
  selectedPeriod: string;
  onPeriodChange: (period: string) => void;
}

const branches = [
  { id: "all", label: "Todas as Filiais", icon: true },
  { id: "centro", label: "Filial Centro" },
  { id: "norte", label: "Filial Norte" },
  { id: "sul", label: "Filial Sul" },
];

const periods = ["Hoje", "Ontem", "7 Dias", "30 Dias", "Este Mês", "Mês Anterior"];

const DashboardHeader = ({ selectedBranch, onBranchChange, selectedPeriod, onPeriodChange }: DashboardHeaderProps) => {
  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
          </span>
          <span className="text-xs text-muted-foreground font-medium">Sistema Online</span>
          <span className="text-xs text-muted-foreground">•</span>
          <span className="text-xs text-muted-foreground">47 lançamentos hoje</span>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {periods.map((p) => (
            <button
              key={p}
              onClick={() => onPeriodChange(p)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
                selectedPeriod === p
                  ? "bg-primary/20 text-primary border border-primary/30"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary/50 border border-transparent"
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-1 p-1 rounded-xl bg-secondary/30 backdrop-blur-sm border border-border/50 overflow-x-auto">
        {branches.map((b) => (
          <button
            key={b.id}
            onClick={() => onBranchChange(b.id)}
            className={`relative px-4 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all duration-300 flex items-center gap-1.5 ${
              selectedBranch === b.id ? "text-primary" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {selectedBranch === b.id && (
              <motion.div
                layoutId="branchTab"
                className="absolute inset-0 bg-secondary/80 rounded-lg border border-primary/20"
                style={{ boxShadow: "0 0 12px rgba(245,158,11,0.1)" }}
                transition={{ type: "spring", bounce: 0.2, duration: 0.4 }}
              />
            )}
            <span className="relative z-10 flex items-center gap-1.5">
              {b.icon && <Building2 className="h-3.5 w-3.5" />}
              {b.label}
            </span>
          </button>
        ))}
      </div>

      <p className="text-[11px] text-muted-foreground">
        Comparando com: {selectedPeriod === "Hoje" ? "ontem" : selectedPeriod === "7 Dias" ? "7 dias anteriores" : "período anterior equivalente"}
      </p>
    </div>
  );
};

export default DashboardHeader;
