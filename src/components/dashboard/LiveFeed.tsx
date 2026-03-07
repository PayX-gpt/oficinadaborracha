import { motion } from "framer-motion";
import { Pencil, Camera, Mic, ClipboardList } from "lucide-react";
import { mockLiveFeed, formatCurrency } from "@/lib/mockDashboardData";
import type { ComponentType } from "react";

const typeConfig: Record<string, { icon: ComponentType<{ className?: string }>; label: string; color: string }> = {
  manual: { icon: Pencil, label: "Manual", color: "bg-primary/20 text-primary" },
  foto: { icon: Camera, label: "Foto", color: "bg-blue-500/20 text-blue-400" },
  audio: { icon: Mic, label: "Áudio", color: "bg-violet-500/20 text-violet-400" },
  despesa: { icon: ClipboardList, label: "Despesa", color: "bg-red-500/20 text-red-400" },
};

const LiveFeed = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.95, duration: 0.4 }}
      className="rounded-2xl p-4 md:p-6 transition-all duration-300"
      style={{
        background: "rgba(14,20,35,0.85)",
        backdropFilter: "blur(16px)",
        border: "1px solid rgba(245,158,11,0.08)",
        boxShadow: "0 4px 24px rgba(0,0,0,0.3), 0 0 0 1px rgba(255,255,255,0.03)",
      }}
    >
      <div className="flex items-center gap-2 mb-4">
        <h3 className="text-[11px] uppercase tracking-[0.05em] text-muted-foreground font-medium">Atividade em Tempo Real</h3>
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
        </span>
        <span className="text-[10px] text-emerald-500 font-medium">Live</span>
      </div>

      <div className="space-y-1">
        {mockLiveFeed.map((item, i) => {
          const tc = typeConfig[item.tipo];
          const Icon = tc.icon;
          return (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1 + i * 0.05 }}
              className="flex items-center gap-2 md:gap-3 py-2 px-2 rounded-lg hover:bg-secondary/20 transition-colors"
            >
              <span className="text-[11px] text-muted-foreground w-10 shrink-0">{item.hora}</span>
              <div className="w-6 h-6 rounded-full bg-secondary/50 flex items-center justify-center text-[10px] font-bold text-foreground shrink-0">
                {item.operador[0]}
              </div>
              <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium shrink-0 flex items-center gap-1 ${tc.color}`}>
                <Icon className="h-3 w-3" />
                <span className="hidden sm:inline">{tc.label}</span>
              </span>
              <span className="text-xs text-foreground truncate flex-1 min-w-0">{item.desc}</span>
              <span className={`text-xs font-medium shrink-0 ${item.valor >= 0 ? "text-emerald-500" : "text-red-400"}`}>
                {item.valor >= 0 ? formatCurrency(item.valor) : `-${formatCurrency(Math.abs(item.valor))}`}
              </span>
              <span className="px-1.5 py-0.5 rounded text-[10px] bg-secondary/30 text-muted-foreground shrink-0 hidden sm:block">{item.pagamento}</span>
              <span className="text-[10px] text-muted-foreground shrink-0 hidden lg:block">{item.filial}</span>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
};

export default LiveFeed;
