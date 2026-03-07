import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Pencil, Camera, Mic, ClipboardList } from "lucide-react";
import { formatCurrency } from "@/lib/mockDashboardData";
import type { ComponentType } from "react";

const typeConfig: Record<string, { icon: ComponentType<{ className?: string }>; label: string; color: string }> = {
  manual: { icon: Pencil, label: "Manual", color: "bg-primary/20 text-primary" },
  foto: { icon: Camera, label: "Foto", color: "bg-blue-500/20 text-blue-400" },
  audio: { icon: Mic, label: "Áudio", color: "bg-violet-500/20 text-violet-400" },
  despesa: { icon: ClipboardList, label: "Despesa", color: "bg-red-500/20 text-red-400" },
};

interface FeedItem {
  id: string;
  hora: string;
  operador: string;
  tipo: string;
  desc: string;
  valor: number;
  pagamento: string;
}

const LiveFeed = () => {
  const [items, setItems] = useState<FeedItem[]>([]);

  useEffect(() => {
    // Load initial data
    const load = async () => {
      const [lancRes, despRes] = await Promise.all([
        supabase.from("lancamentos").select("id, created_at, cliente_nome, veiculo_desc, valor_bruto, fonte, metodo_pagamento").order("created_at", { ascending: false }).limit(10),
        supabase.from("despesas").select("id, created_at, categoria, subcategoria, valor, metodo_pagamento").order("created_at", { ascending: false }).limit(5),
      ]);

      const feedItems: FeedItem[] = [
        ...(lancRes.data?.map((l) => ({
          id: l.id,
          hora: new Date(l.created_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
          operador: "Op",
          tipo: l.fonte || "manual",
          desc: [l.cliente_nome, l.veiculo_desc].filter(Boolean).join(" — ") || "Serviço",
          valor: Number(l.valor_bruto),
          pagamento: l.metodo_pagamento || "",
        })) || []),
        ...(despRes.data?.map((d) => ({
          id: d.id,
          hora: new Date(d.created_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
          operador: "Op",
          tipo: "despesa",
          desc: `${d.categoria}${d.subcategoria ? ` — ${d.subcategoria}` : ""}`,
          valor: -Number(d.valor),
          pagamento: d.metodo_pagamento || "",
        })) || []),
      ].sort((a, b) => b.hora.localeCompare(a.hora)).slice(0, 15);

      setItems(feedItems);
    };

    load();

    // Realtime subscription
    const channel = supabase.channel("live-feed")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "lancamentos" }, (payload) => {
        const l = payload.new as any;
        setItems((prev) => [{
          id: l.id,
          hora: new Date(l.created_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
          operador: "Op",
          tipo: l.fonte || "manual",
          desc: [l.cliente_nome, l.veiculo_desc].filter(Boolean).join(" — ") || "Serviço",
          valor: Number(l.valor_bruto),
          pagamento: l.metodo_pagamento || "",
        }, ...prev].slice(0, 15));
      })
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "despesas" }, (payload) => {
        const d = payload.new as any;
        setItems((prev) => [{
          id: d.id,
          hora: new Date(d.created_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
          operador: "Op",
          tipo: "despesa",
          desc: `${d.categoria}${d.subcategoria ? ` — ${d.subcategoria}` : ""}`,
          valor: -Number(d.valor),
          pagamento: d.metodo_pagamento || "",
        }, ...prev].slice(0, 15));
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.95, duration: 0.4 }}
      className="rounded-2xl p-4 md:p-6 transition-all duration-300"
      style={{ background: "rgba(14,20,35,0.85)", backdropFilter: "blur(16px)", border: "1px solid rgba(245,158,11,0.08)", boxShadow: "0 4px 24px rgba(0,0,0,0.3), 0 0 0 1px rgba(255,255,255,0.03)" }}>
      <div className="flex items-center gap-2 mb-4">
        <h3 className="text-[11px] uppercase tracking-[0.05em] text-muted-foreground font-medium">Atividade em Tempo Real</h3>
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
        </span>
        <span className="text-[10px] text-emerald-500 font-medium">Live</span>
      </div>

      <div className="space-y-1">
        {items.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-4">Nenhum lançamento ainda. Faça o primeiro!</p>
        ) : (
          items.map((item, i) => {
            const tc = typeConfig[item.tipo] || typeConfig.manual;
            const Icon = tc.icon;
            return (
              <motion.div key={item.id} initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                className="flex items-center gap-2 md:gap-3 py-2 px-2 rounded-lg hover:bg-secondary/20 transition-colors">
                <span className="text-[11px] text-muted-foreground w-10 shrink-0">{item.hora}</span>
                <div className="w-6 h-6 rounded-full bg-secondary/50 flex items-center justify-center text-[10px] font-bold text-foreground shrink-0">
                  {item.operador[0]}
                </div>
                <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium shrink-0 flex items-center gap-1 ${tc.color}`}>
                  <Icon className="h-3 w-3" />
                  <span className="hidden sm:inline">{tc.label}</span>
                </span>
                <span className="text-xs text-foreground truncate flex-1 min-w-0">{item.desc}</span>
                <span className={`text-xs font-medium shrink-0 ${item.valor >= 0 ? "text-emerald-500" : "text-red-400"}`}>
                  {item.valor >= 0 ? formatCurrency(item.valor) : `-${formatCurrency(Math.abs(item.valor))}`}
                </span>
                {item.pagamento && <span className="px-1.5 py-0.5 rounded text-[10px] bg-secondary/30 text-muted-foreground shrink-0 hidden sm:block">{item.pagamento}</span>}
              </motion.div>
            );
          })
        )}
      </div>
    </motion.div>
  );
};

export default LiveFeed;
