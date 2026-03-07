import { useState } from "react";
import { motion } from "framer-motion";
import { Search, User, Car, Phone, Mail, Plus, ChevronRight, Loader2, FileText } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

const fmt = (v: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

const ClientesPage = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [newNome, setNewNome] = useState("");
  const [newTel, setNewTel] = useState("");
  const [newEmail, setNewEmail] = useState("");

  const { data: clientes = [], isLoading } = useQuery({
    queryKey: ["clientes"],
    queryFn: async () => {
      const { data } = await supabase.from("clientes").select("*").order("nome");
      return data || [];
    },
  });

  const { data: veiculos = [] } = useQuery({
    queryKey: ["veiculos"],
    queryFn: async () => {
      const { data } = await supabase.from("veiculos").select("*").order("marca");
      return data || [];
    },
  });

  const { data: lancamentos = [] } = useQuery({
    queryKey: ["lanc-clientes"],
    queryFn: async () => {
      const { data } = await supabase.from("lancamentos").select("id, cliente_id, cliente_nome, veiculo_desc, valor_bruto, lucro, created_at, placa").order("created_at", { ascending: false }).limit(500);
      return data || [];
    },
  });

  const addCliente = useMutation({
    mutationFn: async () => {
      if (!newNome.trim()) return;
      const { error } = await supabase.from("clientes").insert({
        nome: newNome.trim(),
        telefone: newTel.trim() || null,
        email: newEmail.trim() || null,
        created_by: user?.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clientes"] });
      setNewNome(""); setNewTel(""); setNewEmail(""); setShowAdd(false);
      toast.success("Cliente adicionado!");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const filtered = search
    ? clientes.filter(c =>
        c.nome.toLowerCase().includes(search.toLowerCase()) ||
        (c.telefone || "").includes(search) ||
        (c.cpf_cnpj || "").includes(search)
      )
    : clientes;

  const selected = clientes.find(c => c.id === selectedId);
  const selectedVeiculos = veiculos.filter(v => v.cliente_id === selectedId);
  const selectedLanc = lancamentos.filter(l => l.cliente_id === selectedId);
  const totalGasto = selectedLanc.reduce((s, l) => s + Number(l.valor_bruto), 0);

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-4 pb-24">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-foreground">Clientes & Veículos</h2>
          <p className="text-xs text-muted-foreground">{clientes.length} clientes cadastrados</p>
        </div>
        <Button onClick={() => setShowAdd(!showAdd)} size="sm" className="h-8 gap-1 text-xs bg-primary text-primary-foreground">
          <Plus className="h-3.5 w-3.5" /> Novo Cliente
        </Button>
      </div>

      {showAdd && (
        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
          className="rounded-xl p-4 space-y-2" style={{ background: "rgba(14,20,35,0.7)", border: "1px solid rgba(245,158,11,0.1)" }}>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <Input placeholder="Nome *" value={newNome} onChange={e => setNewNome(e.target.value)} className="bg-background/30 border-border/50 h-9 text-sm" />
            <Input placeholder="Telefone" value={newTel} onChange={e => setNewTel(e.target.value)} className="bg-background/30 border-border/50 h-9 text-sm" />
            <Input placeholder="E-mail" value={newEmail} onChange={e => setNewEmail(e.target.value)} className="bg-background/30 border-border/50 h-9 text-sm" />
          </div>
          <Button onClick={() => addCliente.mutate()} disabled={addCliente.isPending || !newNome.trim()} size="sm" className="h-8 bg-primary text-primary-foreground gap-1 text-xs">
            <Plus className="h-3 w-3" /> Salvar
          </Button>
        </motion.div>
      )}

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
        <Input placeholder="Buscar por nome, telefone ou CPF..." value={search} onChange={e => setSearch(e.target.value)}
          className="pl-9 bg-background/30 border-border/50 h-9 text-sm" />
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Client list */}
          <div className="space-y-1.5 max-h-[60vh] overflow-y-auto pr-1">
            {filtered.length === 0 ? (
              <div className="text-center py-12 rounded-xl" style={{ background: "rgba(14,20,35,0.5)", border: "1px solid rgba(245,158,11,0.06)" }}>
                <User className="h-8 w-8 text-muted-foreground/20 mx-auto mb-2" />
                <p className="text-xs text-muted-foreground">Nenhum cliente encontrado</p>
              </div>
            ) : filtered.map(c => {
              const cLanc = lancamentos.filter(l => l.cliente_id === c.id);
              const cTotal = cLanc.reduce((s, l) => s + Number(l.valor_bruto), 0);
              const cVeiculos = veiculos.filter(v => v.cliente_id === c.id);
              const isActive = selectedId === c.id;
              return (
                <button key={c.id} onClick={() => setSelectedId(isActive ? null : c.id)}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all ${isActive ? "border-primary/25" : "border-transparent hover:bg-secondary/10"}`}
                  style={{ background: isActive ? "rgba(245,158,11,0.05)" : "rgba(14,20,35,0.5)", border: `1px solid ${isActive ? "rgba(245,158,11,0.2)" : "rgba(245,158,11,0.06)"}` }}>
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                    <User className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{c.nome}</p>
                    <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                      {c.telefone && <span className="flex items-center gap-0.5"><Phone className="h-2.5 w-2.5" />{c.telefone}</span>}
                      {cVeiculos.length > 0 && <span className="flex items-center gap-0.5"><Car className="h-2.5 w-2.5" />{cVeiculos.length}</span>}
                      {cLanc.length > 0 && <span>{cLanc.length} serviços</span>}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    {cTotal > 0 && <p className="text-xs font-bold text-emerald-500">{fmt(cTotal)}</p>}
                    <ChevronRight className={`h-3.5 w-3.5 text-muted-foreground transition-transform ${isActive ? "rotate-90" : ""}`} />
                  </div>
                </button>
              );
            })}
          </div>

          {/* Client detail */}
          {selected && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
              className="rounded-xl p-4 space-y-4 h-fit" style={{ background: "rgba(14,20,35,0.7)", border: "1px solid rgba(245,158,11,0.1)" }}>
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                  <User className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-bold text-foreground">{selected.nome}</p>
                  <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                    {selected.telefone && <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{selected.telefone}</span>}
                    {selected.email && <span className="flex items-center gap-1"><Mail className="h-3 w-3" />{selected.email}</span>}
                  </div>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-2">
                <div className="rounded-lg p-2.5 text-center bg-secondary/20">
                  <p className="text-[10px] text-muted-foreground">Serviços</p>
                  <p className="text-sm font-bold text-foreground">{selectedLanc.length}</p>
                </div>
                <div className="rounded-lg p-2.5 text-center bg-secondary/20">
                  <p className="text-[10px] text-muted-foreground">Total Gasto</p>
                  <p className="text-sm font-bold text-emerald-500">{fmt(totalGasto)}</p>
                </div>
                <div className="rounded-lg p-2.5 text-center bg-secondary/20">
                  <p className="text-[10px] text-muted-foreground">Veículos</p>
                  <p className="text-sm font-bold text-foreground">{selectedVeiculos.length}</p>
                </div>
              </div>

              {/* Vehicles */}
              {selectedVeiculos.length > 0 && (
                <div className="space-y-1.5">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Veículos</p>
                  {selectedVeiculos.map(v => (
                    <div key={v.id} className="flex items-center gap-2 p-2 rounded-lg bg-secondary/15">
                      <Car className="h-3.5 w-3.5 text-blue-400" />
                      <span className="text-xs text-foreground">{v.marca} {v.modelo}</span>
                      {v.placa && <span className="text-[10px] text-muted-foreground bg-secondary/30 px-1.5 py-0.5 rounded">{v.placa}</span>}
                      {v.ano && <span className="text-[10px] text-muted-foreground">{v.ano}</span>}
                    </div>
                  ))}
                </div>
              )}

              {/* Recent services */}
              {selectedLanc.length > 0 && (
                <div className="space-y-1.5">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Últimos Serviços</p>
                  {selectedLanc.slice(0, 8).map(l => (
                    <div key={l.id} className="flex items-center justify-between p-2 rounded-lg bg-secondary/15">
                      <div className="flex items-center gap-2 min-w-0">
                        <FileText className="h-3 w-3 text-muted-foreground shrink-0" />
                        <span className="text-[11px] text-foreground truncate">{l.veiculo_desc || "Serviço"}</span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[10px] text-muted-foreground">{new Date(l.created_at).toLocaleDateString("pt-BR")}</span>
                        <span className="text-[11px] font-bold text-emerald-500">{fmt(Number(l.valor_bruto))}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </div>
      )}
    </motion.div>
  );
};

export default ClientesPage;
