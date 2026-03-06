import { motion } from "framer-motion";
import { Settings } from "lucide-react";

const SettingsPage = () => (
  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
    <div>
      <h2 className="text-xl font-bold text-foreground">Configurações</h2>
      <p className="text-sm text-muted-foreground">Filiais, sócios, equipe e taxas</p>
    </div>
    <div className="glass-card flex flex-col items-center gap-4 p-10 text-center">
      <Settings className="h-12 w-12 text-muted-foreground" />
      <p className="text-sm text-muted-foreground">Configurações serão implementadas na Fase 4.</p>
    </div>
  </motion.div>
);

export default SettingsPage;
