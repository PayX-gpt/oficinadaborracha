import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Camera, Sparkles, ArrowLeft, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { toast } from "sonner";

const LaunchPhoto = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => setPreview(ev.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleAnalyze = async () => {
    setAnalyzing(true);
    // Will be connected to Gemini in Phase 2
    setTimeout(() => {
      setAnalyzing(false);
      toast.info("A integração com IA será ativada na próxima fase.");
    }, 2000);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate("/launch")} className="text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h2 className="text-xl font-bold text-foreground">Lançar por Foto</h2>
          <p className="text-sm text-muted-foreground">Tire foto do orçamento para análise com IA</p>
        </div>
      </div>

      <input ref={fileInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFileChange} />

      {!preview ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card flex flex-col items-center gap-6 p-10"
        >
          <div className="flex h-24 w-24 items-center justify-center rounded-3xl bg-primary/10">
            <Camera className="h-12 w-12 text-primary" />
          </div>
          <p className="text-center text-sm text-muted-foreground">
            Tire uma foto do orçamento, anotação ou recibo do serviço
          </p>
          <div className="flex gap-3">
            <Button onClick={() => fileInputRef.current?.click()} className="bg-primary text-primary-foreground hover:bg-primary/90 btn-glow gap-2">
              <Camera className="h-4 w-4" /> Abrir Câmera
            </Button>
            <Button onClick={() => { if (fileInputRef.current) { fileInputRef.current.removeAttribute("capture"); fileInputRef.current.click(); }}} variant="outline" className="gap-2 border-border text-foreground hover:bg-secondary">
              <Upload className="h-4 w-4" /> Galeria
            </Button>
          </div>
        </motion.div>
      ) : (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
          <div className="glass-card overflow-hidden">
            <img src={preview} alt="Preview" className="w-full max-h-[400px] object-contain" />
          </div>
          <div className="flex gap-3">
            <Button
              onClick={() => { setPreview(null); fileInputRef.current?.click(); }}
              variant="outline"
              className="flex-1 border-border text-foreground hover:bg-secondary"
            >
              Nova Foto
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
        </motion.div>
      )}
    </div>
  );
};

export default LaunchPhoto;
