import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useFiliais } from "@/hooks/useFiliais";
import { motion, AnimatePresence } from "framer-motion";
import { Package, Plus, Search, Truck, AlertTriangle, Check, Clock, Send, X, Loader2, Car, FileText, ChevronDown, ChevronUp, Wrench, BookOpen, TrendingUp, Sparkles, DollarSign, Timer } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

const fmt = (v: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);
const fmtPct = (v: number) => `${v.toFixed(1)}%`;

interface NFItem {
  id: string;
  descricao: string;
  quantidade: string;
  valor_unitario: string;
  lancamento_id: string;
  veiculo_desc: string;
}

const tabs = ["📦 Catálogo", "⏱ Serviços", "📋 Notas Fiscais", "🔧 Na Oficina", "📩 Solicitações"];

type TipoFiltro = "todas" | "peca_fabricada" | "peca_comprada" | "recuperacao";

const PecasPage = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { data: filiais = [] } = useFiliais();
  const [activeTab, setActiveTab] = useState(0);
  const [showNFForm, setShowNFForm] = useState(false);
  const [showSolicitacao, setShowSolicitacao] = useState(false);
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [tipoFiltro, setTipoFiltro] = useState<TipoFiltro>("todas");

  // NF form state
  const [nfFornecedor, setNfFornecedor] = useState("");
  const [nfNumero, setNfNumero] = useState("");
  const [nfFilialId, setNfFilialId] = useState("");
  const [nfObs, setNfObs] = useState("");
  const [nfItems, setNfItems] = useState<NFItem[]>([
    { id: crypto.randomUUID(), descricao: "", quantidade: "1", valor_unitario: "", lancamento_id: "", veiculo_desc: "" },
  ]);

  // Solicitação form state
  const [solLancamentoId, setSolLancamentoId] = useState("");
  const [solItens, setSolItens] = useState("");
  const [solObs, setSolObs] = useState("");

  // ═══════════════════════════════════════════════
  // QUERIES
  // ═══════════════════════════════════════════════

  // Catálogo de peças (conhecimento)
  const { data: catalogoPecas = [], isLoading: loadingCatalogo } = useQuery({
    queryKey: ["catalogo-pecas"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("odb_conhecimento_pecas")
        .select("*")
        .order("total_lancamentos", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  // Serviços & Mão de Obra (conhecimento)
  const { data: catalogoServicos = [], isLoading: loadingServicos } = useQuery({
    queryKey: ["catalogo-servicos"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("odb_conhecimento_servicos")
        .select("*")
        .order("total_lancamentos", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch cars currently in the shop
  const { data: carrosNaOficina = [], isLoading: loadingCarros } = useQuery({
    queryKey: ["carros-oficina"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("lancamentos")
        .select("id, cliente_nome, veiculo_desc, placa, created_at, valor_bruto, custo_total, status")
        .eq("status", "em_andamento")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch notas fiscais
  const { data: notasFiscais = [], isLoading: loadingNFs } = useQuery({
    queryKey: ["notas-fiscais"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notas_fiscais_pecas")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch NF items
  const { data: nfItemsData = [] } = useQuery({
    queryKey: ["nf-items"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("nota_fiscal_items")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch solicitações
  const { data: solicitacoes = [], isLoading: loadingSol } = useQuery({
    queryKey: ["solicitacoes-pecas"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("solicitacoes_pecas")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data || [];
    },
  });

  // ═══════════════════════════════════════════════
  // COMPUTED
  // ═══════════════════════════════════════════════

  const filteredPecas = useMemo(() => {
    let list = catalogoPecas;
    if (tipoFiltro !== "todas") list = list.filter(p => p.tipo === tipoFiltro);
    if (search) {
      const s = search.toLowerCase();
      list = list.filter(p =>
        (p.descricao_normalizada || "").toLowerCase().includes(s) ||
        (p.veiculo_marca || "").toLowerCase().includes(s) ||
        (p.veiculo_modelo || "").toLowerCase().includes(s)
      );
    }
    return list;
  }, [catalogoPecas, tipoFiltro, search]);

  const filteredServicos = useMemo(() => {
    if (!search) return catalogoServicos;
    const s = search.toLowerCase();
    return catalogoServicos.filter(sv =>
      (sv.descricao_normalizada || "").toLowerCase().includes(s) ||
      (sv.veiculo_marca || "").toLowerCase().includes(s) ||
      (sv.veiculo_modelo || "").toLowerCase().includes(s)
    );
  }, [catalogoServicos, search]);

  // Stats
  const totalPecas = catalogoPecas.length;
  const totalFabricadas = catalogoPecas.filter(p => p.tipo === "peca_fabricada").length;
  const totalCompradas = catalogoPecas.filter(p => p.tipo === "peca_comprada").length;

  // Dica IA: serviço mais frequente
  const topServico = catalogoServicos[0];
  const ganhoHoraTop = topServico?.valor_medio_total && topServico?.tempo_medio_minutos
    ? (Number(topServico.valor_medio_total) / Number(topServico.tempo_medio_minutos)) * 60
    : null;

  // ═══════════════════════════════════════════════
  // HELPERS
  // ═══════════════════════════════════════════════

  const getDaysInShop = (createdAt: string) => {
    const diff = Date.now() - new Date(createdAt).getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24));
  };

  const findEstimatedCost = (descricao: string) => {
    const descNorm = descricao.toLowerCase().trim();
    if (!descNorm) return null;
    const match = catalogoPecas.find(k => {
      const kDesc = (k.descricao_normalizada || "").toLowerCase();
      return descNorm.includes(kDesc) || kDesc.includes(descNorm);
    });
    return match?.custo_medio ? Number(match.custo_medio) : null;
  };

  const autoMatchCar = (descricao: string) => {
    const match = carrosNaOficina.find(c => {
      const veic = (c.veiculo_desc || "").toLowerCase();
      return veic && descricao.toLowerCase().includes(veic.split(" ")[0]);
    });
    return match;
  };

  const getTipoBadge = (tipo: string | null) => {
    switch (tipo) {
      case "peca_fabricada": return { label: "Fabricada", cls: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20" };
      case "peca_comprada": return { label: "Comprada", cls: "bg-blue-500/15 text-blue-400 border-blue-500/20" };
      case "recuperacao": return { label: "Recuperação", cls: "bg-amber-500/15 text-amber-400 border-amber-500/20" };
      default: return { label: "Outro", cls: "bg-muted text-muted-foreground border-border/20" };
    }
  };

  // ═══════════════════════════════════════════════
  // NF MUTATIONS
  // ═══════════════════════════════════════════════

  const addNFItem = () => setNfItems([...nfItems, { id: crypto.randomUUID(), descricao: "", quantidade: "1", valor_unitario: "", lancamento_id: "", veiculo_desc: "" }]);
  const removeNFItem = (id: string) => setNfItems(nfItems.filter(i => i.id !== id));
  const updateNFItem = (id: string, field: keyof NFItem, value: string) => {
    setNfItems(prev => prev.map(i => {
      if (i.id !== id) return i;
      const updated = { ...i, [field]: value };
      if (field === "descricao" && value.length > 3) {
        const cost = findEstimatedCost(value);
        if (cost && !i.valor_unitario) updated.valor_unitario = cost.toFixed(2);
        const match = autoMatchCar(value);
        if (match && !i.lancamento_id) {
          updated.lancamento_id = match.id;
          updated.veiculo_desc = `${match.veiculo_desc || ""} ${match.placa || ""}`.trim();
        }
      }
      return updated;
    }));
  };

  const saveNFMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Login necessário");
      const validItems = nfItems.filter(i => i.descricao.trim());
      if (validItems.length === 0) throw new Error("Adicione pelo menos um item");
      const valorTotal = validItems.reduce((s, i) => s + (parseFloat(i.valor_unitario) || 0) * (parseInt(i.quantidade) || 1), 0);
      const { data: nf, error: nfErr } = await supabase
        .from("notas_fiscais_pecas")
        .insert({ fornecedor: nfFornecedor || null, numero_nota: nfNumero || null, valor_total: valorTotal, filial_id: nfFilialId || null, observacoes: nfObs || null, registrado_por: user.id })
        .select("id").single();
      if (nfErr) throw nfErr;
      const itemsToInsert = validItems.map(i => ({
        nota_fiscal_id: nf.id, descricao: i.descricao, quantidade: parseInt(i.quantidade) || 1,
        valor_unitario: parseFloat(i.valor_unitario) || 0, valor_total: (parseFloat(i.valor_unitario) || 0) * (parseInt(i.quantidade) || 1),
        lancamento_id: i.lancamento_id || null, veiculo_desc: i.veiculo_desc || null, status: i.lancamento_id ? "vinculado" : "pendente",
      }));
      const { error: itemsErr } = await supabase.from("nota_fiscal_items").insert(itemsToInsert);
      if (itemsErr) throw itemsErr;
      for (const item of validItems.filter(i => i.lancamento_id)) {
        const custoItem = (parseFloat(item.valor_unitario) || 0) * (parseInt(item.quantidade) || 1);
        const { data: lanc } = await supabase.from("lancamentos").select("custo_pecas_compradas, custo_total, valor_bruto, desconto, taxa_valor").eq("id", item.lancamento_id).single();
        if (lanc) {
          const novoCustoPecas = (Number(lanc.custo_pecas_compradas) || 0) + custoItem;
          const lucro = Number(lanc.valor_bruto) - Number(lanc.desconto) - Number(lanc.taxa_valor) - novoCustoPecas;
          await supabase.from("lancamentos").update({ custo_pecas_compradas: novoCustoPecas, custo_total: novoCustoPecas, lucro }).eq("id", item.lancamento_id);
        }
      }
      return nf;
    },
    onSuccess: () => {
      toast.success("Nota fiscal salva! Custos atualizados.");
      queryClient.invalidateQueries({ queryKey: ["notas-fiscais"] });
      queryClient.invalidateQueries({ queryKey: ["nf-items"] });
      queryClient.invalidateQueries({ queryKey: ["carros-oficina"] });
      setShowNFForm(false);
      setNfFornecedor(""); setNfNumero(""); setNfObs("");
      setNfItems([{ id: crypto.randomUUID(), descricao: "", quantidade: "1", valor_unitario: "", lancamento_id: "", veiculo_desc: "" }]);
    },
    onError: (err: any) => toast.error(err.message || "Erro ao salvar NF"),
  });

  const saveSolMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Login necessário");
      if (!solLancamentoId) throw new Error("Selecione o veículo");
      if (!solItens.trim()) throw new Error("Informe as peças necessárias");
      const lanc = carrosNaOficina.find(c => c.id === solLancamentoId);
      const itensArray = solItens.split("\n").filter(Boolean).map(i => ({ descricao: i.trim() }));
      const { error } = await supabase.from("solicitacoes_pecas").insert({
        lancamento_id: solLancamentoId, veiculo_desc: lanc?.veiculo_desc || null, placa: lanc?.placa || null,
        itens: itensArray, observacoes: solObs || null, solicitado_por: user.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Solicitação enviada!");
      queryClient.invalidateQueries({ queryKey: ["solicitacoes-pecas"] });
      setShowSolicitacao(false); setSolLancamentoId(""); setSolItens(""); setSolObs("");
    },
    onError: (err: any) => toast.error(err.message || "Erro"),
  });

  const nfTotalValue = useMemo(() =>
    nfItems.reduce((s, i) => s + (parseFloat(i.valor_unitario) || 0) * (parseInt(i.quantidade) || 1), 0),
    [nfItems]
  );

  // ═══════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-3 pb-24">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
            <Package className="h-5 w-5 text-primary" />
            Gestão de Peças
          </h2>
          <p className="text-xs text-muted-foreground">
            {totalPecas} peças catalogadas · {totalFabricadas} fabricadas · {totalCompradas} compradas
          </p>
        </div>
        <div className="flex gap-1.5">
          <Button size="sm" variant="outline" onClick={() => setShowSolicitacao(true)}
            className="text-xs gap-1 border-primary/20 text-primary hover:bg-primary/10">
            <Send className="h-3.5 w-3.5" /> Solicitar
          </Button>
          <Button size="sm" onClick={() => setShowNFForm(true)}
            className="text-xs gap-1 bg-primary text-primary-foreground hover:bg-primary/90">
            <Plus className="h-3.5 w-3.5" /> Nova NF
          </Button>
        </div>
      </div>

      {/* Tabs - horizontal scroll on mobile */}
      <div className="flex overflow-x-auto scrollbar-hide border-b border-border/20 -mx-1 px-1">
        {tabs.map((t, i) => (
          <button key={t} onClick={() => { setActiveTab(i); setSearch(""); setTipoFiltro("todas"); }}
            className={`whitespace-nowrap px-3 py-2 text-xs font-medium text-center transition-colors shrink-0 ${activeTab === i ? "text-primary border-b-2 border-primary" : "text-muted-foreground"}`}>
            {t}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
        <Input placeholder="Buscar peça, veículo, fornecedor..." value={search} onChange={e => setSearch(e.target.value)}
          className="pl-9 bg-background/30 border-border/50 h-8 text-xs" />
      </div>

      {/* ═══ Tab 0: Catálogo de Peças ═══ */}
      {activeTab === 0 && (
        <div className="space-y-3">
          {/* Filtros por tipo */}
          <div className="flex gap-1.5 overflow-x-auto scrollbar-hide">
            {([
              { value: "todas" as TipoFiltro, label: "Todas", count: catalogoPecas.length },
              { value: "peca_fabricada" as TipoFiltro, label: "🟢 Fabricadas", count: totalFabricadas },
              { value: "peca_comprada" as TipoFiltro, label: "🔵 Compradas", count: totalCompradas },
              { value: "recuperacao" as TipoFiltro, label: "🟡 Recuperação", count: catalogoPecas.filter(p => p.tipo === "recuperacao").length },
            ]).map(f => (
              <button key={f.value} onClick={() => setTipoFiltro(f.value)}
                className={`shrink-0 px-3 py-1.5 rounded-full text-[11px] font-medium transition-all border ${
                  tipoFiltro === f.value
                    ? "bg-primary/15 border-primary/30 text-primary"
                    : "bg-card/50 border-border/20 text-muted-foreground hover:border-border/40"
                }`}>
                {f.label} ({f.count})
              </button>
            ))}
          </div>

          {loadingCatalogo ? (
            <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>
          ) : filteredPecas.length === 0 ? (
            <EmptyState
              icon={BookOpen}
              message={catalogoPecas.length === 0 ? "Catálogo vazio" : "Nenhuma peça encontrada"}
              sub={catalogoPecas.length === 0
                ? "O catálogo é preenchido automaticamente pelo Agente ODB a cada lançamento de serviço. Comece registrando serviços!"
                : "Tente outro termo de busca"
              }
            />
          ) : (
            <div className="space-y-2">
              {filteredPecas.map(peca => {
                const badge = getTipoBadge(peca.tipo);
                const margem = peca.margem_media ? Number(peca.margem_media) : null;
                const valorMedio = peca.valor_medio ? Number(peca.valor_medio) : null;
                const custoMedio = peca.custo_medio ? Number(peca.custo_medio) : null;
                const veiculo = [peca.veiculo_marca, peca.veiculo_modelo].filter(Boolean).join(" ");

                return (
                  <motion.div key={peca.id}
                    initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                    className="rounded-xl p-3 space-y-2 border border-border/10 bg-card/60">
                    <div className="flex items-start gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-foreground truncate">{peca.descricao_normalizada}</p>
                        {veiculo && (
                          <p className="text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5">
                            <Car className="h-3 w-3" /> {veiculo}
                          </p>
                        )}
                      </div>
                      <span className={`shrink-0 text-[9px] px-2 py-0.5 rounded-full font-medium border ${badge.cls}`}>
                        {badge.label}
                      </span>
                    </div>

                    <div className="grid grid-cols-4 gap-2">
                      <div className="text-center">
                        <p className="text-[9px] text-muted-foreground">Valor médio</p>
                        <p className="text-xs font-bold text-foreground">{valorMedio ? fmt(valorMedio) : "—"}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-[9px] text-muted-foreground">Custo médio</p>
                        <p className="text-xs font-bold text-foreground">{custoMedio ? fmt(custoMedio) : "—"}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-[9px] text-muted-foreground">Margem</p>
                        <p className={`text-xs font-bold ${margem && margem > 50 ? "text-emerald-400" : margem && margem > 20 ? "text-primary" : "text-red-400"}`}>
                          {margem ? fmtPct(margem) : "—"}
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-[9px] text-muted-foreground">Lançam.</p>
                        <p className="text-xs font-bold text-foreground">{peca.total_lancamentos || 0}</p>
                      </div>
                    </div>

                    {/* Price range bar */}
                    {peca.valor_minimo && peca.valor_maximo && Number(peca.valor_minimo) !== Number(peca.valor_maximo) && (
                      <div className="flex items-center gap-2 text-[9px] text-muted-foreground">
                        <span>{fmt(Number(peca.valor_minimo))}</span>
                        <div className="flex-1 h-1 rounded-full bg-muted/30 relative overflow-hidden">
                          <div className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary/40 to-primary rounded-full" style={{ width: "100%" }} />
                        </div>
                        <span>{fmt(Number(peca.valor_maximo))}</span>
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ═══ Tab 1: Serviços & Mão de Obra ═══ */}
      {activeTab === 1 && (
        <div className="space-y-3">
          {/* Dica IA */}
          {topServico && ganhoHoraTop && (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
              className="rounded-xl p-3 border border-primary/15 bg-primary/5">
              <div className="flex items-center gap-2 mb-1.5">
                <Sparkles className="h-4 w-4 text-primary" />
                <span className="text-[10px] font-bold text-primary uppercase tracking-wider">Dica Inteligente</span>
              </div>
              <p className="text-xs text-foreground">
                O serviço mais frequente é <strong>{topServico.descricao_normalizada}</strong>
                {topServico.veiculo_marca && ` (${[topServico.veiculo_marca, topServico.veiculo_modelo].filter(Boolean).join(" ")})`}.
                {" "}Valor médio: <strong>{fmt(Number(topServico.valor_medio_total || 0))}</strong>,
                tempo médio: <strong>{topServico.tempo_medio_minutos}min</strong>,
                ganho/hora: <strong className="text-emerald-400">{fmt(ganhoHoraTop)}/h</strong>.
              </p>
            </motion.div>
          )}

          {loadingServicos ? (
            <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>
          ) : filteredServicos.length === 0 ? (
            <EmptyState
              icon={Wrench}
              message={catalogoServicos.length === 0 ? "Nenhum serviço catalogado" : "Nenhum serviço encontrado"}
              sub={catalogoServicos.length === 0
                ? "Os serviços são catalogados automaticamente pelo Agente ODB a cada lançamento. Use o ODB para registrar serviços!"
                : "Tente outro termo"
              }
            />
          ) : (
            <div className="space-y-2">
              {filteredServicos.map(sv => {
                const valorMedio = Number(sv.valor_medio_total || 0);
                const tempoMedio = Number(sv.tempo_medio_minutos || 0);
                const ganhoHora = tempoMedio > 0 ? (valorMedio / tempoMedio) * 60 : null;
                const veiculo = [sv.veiculo_marca, sv.veiculo_modelo].filter(Boolean).join(" ");
                const itensComuns = Array.isArray(sv.itens_comuns) ? sv.itens_comuns as Array<{ descricao?: string; nome?: string }> : [];

                return (
                  <motion.div key={sv.id}
                    initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                    className="rounded-xl p-3 space-y-2 border border-border/10 bg-card/60">
                    <div className="flex items-start gap-2">
                      <Wrench className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-foreground">{sv.descricao_normalizada || "Serviço"}</p>
                        {veiculo && (
                          <p className="text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5">
                            <Car className="h-3 w-3" /> {veiculo}
                          </p>
                        )}
                      </div>
                      <span className="shrink-0 text-[9px] px-2 py-0.5 rounded-full font-medium bg-muted/30 text-muted-foreground border border-border/20">
                        {sv.total_lancamentos || 0}x realizado
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <div className="flex items-center gap-1.5 rounded-lg bg-background/30 p-2">
                        <DollarSign className="h-3.5 w-3.5 text-primary" />
                        <div>
                          <p className="text-[9px] text-muted-foreground">Valor médio</p>
                          <p className="text-xs font-bold text-foreground">{fmt(valorMedio)}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 rounded-lg bg-background/30 p-2">
                        <Timer className="h-3.5 w-3.5 text-blue-400" />
                        <div>
                          <p className="text-[9px] text-muted-foreground">Tempo médio</p>
                          <p className="text-xs font-bold text-foreground">{tempoMedio > 0 ? `${tempoMedio}min` : "—"}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 rounded-lg bg-background/30 p-2">
                        <TrendingUp className="h-3.5 w-3.5 text-emerald-400" />
                        <div>
                          <p className="text-[9px] text-muted-foreground">Ganho/h</p>
                          <p className="text-xs font-bold text-emerald-400">{ganhoHora ? fmt(ganhoHora) : "—"}</p>
                        </div>
                      </div>
                    </div>

                    {/* Itens comuns */}
                    {itensComuns.length > 0 && (
                      <div className="pt-1 border-t border-border/10">
                        <p className="text-[9px] text-muted-foreground mb-1">Peças comuns neste serviço:</p>
                        <div className="flex flex-wrap gap-1">
                          {itensComuns.slice(0, 6).map((item, idx) => (
                            <span key={idx} className="text-[10px] px-2 py-0.5 rounded-full bg-primary/8 text-primary/80 border border-primary/10">
                              {(item as any).descricao || (item as any).nome || String(item)}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ═══ Tab 2: Notas Fiscais ═══ */}
      {activeTab === 2 && (
        <div className="space-y-2">
          {loadingNFs ? (
            <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>
          ) : notasFiscais.length === 0 ? (
            <EmptyState icon={FileText} message="Nenhuma nota fiscal registrada" sub="Clique em 'Nova NF' para registrar peças recebidas" />
          ) : notasFiscais.filter(nf => !search || (nf.fornecedor || "").toLowerCase().includes(search.toLowerCase()) || (nf.numero_nota || "").toLowerCase().includes(search.toLowerCase())).map(nf => {
            const expanded = expandedId === nf.id;
            const items = nfItemsData.filter(i => i.nota_fiscal_id === nf.id);
            return (
              <div key={nf.id} onClick={() => setExpandedId(expanded ? null : nf.id)}
                className="rounded-xl p-3 cursor-pointer transition-colors border border-border/10 bg-card/60">
                <div className="flex items-center gap-2">
                  <Truck className="h-4 w-4 text-primary shrink-0" />
                  <div className="flex-1 min-w-0">
                    <span className="text-xs font-semibold text-foreground">{nf.fornecedor || "Fornecedor não informado"}</span>
                    {nf.numero_nota && <span className="text-[10px] text-muted-foreground ml-2">NF {nf.numero_nota}</span>}
                  </div>
                  <span className="text-xs font-bold text-primary shrink-0">{fmt(Number(nf.valor_total))}</span>
                  {expanded ? <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" /> : <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />}
                </div>
                <div className="flex items-center gap-2 mt-1 text-[10px] text-muted-foreground">
                  <span>{new Date(nf.created_at).toLocaleDateString("pt-BR")}</span>
                  <span>• {items.length} itens</span>
                  <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-medium ${nf.status === "vinculada" ? "bg-emerald-500/15 text-emerald-400" : "bg-yellow-500/15 text-yellow-400"}`}>
                    {nf.status === "vinculada" ? "Vinculada" : "Pendente"}
                  </span>
                </div>
                {expanded && items.length > 0 && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} className="mt-2 pt-2 border-t border-border/10 space-y-1">
                    {items.map(item => (
                      <div key={item.id} className="flex items-center justify-between text-[11px]">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <span className="text-foreground truncate">{item.descricao}</span>
                          <span className="text-muted-foreground shrink-0">x{item.quantidade}</span>
                          {item.veiculo_desc && (
                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 shrink-0">🚗 {item.veiculo_desc}</span>
                          )}
                        </div>
                        <span className="font-medium text-foreground shrink-0 ml-2">{fmt(Number(item.valor_total))}</span>
                      </div>
                    ))}
                  </motion.div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ═══ Tab 3: Carros na Oficina ═══ */}
      {activeTab === 3 && (
        <div className="space-y-2">
          {loadingCarros ? (
            <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>
          ) : carrosNaOficina.length === 0 ? (
            <EmptyState icon={Car} message="Nenhum carro na oficina" sub="Carros com status 'em andamento' aparecerão aqui" />
          ) : carrosNaOficina.filter(c => !search || (c.veiculo_desc || "").toLowerCase().includes(search.toLowerCase()) || (c.placa || "").toLowerCase().includes(search.toLowerCase()) || (c.cliente_nome || "").toLowerCase().includes(search.toLowerCase())).map(c => {
            const days = getDaysInShop(c.created_at);
            const hasAlert = days >= 1;
            return (
              <div key={c.id} className={`rounded-xl p-3 space-y-1.5 border bg-card/60 ${hasAlert ? "border-destructive/20" : "border-border/10"}`}>
                <div className="flex items-center gap-2">
                  <Car className={`h-4 w-4 shrink-0 ${hasAlert ? "text-destructive" : "text-primary"}`} />
                  <div className="flex-1 min-w-0">
                    <span className="text-xs font-semibold text-foreground">{c.veiculo_desc || "Veículo"}</span>
                    {c.placa && <span className="text-[10px] text-muted-foreground ml-2">• {c.placa}</span>}
                  </div>
                  {hasAlert && (
                    <span className="flex items-center gap-1 text-[9px] px-1.5 py-0.5 rounded-full bg-destructive/15 text-destructive font-medium shrink-0">
                      <AlertTriangle className="h-3 w-3" /> {days}d na oficina
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                  <span>👤 {c.cliente_nome || "Sem nome"}</span>
                  <span>💰 {fmt(Number(c.valor_bruto))}</span>
                  <span>📅 {new Date(c.created_at).toLocaleDateString("pt-BR")}</span>
                </div>
                <div className="flex gap-1.5 mt-1">
                  <button onClick={(e) => { e.stopPropagation(); setSolLancamentoId(c.id); setShowSolicitacao(true); }}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-primary/10 border border-primary/20 text-[10px] font-medium text-primary hover:bg-primary/20 transition-all">
                    <Package className="h-3 w-3" /> Solicitar Peças
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ═══ Tab 4: Solicitações ═══ */}
      {activeTab === 4 && (
        <div className="space-y-2">
          {loadingSol ? (
            <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>
          ) : solicitacoes.length === 0 ? (
            <EmptyState icon={Send} message="Nenhuma solicitação" sub="Solicite peças para carros que estão na oficina" />
          ) : solicitacoes.map(sol => {
            const itens = Array.isArray(sol.itens) ? sol.itens as Array<{ descricao: string }> : [];
            return (
              <div key={sol.id} className={`rounded-xl p-3 space-y-1.5 border bg-card/60 ${sol.status === "atendida" ? "border-emerald-500/15" : "border-border/10"}`}>
                <div className="flex items-center gap-2">
                  <Package className={`h-4 w-4 shrink-0 ${sol.status === "atendida" ? "text-emerald-400" : "text-warning"}`} />
                  <span className="text-xs font-semibold text-foreground flex-1">{sol.veiculo_desc || "Veículo"} {sol.placa ? `• ${sol.placa}` : ""}</span>
                  <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-medium ${sol.status === "atendida" ? "bg-emerald-500/15 text-emerald-400" : "bg-warning/15 text-warning"}`}>
                    {sol.status === "atendida" ? "✓ Atendida" : "⏳ Pendente"}
                  </span>
                </div>
                <div className="text-[11px] text-muted-foreground">
                  {itens.map((i, idx) => <span key={idx} className="block">• {i.descricao}</span>)}
                </div>
                <div className="text-[10px] text-muted-foreground">
                  {new Date(sol.created_at).toLocaleDateString("pt-BR")} às {new Date(sol.created_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* NF Form Modal */}
      <AnimatePresence>
        {showNFForm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/60 backdrop-blur-sm"
            onClick={() => setShowNFForm(false)}>
            <motion.div initial={{ y: 100 }} animate={{ y: 0 }} exit={{ y: 100 }}
              className="w-full max-w-lg max-h-[85vh] overflow-y-auto rounded-t-2xl md:rounded-2xl p-4 space-y-4 border border-border/20 bg-card"
              onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                  <Truck className="h-4 w-4 text-primary" /> Nova Nota Fiscal de Peças
                </h3>
                <button onClick={() => setShowNFForm(false)} className="text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-[10px] text-muted-foreground">Fornecedor</Label>
                  <Input value={nfFornecedor} onChange={e => setNfFornecedor(e.target.value)} placeholder="Auto peças..." className="bg-background/30 border-border/50 h-8 text-xs" />
                </div>
                <div>
                  <Label className="text-[10px] text-muted-foreground">Nº Nota</Label>
                  <Input value={nfNumero} onChange={e => setNfNumero(e.target.value)} placeholder="0001" className="bg-background/30 border-border/50 h-8 text-xs" />
                </div>
              </div>
              {filiais.length > 0 && (
                <div>
                  <Label className="text-[10px] text-muted-foreground">Filial</Label>
                  <Select value={nfFilialId} onValueChange={setNfFilialId}>
                    <SelectTrigger className="bg-background/30 border-border/50 h-8 text-xs"><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>{filiais.map(f => <SelectItem key={f.id} value={f.id}>{f.nome}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              )}
              <div className="space-y-2">
                <p className="text-[10px] font-bold text-primary/70 uppercase tracking-widest">Itens da Nota</p>
                {nfItems.map((item, idx) => (
                  <div key={item.id} className="rounded-lg bg-secondary/20 p-3 border border-border/20 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] font-bold text-muted-foreground uppercase">Item {idx + 1}</span>
                      {nfItems.length > 1 && <button onClick={() => removeNFItem(item.id)} className="text-destructive hover:text-destructive/80 text-xs">✕</button>}
                    </div>
                    <Input placeholder="Descrição da peça" value={item.descricao} onChange={e => updateNFItem(item.id, "descricao", e.target.value)} className="bg-background/20 border-border/40 h-8 text-xs" />
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label className="text-[9px] text-muted-foreground">Qtd</Label>
                        <Input type="number" value={item.quantidade} onChange={e => updateNFItem(item.id, "quantidade", e.target.value)} className="bg-background/20 border-border/40 h-7 text-xs" />
                      </div>
                      <div>
                        <Label className="text-[9px] text-muted-foreground">
                          Valor Unit. (R$)
                          {item.valor_unitario && findEstimatedCost(item.descricao) && <span className="text-emerald-400 ml-1">✓ Sugerido</span>}
                        </Label>
                        <Input type="number" value={item.valor_unitario} onChange={e => updateNFItem(item.id, "valor_unitario", e.target.value)} className="bg-background/20 border-border/40 h-7 text-xs" />
                      </div>
                    </div>
                    <div>
                      <Label className="text-[9px] text-muted-foreground">Vincular a veículo na oficina</Label>
                      <Select value={item.lancamento_id} onValueChange={v => {
                        const lanc = carrosNaOficina.find(c => c.id === v);
                        updateNFItem(item.id, "lancamento_id", v);
                        if (lanc) updateNFItem(item.id, "veiculo_desc", `${lanc.veiculo_desc || ""} ${lanc.placa || ""}`.trim());
                      }}>
                        <SelectTrigger className="bg-background/20 border-border/40 h-7 text-xs">
                          <SelectValue placeholder={item.veiculo_desc || "Selecione o veículo"} />
                        </SelectTrigger>
                        <SelectContent>
                          {carrosNaOficina.map(c => (
                            <SelectItem key={c.id} value={c.id}>
                              {c.veiculo_desc || "Veículo"} {c.placa ? `(${c.placa})` : ""} — {c.cliente_nome || ""}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {item.veiculo_desc && <span className="text-[9px] text-emerald-400 mt-0.5 block">🚗 Vinculado: {item.veiculo_desc}</span>}
                    </div>
                  </div>
                ))}
                <button onClick={addNFItem} className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg border border-dashed border-primary/30 text-primary text-xs font-medium hover:bg-primary/5 transition-colors">
                  <Plus className="h-3.5 w-3.5" /> Adicionar Item
                </button>
              </div>
              <Textarea placeholder="Observações..." value={nfObs} onChange={e => setNfObs(e.target.value)} className="bg-background/30 border-border/50 min-h-[50px] text-xs resize-none" />
              <div className="flex items-center justify-between pt-2 border-t border-border/20">
                <span className="text-xs font-bold text-foreground">Total: {fmt(nfTotalValue)}</span>
                <Button onClick={() => saveNFMutation.mutate()} disabled={saveNFMutation.isPending} className="bg-primary text-primary-foreground hover:bg-primary/90 text-xs gap-1">
                  {saveNFMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />} Salvar NF
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Solicitação Modal */}
      <AnimatePresence>
        {showSolicitacao && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/60 backdrop-blur-sm"
            onClick={() => setShowSolicitacao(false)}>
            <motion.div initial={{ y: 100 }} animate={{ y: 0 }} exit={{ y: 100 }}
              className="w-full max-w-lg rounded-t-2xl md:rounded-2xl p-4 space-y-4 border border-border/20 bg-card"
              onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                  <Package className="h-4 w-4 text-primary" /> Solicitar Peças
                </h3>
                <button onClick={() => setShowSolicitacao(false)} className="text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>
              </div>
              <div>
                <Label className="text-[10px] text-muted-foreground">Veículo na oficina</Label>
                <Select value={solLancamentoId} onValueChange={setSolLancamentoId}>
                  <SelectTrigger className="bg-background/30 border-border/50 h-9 text-xs"><SelectValue placeholder="Buscar veículo..." /></SelectTrigger>
                  <SelectContent>
                    {carrosNaOficina.length === 0 ? (
                      <SelectItem value="none" disabled>Nenhum veículo na oficina</SelectItem>
                    ) : carrosNaOficina.map(c => (
                      <SelectItem key={c.id} value={c.id}>
                        <div className="flex items-center gap-2">
                          <Car className="h-3 w-3 text-primary" />
                          {c.veiculo_desc || "Veículo"} {c.placa ? `(${c.placa})` : ""}
                          <span className="text-muted-foreground">— {c.cliente_nome || ""}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-[10px] text-muted-foreground">Peças necessárias (uma por linha)</Label>
                <Textarea value={solItens} onChange={e => setSolItens(e.target.value)} placeholder={"Amortecedor dianteiro\nBucha da bandeja\nTerminal de direção"} className="bg-background/30 border-border/50 min-h-[80px] text-xs" />
              </div>
              <Textarea placeholder="Observações..." value={solObs} onChange={e => setSolObs(e.target.value)} className="bg-background/30 border-border/50 min-h-[40px] text-xs resize-none" />
              <Button onClick={() => saveSolMutation.mutate()} disabled={saveSolMutation.isPending} className="w-full bg-primary text-primary-foreground hover:bg-primary/90 text-xs gap-1">
                {saveSolMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />} Enviar Solicitação
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

const EmptyState = ({ icon: Icon, message, sub }: { icon: any; message: string; sub?: string }) => (
  <div className="flex flex-col items-center gap-2 p-8 text-center rounded-xl border border-border/10 bg-card/40">
    <Icon className="h-8 w-8 text-muted-foreground/30" />
    <p className="text-xs text-muted-foreground">{message}</p>
    {sub && <p className="text-[10px] text-muted-foreground/60">{sub}</p>}
  </div>
);

export default PecasPage;
