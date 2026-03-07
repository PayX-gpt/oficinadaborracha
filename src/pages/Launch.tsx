import { useNavigate } from "react-router-dom";
import { Camera, Mic, Pencil, Receipt, ArrowRight, Sparkles } from "lucide-react";
import { motion } from "framer-motion";

const options = [
  {
    path: "/launch/photo",
    label: "Foto",
    icon: Camera,
    description: "IA extrai dados do orçamento",
    color: "text-blue-400",
    bg: "bg-blue-500/10 border-blue-500/20",
    tag: "IA",
  },
  {
    path: "/launch/audio",
    label: "Áudio",
    icon: Mic,
    description: "Dite e a IA transcreve",
    color: "text-violet-400",
    bg: "bg-violet-500/10 border-violet-500/20",
    tag: "IA",
  },
  {
    path: "/launch/manual",
    label: "Manual",
    icon: Pencil,
    description: "Preencha os dados do serviço",
    color: "text-primary",
    bg: "bg-primary/10 border-primary/20",
    tag: null,
  },
  {
    path: "/launch/expense",
    label: "Despesa",
    icon: Receipt,
    description: "Registre saídas e custos",
    color: "text-red-400",
    bg: "bg-red-500/10 border-red-500/20",
    tag: null,
  },
];

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
};

const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

const Launch = () => {
  const navigate = useNavigate();

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-bold text-foreground">Novo Lançamento</h2>
        <p className="text-xs text-muted-foreground">Selecione o método de registro</p>
      </div>

      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="space-y-2"
      >
        {options.map((opt) => {
          const Icon = opt.icon;
          return (
            <motion.button
              key={opt.path}
              variants={item}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate(opt.path)}
              className={`w-full flex items-center gap-4 p-4 rounded-xl border transition-all duration-200 hover:scale-[1.01] active:scale-[0.99] ${opt.bg}`}
              style={{
                background: "rgba(14,20,35,0.7)",
                backdropFilter: "blur(12px)",
              }}
            >
              <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${opt.bg}`}>
                <Icon className={`h-5 w-5 ${opt.color}`} />
              </div>
              <div className="flex-1 text-left min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-foreground">{opt.label}</span>
                  {opt.tag && (
                    <span className="flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-bold bg-primary/15 text-primary uppercase tracking-wider">
                      <Sparkles className="h-2.5 w-2.5" />
                      {opt.tag}
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-muted-foreground mt-0.5">{opt.description}</p>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
            </motion.button>
          );
        })}
      </motion.div>
    </div>
  );
};

export default Launch;
