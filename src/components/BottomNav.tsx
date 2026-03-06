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
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card/95 backdrop-blur-lg md:hidden">
      <div className="flex items-end justify-around px-2 pb-safe pt-1">
        {navItems.map((item) => {
          const isActive = location.pathname.startsWith(item.path);
          const Icon = item.icon;

          if (item.highlight) {
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className="relative -mt-4 flex flex-col items-center"
              >
                <motion.div
                  whileTap={{ scale: 0.9 }}
                  className="flex h-14 w-14 items-center justify-center rounded-full bg-primary shadow-lg animate-pulse-glow"
                >
                  <Icon className="h-7 w-7 text-primary-foreground" />
                </motion.div>
                <span className="mt-1 text-[10px] font-medium text-primary">
                  {item.label}
                </span>
              </button>
            );
          }

          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className="flex flex-col items-center py-2 px-3"
            >
              <Icon
                className={`h-5 w-5 transition-colors ${
                  isActive ? "text-primary" : "text-muted-foreground"
                }`}
              />
              <span
                className={`mt-1 text-[10px] font-medium transition-colors ${
                  isActive ? "text-primary" : "text-muted-foreground"
                }`}
              >
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
