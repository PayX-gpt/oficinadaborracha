import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { FileText, Search, Pencil, Camera, Mic, ClipboardList, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";

const formatCurrency = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

const fonteConfig: Record<string, { icon: any; label: string; color: string }> = {
  manual: { icon: Pencil, label: "Manual", color: "bg-primary/20 text-primary" },
  foto: { icon: Camera, label: "Foto", color: "bg-blue-500/20 text-blue-400" },
  audio: { icon: Mic, label: "Áudio", color: "bg-violet-500/20 text-violet-400" },
};

const History = () => {
  const [search, setSearch] = useState("");

  const { data: lancamentos, isLoading: loadingLanc } = useQuery({
    queryKey: ["history-lancamentos"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("lancamentos")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return data;
    },
  });

  const { data: despesas, isLoading: loadingDesp } = useQuery({
    queryKey: ["history-despesas"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("despesas")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return data;
    },
  });

  const loading = loadingLanc || loadingDesp;

  const allItems = [
    ...(lancamentos?.map((l) => ({
      id: l.id,
      type: "lancamento" as const,
      desc: l.cliente_nome ? `${l.cliente_nome} — ${l.veiculo_desc || ""}` : l.veiculo_desc || "Serviço",
      valor: l.valor_bruto,
      lucro: l.lucro,
      fonte: l.fonte,
      pagamento: l.metodo_pagamento,
      date: new Date(l.created_at),
    })) || []),
    ...(despesas?.map((d) => ({
      id: d.id,
      type: "despesa" as const,
      desc: `${d.categoria}${d.subcategoria ? ` — ${d.subcategoria}` : ""}`,
      valor: -d.valor,
      lucro: -d.valor,
      fonte: "despesa",
      pagamento: d.metodo_pagamento,
      date: new Date(d.created_at),
    })) || []),
  ].sort((a, b) => b.date.getTime() - a.date.getTime());

  const filtered = search
    ? allItems.filter((i) => i.desc.toLowerCase().includes(search.toLowerCase()))
    : allItems;

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
      <div>
        <h2 className="text-lg font-bold text-foreground">Histórico</h2>
        <p className="text-xs text-muted-foreground">{allItems.length} registros</p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 bg-background/30 border-border/50 h-9 text-sm"
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : filtered.length === 0 ? (
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
          <p className="text-sm font-medium text-foreground">Nenhum lançamento ainda</p>
          <p className="text-xs text-muted-foreground">Faça seu primeiro lançamento para ver o histórico aqui.</p>
        </div>
      ) : (
        <div className="space-y-1">
          {filtered.map((item) => {
            const fc = item.fonte === "despesa"
              ? { icon: ClipboardList, label: "Despesa", color: "bg-red-500/20 text-red-400" }
              : fonteConfig[item.fonte || "manual"] || fonteConfig.manual;
            const Icon = fc.icon;
            return (
              <div
                key={item.id}
                className="flex items-center gap-2 md:gap-3 py-2.5 px-3 rounded-lg hover:bg-secondary/20 transition-colors"
              >
                <span className="text-[11px] text-muted-foreground w-12 shrink-0">
                  {item.date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                </span>
                <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium shrink-0 flex items-center gap-1 ${fc.color}`}>
                  <Icon className="h-3 w-3" />
                  <span className="hidden sm:inline">{fc.label}</span>
                </span>
                <span className="text-xs text-foreground truncate flex-1 min-w-0">{item.desc}</span>
                <span className={`text-xs font-medium shrink-0 ${item.valor >= 0 ? "text-emerald-500" : "text-red-400"}`}>
                  {formatCurrency(Math.abs(item.valor))}
                </span>
                {item.pagamento && (
                  <span className="px-1.5 py-0.5 rounded text-[10px] bg-secondary/30 text-muted-foreground shrink-0 hidden sm:block">
                    {item.pagamento}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
};

export default History;
