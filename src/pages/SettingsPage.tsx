import { useState } from "react";
import { motion } from "framer-motion";
import { Building2, Users, Percent, LogOut, Loader2, Plus, Trash2, Save, Edit2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

const SectionCard = ({ icon: Icon, title, children, defaultOpen = false }: { icon: any; title: string; children: React.ReactNode; defaultOpen?: boolean }) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-xl border transition-all" style={{ background: "rgba(14,20,35,0.7)", backdropFilter: "blur(12px)", borderColor: "rgba(245,158,11,0.08)" }}>
      <button onClick={() => setOpen(!open)} className="w-full flex items-center gap-3 p-4 text-left">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-secondary/50"><Icon className="h-5 w-5 text-muted-foreground" /></div>
        <p className="text-sm font-medium text-foreground flex-1">{title}</p>
        <span className="text-xs text-muted-foreground">{open ? "▲" : "▼"}</span>
      </button>
      {open && <div className="px-4 pb-4 space-y-3">{children}</div>}
    </div>
  );
};

const SettingsPage = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [loggingOut, setLoggingOut] = useState(false);
  const [newFilial, setNewFilial] = useState("");
  const [newSocioNome, setNewSocioNome] = useState("");
  const [newSocioPercent, setNewSocioPercent] = useState("");

  const { data: filiais = [] } = useQuery({
    queryKey: ["filiais"],
    queryFn: async () => { const { data } = await supabase.from("filiais").select("*").order("nome"); return data || []; },
  });

  const { data: socios = [] } = useQuery({
    queryKey: ["socios"],
    queryFn: async () => { const { data } = await supabase.from("socios").select("*").order("nome"); return data || []; },
  });

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
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("filiais").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["filiais"] }); toast.success("Filial removida!"); },
    onError: (e: any) => toast.error(e.message),
  });

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
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("socios").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["socios"] }); toast.success("Sócio removido!"); },
    onError: (e: any) => toast.error(e.message),
  });

  const handleLogout = async () => { setLoggingOut(true); await signOut(); navigate("/login"); };

  const totalPercent = socios.reduce((s, so) => s + Number(so.percentual_lucro), 0);

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-4 pb-24">
      <div>
        <h2 className="text-lg font-bold text-foreground">Configurações</h2>
        <p className="text-xs text-muted-foreground">{user?.email}</p>
      </div>

      <SectionCard icon={Building2} title="Filiais" defaultOpen>
        <div className="space-y-2">
          {filiais.map((f) => (
            <div key={f.id} className="flex items-center justify-between py-2 px-3 rounded-lg bg-secondary/20">
              <span className="text-sm text-foreground">{f.nome}</span>
              <button onClick={() => deleteFilial.mutate(f.id)} className="text-red-400 hover:text-red-300"><Trash2 className="h-3.5 w-3.5" /></button>
            </div>
          ))}
          <div className="flex gap-2">
            <Input placeholder="Nome da filial" value={newFilial} onChange={(e) => setNewFilial(e.target.value)} className="bg-background/30 border-border/50 h-9 text-sm flex-1" />
            <Button onClick={() => addFilial.mutate()} disabled={addFilial.isPending} size="sm" className="h-9 bg-primary text-primary-foreground gap-1">
              <Plus className="h-3.5 w-3.5" /> Adicionar
            </Button>
          </div>
        </div>
      </SectionCard>

      <SectionCard icon={Users} title={`Sócios (${totalPercent.toFixed(0)}% alocado)`}>
        <div className="space-y-2">
          {socios.map((s) => (
            <div key={s.id} className="flex items-center justify-between py-2 px-3 rounded-lg bg-secondary/20">
              <div>
                <span className="text-sm text-foreground">{s.nome}</span>
                <span className="text-xs text-primary ml-2">{Number(s.percentual_lucro)}%</span>
              </div>
              <button onClick={() => deleteSocio.mutate(s.id)} className="text-red-400 hover:text-red-300"><Trash2 className="h-3.5 w-3.5" /></button>
            </div>
          ))}
          <div className="flex gap-2">
            <Input placeholder="Nome" value={newSocioNome} onChange={(e) => setNewSocioNome(e.target.value)} className="bg-background/30 border-border/50 h-9 text-sm flex-1" />
            <Input type="number" placeholder="%" value={newSocioPercent} onChange={(e) => setNewSocioPercent(e.target.value)} className="bg-background/30 border-border/50 h-9 text-sm w-20" />
            <Button onClick={() => addSocio.mutate()} disabled={addSocio.isPending} size="sm" className="h-9 bg-primary text-primary-foreground gap-1">
              <Plus className="h-3.5 w-3.5" />
            </Button>
          </div>
          {totalPercent > 100 && <p className="text-xs text-red-400">Total excede 100%!</p>}
        </div>
      </SectionCard>

      <SectionCard icon={Percent} title="Taxas de Máquina">
        <div className="space-y-2 text-xs">
          {[
            { label: "PIX", taxa: "0%" },
            { label: "Dinheiro", taxa: "0%" },
            { label: "Débito", taxa: "1.5%" },
            { label: "Crédito 1x", taxa: "2.5%" },
            { label: "Crédito 2x", taxa: "3.5%" },
            { label: "Crédito 3x", taxa: "4.5%" },
          ].map((t) => (
            <div key={t.label} className="flex items-center justify-between py-2 px-3 rounded-lg bg-secondary/20">
              <span className="text-foreground">{t.label}</span>
              <span className="text-muted-foreground">{t.taxa}</span>
            </div>
          ))}
          <p className="text-[11px] text-muted-foreground">Taxas configuráveis em versão futura</p>
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
