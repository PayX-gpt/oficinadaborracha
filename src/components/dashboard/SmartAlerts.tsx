import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, AlertTriangle, TrendingUp, CheckCircle, Loader2, RefreshCw, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Notificacao {
  id: string;
  tipo: string;
  titulo: string;
  mensagem: string;
  lida: boolean;
  created_at: string;
}

const tipoConfig: Record<string, { icon: any; color: string; bg: string }> = {
  alerta: { icon: AlertTriangle, color: "text-primary", bg: "bg-primary/10" },
  insight: { icon: TrendingUp, color: "text-gold", bg: "bg-gold/10" },
  sucesso: { icon: CheckCircle, color: "text-success", bg: "bg-success/10" },
};

const SmartAlerts = () => {
  const [alerts, setAlerts] = useState<Notificacao[]>([]);
  const [loading, setLoading] = useState(false);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  const fetchAlerts = async () => {
    const { data } = await supabase
      .from("notificacoes")
      .select("*")
      .eq("lida", false)
      .order("created_at", { ascending: false })
      .limit(10);
    setAlerts(data || []);
  };

  const triggerSmartAlerts = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.functions.invoke("smart-alerts");
      if (error) throw error;
      await fetchAlerts();
      toast.success("Alertas atualizados");
    } catch (err: any) {
      toast.error("Erro: " + (err.message || "Falha"));
    } finally {
      setLoading(false);
    }
  };

  const dismissAlert = async (id: string) => {
    setDismissed(prev => new Set(prev).add(id));
    await supabase.from("notificacoes").update({ lida: true }).eq("id", id);
  };

  useEffect(() => {
    fetchAlerts();
  }, []);

  const visibleAlerts = alerts.filter(a => !dismissed.has(a.id));

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.95, duration: 0.4 }}
      className="rounded-xl p-3 md:p-6 transition-all duration-300 overflow-hidden bg-card border border-border">
      
      <div className="flex items-center justify-between gap-2 mb-3">
        <h3 className="text-[11px] uppercase tracking-[0.05em] text-muted-foreground font-medium flex items-center gap-1.5">
          <Bell className="h-3.5 w-3.5 text-primary shrink-0" />
          <span>Alertas Inteligentes</span>
          {visibleAlerts.length > 0 && (
            <span className="flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white px-1">
              {visibleAlerts.length}
            </span>
          )}
        </h3>
        <button onClick={triggerSmartAlerts} disabled={loading}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-medium bg-primary/20 text-primary border border-primary/30 hover:bg-primary/30 transition-colors disabled:opacity-50 shrink-0">
          {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
          Verificar
        </button>
      </div>

      {visibleAlerts.length === 0 ? (
        <div className="text-center py-4">
          <CheckCircle className="h-6 w-6 text-emerald-500/30 mx-auto mb-1" />
          <p className="text-xs text-muted-foreground">Nenhum alerta pendente</p>
        </div>
      ) : (
        <div className="space-y-2">
          <AnimatePresence>
            {visibleAlerts.map((alert) => {
              const config = tipoConfig[alert.tipo] || tipoConfig.insight;
              const Icon = config.icon;
              return (
                <motion.div key={alert.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, height: 0 }}
                  className={`rounded-xl p-3 ${config.bg} border border-border/10 space-y-1`}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <Icon className={`h-3.5 w-3.5 shrink-0 ${config.color}`} />
                      <p className="text-xs font-semibold text-foreground truncate">{alert.titulo}</p>
                    </div>
                    <button onClick={() => dismissAlert(alert.id)} className="text-muted-foreground hover:text-foreground shrink-0">
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-relaxed pl-5">{alert.mensagem}</p>
                  <p className="text-[9px] text-muted-foreground/50 pl-5">
                    {new Date(alert.created_at).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}
                  </p>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </motion.div>
  );
};

export default SmartAlerts;
