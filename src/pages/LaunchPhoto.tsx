import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Camera, Sparkles, ChevronLeft, Upload, ImageIcon } from "lucide-react";
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
    setTimeout(() => {
      setAnalyzing(false);
      toast.info("A integração com IA será ativada na próxima fase.");
    }, 2000);
  };

  return (
    <div className="space-y-5">
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
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center gap-5 p-8 rounded-xl border"
          style={{
            background: "rgba(14,20,35,0.7)",
            backdropFilter: "blur(12px)",
            borderColor: "rgba(245,158,11,0.08)",
          }}
        >
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-500/10 border border-blue-500/20">
            <Camera className="h-8 w-8 text-blue-400" />
          </div>
          <div className="text-center space-y-1">
            <p className="text-sm font-medium text-foreground">Fotografe o orçamento</p>
            <p className="text-xs text-muted-foreground">Anotação, recibo ou nota de serviço</p>
          </div>
          <div className="flex gap-2 w-full">
            <Button
              onClick={() => fileInputRef.current?.click()}
              className="flex-1 h-10 bg-primary text-primary-foreground hover:bg-primary/90 gap-2 text-sm"
              style={{ boxShadow: "0 0 16px rgba(245,158,11,0.2)" }}
            >
              <Camera className="h-4 w-4" /> Câmera
            </Button>
            <Button
              onClick={() => {
                if (fileInputRef.current) {
                  fileInputRef.current.removeAttribute("capture");
                  fileInputRef.current.click();
                }
              }}
              variant="outline"
              className="flex-1 h-10 gap-2 text-sm border-border/50 text-foreground hover:bg-secondary/50"
            >
              <ImageIcon className="h-4 w-4" /> Galeria
            </Button>
          </div>
        </motion.div>
      ) : (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
          <div
            className="rounded-xl overflow-hidden border"
            style={{ borderColor: "rgba(245,158,11,0.08)" }}
          >
            <img src={preview} alt="Preview" className="w-full max-h-[350px] object-contain bg-black/20" />
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => { setPreview(null); fileInputRef.current?.click(); }}
              variant="outline"
              className="flex-1 h-10 border-border/50 text-foreground hover:bg-secondary/50 text-sm"
            >
              Nova Foto
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
