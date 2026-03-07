import { useState, useEffect } from "react";
import { Bell, X, Check, AlertTriangle, TrendingUp, Info, CheckCircle } from "lucide-react";
import odbLogo from "@/assets/odb-logo.png";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

const typeConfig: Record<string, { icon: any; color: string; bg: string }> = {
  alerta: { icon: AlertTriangle, color: "text-red-400", bg: "bg-red-500/10" },
  info: { icon: Info, color: "text-blue-400", bg: "bg-blue-500/10" },
  sucesso: { icon: CheckCircle, color: "text-emerald-400", bg: "bg-emerald-500/10" },
  insight: { icon: TrendingUp, color: "text-primary", bg: "bg-primary/10" },
};

const AppHeader = () => {
  const [open, setOpen] = useState(false);
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: notifications = [] } = useQuery({
    queryKey: ["notificacoes"],
    queryFn: async () => {
      const { data } = await supabase
        .from("notificacoes")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(20);
      return (data || []) as any[];
    },
    refetchInterval: 30000,
  });

  const unreadCount = notifications.filter((n: any) => !n.lida).length;

  const markRead = async (id: string) => {
    await supabase.from("notificacoes").update({ lida: true }).eq("id", id);
    queryClient.invalidateQueries({ queryKey: ["notificacoes"] });
  };

  const markAllRead = async () => {
    const unread = notifications.filter((n: any) => !n.lida);
    for (const n of unread) {
      await supabase.from("notificacoes").update({ lida: true }).eq("id", n.id);
    }
    queryClient.invalidateQueries({ queryKey: ["notificacoes"] });
  };

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
        <div className="h-7 w-7 rounded-lg overflow-hidden flex items-center justify-center" style={{ boxShadow: "0 0 12px rgba(245,158,11,0.2)" }}>
          <img src={odbLogo} alt="ODB" className="h-7 w-7 object-contain" />
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

        <div className="relative">
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => setOpen(!open)}
            className="relative flex items-center justify-center h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/30 transition-colors"
          >
            <Bell className="h-4 w-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </motion.button>

          <AnimatePresence>
            {open && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
                <motion.div
                  initial={{ opacity: 0, y: -8, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.95 }}
                  className="absolute right-0 top-10 z-50 w-80 max-h-96 overflow-y-auto rounded-xl border shadow-2xl"
                  style={{ background: "rgba(14,20,35,0.97)", borderColor: "rgba(245,158,11,0.12)", backdropFilter: "blur(20px)" }}
                >
                  <div className="flex items-center justify-between p-3 border-b border-border/10">
                    <span className="text-xs font-bold text-foreground">Notificações</span>
                    {unreadCount > 0 && (
                      <button onClick={markAllRead} className="text-[10px] text-primary hover:underline">Marcar todas como lidas</button>
                    )}
                  </div>
                  {notifications.length === 0 ? (
                    <div className="p-6 text-center">
                      <Bell className="h-8 w-8 text-muted-foreground/20 mx-auto mb-2" />
                      <p className="text-xs text-muted-foreground">Nenhuma notificação</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-border/5">
                      {notifications.map((n: any) => {
                        const cfg = typeConfig[n.tipo] || typeConfig.info;
                        const Icon = cfg.icon;
                        return (
                          <div key={n.id} className={`flex gap-2.5 p-3 transition-colors ${n.lida ? "opacity-50" : "hover:bg-secondary/10"}`}>
                            <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${cfg.bg}`}>
                              <Icon className={`h-3.5 w-3.5 ${cfg.color}`} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-[11px] font-semibold text-foreground leading-tight">{n.titulo}</p>
                              <p className="text-[10px] text-muted-foreground mt-0.5 leading-snug">{n.mensagem}</p>
                              <p className="text-[9px] text-muted-foreground/60 mt-1">
                                {new Date(n.created_at).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}
                              </p>
                            </div>
                            {!n.lida && (
                              <button onClick={() => markRead(n.id)} className="shrink-0 text-muted-foreground hover:text-primary">
                                <Check className="h-3.5 w-3.5" />
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
};

export default AppHeader;
