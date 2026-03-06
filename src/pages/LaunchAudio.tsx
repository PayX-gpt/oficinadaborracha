import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Mic, MicOff, Sparkles, ArrowLeft, Play, Square } from "lucide-react";
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
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate("/launch")} className="text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h2 className="text-xl font-bold text-foreground">Lançar por Áudio</h2>
          <p className="text-sm text-muted-foreground">Dite os dados do serviço</p>
        </div>
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card flex flex-col items-center gap-6 p-10">
        {!audioUrl ? (
          <>
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={recording ? stopRecording : startRecording}
              className={`flex h-28 w-28 items-center justify-center rounded-full transition-all ${
                recording
                  ? "bg-destructive/20 text-destructive animate-pulse"
                  : "bg-primary/10 text-primary hover:bg-primary/20"
              }`}
            >
              {recording ? <MicOff className="h-12 w-12" /> : <Mic className="h-12 w-12" />}
            </motion.button>

            {recording && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center space-y-2">
                <p className="text-2xl font-mono font-bold text-foreground">{formatTime(timer)}</p>
                <div className="flex items-center gap-1 justify-center">
                  {[...Array(5)].map((_, i) => (
                    <motion.div
                      key={i}
                      animate={{ scaleY: [1, 2, 1] }}
                      transition={{ repeat: Infinity, duration: 0.5, delay: i * 0.1 }}
                      className="h-4 w-1 rounded-full bg-primary"
                    />
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">Gravando... Toque para parar</p>
              </motion.div>
            )}

            {!recording && (
              <p className="text-center text-sm text-muted-foreground">
                Toque no microfone para iniciar a gravação
              </p>
            )}
          </>
        ) : (
          <div className="w-full space-y-4">
            <audio src={audioUrl} controls className="w-full" />
            <div className="flex gap-3">
              <Button
                onClick={() => { setAudioUrl(null); setTimer(0); }}
                variant="outline"
                className="flex-1 border-border text-foreground hover:bg-secondary"
              >
                Regravar
              </Button>
              <Button
                onClick={handleAnalyze}
                disabled={analyzing}
                className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90 btn-glow gap-2"
              >
                {analyzing ? (
                  <>
                    <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }}>
                      <Sparkles className="h-4 w-4" />
                    </motion.div>
                    Analisando...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" /> Analisar com IA
                  </>
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
