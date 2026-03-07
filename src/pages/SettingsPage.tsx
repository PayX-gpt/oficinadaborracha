import { motion } from "framer-motion";
import { Building2, Users, CreditCard, Shield, LogOut, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useState } from "react";

const settingsSections = [
  { icon: Building2, label: "Filiais", desc: "Gerenciar unidades da oficina" },
  { icon: Users, label: "Sócios & Equipe", desc: "Participação e operadores" },
  { icon: CreditCard, label: "Taxas", desc: "Configurar taxas de máquina" },
  { icon: Shield, label: "Segurança", desc: "Senha e permissões" },
];

const SettingsPage = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    await signOut();
    navigate("/login");
  };

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
      <div>
        <h2 className="text-lg font-bold text-foreground">Configurações</h2>
        <p className="text-xs text-muted-foreground">{user?.email}</p>
      </div>
      <div className="space-y-2">
        {settingsSections.map((s) => (
          <button
            key={s.label}
            className="w-full flex items-center gap-4 p-4 rounded-xl border transition-all hover:border-primary/20"
            style={{
              background: "rgba(14,20,35,0.7)",
              backdropFilter: "blur(12px)",
              borderColor: "rgba(245,158,11,0.08)",
            }}
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-secondary/50">
              <s.icon className="h-5 w-5 text-muted-foreground" />
            </div>
            <div className="text-left">
              <p className="text-sm font-medium text-foreground">{s.label}</p>
              <p className="text-[11px] text-muted-foreground">{s.desc}</p>
            </div>
          </button>
        ))}
      </div>

      <Button
        onClick={handleLogout}
        disabled={loggingOut}
        variant="outline"
        className="w-full h-11 border-red-500/30 text-red-400 hover:bg-red-500/10 gap-2"
      >
        {loggingOut ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogOut className="h-4 w-4" />}
        Sair da Conta
      </Button>
    </motion.div>
  );
};

export default SettingsPage;
