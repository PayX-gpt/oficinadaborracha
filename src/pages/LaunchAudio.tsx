import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Mic, MicOff, ChevronLeft, Loader2, CheckCircle, Save } from "lucide-react";
import odbLogo from "@/assets/odb-logo.png";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { motion } from "framer-motion";
import { toast } from "sonner";

const paymentMethods = ["PIX", "Dinheiro", "Débito", "Crédito 1x", "Crédito 2x", "Crédito 3x"];

const LaunchAudio = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [recording, setRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [timer, setTimer] = useState(0);
  const [analyzing, setAnalyzing] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [aiResult, setAiResult] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [metodo, setMetodo] = useState("");
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const recognitionRef = useRef<any>(null);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];
      mediaRecorder.ondataavailable = (e) => chunksRef.current.push(e.data);
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        setAudioUrl(URL.createObjectURL(blob));
        stream.getTracks().forEach((t) => t.stop());
      };
      mediaRecorder.start();
      setRecording(true);
      setTimer(0);
      setTranscript("");
      timerRef.current = setInterval(() => setTimer((t) => t + 1), 1000);

      // Web Speech API for real-time transcription
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = "pt-BR";
        recognition.onresult = (event: any) => {
          let full = "";
          for (let i = 0; i < event.results.length; i++) {
            full += event.results[i][0].transcript;
          }
          setTranscript(full);
        };
        recognition.start();
        recognitionRef.current = recognition;
      }
    } catch {
      toast.error("Não foi possível acessar o microfone.");
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    recognitionRef.current?.stop();
    setRecording(false);
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const handleAnalyze = async () => {
    if (!transcript.trim()) { toast.error("Nenhuma transcrição detectada. Tente novamente."); return; }
    setAnalyzing(true);
    try {
      const { data, error } = await supabase.functions.invoke("analyze-audio", {
        body: { transcript },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setAiResult(data.result);
      toast.success("Dados extraídos pela IA!");
    } catch (err: any) {
      toast.error("Erro: " + err.message);
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
        fonte: "audio",
        metodo_pagamento: metodo || aiResult.metodo_pagamento || null,
        valor_bruto: valorBruto,
        custo_total: custoTotal,
        desconto: desc,
        taxa_percentual: 0, taxa_valor: 0,
        valor_liquido: valorBruto - desc,
        lucro: valorBruto - desc - custoTotal,
        ai_data: { ...aiResult, transcript },
      }).select("id").single();

      if (error) throw error;

      if (items.length > 0) {
        await supabase.from("lancamento_items").insert(
          items.map((i: any) => ({ lancamento_id: lancamento.id, descricao: i.descricao || "", tipo: i.tipo || "mao_de_obra", valor_cobrado: Number(i.valor_cobrado) || 0, custo: Number(i.custo) || 0 }))
        );
      }

      toast.success("Lançamento salvo!");
      navigate("/dashboard");
    } catch (err: any) {
      toast.error("Erro: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const formatTime = (s: number) => `${Math.floor(s / 60).toString().padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;

  return (
    <div className="space-y-5 pb-24">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate("/launch")} className="flex items-center justify-center h-8 w-8 rounded-lg bg-secondary/50 text-muted-foreground hover:text-foreground transition-colors">
          <ChevronLeft className="h-4 w-4" />
        </button>
        <div>
          <h2 className="text-lg font-bold text-foreground">Lançar por Áudio</h2>
          <p className="text-[11px] text-muted-foreground">Dite e a IA transcreve automaticamente</p>
        </div>
      </div>

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center gap-6 p-8 rounded-xl border"
        style={{ background: "rgba(14,20,35,0.7)", backdropFilter: "blur(12px)", borderColor: "rgba(245,158,11,0.08)" }}>
        
        {!aiResult ? (
          <>
            {!audioUrl ? (
              <>
                <motion.button whileTap={{ scale: 0.92 }} onClick={recording ? stopRecording : startRecording}
                  className={`relative flex h-24 w-24 items-center justify-center rounded-full transition-all ${recording ? "bg-red-500/15 text-red-400 border-2 border-red-500/30" : "bg-violet-500/10 text-violet-400 border-2 border-violet-500/20 hover:border-violet-500/40"}`}>
                  {recording && <motion.div className="absolute inset-0 rounded-full border-2 border-red-400/30" animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0, 0.5] }} transition={{ repeat: Infinity, duration: 1.5 }} />}
                  {recording ? <MicOff className="h-10 w-10" /> : <Mic className="h-10 w-10" />}
                </motion.button>
                {recording ? (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center space-y-2 w-full">
                    <p className="text-2xl font-mono font-bold text-foreground">{formatTime(timer)}</p>
                    <div className="flex items-center gap-1 justify-center">
                      {[...Array(5)].map((_, i) => (<motion.div key={i} animate={{ scaleY: [1, 2.5, 1] }} transition={{ repeat: Infinity, duration: 0.4, delay: i * 0.08 }} className="h-3 w-1 rounded-full bg-red-400" />))}
                    </div>
                    {transcript && <p className="text-xs text-muted-foreground mt-3 px-4 italic">"{transcript}"</p>}
                    <p className="text-[11px] text-muted-foreground">Gravando... Toque para parar</p>
                  </motion.div>
                ) : (
                  <div className="text-center space-y-1">
                    <p className="text-sm font-medium text-foreground">Toque para gravar</p>
                    <p className="text-xs text-muted-foreground">Descreva o serviço realizado</p>
                  </div>
                )}
              </>
            ) : (
              <div className="w-full space-y-4">
                <audio src={audioUrl} controls className="w-full rounded-lg" />
                {transcript && (
                  <div className="space-y-1">
                    <Label className="text-[10px] text-muted-foreground">Transcrição</Label>
                    <Textarea value={transcript} onChange={(e) => setTranscript(e.target.value)} className="bg-background/20 border-border/40 text-sm min-h-[80px]" />
                  </div>
                )}
                <div className="flex gap-2">
                  <Button onClick={() => { setAudioUrl(null); setTimer(0); setTranscript(""); }} variant="outline" className="flex-1 h-10 border-border/50 text-foreground hover:bg-secondary/50 text-sm">Regravar</Button>
                  <Button onClick={handleAnalyze} disabled={analyzing} className="flex-1 h-10 bg-primary text-primary-foreground hover:bg-primary/90 gap-2 text-sm" style={{ boxShadow: "0 0 16px rgba(245,158,11,0.2)" }}>
                    {analyzing ? <><Loader2 className="h-4 w-4 animate-spin" /> Analisando...</> : <><img src={odbLogo} alt="IA" className="h-4 w-4 object-contain" /> Extrair Dados</>}
                  </Button>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="w-full space-y-3">
            <div className="flex items-center gap-2 text-emerald-500 text-sm font-medium">
              <CheckCircle className="h-4 w-4" /> Dados extraídos pela IA
            </div>
            <div className="rounded-lg p-3 bg-secondary/20 space-y-2">
              {aiResult.cliente && <p className="text-xs text-foreground"><span className="text-muted-foreground">Cliente:</span> {aiResult.cliente}</p>}
              {aiResult.veiculo && <p className="text-xs text-foreground"><span className="text-muted-foreground">Veículo:</span> {[aiResult.veiculo.marca, aiResult.veiculo.modelo, aiResult.veiculo.ano].filter(Boolean).join(" ")}</p>}
              {aiResult.itens?.map((item: any, i: number) => (
                <div key={i} className="flex justify-between text-xs py-1 border-b border-border/20">
                  <span className="text-foreground">{item.descricao}</span>
                  <span className="text-emerald-500 font-medium">R$ {Number(item.valor_cobrado || 0).toFixed(2)}</span>
                </div>
              ))}
            </div>
            <div>
              <Label className="text-[10px] text-muted-foreground mb-1.5 block">Pagamento</Label>
              <div className="grid grid-cols-3 gap-1.5">
                {paymentMethods.map((m) => (
                  <button key={m} onClick={() => setMetodo(m)} className={`rounded-lg px-2 py-2 text-[11px] font-medium transition-all border ${metodo === m ? "bg-primary/20 border-primary/40 text-primary" : "bg-secondary/30 border-border/30 text-muted-foreground"}`}>{m}</button>
                ))}
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={() => { setAiResult(null); setAudioUrl(null); setTranscript(""); }} variant="outline" className="flex-1 h-10 border-border/50 text-foreground text-sm">Recomeçar</Button>
              <Button onClick={handleSave} disabled={saving} className="flex-1 h-10 bg-primary text-primary-foreground hover:bg-primary/90 gap-2 text-sm" style={{ boxShadow: "0 0 16px rgba(245,158,11,0.25)" }}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                {saving ? "Salvando..." : "Salvar"}
              </Button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default LaunchAudio;
