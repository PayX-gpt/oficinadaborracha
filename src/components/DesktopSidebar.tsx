import { useLocation, useNavigate } from "react-router-dom";
import { LayoutDashboard, ClipboardList, Settings, Users, User, LogOut, MessageSquare, UserCircle, Package, FileText, Download, BookOpen } from "lucide-react";
import { useAuth, UserRole } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import odbLogo from "@/assets/odb-logo.png";
import { toast } from "sonner";

interface NavItem {
  path: string;
  label: string;
  icon: any;
}

const ODBIcon = ({ className }: { className?: string }) => (
  <img src={odbLogo} alt="ODB" className={className} style={{ objectFit: "contain" }} />
);

function getNavItems(role: UserRole): NavItem[] {
  switch (role) {
    case "admin":
      return [
        { path: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
        { path: "/chat-financeiro", label: "Chat IA", icon: MessageSquare },
        { path: "/relatorios", label: "Relatórios IA", icon: FileText },
        { path: "/clientes", label: "Clientes", icon: UserCircle },
        { path: "/equipe", label: "Equipe", icon: Users },
        { path: "/odb", label: "Agente ODB", icon: ODBIcon },
        { path: "/pecas", label: "Peças", icon: Package },
        { path: "/history", label: "Histórico", icon: ClipboardList },
        { path: "/install", label: "Instalar App", icon: Download },
        { path: "/settings", label: "Configurações", icon: Settings },
      ];
    case "gerente":
      return [
        { path: "/dashboard", label: "Resumo", icon: LayoutDashboard },
        { path: "/odb", label: "Agente ODB", icon: ODBIcon },
        { path: "/history", label: "Serviços", icon: ClipboardList },
        { path: "/settings", label: "Config", icon: Settings },
      ];
    default:
      return [
        { path: "/odb", label: "Agente ODB", icon: ODBIcon },
        { path: "/history", label: "Meus Lançamentos", icon: ClipboardList },
        { path: "/perfil", label: "Perfil", icon: User },
      ];
  }
}

const DesktopSidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const role = profile?.role || "operador";
  const navItems = getNavItems(role);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success("Logout realizado");
    navigate("/login");
  };

  return (
    <aside
      className="hidden md:flex fixed top-12 left-0 bottom-0 w-60 flex-col border-r p-3 z-40"
      style={{
        background: "rgba(7,11,20,0.92)",
        backdropFilter: "blur(16px)",
        borderColor: "rgba(245,158,11,0.08)",
      }}
    >
      <div className="flex-1 space-y-0.5 mt-3">
        {navItems.map((item) => {
          const isActive = location.pathname.startsWith(item.path);
          const Icon = item.icon;
          const isODB = item.path === "/odb";
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] font-medium transition-all ${
                isODB
                  ? isActive
                    ? "bg-primary/20 text-primary border border-primary/25"
                    : "bg-primary/5 text-primary/80 hover:bg-primary/10 border border-primary/10"
                  : isActive
                  ? "bg-primary/10 text-primary border border-primary/15"
                  : "text-muted-foreground hover:bg-secondary/30 hover:text-foreground border border-transparent"
              }`}
            >
              <Icon className="h-4 w-4" />
              {item.label}
              {isODB && (
                <span className="ml-auto text-[9px] font-bold bg-primary/15 text-primary px-1.5 py-0.5 rounded">IA</span>
              )}
            </button>
          );
        })}
      </div>

      <button
        onClick={handleLogout}
        className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] font-medium text-muted-foreground hover:bg-red-500/10 hover:text-red-400 transition-all"
      >
        <LogOut className="h-4 w-4" />
        Sair
      </button>
    </aside>
  );
};

export default DesktopSidebar;
