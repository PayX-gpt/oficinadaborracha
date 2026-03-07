import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { Search, Download, Pencil, Camera, Mic, ChevronDown, ChevronUp } from "lucide-react";
import { Input } from "@/components/ui/input";

const formatCurrency = (v: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

const fonteIcons: Record<string, any> = { manual: Pencil, foto: Camera, audio: Mic };

type SortKey = "created_at" | "valor_bruto" | "lucro" | "cliente_nome";

const DetailedTable = () => {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [sortKey, setSortKey] = useState<SortKey>("created_at");
  const [sortAsc, setSortAsc] = useState(false);
  const pageSize = 20;

  const { data: lancamentos = [] } = useQuery({
    queryKey: ["detailed-table", sortKey, sortAsc],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("lancamentos")
        .select("*")
        .order(sortKey, { ascending: sortAsc })
        .limit(200);
      if (error) throw error;
      return data;
    },
  });

  const filtered = search
    ? lancamentos.filter((l) =>
        (l.cliente_nome || "").toLowerCase().includes(search.toLowerCase()) ||
        (l.veiculo_desc || "").toLowerCase().includes(search.toLowerCase()) ||
        (l.placa || "").toLowerCase().includes(search.toLowerCase())
      )
    : lancamentos;

  const totalPages = Math.ceil(filtered.length / pageSize);
  const paged = filtered.slice(page * pageSize, (page + 1) * pageSize);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortAsc(!sortAsc);
    else { setSortKey(key); setSortAsc(false); }
  };

  const SortIcon = ({ col }: { col: SortKey }) => {
    if (sortKey !== col) return null;
    return sortAsc ? <ChevronUp className="h-3 w-3 inline" /> : <ChevronDown className="h-3 w-3 inline" />;
  };

  const exportCSV = () => {
    const header = "Hora,Cliente,Veículo,Placa,Bruto,Custo,Desconto,Taxas,Líquido,Lucro,Pagamento,Fonte\n";
    const rows = filtered.map((l) =>
      `${new Date(l.created_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })},${l.cliente_nome || ""},${l.veiculo_desc || ""},${l.placa || ""},${l.valor_bruto},${l.custo_total},${l.desconto},${l.taxa_valor},${l.valor_liquido},${l.lucro},${l.metodo_pagamento || ""},${l.fonte}`
    ).join("\n");
    const blob = new Blob([header + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "lancamentos.csv"; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.1, duration: 0.4 }}
      className="rounded-2xl p-4 md:p-6 transition-all duration-300"
      style={{ background: "rgba(14,20,35,0.85)", backdropFilter: "blur(16px)", border: "1px solid rgba(245,158,11,0.08)", boxShadow: "0 4px 24px rgba(0,0,0,0.3), 0 0 0 1px rgba(255,255,255,0.03)" }}>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <h3 className="text-[11px] uppercase tracking-[0.05em] text-muted-foreground font-medium">
          Lançamentos Detalhados <span className="text-foreground">({filtered.length})</span>
        </h3>
        <div className="flex items-center gap-2">
          <div className="relative flex-1 sm:w-48">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
            <Input placeholder="Buscar..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(0); }} className="pl-7 h-8 text-xs bg-background/30 border-border/50" />
          </div>
          <button onClick={exportCSV} className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-secondary/50 text-muted-foreground hover:text-foreground border border-border/30 transition-colors">
            <Download className="h-3 w-3" /> CSV
          </button>
        </div>
      </div>

      {/* Desktop table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="text-muted-foreground border-b border-border/50">
              <th className="text-left py-2 font-medium">#</th>
              <th className="text-left py-2 font-medium cursor-pointer" onClick={() => toggleSort("created_at")}>Hora <SortIcon col="created_at" /></th>
              <th className="text-left py-2 font-medium">Fonte</th>
              <th className="text-left py-2 font-medium cursor-pointer" onClick={() => toggleSort("cliente_nome")}>Cliente <SortIcon col="cliente_nome" /></th>
              <th className="text-left py-2 font-medium">Veículo</th>
              <th className="text-right py-2 font-medium cursor-pointer" onClick={() => toggleSort("valor_bruto")}>Bruto <SortIcon col="valor_bruto" /></th>
              <th className="text-right py-2 font-medium">Custo</th>
              <th className="text-right py-2 font-medium cursor-pointer" onClick={() => toggleSort("lucro")}>Lucro <SortIcon col="lucro" /></th>
              <th className="text-right py-2 font-medium">Margem</th>
              <th className="text-left py-2 font-medium">Pagam.</th>
            </tr>
          </thead>
          <tbody>
            {paged.map((l, i) => {
              const FonIcon = fonteIcons[l.fonte || "manual"] || Pencil;
              const margem = Number(l.valor_bruto) > 0 ? (Number(l.lucro) / Number(l.valor_bruto) * 100) : 0;
              return (
                <tr key={l.id} className="border-b border-border/20 hover:bg-secondary/10 transition-colors">
                  <td className="py-2 text-muted-foreground">{page * pageSize + i + 1}</td>
                  <td className="py-2 text-foreground">{new Date(l.created_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</td>
                  <td className="py-2"><FonIcon className="h-3.5 w-3.5 text-muted-foreground" /></td>
                  <td className="py-2 text-foreground truncate max-w-[120px]">{l.cliente_nome || "—"}</td>
                  <td className="py-2 text-foreground truncate max-w-[120px]">{l.veiculo_desc || "—"}</td>
                  <td className="py-2 text-right text-foreground">{formatCurrency(Number(l.valor_bruto))}</td>
                  <td className="py-2 text-right text-red-400">{formatCurrency(Number(l.custo_total))}</td>
                  <td className="py-2 text-right text-emerald-500 font-medium">{formatCurrency(Number(l.lucro))}</td>
                  <td className={`py-2 text-right font-medium ${margem > 50 ? "text-emerald-500" : margem > 20 ? "text-primary" : "text-red-400"}`}>{margem.toFixed(0)}%</td>
                  <td className="py-2"><span className="px-1.5 py-0.5 rounded text-[10px] bg-secondary/30 text-muted-foreground">{l.metodo_pagamento || "—"}</span></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden space-y-2">
        {paged.map((l) => {
          const FonIcon = fonteIcons[l.fonte || "manual"] || Pencil;
          return (
            <div key={l.id} className="rounded-lg p-3 bg-secondary/20 space-y-1.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FonIcon className="h-3 w-3 text-muted-foreground" />
                  <span className="text-xs text-foreground font-medium">{l.cliente_nome || "Serviço"}</span>
                </div>
                <span className="text-[10px] text-muted-foreground">{new Date(l.created_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</span>
              </div>
              {l.veiculo_desc && <p className="text-[11px] text-muted-foreground">{l.veiculo_desc}</p>}
              <div className="flex items-center justify-between">
                <span className="text-xs text-foreground">{formatCurrency(Number(l.valor_bruto))}</span>
                <span className="text-xs text-emerald-500 font-medium">Lucro: {formatCurrency(Number(l.lucro))}</span>
              </div>
            </div>
          );
        })}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-4">
          <button onClick={() => setPage(Math.max(0, page - 1))} disabled={page === 0} className="px-3 py-1 rounded text-xs bg-secondary/30 text-muted-foreground hover:text-foreground disabled:opacity-30">Anterior</button>
          <span className="text-xs text-muted-foreground">{page + 1} / {totalPages}</span>
          <button onClick={() => setPage(Math.min(totalPages - 1, page + 1))} disabled={page >= totalPages - 1} className="px-3 py-1 rounded text-xs bg-secondary/30 text-muted-foreground hover:text-foreground disabled:opacity-30">Próximo</button>
        </div>
      )}
    </motion.div>
  );
};

export default DetailedTable;
