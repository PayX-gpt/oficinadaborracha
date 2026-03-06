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
    <aside className="hidden md:flex fixed top-14 left-0 bottom-0 w-64 flex-col border-r border-border bg-card/50 backdrop-blur-lg p-4 z-40">
      <div className="flex-1 space-y-1 mt-4">
        {navItems.map((item) => {
          const isActive = location.pathname.startsWith(item.path);
          const Icon = item.icon;
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              }`}
            >
              <Icon className="h-5 w-5" />
              {item.label}
            </button>
          );
        })}
      </div>

      <button
        onClick={handleLogout}
        className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-all"
      >
        <LogOut className="h-5 w-5" />
        Sair
      </button>
    </aside>
  );
};

export default DesktopSidebar;
