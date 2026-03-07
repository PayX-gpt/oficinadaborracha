import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Camera, ChevronLeft, ImageIcon, Loader2, CheckCircle, Save } from "lucide-react";
import odbLogo from "@/assets/odb-logo.png";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { motion } from "framer-motion";
import { toast } from "sonner";

const paymentMethods = ["PIX", "Dinheiro", "Débito", "Crédito 1x", "Crédito 2x", "Crédito 3x"];

const LaunchPhoto = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [fileBase64, setFileBase64] = useState<string | null>(null);
  const [fileMime, setFileMime] = useState<string>("image/jpeg");
  const [analyzing, setAnalyzing] = useState(false);
  const [aiResult, setAiResult] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [metodo, setMetodo] = useState("");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFileMime(file.type);
      const reader = new FileReader();
      reader.onload = (ev) => {
        const dataUrl = ev.target?.result as string;
        setPreview(dataUrl);
        setFileBase64(dataUrl.split(",")[1]);
      };
      reader.readAsDataURL(file);
      setAiResult(null);
    }
  };

  const handleAnalyze = async () => {
    if (!fileBase64) return;
    setAnalyzing(true);
    try {
      const { data, error } = await supabase.functions.invoke("analyze-photo", {
        body: { imageBase64: fileBase64, mimeType: fileMime },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setAiResult(data.result);
      toast.success("Análise concluída pela IA!");
    } catch (err: any) {
      toast.error("Erro na análise: " + err.message);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleSave = async () => {
    if (!user || !aiResult) return;
    setSaving(true);
    try {
      const items = aiResult.itens || [];
      const valorBruto = items.reduce((s: number, i: any) => s + (Number(i.valor_cobrado) || 0), 0);
      const custoTotal = items.reduce((s: number, i: any) => s + (Number(i.custo) || 0), 0);
      const desc = Number(aiResult.desconto) || 0;

      const { data: lancamento, error } = await supabase.from("lancamentos").insert({
        user_id: user.id,
        cliente_nome: aiResult.cliente || null,
        veiculo_desc: [aiResult.veiculo?.marca, aiResult.veiculo?.modelo, aiResult.veiculo?.ano].filter(Boolean).join(" ") || null,
        placa: aiResult.veiculo?.placa || null,
        fonte: "foto",
        metodo_pagamento: metodo || aiResult.metodo_pagamento || null,
        valor_bruto: valorBruto,
        custo_total: custoTotal,
        desconto: desc,
        taxa_percentual: 0,
        taxa_valor: 0,
        valor_liquido: valorBruto - desc,
        lucro: valorBruto - desc - custoTotal,
        observacoes: aiResult.observacoes || null,
        ai_data: aiResult,
      }).select("id").single();

      if (error) throw error;

      if (items.length > 0) {
        await supabase.from("lancamento_items").insert(
          items.map((i: any) => ({
            lancamento_id: lancamento.id,
            descricao: i.descricao || "",
            tipo: i.tipo || "mao_de_obra",
            valor_cobrado: Number(i.valor_cobrado) || 0,
            custo: Number(i.custo) || 0,
          }))
        );
      }

      toast.success("Lançamento salvo!");
      navigate("/dashboard");
    } catch (err: any) {
      toast.error("Erro ao salvar: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5 pb-24">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate("/launch")} className="flex items-center justify-center h-8 w-8 rounded-lg bg-secondary/50 text-muted-foreground hover:text-foreground transition-colors">
          <ChevronLeft className="h-4 w-4" />
        </button>
        <div>
          <h2 className="text-lg font-bold text-foreground">Lançar por Foto</h2>
          <p className="text-[11px] text-muted-foreground">IA analisa o orçamento automaticamente</p>
        </div>
      </div>

      <input ref={fileInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFileChange} />

      {!preview ? (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center gap-5 p-8 rounded-xl border"
          style={{ background: "rgba(14,20,35,0.7)", backdropFilter: "blur(12px)", borderColor: "rgba(245,158,11,0.08)" }}>
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-500/10 border border-blue-500/20">
            <Camera className="h-8 w-8 text-blue-400" />
          </div>
          <div className="text-center space-y-1">
            <p className="text-sm font-medium text-foreground">Fotografe o orçamento</p>
            <p className="text-xs text-muted-foreground">Anotação, recibo ou nota de serviço</p>
          </div>
          <div className="flex gap-2 w-full">
            <Button onClick={() => fileInputRef.current?.click()} className="flex-1 h-10 bg-primary text-primary-foreground hover:bg-primary/90 gap-2 text-sm" style={{ boxShadow: "0 0 16px rgba(245,158,11,0.2)" }}>
              <Camera className="h-4 w-4" /> Câmera
            </Button>
            <Button onClick={() => { if (fileInputRef.current) { fileInputRef.current.removeAttribute("capture"); fileInputRef.current.click(); } }} variant="outline" className="flex-1 h-10 gap-2 text-sm border-border/50 text-foreground hover:bg-secondary/50">
              <ImageIcon className="h-4 w-4" /> Galeria
            </Button>
          </div>
        </motion.div>
      ) : (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
          <div className="rounded-xl overflow-hidden border" style={{ borderColor: "rgba(245,158,11,0.08)" }}>
            <img src={preview} alt="Preview" className="w-full max-h-[250px] object-contain bg-black/20" />
          </div>

          {!aiResult ? (
            <div className="flex gap-2">
              <Button onClick={() => { setPreview(null); setFileBase64(null); }} variant="outline" className="flex-1 h-10 border-border/50 text-foreground hover:bg-secondary/50 text-sm">Nova Foto</Button>
              <Button onClick={handleAnalyze} disabled={analyzing} className="flex-1 h-10 bg-primary text-primary-foreground hover:bg-primary/90 gap-2 text-sm" style={{ boxShadow: "0 0 16px rgba(245,158,11,0.2)" }}>
                {analyzing ? <><Loader2 className="h-4 w-4 animate-spin" /> Analisando...</> : <><img src={odbLogo} alt="IA" className="h-4 w-4 object-contain" /> Analisar com IA</>}
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-emerald-500 text-sm font-medium">
                <CheckCircle className="h-4 w-4" /> Dados extraídos pela IA
              </div>
              <div className="rounded-xl p-4 border space-y-3" style={{ background: "rgba(14,20,35,0.7)", borderColor: "rgba(245,158,11,0.08)" }}>
                {aiResult.cliente && <div><Label className="text-[10px] text-muted-foreground">Cliente</Label><p className="text-sm text-foreground">{aiResult.cliente}</p></div>}
                {aiResult.veiculo && <div><Label className="text-[10px] text-muted-foreground">Veículo</Label><p className="text-sm text-foreground">{[aiResult.veiculo.marca, aiResult.veiculo.modelo, aiResult.veiculo.ano].filter(Boolean).join(" ")} {aiResult.veiculo.placa && `• ${aiResult.veiculo.placa}`}</p></div>}
                {aiResult.itens?.length > 0 && (
                  <div>
                    <Label className="text-[10px] text-muted-foreground">Itens ({aiResult.itens.length})</Label>
                    {aiResult.itens.map((item: any, i: number) => (
                      <div key={i} className="flex justify-between text-xs py-1 border-b border-border/20">
                        <span className="text-foreground">{item.descricao}</span>
                        <span className="text-emerald-500 font-medium">R$ {Number(item.valor_cobrado || 0).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div>
                <Label className="text-[10px] text-muted-foreground mb-1.5 block">Método de Pagamento</Label>
                <div className="grid grid-cols-3 gap-1.5">
                  {paymentMethods.map((m) => (
                    <button key={m} onClick={() => setMetodo(m)} className={`rounded-lg px-2 py-2 text-[11px] font-medium transition-all border ${metodo === m ? "bg-primary/20 border-primary/40 text-primary" : "bg-secondary/30 border-border/30 text-muted-foreground hover:border-primary/20"}`}>
                      {m}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex gap-2">
                <Button onClick={() => { setAiResult(null); setPreview(null); setFileBase64(null); }} variant="outline" className="flex-1 h-10 border-border/50 text-foreground text-sm">Recomeçar</Button>
                <Button onClick={handleSave} disabled={saving} className="flex-1 h-10 bg-primary text-primary-foreground hover:bg-primary/90 gap-2 text-sm" style={{ boxShadow: "0 0 16px rgba(245,158,11,0.25)" }}>
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  {saving ? "Salvando..." : "Salvar Lançamento"}
                </Button>
              </div>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
};

export default LaunchPhoto;
