import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Mic, MicOff, Sparkles, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { toast } from "sonner";

const LaunchAudio = () => {
  const navigate = useNavigate();
  const [recording, setRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [timer, setTimer] = useState(0);
  const [analyzing, setAnalyzing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

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
      timerRef.current = setInterval(() => setTimer((t) => t + 1), 1000);
    } catch {
      toast.error("Não foi possível acessar o microfone.");
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setRecording(false);
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const handleAnalyze = () => {
    setAnalyzing(true);
    setTimeout(() => {
      setAnalyzing(false);
      toast.info("A integração com IA será ativada na próxima fase.");
    }, 2000);
  };

  const formatTime = (s: number) => `${Math.floor(s / 60).toString().padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate("/launch")} className="flex items-center justify-center h-8 w-8 rounded-lg bg-secondary/50 text-muted-foreground hover:text-foreground transition-colors">
          <ChevronLeft className="h-4 w-4" />
        </button>
        <div>
          <h2 className="text-lg font-bold text-foreground">Lançar por Áudio</h2>
          <p className="text-[11px] text-muted-foreground">Dite e a IA transcreve automaticamente</p>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center gap-6 p-8 rounded-xl border"
        style={{
          background: "rgba(14,20,35,0.7)",
          backdropFilter: "blur(12px)",
          borderColor: "rgba(245,158,11,0.08)",
        }}
      >
        {!audioUrl ? (
          <>
            <motion.button
              whileTap={{ scale: 0.92 }}
              onClick={recording ? stopRecording : startRecording}
              className={`relative flex h-24 w-24 items-center justify-center rounded-full transition-all ${
                recording
                  ? "bg-red-500/15 text-red-400 border-2 border-red-500/30"
                  : "bg-violet-500/10 text-violet-400 border-2 border-violet-500/20 hover:border-violet-500/40"
              }`}
            >
              {recording && (
                <motion.div
                  className="absolute inset-0 rounded-full border-2 border-red-400/30"
                  animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0, 0.5] }}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                />
              )}
              {recording ? <MicOff className="h-10 w-10" /> : <Mic className="h-10 w-10" />}
            </motion.button>

            {recording ? (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center space-y-2">
                <p className="text-2xl font-mono font-bold text-foreground">{formatTime(timer)}</p>
                <div className="flex items-center gap-1 justify-center">
                  {[...Array(5)].map((_, i) => (
                    <motion.div
                      key={i}
                      animate={{ scaleY: [1, 2.5, 1] }}
                      transition={{ repeat: Infinity, duration: 0.4, delay: i * 0.08 }}
                      className="h-3 w-1 rounded-full bg-red-400"
                    />
                  ))}
                </div>
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
            <div className="flex gap-2">
              <Button
                onClick={() => { setAudioUrl(null); setTimer(0); }}
                variant="outline"
                className="flex-1 h-10 border-border/50 text-foreground hover:bg-secondary/50 text-sm"
              >
                Regravar
              </Button>
              <Button
                onClick={handleAnalyze}
                disabled={analyzing}
                className="flex-1 h-10 bg-primary text-primary-foreground hover:bg-primary/90 gap-2 text-sm"
                style={{ boxShadow: "0 0 16px rgba(245,158,11,0.2)" }}
              >
                {analyzing ? (
                  <>
                    <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}>
                      <Sparkles className="h-4 w-4" />
                    </motion.div>
                    Analisando...
                  </>
                ) : (
                  <><Sparkles className="h-4 w-4" /> Analisar com IA</>
                )}
              </Button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default LaunchAudio;
