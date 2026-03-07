import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Download, Smartphone, Wifi, WifiOff, CheckCircle, Share2, Monitor } from "lucide-react";
import odbLogo from "@/assets/odb-logo.png";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const InstallPage = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    const ua = navigator.userAgent;
    setIsIOS(/iPad|iPhone|iPod/.test(ua));
    setIsStandalone(window.matchMedia("(display-mode: standalone)").matches || (navigator as any).standalone === true);

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", handler);

    const onOnline = () => setIsOnline(true);
    const onOffline = () => setIsOnline(false);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);

    const onInstalled = () => setInstalled(true);
    window.addEventListener("appinstalled", onInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") setInstalled(true);
    setDeferredPrompt(null);
  };

  if (isStandalone || installed) {
    return (
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <CheckCircle className="h-16 w-16 text-emerald-500" />
        <h2 className="text-lg font-bold text-foreground">App Instalado!</h2>
        <p className="text-xs text-muted-foreground text-center max-w-sm">
          O app está instalado e pronto para uso. Funciona offline e você receberá atualizações automaticamente.
        </p>
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-secondary/30 text-xs">
          {isOnline ? (
            <><Wifi className="h-4 w-4 text-emerald-500" /><span className="text-emerald-400">Online</span></>
          ) : (
            <><WifiOff className="h-4 w-4 text-red-400" /><span className="text-red-400">Offline</span></>
          )}
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center justify-center min-h-[60vh] space-y-6 pb-24">
      <div className="relative">
        <motion.div
          animate={{ scale: [1, 1.08, 1], opacity: [0.4, 0.7, 0.4] }}
          transition={{ duration: 3, repeat: Infinity }}
          className="absolute inset-0 rounded-full bg-primary/20 blur-2xl"
        />
        <div className="relative flex h-24 w-24 items-center justify-center rounded-2xl bg-primary/10 border border-primary/20 overflow-hidden">
          <img src={odbLogo} alt="ODB" className="h-20 w-20 object-contain" />
        </div>
      </div>

      <div className="text-center space-y-2">
        <h2 className="text-xl font-bold text-foreground">Instale o App</h2>
        <p className="text-xs text-muted-foreground max-w-sm leading-relaxed">
          Instale a Oficina da Borracha no seu celular para acesso rápido, funcionamento offline e melhor experiência.
        </p>
      </div>

      {/* Features */}
      <div className="grid grid-cols-1 gap-2 w-full max-w-sm">
        {[
          { icon: Smartphone, label: "Ícone na tela inicial", desc: "Acesse como app nativo" },
          { icon: WifiOff, label: "Funciona offline", desc: "Dados em cache disponíveis sem internet" },
          { icon: Download, label: "Atualizações automáticas", desc: "Sempre na versão mais recente" },
        ].map((f, i) => (
          <div key={i} className="flex items-center gap-3 p-3 rounded-xl"
            style={{ background: "rgba(14,20,35,0.7)", border: "1px solid rgba(245,158,11,0.1)" }}>
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
              <f.icon className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-xs font-medium text-foreground">{f.label}</p>
              <p className="text-[10px] text-muted-foreground">{f.desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Install CTA */}
      {deferredPrompt ? (
        <button onClick={handleInstall}
          className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-all shadow-lg shadow-primary/20">
          <Download className="h-5 w-5" />
          Instalar Agora
        </button>
      ) : isIOS ? (
        <div className="rounded-xl p-4 max-w-sm text-center space-y-2"
          style={{ background: "rgba(14,20,35,0.8)", border: "1px solid rgba(245,158,11,0.1)" }}>
          <Share2 className="h-6 w-6 text-primary mx-auto" />
          <p className="text-xs text-foreground font-medium">No iPhone/iPad:</p>
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            Toque no botão <strong className="text-primary">Compartilhar</strong> (ícone de seta) e depois em <strong className="text-primary">"Adicionar à Tela de Início"</strong>
          </p>
        </div>
      ) : (
        <div className="rounded-xl p-4 max-w-sm text-center space-y-2"
          style={{ background: "rgba(14,20,35,0.8)", border: "1px solid rgba(245,158,11,0.1)" }}>
          <Monitor className="h-6 w-6 text-primary mx-auto" />
          <p className="text-xs text-foreground font-medium">Como instalar:</p>
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            Abra o menu do navegador (⋮) e selecione <strong className="text-primary">"Instalar app"</strong> ou <strong className="text-primary">"Adicionar à tela inicial"</strong>
          </p>
        </div>
      )}

      {/* Connection status */}
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-secondary/20 text-[11px]">
        {isOnline ? (
          <><Wifi className="h-3.5 w-3.5 text-emerald-500" /><span className="text-muted-foreground">Conectado</span></>
        ) : (
          <><WifiOff className="h-3.5 w-3.5 text-red-400" /><span className="text-red-400">Sem conexão</span></>
        )}
      </div>
    </motion.div>
  );
};

export default InstallPage;
