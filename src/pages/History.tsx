import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { FileText, Search, Pencil, Camera, Mic, ClipboardList, Loader2, Calendar, ChevronDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";

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
  const isGerente = profile?.role === "gerente";
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState(0);
  const [period, setPeriod] = useState("Hoje");
  const [expandedId, setExpandedId] = useState<string | null>(null);
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

  const loading = loadingL || loadingD || loadingF;
  const filteredL = search ? lancamentos.filter(l => (l.cliente_nome || "").toLowerCase().includes(search.toLowerCase()) || (l.veiculo_desc || "").toLowerCase().includes(search.toLowerCase()) || (l.placa || "").toLowerCase().includes(search.toLowerCase())) : lancamentos;
  const filteredD = search ? despesas.filter(d => d.categoria.toLowerCase().includes(search.toLowerCase())) : despesas;

  const totalReceitaL = filteredL.reduce((s, l) => s + Number(l.valor_bruto), 0);
  const totalLucroL = filteredL.reduce((s, l) => s + Number(l.lucro), 0);
  const totalDespD = filteredD.reduce((s, d) => s + Number(d.valor), 0);

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-3 pb-24">
      <div>
        <h2 className="text-lg font-bold text-foreground">Histórico</h2>
        <p className="text-xs text-muted-foreground">{lancamentos.length} lançamentos · {despesas.length} despesas</p>
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
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
        <Input placeholder="Buscar cliente, placa, categoria..." value={search} onChange={e => setSearch(e.target.value)}
          className="pl-9 bg-background/30 border-border/50 h-8 text-xs" />
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
      ) : (
        <>
          {/* Tab: Lançamentos */}
          {tab === 0 && (
            <>
              <div className="flex gap-3 text-[11px]">
                <span className="text-muted-foreground">{filteredL.length} registros</span>
                <span className="text-emerald-500">Receita: {fmt(totalReceitaL)}</span>
                {!isGerente && <span className="text-primary">Lucro: {fmt(totalLucroL)}</span>}
              </div>
              <div className="space-y-1.5">
                {filteredL.length === 0 ? (
                  <EmptyState message="Nenhum lançamento encontrado" />
                ) : filteredL.map(l => {
                  const fc = fonteConfig[l.fonte || "manual"] || fonteConfig.manual;
                  const Icon = fc.icon;
                  const expanded = expandedId === l.id;
                  const margem = Number(l.valor_bruto) > 0 ? (Number(l.lucro) / Number(l.valor_bruto) * 100) : 0;
                  return (
                    <div key={l.id} onClick={() => setExpandedId(expanded ? null : l.id)}
                      className="rounded-xl p-3 space-y-1.5 transition-colors cursor-pointer"
                      style={{ background: "rgba(14,20,35,0.6)", border: `1px solid ${(l as any).status === "em_andamento" ? "rgba(245,158,11,0.3)" : "rgba(245,158,11,0.06)"}` }}>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-muted-foreground w-10 shrink-0">
                          {new Date(l.created_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                        </span>
                        <span className={`px-1.5 py-0.5 rounded text-[9px] font-medium shrink-0 ${fc.color}`}>
                          <Icon className="h-3 w-3 inline mr-0.5" />{fc.label}
                        </span>
                        <span className="text-xs text-foreground truncate flex-1">{l.cliente_nome || "Serviço"}</span>
                        <span className="text-xs font-bold text-emerald-500 shrink-0">{fmt(Number(l.valor_bruto))}</span>
                      </div>
                      {l.veiculo_desc && <p className="text-[11px] text-muted-foreground pl-12">{l.veiculo_desc} {l.placa ? `· ${l.placa}` : ""}</p>}
                      <div className="flex items-center gap-2 pl-12 text-[10px]">
                        {l.metodo_pagamento && <span className="px-1.5 py-0.5 rounded bg-secondary/30 text-muted-foreground">{l.metodo_pagamento}</span>}
                        {!isGerente && <span className={`font-medium ${margem > 50 ? "text-emerald-400" : margem > 20 ? "text-primary" : "text-red-400"}`}>Margem: {margem.toFixed(0)}%</span>}
                        {(l as any).status === "em_andamento" && <span className="text-yellow-400 font-medium">⏳ Em andamento</span>}
                      </div>
                      {expanded && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} className="pt-2 pl-12 space-y-1 text-[11px] border-t border-border/10 mt-1">
                          {!isGerente && <p className="text-muted-foreground">Lucro: <span className="text-emerald-500 font-medium">{fmt(Number(l.lucro))}</span></p>}
                          <p className="text-muted-foreground">Custo: {fmt(Number(l.custo_total))} · Desconto: {fmt(Number(l.desconto))} · Taxa: {fmt(Number(l.taxa_valor))}</p>
                          {l.observacoes && <p className="text-muted-foreground">Obs: {l.observacoes}</p>}
                          {l.foto_url && <img src={l.foto_url} alt="foto" className="rounded-lg max-h-32 mt-1" />}
                        </motion.div>
                      )}
                    </div>
                  );
                })}
              </div>
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
                      <span className="text-xs text-foreground truncate flex-1">{d.subcategoria || (d as any).descricao || ""}</span>
                      <span className="text-xs font-bold text-red-400 shrink-0">{fmt(Number(d.valor))}</span>
                    </div>
                    {d.observacoes && <p className="text-[10px] text-muted-foreground pl-12">{d.observacoes}</p>}
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Tab: Fechamentos */}
          {tab === 2 && (
            <div className="space-y-2">
              {(fechamentos as any[]).length === 0 ? (
                <EmptyState message="Nenhum fechamento realizado" />
              ) : (fechamentos as any[]).map((f: any) => (
                <div key={f.id} className="rounded-xl p-4 space-y-2"
                  style={{ background: "rgba(14,20,35,0.6)", border: "1px solid rgba(16,185,129,0.15)" }}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-3.5 w-3.5 text-emerald-500" />
                      <span className="text-sm font-bold text-foreground">{new Date(f.data + "T12:00:00").toLocaleDateString("pt-BR")}</span>
                    </div>
                    <span className="text-xs text-emerald-400 font-medium">✓ Fechado</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div>
                      <p className="text-[10px] text-muted-foreground">Receita</p>
                      <p className="text-xs font-bold text-emerald-500">{fmt(Number(f.receita_bruta))}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-foreground">Despesas</p>
                      <p className="text-xs font-bold text-red-400">{fmt(Number(f.total_despesas))}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-foreground">Lucro Líq.</p>
                      <p className={`text-xs font-bold ${Number(f.lucro_liquido) >= 0 ? "text-primary" : "text-red-500"}`}>{fmt(Number(f.lucro_liquido))}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-1 border-t border-border/10">
                    <span>{f.total_servicos} serviços</span>
                    <span>Caixa: {fmt(Number(f.valor_caixa_filial))}</span>
                    <span>Sócios: {fmt(Number(f.valor_distribuir_socios))}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
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
