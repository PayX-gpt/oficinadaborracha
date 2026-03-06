import { motion } from "framer-motion";
import { ClipboardList } from "lucide-react";

const History = () => (
  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
    <div>
      <h2 className="text-xl font-bold text-foreground">Histórico</h2>
      <p className="text-sm text-muted-foreground">Lançamentos, despesas e fechamentos</p>
    </div>
    <div className="glass-card flex flex-col items-center gap-4 p-10 text-center">
      <ClipboardList className="h-12 w-12 text-muted-foreground" />
      <p className="text-sm text-muted-foreground">Nenhum lançamento ainda. Faça seu primeiro lançamento!</p>
    </div>
  </motion.div>
);

export default History;
