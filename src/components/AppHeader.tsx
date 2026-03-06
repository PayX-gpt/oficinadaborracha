import { Bell } from "lucide-react";
import { motion } from "framer-motion";

interface AppHeaderProps {
  filialName?: string;
}

const AppHeader = ({ filialName = "Oficina da Borracha" }: AppHeaderProps) => {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 flex h-14 items-center justify-between border-b border-border bg-card/95 backdrop-blur-lg px-4">
      <div className="flex items-center gap-2">
        <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
          <span className="text-sm font-bold text-primary-foreground">OB</span>
        </div>
      </div>

      <h1 className="text-sm font-semibold text-foreground truncate max-w-[200px]">
        {filialName}
      </h1>

      <motion.button
        whileTap={{ scale: 0.9 }}
        className="relative rounded-full p-2 text-muted-foreground hover:text-foreground transition-colors"
      >
        <Bell className="h-5 w-5" />
        <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-primary" />
      </motion.button>
    </header>
  );
};

export default AppHeader;
