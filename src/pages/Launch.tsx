import { useNavigate } from "react-router-dom";
import { Camera, Mic, Pencil, Receipt } from "lucide-react";
import { motion } from "framer-motion";

const options = [
  {
    path: "/launch/photo",
    label: "Lançar por Foto",
    emoji: "📸",
    icon: Camera,
    description: "Tire foto do orçamento e a IA extrai os dados",
    variant: "default" as const,
  },
  {
    path: "/launch/audio",
    label: "Lançar por Áudio",
    emoji: "🎤",
    icon: Mic,
    description: "Dite o serviço e a IA transcreve tudo",
    variant: "default" as const,
  },
  {
    path: "/launch/manual",
    label: "Lançar Manual",
    emoji: "✏️",
    icon: Pencil,
    description: "Preencha os dados do serviço manualmente",
    variant: "default" as const,
  },
  {
    path: "/launch/expense",
    label: "Registrar Despesa",
    emoji: "📋",
    icon: Receipt,
    description: "Registre saídas e custos operacionais",
    variant: "expense" as const,
  },
];

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

const Launch = () => {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-foreground">Novo Lançamento</h2>
        <p className="text-sm text-muted-foreground">Como deseja registrar?</p>
      </div>

      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 gap-4 sm:grid-cols-2"
      >
        {options.map((opt) => {
          const Icon = opt.icon;
          return (
            <motion.button
              key={opt.path}
              variants={item}
              whileTap={{ scale: 0.97 }}
              onClick={() => navigate(opt.path)}
              className={`glass-card flex flex-col items-center gap-3 p-6 text-center transition-all hover:border-primary/30 ${
                opt.variant === "expense" ? "border-destructive/20 hover:border-destructive/40" : ""
              }`}
            >
              <div
                className={`flex h-16 w-16 items-center justify-center rounded-2xl ${
                  opt.variant === "expense"
                    ? "bg-destructive/10 text-destructive"
                    : "bg-primary/10 text-primary"
                }`}
              >
                <Icon className="h-8 w-8" />
              </div>
              <h3 className="text-base font-semibold text-foreground">{opt.label}</h3>
              <p className="text-xs text-muted-foreground">{opt.description}</p>
            </motion.button>
          );
        })}
      </motion.div>
    </div>
  );
};

export default Launch;
