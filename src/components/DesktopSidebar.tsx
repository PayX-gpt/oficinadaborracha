import { useLocation, useNavigate } from "react-router-dom";
import { LayoutDashboard, PlusCircle, ClipboardList, Settings, LogOut } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const navItems = [
  { path: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { path: "/launch", label: "Novo Lançamento", icon: PlusCircle },
  { path: "/history", label: "Histórico", icon: ClipboardList },
  { path: "/settings", label: "Configurações", icon: Settings },
];

const DesktopSidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();

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
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] font-medium transition-all ${
                isActive
                  ? "bg-primary/10 text-primary border border-primary/15"
                  : "text-muted-foreground hover:bg-secondary/30 hover:text-foreground border border-transparent"
              }`}
            >
              <Icon className="h-4 w-4" />
              {item.label}
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
