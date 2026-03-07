import { Bell, Wifi } from "lucide-react";
import { motion } from "framer-motion";

const AppHeader = () => {
  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 flex h-12 items-center justify-between border-b px-4"
      style={{
        background: "rgba(7,11,20,0.92)",
        backdropFilter: "blur(16px)",
        borderColor: "rgba(245,158,11,0.08)",
      }}
    >
      <div className="flex items-center gap-2.5">
        <div className="h-7 w-7 rounded-lg bg-primary flex items-center justify-center" style={{ boxShadow: "0 0 12px rgba(245,158,11,0.2)" }}>
          <span className="text-[11px] font-extrabold text-primary-foreground">OB</span>
        </div>
        <span className="text-sm font-semibold text-foreground hidden sm:block">Oficina da Borracha</span>
      </div>

      <div className="flex items-center gap-1.5">
        <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-emerald-500/10">
          <span className="relative flex h-1.5 w-1.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
          </span>
          <span className="text-[10px] text-emerald-400 font-medium hidden sm:block">Online</span>
        </div>

        <motion.button
          whileTap={{ scale: 0.9 }}
          className="relative flex items-center justify-center h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/30 transition-colors"
        >
          <Bell className="h-4 w-4" />
          <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-primary" />
        </motion.button>
      </div>
    </header>
  );
};

export default AppHeader;
