import { motion } from "framer-motion";
import { Building2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface DashboardHeaderProps {
  selectedBranch: string;
  onBranchChange: (branch: string) => void;
  selectedPeriod: string;
  onPeriodChange: (period: string) => void;
}

const periods = ["Hoje", "Ontem", "7 Dias", "30 Dias", "Este Mês", "Mês Anterior"];

const DashboardHeader = ({ selectedBranch, onBranchChange, selectedPeriod, onPeriodChange }: DashboardHeaderProps) => {
  const { data: filiais = [] } = useQuery({
    queryKey: ["filiais"],
    queryFn: async () => { const { data } = await supabase.from("filiais").select("id, nome").order("nome"); return data || []; },
  });

  const { data: todayCount = 0 } = useQuery({
    queryKey: ["today-count"],
    queryFn: async () => {
      const today = new Date(); today.setHours(0, 0, 0, 0);
      const { count } = await supabase.from("lancamentos").select("*", { count: "exact", head: true }).gte("created_at", today.toISOString());
      return count || 0;
    },
    refetchInterval: 30000,
  });

  const branches = [
    { id: "all", label: "Todas", icon: true },
    ...filiais.map((f) => ({ id: f.id, label: f.nome, icon: false })),
  ];

  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 shrink-0">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
          <span className="text-[10px] text-muted-foreground font-medium">Online</span>
          <span className="text-[10px] text-muted-foreground">•</span>
          <span className="text-[10px] text-muted-foreground">{todayCount} lanç.</span>
        </div>
      </div>

      <div className="flex gap-1 overflow-x-auto scrollbar-none -mx-1 px-1 pb-1">
        {periods.map((p) => (
          <button key={p} onClick={() => onPeriodChange(p)}
            className={`px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-all whitespace-nowrap shrink-0 ${
              selectedPeriod === p ? "bg-primary/20 text-primary border border-primary/30" : "text-muted-foreground hover:text-foreground border border-transparent"
            }`}>{p}</button>
        ))}
      </div>

      <div className="flex gap-1 overflow-x-auto scrollbar-none -mx-1 px-1 pb-1 p-0.5 rounded-xl bg-secondary/30 backdrop-blur-sm border border-border/50">
        {branches.map((b) => (
          <button key={b.id} onClick={() => onBranchChange(b.id)}
            className={`relative px-3 py-1.5 rounded-lg text-[11px] font-medium whitespace-nowrap transition-all shrink-0 flex items-center gap-1 ${
              selectedBranch === b.id ? "text-primary" : "text-muted-foreground hover:text-foreground"
            }`}>
            {selectedBranch === b.id && (
              <motion.div layoutId="branchTab" className="absolute inset-0 bg-secondary/80 rounded-lg border border-primary/20" style={{ boxShadow: "0 0 12px rgba(245,158,11,0.1)" }} transition={{ type: "spring", bounce: 0.2, duration: 0.4 }} />
            )}
            <span className="relative z-10 flex items-center gap-1">
              {b.icon && <Building2 className="h-3 w-3" />}{b.label}
            </span>
          </button>
        ))}
      </div>

      <p className="text-[10px] text-muted-foreground">
        vs: {selectedPeriod === "Hoje" ? "ontem" : selectedPeriod === "7 Dias" ? "7 dias anteriores" : "período anterior"}
      </p>
    </div>
  );
};

export default DashboardHeader;
