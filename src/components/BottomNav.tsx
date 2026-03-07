import { useLocation, useNavigate } from "react-router-dom";
import { LayoutDashboard, PlusCircle, ClipboardList, Settings } from "lucide-react";
import { motion } from "framer-motion";

const navItems = [
  { path: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { path: "/launch", label: "Lançar", icon: PlusCircle, highlight: true },
  { path: "/history", label: "Histórico", icon: ClipboardList },
  { path: "/settings", label: "Config", icon: Settings },
];

const BottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 border-t md:hidden"
      style={{
        background: "rgba(7,11,20,0.95)",
        backdropFilter: "blur(20px)",
        borderColor: "rgba(245,158,11,0.08)",
      }}
    >
      <div className="flex items-end justify-around px-2 pb-safe pt-1">
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
                  className="flex h-12 w-12 items-center justify-center rounded-full bg-primary"
                  style={{ boxShadow: "0 0 20px rgba(245,158,11,0.3)" }}
                >
                  <Icon className="h-6 w-6 text-primary-foreground" />
                </motion.div>
                <span className="mt-1 text-[9px] font-semibold text-primary">{item.label}</span>
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
