import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import { FileText, Search, Pencil, Camera, Mic, Loader2, Calendar, TrendingUp, TrendingDown, RotateCcw, ChevronDown, ChevronUp, User, Car, CreditCard } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import ServiceDetailDialog from "@/components/ServiceDetailDialog";

const fmt = (v: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

const fonteConfig: Record<string, { icon: any; label: string; color: string }> = {
  manual: { icon: Pencil, label: "Manual", color: "bg-primary/20 text-primary" },
  foto: { icon: Camera, label: "Foto", color: "bg-blue-500/20 text-blue-400" },
  audio: { icon: Mic, label: "Áudio", color: "bg-violet-500/20 text-violet-400" },
};

const periods = ["Hoje", "Ontem", "7 Dias", "30 Dias", "Tudo"];
const tabs = ["Lançamentos", "Despesas", "Fechamentos"];

function getDateRange(p: string) {
  const now = new Date();
  switch (p) {
    case "Hoje": return new Date(now.getFullYear(), now.getMonth(), now.getDate());
    case "Ontem": return new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
    case "7 Dias": return new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
    case "30 Dias": return new Date(now.getFullYear(), now.getMonth(), now.getDate() - 30);
    default: return new Date(2020, 0, 1);
  }
}

const History = () => {
  const { profile } = useAuth();
  const isAdmin = profile?.role === "admin";
  const isGerente = profile?.role === "gerente";
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState(0);
  const [period, setPeriod] = useState("Hoje");
  const [selectedLanc, setSelectedLanc] = useState<any>(null);
  const [expandedFech, setExpandedFech] = useState<string | null>(null);
  const dateFrom = getDateRange(period).toISOString();

  const { data: lancamentos = [], isLoading: loadingL } = useQuery({
    queryKey: ["hist-lanc", period],
    queryFn: async () => {
      const { data, error } = await supabase.from("lancamentos").select("*").gte("created_at", dateFrom).order("created_at", { ascending: false }).limit(200);
      if (error) throw error;
      return data;
    },
  });

  const { data: despesas = [], isLoading: loadingD } = useQuery({
    queryKey: ["hist-desp", period],
    queryFn: async () => {
      const { data, error } = await supabase.from("despesas").select("*").gte("created_at", dateFrom).order("created_at", { ascending: false }).limit(200);
      if (error) throw error;
      return data;
    },
  });

  const { data: fechamentos = [], isLoading: loadingF } = useQuery({
    queryKey: ["hist-fech", period],
    queryFn: async () => {
      const { data, error } = await supabase.from("fechamentos_diarios").select("*").gte("data", dateFrom.split("T")[0]).order("data", { ascending: false }).limit(100);
      if (error) throw error;
      return data;
    },
  });

  const { data: distribuicoes = [] } = useQuery({
    queryKey: ["hist-dist", expandedFech],
    queryFn: async () => {
      if (!expandedFech) return [];
      const { data } = await supabase.from("distribuicao_socios").select("*, socios(nome)").eq("fechamento_id", expandedFech);
      return data || [];
    },
    enabled: !!expandedFech,
  });

  const reopenMutation = useMutation({
    mutationFn: async (fechamentoId: string) => {
      await supabase.from("distribuicao_socios").delete().eq("fechamento_id", fechamentoId);
      const { error } = await supabase.from("fechamentos_diarios").delete().eq("id", fechamentoId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hist-fech"] });
      queryClient.invalidateQueries({ queryKey: ["fechamento"] });
      toast.success("Fechamento reaberto com sucesso");
      setExpandedFech(null);
    },
    onError: (e: any) => toast.error("Erro ao reabrir: " + e.message),
  });

  const loading = loadingL || loadingD || loadingF;
  const filteredL = search ? lancamentos.filter(l => (l.cliente_nome || "").toLowerCase().includes(search.toLowerCase()) || (l.veiculo_desc || "").toLowerCase().includes(search.toLowerCase()) || (l.placa || "").toLowerCase().includes(search.toLowerCase())) : lancamentos;
  const filteredD = search ? despesas.filter(d => d.categoria.toLowerCase().includes(search.toLowerCase())) : despesas;

  const totalReceitaL = filteredL.reduce((s, l) => s + Number(l.valor_bruto), 0);
  const totalLucroL = filteredL.reduce((s, l) => s + Number(l.lucro), 0);
  const totalDespD = filteredD.reduce((s, d) => s + Number(d.valor), 0);

  const fechEvolution = [...(fechamentos as any[])].reverse().map((f: any) => ({
    data: new Date(f.data + "T12:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }),
    receita: Number(f.receita_bruta),
    lucro: Number(f.lucro_liquido),
  }));
  const totalFechReceita = (fechamentos as any[]).reduce((s, f: any) => s + Number(f.receita_bruta), 0);
  const totalFechLucro = (fechamentos as any[]).reduce((s, f: any) => s + Number(f.lucro_liquido), 0);
  const avgFechReceita = (fechamentos as any[]).length > 0 ? totalFechReceita / (fechamentos as any[]).length : 0;

  // Group lancamentos by date
  const groupedByDate = filteredL.reduce<Record<string, typeof filteredL>>((acc, l) => {
    const dateKey = new Date(l.created_at).toLocaleDateString("pt-BR", { weekday: "short", day: "2-digit", month: "short" });
    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(l);
    return acc;
  }, {});

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-3 pb-24">
      <div>
        <h2 className="text-lg font-bold text-foreground">Histórico</h2>
        <p className="text-xs text-muted-foreground">{lancamentos.length} lançamentos · {despesas.length} despesas · {(fechamentos as any[]).length} fechamentos</p>
      </div>

      {/* Period filter */}
      <div className="flex gap-1.5 overflow-x-auto scrollbar-none">
        {periods.map(p => (
          <button key={p} onClick={() => setPeriod(p)}
            className={`px-3 py-1.5 rounded-lg text-[11px] font-medium whitespace-nowrap border transition-colors ${period === p ? "bg-primary/15 text-primary border-primary/25" : "bg-secondary/30 text-muted-foreground border-border/20"}`}>
            {p}
          </button>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border/20">
        {tabs.map((t, i) => (
          <button key={t} onClick={() => setTab(i)}
            className={`flex-1 py-2 text-xs font-medium text-center transition-colors ${tab === i ? "text-primary border-b-2 border-primary" : "text-muted-foreground"}`}>
            {t}
            {i === 2 && (fechamentos as any[]).length > 0 && (
              <span className="ml-1 px-1 py-0.5 rounded text-[9px] bg-emerald-500/20 text-emerald-400">{(fechamentos as any[]).length}</span>
            )}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
        <Input placeholder="Buscar cliente, placa, veículo..." value={search} onChange={e => setSearch(e.target.value)}
          className="pl-9 bg-background/30 border-border/50 h-8 text-xs" />
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
      ) : (
        <>
          {/* Tab: Lançamentos — organized by date */}
          {tab === 0 && (
            <>
              <div className="flex gap-3 text-[11px]">
                <span className="text-muted-foreground">{filteredL.length} registros</span>
                <span className="text-emerald-500">Receita: {fmt(totalReceitaL)}</span>
                {!isGerente && <span className="text-primary">Lucro: {fmt(totalLucroL)}</span>}
              </div>

              {filteredL.length === 0 ? (
                <EmptyState message="Nenhum lançamento encontrado" />
              ) : (
                <div className="space-y-4">
                  {Object.entries(groupedByDate).map(([dateLabel, lancs]) => (
                    <div key={dateLabel}>
                      {/* Date header */}
                      <div className="flex items-center gap-2 mb-2">
                        <Calendar className="h-3 w-3 text-primary" />
                        <span className="text-[11px] font-semibold text-foreground uppercase tracking-wider">{dateLabel}</span>
                        <span className="text-[10px] text-muted-foreground">({lancs.length})</span>
                        <div className="h-px flex-1 bg-border/15" />
                        <span className="text-[10px] text-emerald-500 font-medium tabular-nums">{fmt(lancs.reduce((s, l) => s + Number(l.valor_bruto), 0))}</span>
                      </div>

                      {/* Service cards */}
                      <div className="space-y-1.5">
                        {lancs.map(l => {
                          const fc = fonteConfig[l.fonte || "manual"] || fonteConfig.manual;
                          const Icon = fc.icon;
                          return (
                            <div
                              key={l.id}
                              onClick={() => setSelectedLanc(l)}
                              className="rounded-xl p-3 cursor-pointer hover:ring-1 hover:ring-primary/20 transition-all active:scale-[0.99]"
                              style={{ background: "rgba(14,20,35,0.6)", border: `1px solid ${l.status === "em_andamento" ? "rgba(245,158,11,0.3)" : "rgba(245,158,11,0.06)"}` }}
                            >
                              {/* Row 1: time, source, client, value */}
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] text-muted-foreground w-10 shrink-0 tabular-nums">
                                  {new Date(l.created_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                                </span>
                                <span className={`px-1.5 py-0.5 rounded text-[9px] font-medium shrink-0 ${fc.color}`}>
                                  <Icon className="h-3 w-3 inline mr-0.5" />{fc.label}
                                </span>
                                <span className="text-xs text-foreground font-medium truncate flex-1">
                                  {l.cliente_nome || "Serviço"}
                                </span>
                                <span className="text-xs font-bold text-emerald-500 shrink-0 tabular-nums">{fmt(Number(l.valor_bruto))}</span>
                              </div>

                              {/* Row 2: car + plate + payment */}
                              <div className="flex items-center gap-2 mt-1.5 pl-12">
                                {l.veiculo_desc && (
                                  <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                                    <Car className="h-3 w-3" />
                                    <span className="truncate max-w-[120px]">{l.veiculo_desc}</span>
                                  </span>
                                )}
                                {l.placa && (
                                  <span className="px-1.5 py-0.5 rounded bg-secondary/40 text-[9px] font-mono font-medium text-foreground">{l.placa}</span>
                                )}
                                {l.metodo_pagamento && (
                                  <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground ml-auto">
                                    <CreditCard className="h-3 w-3" />
                                    {l.metodo_pagamento}
                                  </span>
                                )}
                              </div>

                              {/* Row 3: margin + status */}
                              <div className="flex items-center gap-2 mt-1 pl-12 text-[10px]">
                                {!isGerente && (() => {
                                  const margem = Number(l.valor_bruto) > 0 ? (Number(l.lucro) / Number(l.valor_bruto) * 100) : 0;
                                  return <span className={`font-medium ${margem > 50 ? "text-emerald-400" : margem > 20 ? "text-primary" : "text-red-400"}`}>Margem: {margem.toFixed(0)}%</span>;
                                })()}
                                {l.status === "em_andamento" && <span className="text-yellow-400 font-medium">⏳ Em andamento</span>}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {/* Tab: Despesas */}
          {tab === 1 && (
            <>
              <div className="flex gap-3 text-[11px]">
                <span className="text-muted-foreground">{filteredD.length} registros</span>
                <span className="text-red-400">Total: {fmt(totalDespD)}</span>
              </div>
              <div className="space-y-1.5">
                {filteredD.length === 0 ? (
                  <EmptyState message="Nenhuma despesa encontrada" />
                ) : filteredD.map(d => (
                  <div key={d.id} className="rounded-xl p-3 space-y-1"
                    style={{ background: "rgba(14,20,35,0.6)", border: "1px solid rgba(239,68,68,0.1)" }}>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-muted-foreground w-10 shrink-0">
                        {new Date(d.created_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                      </span>
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-medium bg-red-500/15 text-red-400">{d.categoria}</span>
                      <span className="text-xs text-foreground truncate flex-1">{d.subcategoria || d.descricao || ""}</span>
                      <span className="text-xs font-bold text-red-400 shrink-0 tabular-nums">{fmt(Number(d.valor))}</span>
                    </div>
                    {d.observacoes && <p className="text-[10px] text-muted-foreground pl-12">{d.observacoes}</p>}
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Tab: Fechamentos */}
          {tab === 2 && (
            <div className="space-y-3">
              {(fechamentos as any[]).length > 0 && (
                <div className="grid grid-cols-3 gap-2">
                  <div className="rounded-lg p-2.5 bg-secondary/20 text-center">
                    <p className="text-[10px] text-muted-foreground">Receita Total</p>
                    <p className="text-xs font-bold text-emerald-500 tabular-nums">{fmt(totalFechReceita)}</p>
                  </div>
                  <div className="rounded-lg p-2.5 bg-secondary/20 text-center">
                    <p className="text-[10px] text-muted-foreground">Lucro Total</p>
                    <p className={`text-xs font-bold tabular-nums ${totalFechLucro >= 0 ? "text-primary" : "text-red-400"}`}>{fmt(totalFechLucro)}</p>
                  </div>
                  <div className="rounded-lg p-2.5 bg-secondary/20 text-center">
                    <p className="text-[10px] text-muted-foreground">Méd/Dia</p>
                    <p className="text-xs font-bold text-foreground tabular-nums">{fmt(avgFechReceita)}</p>
                  </div>
                </div>
              )}

              {fechEvolution.length > 1 && (
                <div className="rounded-xl p-3" style={{ background: "rgba(14,20,35,0.6)", border: "1px solid rgba(16,185,129,0.1)" }}>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium mb-2">Evolução dos Fechamentos</p>
                  <ResponsiveContainer width="100%" height={140}>
                    <AreaChart data={fechEvolution}>
                      <defs>
                        <linearGradient id="fechGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                      <XAxis dataKey="data" tick={{ fill: "#64748B", fontSize: 9 }} />
                      <YAxis tick={{ fill: "#64748B", fontSize: 9 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} width={30} />
                      <Tooltip content={({ active, payload, label }) => {
                        if (!active || !payload?.length) return null;
                        return (
                          <div className="rounded-lg px-3 py-2 text-xs border shadow-xl" style={{ background: "rgba(14,20,35,0.95)", borderColor: "rgba(245,158,11,0.3)" }}>
                            <p className="text-foreground font-medium">{label}</p>
                            <p className="text-emerald-500">Receita: {fmt(payload[0]?.value as number)}</p>
                            <p className="text-primary">Lucro: {fmt(payload[1]?.value as number)}</p>
                          </div>
                        );
                      }} />
                      <Area type="monotone" dataKey="receita" stroke="#10B981" fill="url(#fechGrad)" strokeWidth={2} name="Receita" />
                      <Area type="monotone" dataKey="lucro" stroke="#F59E0B" fill="transparent" strokeWidth={1.5} strokeDasharray="4 2" name="Lucro" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}

              <div className="space-y-2">
                {(fechamentos as any[]).length === 0 ? (
                  <EmptyState message="Nenhum fechamento realizado" />
                ) : (fechamentos as any[]).map((f: any) => {
                  const isExpanded = expandedFech === f.id;
                  const lucroPositivo = Number(f.lucro_liquido) >= 0;
                  return (
                    <div key={f.id} className="rounded-xl overflow-hidden transition-all"
                      style={{ background: "rgba(14,20,35,0.6)", border: `1px solid ${lucroPositivo ? "rgba(16,185,129,0.15)" : "rgba(239,68,68,0.15)"}` }}>
                      <div className="p-3 cursor-pointer" onClick={() => setExpandedFech(isExpanded ? null : f.id)}>
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-3.5 w-3.5 text-emerald-500" />
                            <span className="text-sm font-bold text-foreground">{new Date(f.data + "T12:00:00").toLocaleDateString("pt-BR", { weekday: "short", day: "2-digit", month: "short" })}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] text-emerald-400 font-medium">✓ Fechado</span>
                            {isExpanded ? <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" /> : <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />}
                          </div>
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-center">
                          <div>
                            <p className="text-[10px] text-muted-foreground">Receita</p>
                            <p className="text-xs font-bold text-emerald-500 tabular-nums">{fmt(Number(f.receita_bruta))}</p>
                          </div>
                          <div>
                            <p className="text-[10px] text-muted-foreground">Despesas</p>
                            <p className="text-xs font-bold text-red-400 tabular-nums">{fmt(Number(f.total_despesas))}</p>
                          </div>
                          <div>
                            <p className="text-[10px] text-muted-foreground">Lucro Líq.</p>
                            <p className={`text-xs font-bold tabular-nums ${lucroPositivo ? "text-primary" : "text-red-500"}`}>
                              {lucroPositivo ? <TrendingUp className="h-3 w-3 inline mr-0.5" /> : <TrendingDown className="h-3 w-3 inline mr-0.5" />}
                              {fmt(Number(f.lucro_liquido))}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-1.5 border-t border-border/10 mt-2">
                          <span>{f.total_servicos} serviços</span>
                          <span>Caixa: {fmt(Number(f.valor_caixa_filial))}</span>
                          <span>Sócios: {fmt(Number(f.valor_distribuir_socios))}</span>
                        </div>
                      </div>

                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                            className="border-t border-border/10">
                            <div className="p-3 space-y-3">
                              <div className="space-y-1 text-[11px]">
                                <div className="flex justify-between"><span className="text-muted-foreground">Receita Bruta</span><span className="text-emerald-500 tabular-nums">{fmt(Number(f.receita_bruta))}</span></div>
                                <div className="flex justify-between"><span className="text-muted-foreground">→ Descontos</span><span className="text-red-400 tabular-nums">-{fmt(Number(f.total_descontos))}</span></div>
                                <div className="flex justify-between"><span className="text-muted-foreground">→ Taxas Máquina</span><span className="text-red-400 tabular-nums">-{fmt(Number(f.total_taxas_maquina))}</span></div>
                                <div className="flex justify-between font-medium"><span className="text-foreground">= Receita Líquida</span><span className="text-foreground tabular-nums">{fmt(Number(f.receita_liquida))}</span></div>
                                <div className="flex justify-between"><span className="text-muted-foreground">→ Custo Peças</span><span className="text-red-400 tabular-nums">-{fmt(Number(f.custo_pecas_compradas))}</span></div>
                                <div className="flex justify-between font-medium"><span className="text-foreground">= Lucro Bruto</span><span className="text-emerald-500 tabular-nums">{fmt(Number(f.lucro_bruto))}</span></div>
                                <div className="flex justify-between"><span className="text-muted-foreground">→ Despesas</span><span className="text-red-400 tabular-nums">-{fmt(Number(f.total_despesas))}</span></div>
                                <div className="border-t border-border/20 my-1" />
                                <div className="flex justify-between font-bold"><span className="text-foreground">= LUCRO LÍQUIDO</span><span className={`tabular-nums ${lucroPositivo ? "text-emerald-500" : "text-red-500"}`}>{fmt(Number(f.lucro_liquido))}</span></div>
                              </div>

                              {f.metodo_pagamento_breakdown && (
                                <div className="space-y-1">
                                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Pagamentos</p>
                                  {Object.entries(f.metodo_pagamento_breakdown as Record<string, number>).map(([method, value]) => (
                                    <div key={method} className="flex justify-between text-[11px]">
                                      <span className="text-muted-foreground">{method}</span>
                                      <span className="text-foreground tabular-nums">{fmt(value)}</span>
                                    </div>
                                  ))}
                                </div>
                              )}

                              {distribuicoes.length > 0 && (
                                <div className="space-y-1">
                                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Distribuição Sócios</p>
                                  {distribuicoes.map((d: any) => (
                                    <div key={d.id} className="flex justify-between text-[11px]">
                                      <span className="text-foreground">{d.socios?.nome || "Sócio"} ({Number(d.porcentagem)}%)</span>
                                      <span className="text-primary font-bold tabular-nums">{fmt(Number(d.valor))}</span>
                                    </div>
                                  ))}
                                </div>
                              )}

                              {isAdmin && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (confirm("Tem certeza que deseja reabrir este fechamento? Os dados de distribuição serão apagados.")) {
                                      reopenMutation.mutate(f.id);
                                    }
                                  }}
                                  disabled={reopenMutation.isPending}
                                  className="w-full text-xs gap-1.5 border-red-500/20 text-red-400 hover:bg-red-500/10"
                                >
                                  <RotateCcw className="h-3.5 w-3.5" />
                                  Reabrir Fechamento
                                </Button>
                              )}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}

      {/* Service Detail Dialog */}
      <ServiceDetailDialog
        lancamento={selectedLanc}
        open={!!selectedLanc}
        onClose={() => setSelectedLanc(null)}
        isAdmin={isAdmin}
      />
    </motion.div>
  );
};

const EmptyState = ({ message }: { message: string }) => (
  <div className="flex flex-col items-center gap-3 p-8 text-center rounded-xl" style={{ background: "rgba(14,20,35,0.5)", border: "1px solid rgba(245,158,11,0.06)" }}>
    <FileText className="h-8 w-8 text-muted-foreground/30" />
    <p className="text-xs text-muted-foreground">{message}</p>
  </div>
);

export default History;
