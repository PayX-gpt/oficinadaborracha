import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Lock, CheckCircle, Loader2, AlertTriangle, X, Clock } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const fmt = (v: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

interface Props {
  filialId: string;
  filialNome: string;
}

const FechamentoDiario = ({ filialId, filialNome }: Props) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const today = new Date().toISOString().split("T")[0];

  const { data: existing } = useQuery({
    queryKey: ["fechamento", filialId, today],
    queryFn: async () => {
      const { data } = await supabase.from("fechamentos_diarios").select("*").eq("filial_id", filialId).eq("data", today).maybeSingle();
      return data;
    },
    enabled: !!filialId,
  });

  const { data: summary } = useQuery({
    queryKey: ["fechamento-summary", filialId, today],
    queryFn: async () => {
      const startOfDay = new Date(); startOfDay.setHours(0, 0, 0, 0);
      const [lancRes, despRes, sociosRes, filialRes] = await Promise.all([
        supabase.from("lancamentos").select("*").eq("filial_id", filialId).gte("created_at", startOfDay.toISOString()),
        supabase.from("despesas").select("*").eq("filial_id", filialId).gte("created_at", startOfDay.toISOString()),
        supabase.from("socios").select("*, socio_filiais(*)"),
        supabase.from("filiais").select("*").eq("id", filialId).maybeSingle(),
      ]);
      const lancs = lancRes.data || [];
      const desps = despRes.data || [];
      const socios = sociosRes.data || [];
      const filial = filialRes.data;
      const pctCaixa = filial ? Number((filial as any).porcentagem_caixa || 25) : 25;

      const totalServicos = lancs.length;
      const receitaBruta = lancs.reduce((s, l) => s + Number(l.valor_bruto), 0);
      const totalDescontos = lancs.reduce((s, l) => s + Number(l.desconto), 0);
      const totalTaxas = lancs.reduce((s, l) => s + Number(l.taxa_valor), 0);
      const receitaLiquida = receitaBruta - totalDescontos - totalTaxas;
      const custoTotal = lancs.reduce((s, l) => s + Number(l.custo_total), 0);
      const custoCompradas = lancs.reduce((s, l) => s + Number(l.custo_pecas_compradas || 0), 0);
      const custoFabricadas = lancs.reduce((s, l) => s + Number(l.custo_pecas_fabricadas_estimado || 0), 0);
      const totalDespesas = desps.reduce((s, d) => s + Number(d.valor), 0);
      const lucroBruto = receitaLiquida - custoTotal;
      const lucroLiquido = lucroBruto - totalDespesas;
      const valorCaixa = lucroLiquido > 0 ? lucroLiquido * (pctCaixa / 100) : 0;
      const paraDistribuir = lucroLiquido > 0 ? lucroLiquido - valorCaixa : 0;

      // Time
      const tempoTotal = lancs.reduce((s, l) => s + Number(l.tempo_servico_minutos || 0), 0);
      const ganhoMedioHora = tempoTotal > 0 ? (lucroLiquido / (tempoTotal / 60)) : 0;

      // Payment breakdown
      const pmMap = new Map<string, number>();
      lancs.forEach(l => { const m = l.metodo_pagamento || "Outro"; pmMap.set(m, (pmMap.get(m) || 0) + Number(l.valor_bruto)); });

      // Pending services
      const pendentes = lancs.filter(l => l.status === "em_andamento").length;

      // Sócios distribution
      const sociosDist = socios.map(s => {
        const sf = (s.socio_filiais || []).find((sf: any) => sf.filial_id === filialId);
        const pct = sf ? Number((sf as any).porcentagem_lucro) : Number(s.percentual_lucro);
        return { id: s.id, nome: s.nome, percent: pct, valor: paraDistribuir * (pct / 100) };
      }).filter(s => s.percent > 0);

      return {
        totalServicos, receitaBruta, totalDescontos, totalTaxas, receitaLiquida,
        custoTotal, custoCompradas, custoFabricadas, totalDespesas, lucroBruto, lucroLiquido,
        valorCaixa, paraDistribuir, pctCaixa, pendentes, sociosDist, tempoTotal, ganhoMedioHora,
        paymentBreakdown: Object.fromEntries(pmMap),
      };
    },
    enabled: open && !!filialId,
  });

  const fechar = useMutation({
    mutationFn: async () => {
      if (!summary || !user) throw new Error("Dados não carregados");
      const { data: fechamento, error } = await supabase.from("fechamentos_diarios").insert({
        filial_id: filialId,
        data: today,
        total_servicos: summary.totalServicos,
        receita_bruta: summary.receitaBruta,
        total_descontos: summary.totalDescontos,
        total_taxas_maquina: summary.totalTaxas,
        receita_liquida: summary.receitaLiquida,
        custo_pecas_compradas: summary.custoCompradas,
        custo_pecas_fabricadas: summary.custoFabricadas,
        total_despesas: summary.totalDespesas,
        lucro_bruto: summary.lucroBruto,
        lucro_liquido: summary.lucroLiquido,
        valor_caixa_filial: summary.valorCaixa,
        valor_distribuir_socios: summary.paraDistribuir,
        metodo_pagamento_breakdown: summary.paymentBreakdown,
        tempo_total_servicos_minutos: summary.tempoTotal,
        ganho_medio_por_hora: summary.ganhoMedioHora,
        fechado_por: user.id,
      } as any).select().single();
      if (error) throw error;

      // Create sócio distributions
      for (const s of summary.sociosDist) {
        await supabase.from("distribuicao_socios").insert({
          fechamento_id: fechamento.id,
          socio_id: s.id,
          filial_id: filialId,
          porcentagem: s.percent,
          valor: s.valor,
        } as any);
      }
    },
    onSuccess: () => {
      setConfirmed(true);
      queryClient.invalidateQueries({ queryKey: ["fechamento"] });
      queryClient.invalidateQueries({ queryKey: ["hist-fech"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      toast.success("Dia fechado com sucesso! ✅");
    },
    onError: (e: any) => toast.error("Erro: " + e.message),
  });

  if (existing) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
        <CheckCircle className="h-4 w-4 text-emerald-500" />
        <span className="text-xs text-emerald-400 font-medium">{filialNome} — Dia fechado ✓</span>
      </div>
    );
  }

  const isAfternoon = new Date().getHours() >= 17;

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        size="sm"
        className={`gap-1.5 text-xs ${isAfternoon ? "bg-primary text-primary-foreground animate-pulse" : "bg-secondary/50 text-foreground border border-border/30"}`}
      >
        <Lock className="h-3.5 w-3.5" />
        {filialNome}
      </Button>

      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-4 pb-20 md:pb-4"
            onClick={() => !fechar.isPending && setOpen(false)}>
            <motion.div initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }}
              className="w-full max-w-lg max-h-[75vh] md:max-h-[85vh] overflow-y-auto rounded-2xl p-4 md:p-5 space-y-3 md:space-y-4"
              style={{ background: "rgba(14,20,35,0.95)", border: "1px solid rgba(245,158,11,0.15)" }}
              onClick={e => e.stopPropagation()}>

              {confirmed ? (
                <div className="text-center py-8 space-y-4">
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", damping: 10 }}>
                    <CheckCircle className="h-16 w-16 text-emerald-500 mx-auto" />
                  </motion.div>
                  <p className="text-lg font-bold text-foreground">Dia Fechado! 🎉</p>
                  <p className="text-sm text-muted-foreground">O fechamento de {filialNome} foi registrado.</p>
                  <Button onClick={() => setOpen(false)} className="bg-primary text-primary-foreground">Fechar</Button>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-foreground">Fechamento do Dia</h3>
                      <p className="text-xs text-muted-foreground">{filialNome} — {new Date().toLocaleDateString("pt-BR")}</p>
                    </div>
                    <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground">
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  {!summary ? (
                    <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
                  ) : (
                    <>
                      {summary.pendentes > 0 && (
                        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                          <AlertTriangle className="h-4 w-4 text-yellow-500" />
                          <span className="text-xs text-yellow-400">{summary.pendentes} serviço(s) em andamento — finalize antes de fechar</span>
                        </div>
                      )}

                      {/* Time stats */}
                      {summary.tempoTotal > 0 && (
                        <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-secondary/20">
                          <Clock className="h-4 w-4 text-blue-400" />
                          <div className="text-[11px]">
                            <span className="text-muted-foreground">Tempo total: </span>
                            <span className="text-foreground font-medium">{Math.floor(summary.tempoTotal / 60)}h{summary.tempoTotal % 60}min</span>
                            <span className="text-muted-foreground"> · Ganho/hora: </span>
                            <span className="text-primary font-medium">{fmt(summary.ganhoMedioHora)}</span>
                          </div>
                        </div>
                      )}

                      <div className="space-y-1.5 text-xs">
                        <Row label="Total de Lançamentos" value={String(summary.totalServicos)} />
                        <Row label="Receita Bruta" value={fmt(summary.receitaBruta)} color="text-emerald-500" />
                        <Row label="(-) Descontos" value={fmt(summary.totalDescontos)} color="text-red-400" neg />
                        <Row label="(-) Taxas de Máquina" value={fmt(summary.totalTaxas)} color="text-red-400" neg />
                        <Divider />
                        <Row label="= Receita Líquida" value={fmt(summary.receitaLiquida)} bold />
                        <Row label="(-) Custo Peças/Serviço" value={fmt(summary.custoTotal)} color="text-red-400" neg />
                        <Divider />
                        <Row label="= LUCRO BRUTO" value={fmt(summary.lucroBruto)} bold color="text-emerald-500" />
                        <Row label="(-) Despesas do Dia" value={fmt(summary.totalDespesas)} color="text-red-400" neg />
                        <Divider />
                        <Row label="= LUCRO LÍQUIDO" value={fmt(summary.lucroLiquido)} bold
                          color={summary.lucroLiquido >= 0 ? "text-emerald-500" : "text-red-500"} highlight />
                        <Row label={`(-) Reserva Caixa (${summary.pctCaixa}%)`} value={fmt(summary.valorCaixa)} color="text-blue-400" neg />
                        <Divider />
                        <Row label="= PARA DISTRIBUIR" value={fmt(summary.paraDistribuir)} bold color="text-primary" highlight />
                      </div>

                      {/* Payment breakdown */}
                      {Object.keys(summary.paymentBreakdown).length > 0 && (
                        <div className="space-y-1">
                          <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Recebimentos por Método</p>
                          {Object.entries(summary.paymentBreakdown).map(([method, value]) => (
                            <div key={method} className="flex items-center justify-between py-1 px-2 text-xs">
                              <span className="text-muted-foreground">{method}</span>
                              <span className="text-foreground font-medium tabular-nums">{fmt(value as number)}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {summary.sociosDist.length > 0 && (
                        <div className="space-y-1.5">
                          <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Distribuição por Sócio</p>
                          {summary.sociosDist.map(s => (
                            <div key={s.id} className="flex items-center justify-between py-1.5 px-2 rounded bg-secondary/20 text-xs">
                              <span className="text-foreground">{s.nome} ({s.percent}%)</span>
                              <span className="text-primary font-bold tabular-nums">{fmt(s.valor)}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      <Button onClick={() => fechar.mutate()} disabled={fechar.isPending}
                        className="w-full h-11 bg-primary text-primary-foreground gap-2 text-sm font-bold">
                        {fechar.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />}
                        Confirmar Fechamento
                      </Button>
                    </>
                  )}
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

const Row = ({ label, value, color, bold, neg, highlight }: { label: string; value: string; color?: string; bold?: boolean; neg?: boolean; highlight?: boolean }) => (
  <div className={`flex items-center justify-between py-1 px-2 rounded ${highlight ? "bg-secondary/30" : ""}`}>
    <span className={`${bold ? "font-bold text-foreground" : "text-muted-foreground"}`}>{neg ? "→ " : ""}{label}</span>
    <span className={`${bold ? "font-bold" : "font-medium"} tabular-nums ${color || "text-foreground"}`}>{value}</span>
  </div>
);

const Divider = () => <div className="border-t border-border/20 my-1" />;

export default FechamentoDiario;
