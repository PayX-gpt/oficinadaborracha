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
  if (percent > 60) return "#33A833";
  if (percent > 30) return "#C9A84C";
  return "#D20A0A";
}

const DonutCard = ({ title, percent, details, color, index }: DonutCardProps) => {
  const fillColor = getColor(percent, color);
  const data = [{ value: percent }, { value: 100 - percent }];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 + 0.3, duration: 0.4 }}
      className="rounded-xl p-3 flex items-center gap-3 transition-all duration-300 hover:border-primary/20"
      style={{
        background: "rgba(9,9,9,0.85)",
        border: "1px solid rgba(210,10,10,0.08)",
        boxShadow: "0 4px 24px rgba(0,0,0,0.3)",
      }}
    >
      <div className="relative w-14 h-14 shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} cx="50%" cy="50%" innerRadius={18} outerRadius={26} startAngle={90} endAngle={-270} dataKey="value" stroke="none">
              <Cell fill={fillColor} />
              <Cell fill="rgba(255,255,255,0.05)" />
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-[11px] font-bold text-foreground">{percent}%</span>
        </div>
      </div>
      <div className="space-y-0.5 min-w-0 flex-1">
        <p className="text-[10px] uppercase tracking-[0.05em] text-muted-foreground font-medium leading-tight">{title}</p>
        {details.map((d, i) => (
          <p key={i} className="text-[10px] text-muted-foreground truncate">{d}</p>
        ))}
      </div>
    </motion.div>
  );
};

export default DonutCard;
