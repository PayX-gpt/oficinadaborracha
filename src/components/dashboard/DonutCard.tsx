import { motion } from "framer-motion";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";

interface DonutCardProps {
  title: string;
  percent: number;
  details: string[];
  color?: string;
  index: number;
}

function getColor(percent: number, customColor?: string) {
  if (customColor) return customColor;
  if (percent > 60) return "#10B981";
  if (percent > 30) return "#F59E0B";
  return "#EF4444";
}

const DonutCard = ({ title, percent, details, color, index }: DonutCardProps) => {
  const fillColor = getColor(percent, color);
  const data = [{ value: percent }, { value: 100 - percent }];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 + 0.3, duration: 0.4 }}
      className="rounded-2xl p-4 flex items-center gap-4 transition-all duration-300 hover:border-primary/20"
      style={{
        background: "rgba(14,20,35,0.85)",
        backdropFilter: "blur(16px)",
        border: "1px solid rgba(245,158,11,0.08)",
        boxShadow: "0 4px 24px rgba(0,0,0,0.3), 0 0 0 1px rgba(255,255,255,0.03)",
      }}
    >
      <div className="relative w-20 h-20 shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} cx="50%" cy="50%" innerRadius={25} outerRadius={35} startAngle={90} endAngle={-270} dataKey="value" stroke="none">
              <Cell fill={fillColor} />
              <Cell fill="rgba(255,255,255,0.05)" />
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-sm font-bold text-foreground">{percent}%</span>
        </div>
      </div>
      <div className="space-y-1 min-w-0">
        <p className="text-[11px] uppercase tracking-[0.05em] text-muted-foreground font-medium">{title}</p>
        {details.map((d, i) => (
          <p key={i} className="text-xs text-muted-foreground truncate">{d}</p>
        ))}
      </div>
    </motion.div>
  );
};

export default DonutCard;
