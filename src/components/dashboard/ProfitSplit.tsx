import { motion } from "framer-motion";
import { Users } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { DashboardData } from "@/hooks/useDashboardData";

const formatCurrency = (v: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

const ProfitSplit = ({ data }: { data?: DashboardData }) => {
  const lucroLiquido = data?.lucroLiquido ?? 0;
  const totalReceita = data?.totalReceita ?? 0;
  const totalCusto = data?.totalCusto ?? 0;
  const totalDespesas = data?.totalDespesas ?? 0;
  const totalTaxas = data?.totalTaxas ?? 0;

  const { data: socios = [] } = useQuery({
    queryKey: ["socios-split"],
    queryFn: async () => {
      const [sociosRes, retiradasRes, filRes] = await Promise.all([
        supabase.from("socios").select("*").order("nome"),
        supabase.from("retiradas").select("*"),
        supabase.from("socio_filiais").select("*, filiais(nome)"),
      ]);
      const socios = sociosRes.data || [];
      const retiradas = retiradasRes.data || [];
      const filiais = filRes.data || [];

      return socios.map((s) => {
        const totalRetiradas = retiradas.filter((r) => r.socio_id === s.id).reduce((sum, r) => sum + Number(r.valor), 0);
        const socioFiliais = filiais.filter((f) => f.socio_id === s.id).map((f: any) => f.filiais?.nome).filter(Boolean);
        const valorBruto = lucroLiquido > 0 ? (lucroLiquido * Number(s.percentual_lucro)) / 100 : 0;
        return {
          nome: s.nome,
          filiais: socioFiliais.join(", ") || "—",
          percent: Number(s.percentual_lucro),
          valorBruto,
          retiradas: totalRetiradas,
          saldo: valorBruto - totalRetiradas,
        };
      });
    },
  });

  const reserva = lucroLiquido * 0.15;
  const paraDistribuir = lucroLiquido - reserva;

  const waterfall = [
    { label: "Receita Líquida", value: totalReceita, type: "positive" },
    { label: "Custo Peças/Serviço", value: -totalCusto, type: "negative" },
    { label: "Despesas Operacionais", value: -totalDespesas, type: "negative" },
    { label: "Taxas de Máquina", value: -totalTaxas, type: "negative" },
    { label: "LUCRO LÍQUIDO", value: lucroLiquido, type: "total" },
    { label: "Reserva Caixa (15%)", value: -reserva, type: "negative" },
    { label: "PARA DISTRIBUIR", value: paraDistribuir, type: "result" },
  ];

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.75, duration: 0.4 }}
      className="rounded-xl p-3 md:p-6 transition-all duration-300 overflow-hidden"
      style={{ background: "rgba(14,20,35,0.85)", backdropFilter: "blur(16px)", border: "1px solid rgba(245,158,11,0.15)", boxShadow: "0 4px 24px rgba(0,0,0,0.3), 0 0 0 1px rgba(255,255,255,0.03)" }}>
      <div className="flex items-center gap-2 mb-4">
        <Users className="h-4 w-4 text-primary" />
        <h3 className="text-[11px] uppercase tracking-[0.05em] text-muted-foreground font-medium">Distribuição de Lucros</h3>
      </div>
      <div className="space-y-4">
        {/* Waterfall */}
        <div className="space-y-1">
          {waterfall.map((w, i) => (
            <motion.div key={w.label} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.8 + i * 0.05 }}
              className={`flex items-center justify-between py-1.5 px-2 rounded text-[11px] ${w.type === "total" || w.type === "result" ? "bg-secondary/50" : ""}`}>
              <span className={`${w.type === "total" || w.type === "result" ? "text-foreground font-bold" : "text-muted-foreground"} truncate`}>
                {w.type === "negative" ? "→ " : ""}{w.label}
              </span>
              <span className={`font-medium shrink-0 ml-2 ${w.type === "negative" ? "text-red-400" : w.type === "result" ? "text-primary font-bold" : "text-emerald-500"}`}>
                {w.value >= 0 ? formatCurrency(w.value) : `-${formatCurrency(Math.abs(w.value))}`}
              </span>
            </motion.div>
          ))}
        </div>
        {/* Sócios */}
        <div className="space-y-2">
          {socios.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-3">Cadastre sócios nas configurações</p>
          ) : socios.map((s) => (
            <div key={s.nome} className="rounded-lg p-2.5 bg-secondary/20 space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-[10px] font-bold text-primary shrink-0">{s.nome[0]}</div>
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-foreground truncate">{s.nome}</p>
                    <p className="text-[10px] text-muted-foreground truncate">{s.filiais} • {s.percent}%</p>
                  </div>
                </div>
                <p className="text-xs font-bold text-primary shrink-0">{formatCurrency(s.valorBruto)}</p>
              </div>
              <div className="space-y-0.5">
                <div className="flex justify-between text-[10px]">
                  <span className="text-muted-foreground">Retirado: {formatCurrency(s.retiradas)}</span>
                  <span className="text-emerald-500">Saldo: {formatCurrency(s.saldo)}</span>
                </div>
                <div className="h-1 rounded-full bg-secondary/50 overflow-hidden">
                  <div className="h-full rounded-full bg-primary" style={{ width: `${s.valorBruto > 0 ? Math.min(100, (s.retiradas / s.valorBruto) * 100) : 0}%` }} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

export default ProfitSplit;
