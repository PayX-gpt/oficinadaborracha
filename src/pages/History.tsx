import { motion } from "framer-motion";
import { ClipboardList, FileText } from "lucide-react";

const History = () => (
  <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
    <div>
      <h2 className="text-lg font-bold text-foreground">Histórico</h2>
      <p className="text-xs text-muted-foreground">Lançamentos, despesas e fechamentos</p>
    </div>
    <div
      className="flex flex-col items-center gap-4 p-10 text-center rounded-xl border"
      style={{
        background: "rgba(14,20,35,0.7)",
        backdropFilter: "blur(12px)",
        borderColor: "rgba(245,158,11,0.08)",
      }}
    >
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary/50">
        <FileText className="h-7 w-7 text-muted-foreground" />
      </div>
      <div className="space-y-1">
        <p className="text-sm font-medium text-foreground">Nenhum lançamento ainda</p>
        <p className="text-xs text-muted-foreground">Faça seu primeiro lançamento para ver o histórico aqui.</p>
      </div>
    </div>
  </motion.div>
);

export default History;
