import { useState } from "react";
import { Bell, X, Check, AlertTriangle, TrendingUp, Info, CheckCircle, ChevronDown, LogOut, User } from "lucide-react";
import odbLogo from "@/assets/odb-logo.png";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";

const typeConfig: Record<string, { icon: any; color: string; bg: string }> = {
  alerta: { icon: AlertTriangle, color: "text-red-400", bg: "bg-red-500/10" },
  info: { icon: Info, color: "text-blue-400", bg: "bg-blue-500/10" },
  sucesso: { icon: CheckCircle, color: "text-emerald-400", bg: "bg-emerald-500/10" },
  insight: { icon: TrendingUp, color: "text-primary", bg: "bg-primary/10" },
};

const AppHeader = () => {
  const [notifOpen, setNotifOpen] = useState(false);
  const [filialOpen, setFilialOpen] = useState(false);
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isAdmin = profile?.role === "admin";

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

  const { data: filiais = [] } = useQuery({
    queryKey: ["filiais-header"],
    queryFn: async () => {
      const { data } = await supabase.from("filiais").select("id, nome").eq("ativa", true).order("nome");
      return data || [];
    },
    staleTime: 60000,
  });

  const unreadCount = notifications.filter((n: any) => !n.lida).length;
  const filialNome = filiais.find(f => f.id === profile?.filial_id)?.nome || (isAdmin ? "Todas Filiais" : "—");

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

  const initials = (profile?.nome || "U").slice(0, 2).toUpperCase();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 flex h-14 items-center justify-between border-b border-primary/30 px-3 md:px-4 bg-background/95 backdrop-blur-xl">
      {/* Left: Logo */}
      <div className="flex items-center gap-2">
        <div className="h-8 w-8 overflow-hidden flex items-center justify-center shrink-0 bg-primary flex items-center justify-center">
          <img src={odbLogo} alt="ODB" className="h-8 w-8 object-contain" />
        </div>
        <span className="text-sm font-bold text-foreground hidden md:block">Oficina da Borracha</span>
      </div>

      {/* Center: Filial name */}
      <div className="absolute left-1/2 -translate-x-1/2 flex items-center">
        {isAdmin ? (
          <div className="relative">
            <button
              onClick={() => setFilialOpen(!filialOpen)}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold text-foreground hover:bg-secondary/30 transition-colors"
            >
              {filialNome}
              <ChevronDown className="h-3 w-3 text-muted-foreground" />
            </button>
            <AnimatePresence>
              {filialOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setFilialOpen(false)} />
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    className="absolute left-1/2 -translate-x-1/2 top-8 z-50 w-44 rounded-xl border border-border/20 bg-card/95 backdrop-blur-xl shadow-2xl overflow-hidden"
                  >
                    {filiais.map(f => (
                      <button
                        key={f.id}
                        onClick={() => { setFilialOpen(false); }}
                        className="w-full text-left px-3 py-2 text-xs text-foreground hover:bg-secondary/30 transition-colors"
                      >
                        {f.nome}
                      </button>
                    ))}
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        ) : (
          <span className="text-xs font-semibold text-foreground">{filialNome}</span>
        )}
      </div>

      {/* Right: Status + Bell + Avatar */}
      <div className="flex items-center gap-1.5">
        <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-emerald-500/10">
          <span className="relative flex h-1.5 w-1.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
          </span>
        </div>

        {/* Notifications */}
        <div className="relative">
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => setNotifOpen(!notifOpen)}
            className="relative flex items-center justify-center h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/30 transition-colors"
          >
            <Bell className="h-4 w-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[9px] font-bold text-destructive-foreground">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </motion.button>

          <AnimatePresence>
            {notifOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setNotifOpen(false)} />
                <motion.div
                  initial={{ opacity: 0, y: -8, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.95 }}
                  className="absolute right-0 top-10 z-50 w-80 max-h-96 overflow-y-auto rounded-xl border border-border/20 bg-card/97 backdrop-blur-xl shadow-2xl"
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

        {/* Avatar */}
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/15 text-primary text-[11px] font-bold border border-primary/20">
          {initials}
        </div>
      </div>
    </header>
  );
};

export default AppHeader;
