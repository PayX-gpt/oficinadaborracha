import { useLocation, useNavigate } from "react-router-dom";
import { LayoutDashboard, ClipboardList, Settings, Users, User, Package } from "lucide-react";
import { motion } from "framer-motion";
import { useAuth, UserRole } from "@/hooks/useAuth";
import odbLogo from "@/assets/odb-logo.png";

interface NavItem {
  path: string;
  label: string;
  icon: any;
  highlight?: boolean;
}

const adminNav: NavItem[] = [
  { path: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { path: "/equipe", label: "Equipe", icon: Users },
  { path: "/odb", label: "ODB", icon: null, highlight: true },
  { path: "/history", label: "Histórico", icon: ClipboardList },
  { path: "/settings", label: "Config", icon: Settings },
];

const gerenteNav: NavItem[] = [
  { path: "/gerente", label: "Resumo", icon: LayoutDashboard },
  { path: "/odb", label: "ODB", icon: null, highlight: true },
  { path: "/history", label: "Serviços", icon: ClipboardList },
  { path: "/settings", label: "Config", icon: Settings },
];

const operadorNav: NavItem[] = [
  { path: "/odb", label: "ODB", icon: null, highlight: true },
  { path: "/history", label: "Meus Lanç.", icon: ClipboardList },
  { path: "/perfil", label: "Perfil", icon: User },
];

function getNavItems(role: UserRole): NavItem[] {
  switch (role) {
    case "admin": return adminNav;
    case "gerente": return gerenteNav;
    case "operador": return operadorNav;
    default: return operadorNav;
  }
}

const BottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const role = profile?.role || "operador";
  const navItems = getNavItems(role);

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border/10 md:hidden bg-background/95 backdrop-blur-xl" style={{ height: 64 }}>
      <div className="flex items-end justify-around px-2 pb-safe pt-1 h-full">
        {navItems.map((item) => {
          const isActive = location.pathname.startsWith(item.path);
          const Icon = item.icon;

          if (item.highlight) {
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className="relative -mt-5 flex flex-col items-center"
              >
                <motion.div
                  whileTap={{ scale: 0.9 }}
                  className="flex h-14 w-14 items-center justify-center rounded-full bg-background border-2 border-primary overflow-hidden"
                  style={{ boxShadow: "0 0 24px hsl(var(--primary) / 0.35)" }}
                  animate={{ boxShadow: ["0 0 20px hsl(var(--primary) / 0.25)", "0 0 30px hsl(var(--primary) / 0.45)", "0 0 20px hsl(var(--primary) / 0.25)"] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <img src={odbLogo} alt="ODB" className="h-10 w-10 object-contain" />
                </motion.div>
                <span className="mt-1 text-[9px] font-bold text-primary">{item.label}</span>
              </button>
            );
          }

          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className="flex flex-col items-center py-2 px-3 transition-colors"
            >
              <Icon className={`h-5 w-5 ${isActive ? "text-primary" : "text-muted-foreground"}`} />
              <span className={`mt-0.5 text-[9px] font-medium ${isActive ? "text-primary" : "text-muted-foreground"}`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
