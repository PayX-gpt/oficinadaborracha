import { useLocation, useNavigate } from "react-router-dom";
import { LayoutDashboard, ClipboardList, Settings, Users, User, MessageSquare } from "lucide-react";
import { motion } from "framer-motion";
import { useAuth, UserRole } from "@/hooks/useAuth";
import odbLogo from "@/assets/odb-logo.png";

interface NavItem {
  path: string;
  label: string;
  icon: any;
  highlight?: boolean;
}

// Placeholder icon for ODB (logo is used directly in the highlight button)
const ODBIcon = ({ className }: { className?: string }) => (
  <img src={odbLogo} alt="ODB" className={className} style={{ objectFit: "contain" }} />
);

const adminNav: NavItem[] = [
  { path: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { path: "/chat-financeiro", label: "Chat IA", icon: MessageSquare },
  { path: "/odb", label: "ODB", icon: ODBIcon, highlight: true },
  { path: "/history", label: "Histórico", icon: ClipboardList },
  { path: "/settings", label: "Config", icon: Settings },
];

const gerenteNav: NavItem[] = [
  { path: "/dashboard", label: "Resumo", icon: LayoutDashboard },
  { path: "/odb", label: "ODB", icon: ODBIcon, highlight: true },
  { path: "/history", label: "Serviços", icon: ClipboardList },
  { path: "/settings", label: "Config", icon: Settings },
];

const operadorNav: NavItem[] = [
  { path: "/odb", label: "ODB", icon: ODBIcon, highlight: true },
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
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 border-t md:hidden"
      style={{
        height: 64,
        background: "rgba(7,11,20,0.95)",
        backdropFilter: "blur(20px)",
        borderColor: "rgba(245,158,11,0.08)",
      }}
    >
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
                  style={{ boxShadow: "0 0 24px rgba(245,158,11,0.35)" }}
                  animate={{ boxShadow: ["0 0 20px rgba(245,158,11,0.25)", "0 0 30px rgba(245,158,11,0.45)", "0 0 20px rgba(245,158,11,0.25)"] }}
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
