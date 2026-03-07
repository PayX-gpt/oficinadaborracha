import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, BellOff, MessageCircle, Share2, X, Check } from "lucide-react";
import { toast } from "sonner";

const NotificationSettings = () => {
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [showSection, setShowSection] = useState(true);

  useEffect(() => {
    if ("Notification" in window) {
      setPermission(Notification.permission);
    }
  }, []);

  const requestPermission = async () => {
    if (!("Notification" in window)) {
      toast.error("Notificações não suportadas neste navegador");
      return;
    }
    const result = await Notification.requestPermission();
    setPermission(result);
    if (result === "granted") {
      toast.success("Notificações ativadas!");
      new Notification("Oficina da Borracha", {
        body: "Você receberá alertas inteligentes sobre suas finanças!",
        icon: "/odb-logo.png",
      });
    } else {
      toast.info("Notificações bloqueadas. Ative nas configurações do navegador.");
    }
  };

  const shareWhatsApp = (text: string) => {
    const encoded = encodeURIComponent(text);
    window.open(`https://wa.me/?text=${encoded}`, "_blank");
  };

  const shareReport = () => {
    shareWhatsApp("📊 Relatório Oficina da Borracha — Acesse o sistema para ver os dados atualizados!");
  };

  const shareAlert = (msg: string) => {
    shareWhatsApp(`⚠️ Alerta ODB: ${msg}`);
  };

  return (
    <div className="space-y-4">
      {/* Push Notifications */}
      <div className="rounded-xl p-4"
        style={{ background: "rgba(14,20,35,0.85)", border: "1px solid rgba(245,158,11,0.08)" }}>
        <h4 className="text-xs font-semibold text-foreground flex items-center gap-2 mb-3">
          <Bell className="h-4 w-4 text-primary" /> Notificações Push
        </h4>
        
        {permission === "granted" ? (
          <div className="flex items-center gap-2 p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
            <Check className="h-4 w-4 text-emerald-400" />
            <span className="text-xs text-emerald-400 font-medium">Notificações ativadas</span>
          </div>
        ) : permission === "denied" ? (
          <div className="flex items-center gap-2 p-2.5 rounded-lg bg-red-500/10 border border-red-500/20">
            <BellOff className="h-4 w-4 text-red-400" />
            <div>
              <span className="text-xs text-red-400 font-medium block">Notificações bloqueadas</span>
              <span className="text-[10px] text-muted-foreground">Ative nas configurações do navegador</span>
            </div>
          </div>
        ) : (
          <button onClick={requestPermission}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-medium bg-primary/20 text-primary border border-primary/30 hover:bg-primary/30 transition-colors w-full justify-center">
            <Bell className="h-4 w-4" />
            Ativar Notificações
          </button>
        )}
        
        <p className="text-[10px] text-muted-foreground mt-2 leading-relaxed">
          Receba alertas sobre: margem baixa, despesas elevadas, faturamento zerado e sequências positivas.
        </p>
      </div>

      {/* WhatsApp Integration */}
      <div className="rounded-xl p-4"
        style={{ background: "rgba(14,20,35,0.85)", border: "1px solid rgba(245,158,11,0.08)" }}>
        <h4 className="text-xs font-semibold text-foreground flex items-center gap-2 mb-3">
          <MessageCircle className="h-4 w-4 text-emerald-500" /> Compartilhar via WhatsApp
        </h4>
        
        <div className="space-y-2">
          <button onClick={shareReport}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 transition-colors w-full">
            <Share2 className="h-3.5 w-3.5" />
            Compartilhar Resumo Financeiro
          </button>
          <button onClick={() => shareAlert("Margem abaixo do esperado nos últimos 7 dias. Revisar preços.")}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium bg-secondary/20 text-muted-foreground border border-border/20 hover:bg-secondary/30 transition-colors w-full">
            <Share2 className="h-3.5 w-3.5" />
            Enviar Alerta aos Sócios
          </button>
        </div>
        
        <p className="text-[10px] text-muted-foreground mt-2 leading-relaxed">
          Envie relatórios e alertas diretamente pelo WhatsApp para seus sócios e gerentes.
        </p>
      </div>
    </div>
  );
};

export default NotificationSettings;
