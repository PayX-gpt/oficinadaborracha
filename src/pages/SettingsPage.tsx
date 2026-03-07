import { useState } from "react";
import { motion } from "framer-motion";
import { Building2, Users, Percent, LogOut, Loader2, Plus, Trash2, Save, UserCheck, Briefcase, Calendar, DollarSign, Edit2, Check, X } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

const fmt = (v: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

const SectionCard = ({ icon: Icon, title, children, defaultOpen = false, badge }: { icon: any; title: string; children: React.ReactNode; defaultOpen?: boolean; badge?: string }) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-xl border transition-all" style={{ background: "rgba(14,20,35,0.7)", backdropFilter: "blur(12px)", borderColor: "rgba(245,158,11,0.08)" }}>
      <button onClick={() => setOpen(!open)} className="w-full flex items-center gap-3 p-4 text-left">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-secondary/50"><Icon className="h-5 w-5 text-muted-foreground" /></div>
        <p className="text-sm font-medium text-foreground flex-1">{title}</p>
        {badge && <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/15 text-primary font-medium">{badge}</span>}
        <span className="text-xs text-muted-foreground">{open ? "▲" : "▼"}</span>
      </button>
      {open && <div className="px-4 pb-4 space-y-3">{children}</div>}
    </div>
  );
};

