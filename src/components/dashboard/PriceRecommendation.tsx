import { useState } from "react";
import { motion } from "framer-motion";
import { DollarSign, Loader2, TrendingUp, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface PriceResult {
  precoSugerido: number;
  precoMinimo: number;
  precoMaximo: number;
  margemEstimada: number;
  justificativa: string;
  servicosSimilares: { descricao: string; preco: number; margem: number }[];
}

const formatCurrency = (v: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

const PriceRecommendation = () => {
  const [servico, setServico] = useState("");
  const [veiculo, setVeiculo] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PriceResult | null>(null);

  const getRecommendation = async () => {
    if (!servico.trim()) { toast.error("Descreva o serviço"); return; }
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("ai-price-recommend", {
        body: { servicoDescricao: servico, veiculoDescricao: veiculo },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setResult(data.result);
      toast.success("Recomendação gerada!");
    } catch (err: any) {
      toast.error(err.message || "Erro");
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.05, duration: 0.4 }}
      className="rounded-xl p-3 md:p-6 transition-all duration-300 overflow-hidden bg-card border border-border">
      
      <h3 className="text-[11px] uppercase tracking-[0.05em] text-muted-foreground font-medium flex items-center gap-1.5 mb-3">
        <DollarSign className="h-3.5 w-3.5 text-primary shrink-0" />
        Recomendação de Preço IA
      </h3>

      <div className="space-y-2 mb-3">
        <input
          value={servico}
          onChange={e => setServico(e.target.value)}
          placeholder="Ex: Troca de bucha da bandeja Civic"
          className="w-full h-9 rounded-lg px-3 text-xs bg-secondary/30 border border-border/30 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/40 transition-all"
        />
        <div className="flex gap-2">
          <input
            value={veiculo}
            onChange={e => setVeiculo(e.target.value)}
            placeholder="Veículo (opcional)"
            className="flex-1 h-9 rounded-lg px-3 text-xs bg-secondary/30 border border-border/30 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/40 transition-all"
          />
          <button onClick={getRecommendation} disabled={loading}
            className="flex items-center gap-1 px-3 h-9 rounded-lg text-[10px] font-medium bg-primary/20 text-primary border border-primary/30 hover:bg-primary/30 transition-colors disabled:opacity-50 shrink-0">
            {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Search className="h-3 w-3" />}
            Consultar
          </button>
        </div>
      </div>

      {result && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
          {/* Price range */}
          <div className="rounded-xl p-3 bg-success/10 border border-success/20">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] uppercase text-muted-foreground font-medium">Preço Sugerido</span>
              <span className="text-lg font-bold text-gold">{formatCurrency(result.precoSugerido)}</span>
            </div>
            <div className="flex justify-between text-[10px] text-muted-foreground">
              <span>Mín: {formatCurrency(result.precoMinimo)}</span>
              <span>Máx: {formatCurrency(result.precoMaximo)}</span>
            </div>
            <div className="mt-2 h-2 rounded-full bg-secondary/30 overflow-hidden">
              <div className="h-full rounded-full bg-gradient-to-r from-primary via-gold to-success"
                style={{ width: `${Math.min(100, result.margemEstimada)}%` }} />
            </div>
            <p className="text-[10px] text-gold mt-1">Margem estimada: {result.margemEstimada}%</p>
          </div>

          {/* Justification */}
          <div className="rounded-lg p-2.5 bg-secondary/20">
            <p className="text-[11px] text-foreground leading-relaxed">{result.justificativa}</p>
          </div>

          {/* Similar services */}
          {result.servicosSimilares.length > 0 && (
            <div>
              <p className="text-[10px] uppercase text-muted-foreground font-medium mb-1.5">Serviços Similares</p>
              <div className="space-y-1">
                {result.servicosSimilares.map((s, i) => (
                  <div key={i} className="flex items-center justify-between rounded-lg p-2 bg-secondary/10 text-xs">
                    <span className="text-muted-foreground truncate mr-2">{s.descricao}</span>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-foreground font-medium">{formatCurrency(s.preco)}</span>
                      <span className={`text-[10px] ${s.margem >= 40 ? "text-emerald-400" : "text-red-400"}`}>{s.margem}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      )}
    </motion.div>
  );
};

export default PriceRecommendation;
