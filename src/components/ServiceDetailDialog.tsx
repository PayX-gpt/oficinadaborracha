import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Pencil, Trash2, Mic, Save, Car, User, CreditCard, Clock, CalendarDays, FileText, AlertTriangle, Loader2, MicOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";

const fmt = (v: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

interface ServiceDetailDialogProps {
  lancamento: any;
  open: boolean;
  onClose: () => void;
  isAdmin: boolean;
}

const ServiceDetailDialog = ({ lancamento, open, onClose, isAdmin }: ServiceDetailDialogProps) => {
  const l = lancamento;
  const queryClient = useQueryClient();
  const [mode, setMode] = useState<"view" | "edit" | "audio">("view");
  const [editData, setEditData] = useState({
    cliente_nome: l?.cliente_nome || "",
    veiculo_desc: l?.veiculo_desc || "",
    placa: l?.placa || "",
    valor_bruto: l?.valor_bruto?.toString() || "0",
    desconto: l?.desconto?.toString() || "0",
    metodo_pagamento: l?.metodo_pagamento || "",
    observacoes: l?.observacoes || "",
  });
  const [correctionText, setCorrectionText] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Fetch items for this lancamento
  const { data: items = [] } = useQuery({
    queryKey: ["lanc-items", l?.id],
    queryFn: async () => {
      if (!l?.id) return [];
      const { data } = await supabase.from("lancamento_items").select("*").eq("lancamento_id", l.id).order("created_at");
      return data || [];
    },
    enabled: open && !!l?.id,
  });

  const updateMutation = useMutation({
    mutationFn: async (updates: any) => {
      const { error } = await supabase.from("lancamentos").update(updates).eq("id", l.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hist-lanc"] });
      toast.success("Serviço atualizado com sucesso");
      setMode("view");
    },
    onError: (e: any) => toast.error("Erro: " + e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      await supabase.from("lancamento_items").delete().eq("lancamento_id", l.id);
      const { error } = await supabase.from("lancamentos").delete().eq("id", l.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hist-lanc"] });
      toast.success("Serviço apagado");
      onClose();
    },
    onError: (e: any) => toast.error("Erro: " + e.message),
  });

  const correctionMutation = useMutation({
    mutationFn: async (text: string) => {
      const { data, error } = await supabase.functions.invoke("ai-chat", {
        body: {
          message: `Corrija o lançamento ID ${l.id} com base nesta instrução do usuário: "${text}". 
Dados atuais: cliente=${l.cliente_nome}, veículo=${l.veiculo_desc}, placa=${l.placa}, valor=${l.valor_bruto}, desconto=${l.desconto}, pagamento=${l.metodo_pagamento}, obs=${l.observacoes}.
Retorne SOMENTE um JSON com os campos que devem ser atualizados (cliente_nome, veiculo_desc, placa, valor_bruto, desconto, metodo_pagamento, observacoes). Sem explicações.`,
        },
      });
      if (error) throw error;

      let updates: any = {};
      try {
        const jsonMatch = (data?.response || "").match(/\{[\s\S]*\}/);
        if (jsonMatch) updates = JSON.parse(jsonMatch[0]);
      } catch {
        throw new Error("IA não conseguiu interpretar a correção");
      }

      if (Object.keys(updates).length === 0) throw new Error("Nenhuma correção identificada");

      const { error: updateError } = await supabase.from("lancamentos").update(updates).eq("id", l.id);
      if (updateError) throw updateError;

      return updates;
    },
    onSuccess: (updates) => {
      queryClient.invalidateQueries({ queryKey: ["hist-lanc"] });
      toast.success(`Corrigido: ${Object.keys(updates).join(", ")}`);
      setCorrectionText("");
      setMode("view");
    },
    onError: (e: any) => toast.error("Erro na correção: " + e.message),
  });

  const handleSaveEdit = () => {
    updateMutation.mutate({
      cliente_nome: editData.cliente_nome || null,
      veiculo_desc: editData.veiculo_desc || null,
      placa: editData.placa || null,
      valor_bruto: parseFloat(editData.valor_bruto) || 0,
      desconto: parseFloat(editData.desconto) || 0,
      metodo_pagamento: editData.metodo_pagamento || null,
      observacoes: editData.observacoes || null,
    });
  };

  const handleStartRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks: Blob[] = [];
      recorder.ondataavailable = (e) => chunks.push(e.data);
      recorder.onstop = async () => {
        stream.getTracks().forEach(t => t.stop());
        const blob = new Blob(chunks, { type: "audio/webm" });
        const reader = new FileReader();
        reader.onloadend = async () => {
          const base64 = (reader.result as string).split(",")[1];
          toast.info("Processando áudio...");
          try {
            const { data, error } = await supabase.functions.invoke("analyze-audio", {
              body: { audio: base64, context: `Correção do lançamento: ${l.cliente_nome}, ${l.veiculo_desc}` },
            });
            if (error) throw error;
            const transcription = data?.transcription || data?.text || "";
            if (transcription) {
              correctionMutation.mutate(transcription);
            } else {
              toast.error("Não foi possível transcrever o áudio");
            }
          } catch (err: any) {
            toast.error("Erro ao processar áudio: " + err.message);
          }
        };
        reader.readAsDataURL(blob);
      };
      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
    } catch {
      toast.error("Sem permissão para microfone");
    }
  };

  const handleStopRecording = () => {
    mediaRecorder?.stop();
    setIsRecording(false);
    setMediaRecorder(null);
  };

  if (!open || !l) return null;

  const margem = Number(l.valor_bruto) > 0 ? (Number(l.lucro) / Number(l.valor_bruto) * 100) : 0;
  const date = new Date(l.created_at);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
        onClick={onClose}
      >
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
        <motion.div
          initial={{ y: "100%", opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: "100%", opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl"
          style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--primary) / 0.15)" }}
        >
          {/* Header */}
          <div className="sticky top-0 z-10 flex items-center justify-between p-4 border-b border-border/20" style={{ background: "hsl(var(--card))" }}>
            <div>
              <h3 className="text-sm font-bold text-foreground">{l.cliente_nome || "Serviço"}</h3>
              <p className="text-[10px] text-muted-foreground">
                {date.toLocaleDateString("pt-BR", { weekday: "short", day: "2-digit", month: "short", year: "numeric" })} · {date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
              </p>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-secondary/50 transition-colors">
              <X className="h-4 w-4 text-muted-foreground" />
            </button>
          </div>

          {/* Mode tabs */}
          <div className="flex border-b border-border/20">
            {[
              { key: "view", label: "Detalhes", icon: FileText },
              { key: "edit", label: "Editar", icon: Pencil },
              { key: "audio", label: "Corrigir", icon: Mic },
            ].map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setMode(key as any)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-[11px] font-medium transition-colors ${mode === key ? "text-primary border-b-2 border-primary" : "text-muted-foreground"}`}
              >
                <Icon className="h-3.5 w-3.5" />
                {label}
              </button>
            ))}
          </div>

          <div className="p-4 space-y-4">
            {/* VIEW MODE */}
            {mode === "view" && (
              <>
                {/* Main info cards */}
                <div className="grid grid-cols-2 gap-2">
                  <InfoCard icon={User} label="Cliente" value={l.cliente_nome || "—"} />
                  <InfoCard icon={Car} label="Veículo" value={l.veiculo_desc || "—"} />
                  <InfoCard icon={Car} label="Placa" value={l.placa || "—"} />
                  <InfoCard icon={CreditCard} label="Pagamento" value={l.metodo_pagamento || "—"} />
                  <InfoCard icon={Clock} label="Tempo" value={l.tempo_servico_minutos ? `${l.tempo_servico_minutos} min` : "—"} />
                  <InfoCard icon={CalendarDays} label="Data" value={date.toLocaleDateString("pt-BR")} />
                </div>

                {/* Financial */}
                <div className="rounded-xl p-3 space-y-2" style={{ background: "hsl(var(--secondary) / 0.3)" }}>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Financeiro</p>
                  <div className="space-y-1 text-[11px]">
                    <Row label="Valor Bruto" value={fmt(Number(l.valor_bruto))} color="text-emerald-500" bold />
                    <Row label="Custo Total" value={`-${fmt(Number(l.custo_total))}`} color="text-red-400" />
                    <Row label="Desconto" value={`-${fmt(Number(l.desconto))}`} color="text-red-400" />
                    <Row label="Taxa Máquina" value={`-${fmt(Number(l.taxa_valor))}`} color="text-red-400" />
                    <div className="border-t border-border/20 my-1" />
                    <Row label="Valor Líquido" value={fmt(Number(l.valor_liquido))} color="text-foreground" bold />
                    <Row label="Lucro" value={fmt(Number(l.lucro))} color={Number(l.lucro) >= 0 ? "text-emerald-500" : "text-red-500"} bold />
                    <Row label="Margem" value={`${margem.toFixed(1)}%`} color={margem > 50 ? "text-emerald-400" : margem > 20 ? "text-primary" : "text-red-400"} />
                    {l.ganho_por_hora != null && <Row label="Ganho/hora" value={fmt(Number(l.ganho_por_hora))} color="text-primary" />}
                  </div>
                </div>

                {/* Items */}
                {items.length > 0 && (
                  <div className="rounded-xl p-3 space-y-2" style={{ background: "hsl(var(--secondary) / 0.3)" }}>
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Itens do Serviço ({items.length})</p>
                    <div className="space-y-1.5">
                      {items.map((item: any) => (
                        <div key={item.id} className="flex items-center justify-between text-[11px]">
                          <div className="flex-1">
                            <span className="text-foreground">{item.descricao}</span>
                            <span className="text-[9px] text-muted-foreground ml-1">({item.tipo})</span>
                          </div>
                          <span className="text-emerald-500 font-medium tabular-nums">{fmt(Number(item.valor_cobrado))}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Observations */}
                {l.observacoes && (
                  <div className="rounded-xl p-3" style={{ background: "hsl(var(--secondary) / 0.3)" }}>
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium mb-1">Observações</p>
                    <p className="text-[11px] text-foreground">{l.observacoes}</p>
                  </div>
                )}

                {/* Photo */}
                {l.foto_url && (
                  <img src={l.foto_url} alt="Foto do serviço" className="rounded-xl w-full max-h-48 object-cover" />
                )}

                {/* Delete */}
                {isAdmin && (
                  <div className="pt-2">
                    {!confirmDelete ? (
                      <Button variant="outline" size="sm" onClick={() => setConfirmDelete(true)}
                        className="w-full text-xs gap-1.5 border-destructive/20 text-destructive hover:bg-destructive/10">
                        <Trash2 className="h-3.5 w-3.5" /> Apagar Serviço
                      </Button>
                    ) : (
                      <div className="space-y-2">
                        <p className="text-[11px] text-destructive flex items-center gap-1"><AlertTriangle className="h-3.5 w-3.5" /> Tem certeza? Esta ação não pode ser desfeita.</p>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" onClick={() => setConfirmDelete(false)} className="flex-1 text-xs">Cancelar</Button>
                          <Button variant="destructive" size="sm" onClick={() => deleteMutation.mutate()}
                            disabled={deleteMutation.isPending} className="flex-1 text-xs gap-1">
                            {deleteMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
                            Confirmar
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}

            {/* EDIT MODE */}
            {mode === "edit" && (
              <div className="space-y-3">
                <Field label="Cliente" value={editData.cliente_nome} onChange={v => setEditData(p => ({ ...p, cliente_nome: v }))} />
                <Field label="Veículo" value={editData.veiculo_desc} onChange={v => setEditData(p => ({ ...p, veiculo_desc: v }))} />
                <Field label="Placa" value={editData.placa} onChange={v => setEditData(p => ({ ...p, placa: v }))} />
                <div className="grid grid-cols-2 gap-2">
                  <Field label="Valor Bruto (R$)" value={editData.valor_bruto} onChange={v => setEditData(p => ({ ...p, valor_bruto: v }))} type="number" />
                  <Field label="Desconto (R$)" value={editData.desconto} onChange={v => setEditData(p => ({ ...p, desconto: v }))} type="number" />
                </div>
                <Field label="Pagamento" value={editData.metodo_pagamento} onChange={v => setEditData(p => ({ ...p, metodo_pagamento: v }))} />
                <div>
                  <label className="text-[10px] text-muted-foreground font-medium mb-1 block">Observações</label>
                  <Textarea value={editData.observacoes} onChange={e => setEditData(p => ({ ...p, observacoes: e.target.value }))}
                    className="bg-secondary/30 border-border/30 text-xs min-h-[60px]" />
                </div>
                <Button onClick={handleSaveEdit} disabled={updateMutation.isPending}
                  className="w-full text-xs gap-1.5">
                  {updateMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                  Salvar Alterações
                </Button>
              </div>
            )}

            {/* AUDIO/TEXT CORRECTION MODE */}
            {mode === "audio" && (
              <div className="space-y-4">
                <div className="rounded-xl p-3 text-center" style={{ background: "hsl(var(--secondary) / 0.3)" }}>
                  <p className="text-xs text-foreground font-medium mb-1">Correção Inteligente</p>
                  <p className="text-[10px] text-muted-foreground">Diga ou escreva o que precisa corrigir. A IA entende e atualiza automaticamente.</p>
                </div>

                {/* Text correction */}
                <div>
                  <label className="text-[10px] text-muted-foreground font-medium mb-1 block">Descreva a correção</label>
                  <Textarea
                    value={correctionText}
                    onChange={e => setCorrectionText(e.target.value)}
                    placeholder='Ex: "O cliente é João, não José" ou "O valor correto é 350 reais"'
                    className="bg-secondary/30 border-border/30 text-xs min-h-[80px]"
                  />
                  <Button onClick={() => correctionMutation.mutate(correctionText)}
                    disabled={!correctionText.trim() || correctionMutation.isPending}
                    className="w-full mt-2 text-xs gap-1.5">
                    {correctionMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Pencil className="h-3.5 w-3.5" />}
                    Corrigir via Texto
                  </Button>
                </div>

                <div className="flex items-center gap-2">
                  <div className="h-px flex-1 bg-border/20" />
                  <span className="text-[10px] text-muted-foreground">ou</span>
                  <div className="h-px flex-1 bg-border/20" />
                </div>

                {/* Audio correction */}
                <div className="text-center">
                  <button
                    onClick={isRecording ? handleStopRecording : handleStartRecording}
                    className={`inline-flex items-center justify-center h-16 w-16 rounded-full transition-all ${isRecording ? "bg-destructive text-destructive-foreground animate-pulse" : "bg-primary/15 text-primary hover:bg-primary/25"}`}
                  >
                    {isRecording ? <MicOff className="h-7 w-7" /> : <Mic className="h-7 w-7" />}
                  </button>
                  <p className="text-[10px] text-muted-foreground mt-2">
                    {isRecording ? "Gravando... Toque para parar" : "Toque para gravar a correção por voz"}
                  </p>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

const InfoCard = ({ icon: Icon, label, value }: { icon: any; label: string; value: string }) => (
  <div className="rounded-lg p-2.5" style={{ background: "hsl(var(--secondary) / 0.3)" }}>
    <div className="flex items-center gap-1.5 mb-0.5">
      <Icon className="h-3 w-3 text-muted-foreground" />
      <span className="text-[9px] text-muted-foreground uppercase tracking-wider">{label}</span>
    </div>
    <p className="text-xs text-foreground font-medium truncate">{value}</p>
  </div>
);

const Row = ({ label, value, color, bold }: { label: string; value: string; color: string; bold?: boolean }) => (
  <div className="flex justify-between">
    <span className="text-muted-foreground">{label}</span>
    <span className={`tabular-nums ${color} ${bold ? "font-bold" : ""}`}>{value}</span>
  </div>
);

const Field = ({ label, value, onChange, type = "text" }: { label: string; value: string; onChange: (v: string) => void; type?: string }) => (
  <div>
    <label className="text-[10px] text-muted-foreground font-medium mb-1 block">{label}</label>
    <Input value={value} onChange={e => onChange(e.target.value)} type={type}
      className="bg-secondary/30 border-border/30 text-xs h-8" />
  </div>
);

export default ServiceDetailDialog;