const SettingsPage = () => {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [loggingOut, setLoggingOut] = useState(false);
  const [newFilial, setNewFilial] = useState("");
  const [newSocioNome, setNewSocioNome] = useState("");
  const [newSocioPercent, setNewSocioPercent] = useState("");
  // Funcionarios
  const [newFuncNome, setNewFuncNome] = useState("");
  const [newFuncCargo, setNewFuncCargo] = useState("");
  const [newFuncSalario, setNewFuncSalario] = useState("");
  const [newFuncFilial, setNewFuncFilial] = useState("");
  // Custos Fixos
  const [newCFDesc, setNewCFDesc] = useState("");
  const [newCFValor, setNewCFValor] = useState("");
  const [newCFCategoria, setNewCFCategoria] = useState("Aluguel");
  const [newCFFilial, setNewCFFilial] = useState("");
  const [newCFDia, setNewCFDia] = useState("5");
  const [editingCF, setEditingCF] = useState<string | null>(null);
  const [editCFValor, setEditCFValor] = useState("");

  const isAdmin = profile?.role === "admin";

  const { data: filiais = [] } = useQuery({
    queryKey: ["filiais"],
    queryFn: async () => { const { data } = await supabase.from("filiais").select("*").order("nome"); return data || []; },
  });

  const { data: socios = [] } = useQuery({
    queryKey: ["socios"],
    queryFn: async () => { const { data } = await supabase.from("socios").select("*").order("nome"); return data || []; },
  });

  const { data: taxas = [] } = useQuery({
    queryKey: ["taxas-maquina-settings"],
    queryFn: async () => { const { data } = await supabase.from("taxas_maquina").select("*").order("metodo"); return data || []; },
  });

  const { data: funcionarios = [] } = useQuery({
    queryKey: ["funcionarios"],
    queryFn: async () => { const { data } = await supabase.from("funcionarios").select("*").order("nome"); return data || []; },
  });

  const { data: custosFixos = [] } = useQuery({
    queryKey: ["custos-fixos"],
    queryFn: async () => { const { data } = await supabase.from("custos_fixos").select("*").order("categoria").order("descricao"); return data || []; },
  });

  const { data: pagamentos = [] } = useQuery({
    queryKey: ["pagamentos-func"],
    queryFn: async () => {
      const { data } = await supabase.from("pagamentos_funcionarios").select("*, funcionarios(nome)").order("created_at", { ascending: false }).limit(50);
      return (data || []) as any[];
    },
  });

  const [editingTaxas, setEditingTaxas] = useState<Record<string, string>>({});
  const [payingFuncs, setPayingFuncs] = useState<Set<string>>(new Set());
  const [paymentMethods, setPaymentMethods] = useState<Record<string, string>>({});

  // Filiais CRUD
  const addFilial = useMutation({
    mutationFn: async () => {
      if (!newFilial.trim()) return;
      const { error } = await supabase.from("filiais").insert({ nome: newFilial.trim() });
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["filiais"] }); setNewFilial(""); toast.success("Filial adicionada!"); },
    onError: (e: any) => toast.error(e.message),
  });

  const deleteFilial = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("filiais").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["filiais"] }); toast.success("Filial removida!"); },
    onError: (e: any) => toast.error(e.message),
  });

  // Sócios CRUD
  const addSocio = useMutation({
    mutationFn: async () => {
      if (!newSocioNome.trim() || !newSocioPercent) return;
      const { error } = await supabase.from("socios").insert({ nome: newSocioNome.trim(), percentual_lucro: parseFloat(newSocioPercent) });
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["socios"] }); setNewSocioNome(""); setNewSocioPercent(""); toast.success("Sócio adicionado!"); },
    onError: (e: any) => toast.error(e.message),
  });

  const deleteSocio = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("socios").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["socios"] }); toast.success("Sócio removido!"); },
    onError: (e: any) => toast.error(e.message),
  });

  // Taxas
  const saveTaxas = async () => {
    try {
      for (const [id, val] of Object.entries(editingTaxas)) {
        const { error } = await supabase.from("taxas_maquina").update({ taxa_percentual: parseFloat(val) }).eq("id", id);
        if (error) throw error;
      }
      setEditingTaxas({});
      queryClient.invalidateQueries({ queryKey: ["taxas-maquina"] });
      queryClient.invalidateQueries({ queryKey: ["taxas-maquina-settings"] });
      toast.success("Taxas atualizadas!");
    } catch (err: any) { toast.error("Erro: " + err.message); }
  };

  // Funcionarios CRUD
  const addFunc = useMutation({
    mutationFn: async () => {
      if (!newFuncNome.trim()) return;
      const { error } = await supabase.from("funcionarios").insert({
        nome: newFuncNome.trim(),
        cargo: newFuncCargo.trim() || null,
        salario_semanal: newFuncSalario ? parseFloat(newFuncSalario) : null,
        filial_id: newFuncFilial || null,
      } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["funcionarios"] });
      setNewFuncNome(""); setNewFuncCargo(""); setNewFuncSalario(""); setNewFuncFilial("");
      toast.success("Funcionário adicionado!");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const deleteFunc = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("funcionarios").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["funcionarios"] }); toast.success("Funcionário removido!"); },
    onError: (e: any) => toast.error(e.message),
  });

  // Pay selected employees
  const pagarFuncionarios = async () => {
    if (payingFuncs.size === 0) { toast.error("Selecione pelo menos um funcionário"); return; }
    const saturday = getNextSaturday();
    try {
      for (const fId of payingFuncs) {
        const func = funcionarios.find((f: any) => f.id === fId) as any;
        if (!func) continue;
        const metodo = paymentMethods[fId] || "PIX";
        // Insert payment
        await supabase.from("pagamentos_funcionarios").insert({
          funcionario_id: fId,
          filial_id: func.filial_id,
          valor: Number(func.salario_semanal || 0),
          metodo_pagamento: metodo,
          semana_referencia: saturday,
          status: "pago",
          pago_por: user?.id,
        } as any);
        // Also create expense
        await supabase.from("despesas").insert({
          user_id: user?.id!,
          categoria: "Salários",
          subcategoria: func.nome,
          valor: Number(func.salario_semanal || 0),
          filial_id: func.filial_id,
          metodo_pagamento: metodo,
          observacoes: `Pagamento semanal - ${func.nome}`,
        });
      }
      queryClient.invalidateQueries({ queryKey: ["pagamentos-func"] });
      queryClient.invalidateQueries({ queryKey: ["funcionarios"] });
      setPayingFuncs(new Set());
      toast.success(`${payingFuncs.size} funcionário(s) pago(s)!`);
    } catch (err: any) { toast.error("Erro: " + err.message); }
  };

  const getNextSaturday = () => {
    const d = new Date();
    const day = d.getDay();
    const diff = day <= 6 ? 6 - day : 0;
    d.setDate(d.getDate() + diff);
    return d.toISOString().split("T")[0];
  };

  const handleLogout = async () => { setLoggingOut(true); await signOut(); navigate("/login"); };
  const totalPercent = socios.reduce((s, so) => s + Number(so.percentual_lucro), 0);
  const isSaturday = new Date().getDay() === 6;
  const totalFolha = (funcionarios as any[]).filter((f: any) => f.ativo !== false).reduce((s: number, f: any) => s + Number(f.salario_semanal || 0), 0);

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-4 pb-24">
      <div>
        <h2 className="text-lg font-bold text-foreground">Configurações</h2>
        <p className="text-xs text-muted-foreground">{user?.email}</p>
      </div>

      {isAdmin && (
        <SectionCard icon={Building2} title="Filiais" defaultOpen>
          <div className="space-y-2">
            {filiais.map(f => (
              <div key={f.id} className="flex items-center justify-between py-2 px-3 rounded-lg bg-secondary/20">
                <span className="text-sm text-foreground">{f.nome}</span>
                <button onClick={() => deleteFilial.mutate(f.id)} className="text-red-400 hover:text-red-300"><Trash2 className="h-3.5 w-3.5" /></button>
              </div>
            ))}
            <div className="flex gap-2">
              <Input placeholder="Nome da filial" value={newFilial} onChange={e => setNewFilial(e.target.value)} className="bg-background/30 border-border/50 h-9 text-sm flex-1" />
              <Button onClick={() => addFilial.mutate()} disabled={addFilial.isPending} size="sm" className="h-9 bg-primary text-primary-foreground gap-1">
                <Plus className="h-3.5 w-3.5" /> Add
              </Button>
            </div>
          </div>
        </SectionCard>
      )}

      {isAdmin && (
        <SectionCard icon={Users} title={`Sócios (${totalPercent.toFixed(0)}%)`}>
          <div className="space-y-2">
            {socios.map(s => (
              <div key={s.id} className="flex items-center justify-between py-2 px-3 rounded-lg bg-secondary/20">
                <div>
                  <span className="text-sm text-foreground">{s.nome}</span>
                  <span className="text-xs text-primary ml-2">{Number(s.percentual_lucro)}%</span>
                </div>
                <button onClick={() => deleteSocio.mutate(s.id)} className="text-red-400 hover:text-red-300"><Trash2 className="h-3.5 w-3.5" /></button>
              </div>
            ))}
            <div className="flex gap-2">
              <Input placeholder="Nome" value={newSocioNome} onChange={e => setNewSocioNome(e.target.value)} className="bg-background/30 border-border/50 h-9 text-sm flex-1" />
              <Input type="number" placeholder="%" value={newSocioPercent} onChange={e => setNewSocioPercent(e.target.value)} className="bg-background/30 border-border/50 h-9 text-sm w-20" />
              <Button onClick={() => addSocio.mutate()} disabled={addSocio.isPending} size="sm" className="h-9 bg-primary text-primary-foreground"><Plus className="h-3.5 w-3.5" /></Button>
            </div>
            {totalPercent > 100 && <p className="text-xs text-red-400">Total excede 100%!</p>}
          </div>
        </SectionCard>
      )}

      <SectionCard icon={Percent} title="Taxas de Máquina">
        <div className="space-y-2">
          {taxas.map((t: any) => (
            <div key={t.id} className="flex items-center justify-between py-2 px-3 rounded-lg bg-secondary/20 gap-3">
              <span className="text-sm text-foreground flex-1">{t.metodo}</span>
              <div className="flex items-center gap-1">
                <Input type="number" step="0.1"
                  value={editingTaxas[t.id] ?? String(Number(t.taxa_percentual))}
                  onChange={e => setEditingTaxas({ ...editingTaxas, [t.id]: e.target.value })}
                  className="bg-background/20 border-border/40 h-7 text-xs w-20 text-right" />
                <span className="text-xs text-muted-foreground">%</span>
              </div>
            </div>
          ))}
          {Object.keys(editingTaxas).length > 0 && (
            <Button onClick={saveTaxas} size="sm" className="w-full h-8 bg-primary text-primary-foreground gap-1 text-xs">
              <Save className="h-3 w-3" /> Salvar Taxas
            </Button>
          )}
        </div>
      </SectionCard>

      {/* Funcionários & Folha Semanal */}
      <SectionCard icon={Briefcase} title="Funcionários" badge={`Folha: ${fmt(totalFolha)}/sem`}>
        <div className="space-y-3">
          {(funcionarios as any[]).map((f: any) => {
            const isSelected = payingFuncs.has(f.id);
            return (
              <div key={f.id} className={`flex items-center gap-3 py-2 px-3 rounded-lg transition-colors ${isSelected ? "bg-primary/10 border border-primary/20" : "bg-secondary/20"}`}>
                <input type="checkbox" checked={isSelected}
                  onChange={() => {
                    const next = new Set(payingFuncs);
                    isSelected ? next.delete(f.id) : next.add(f.id);
                    setPayingFuncs(next);
                  }}
                  className="rounded border-border accent-amber-500" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground truncate">{f.nome}</p>
                  <p className="text-[10px] text-muted-foreground">{f.cargo || "—"} · {filiais.find(fl => fl.id === f.filial_id)?.nome || "—"}</p>
                </div>
                <span className="text-xs font-bold text-primary shrink-0">{fmt(Number(f.salario_semanal || 0))}</span>
                {isSelected && (
                  <div className="flex gap-1">
                    {["PIX", "Din", "Transf"].map(m => (
                      <button key={m} onClick={() => setPaymentMethods({ ...paymentMethods, [f.id]: m })}
                        className={`px-1.5 py-0.5 rounded text-[9px] border transition-colors ${(paymentMethods[f.id] || "PIX") === m ? "bg-primary/15 text-primary border-primary/25" : "bg-secondary/30 text-muted-foreground border-border/20"}`}>
                        {m}
                      </button>
                    ))}
                  </div>
                )}
                <button onClick={() => deleteFunc.mutate(f.id)} className="text-red-400 hover:text-red-300 shrink-0"><Trash2 className="h-3 w-3" /></button>
              </div>
            );
          })}

          {payingFuncs.size > 0 && (
            <Button onClick={pagarFuncionarios} className="w-full h-10 bg-emerald-600 hover:bg-emerald-700 text-white gap-2 text-xs font-bold">
              <UserCheck className="h-4 w-4" /> Pagar {payingFuncs.size} Funcionário(s)
            </Button>
          )}

          {isSaturday && (funcionarios as any[]).length > 0 && payingFuncs.size === 0 && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary/10 border border-primary/20">
              <Calendar className="h-4 w-4 text-primary" />
              <span className="text-xs text-primary font-medium">Sábado — Dia de pagamento!</span>
            </div>
          )}

          <div className="border-t border-border/20 pt-3 space-y-2">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Adicionar Funcionário</p>
            <div className="grid grid-cols-2 gap-2">
              <Input placeholder="Nome" value={newFuncNome} onChange={e => setNewFuncNome(e.target.value)} className="bg-background/30 border-border/50 h-8 text-xs" />
              <Input placeholder="Cargo" value={newFuncCargo} onChange={e => setNewFuncCargo(e.target.value)} className="bg-background/30 border-border/50 h-8 text-xs" />
              <Input type="number" placeholder="Salário semanal" value={newFuncSalario} onChange={e => setNewFuncSalario(e.target.value)} className="bg-background/30 border-border/50 h-8 text-xs" />
              <select value={newFuncFilial} onChange={e => setNewFuncFilial(e.target.value)}
                className="bg-background/30 border border-border/50 rounded-md h-8 text-xs text-foreground px-2">
                <option value="">Filial...</option>
                {filiais.map(f => <option key={f.id} value={f.id}>{f.nome}</option>)}
              </select>
            </div>
            <Button onClick={() => addFunc.mutate()} disabled={addFunc.isPending} size="sm" className="w-full h-8 bg-primary text-primary-foreground gap-1 text-xs">
              <Plus className="h-3 w-3" /> Adicionar Funcionário
            </Button>
          </div>

          {/* Recent payments */}
          {pagamentos.length > 0 && (
            <div className="border-t border-border/20 pt-3 space-y-1.5">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Pagamentos Recentes</p>
              {pagamentos.slice(0, 5).map((p: any) => (
                <div key={p.id} className="flex items-center justify-between py-1.5 px-2 rounded bg-secondary/15 text-[11px]">
                  <span className="text-foreground">{p.funcionarios?.nome || "—"}</span>
                  <span className="text-muted-foreground">{new Date(p.created_at).toLocaleDateString("pt-BR")}</span>
                  <span className="text-emerald-500 font-medium">{fmt(Number(p.valor))}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </SectionCard>

      <Button onClick={handleLogout} disabled={loggingOut} variant="outline" className="w-full h-11 border-red-500/30 text-red-400 hover:bg-red-500/10 gap-2">
        {loggingOut ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogOut className="h-4 w-4" />}
        Sair da Conta
      </Button>
    </motion.div>
  );
};

export default SettingsPage;
