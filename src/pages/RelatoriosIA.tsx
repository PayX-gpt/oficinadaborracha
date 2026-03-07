import { useState } from "react";
import { motion } from "framer-motion";
import { FileText, Loader2, Calendar, Download } from "lucide-react";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";

const REPORT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-report`;

const RelatoriosIA = () => {
  const [tipo, setTipo] = useState<"semanal" | "mensal">("semanal");
  const [report, setReport] = useState("");
  const [loading, setLoading] = useState(false);

  const generateReport = async () => {
    setLoading(true);
    setReport("");

    try {
      const resp = await fetch(REPORT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ tipo }),
      });

      if (!resp.ok) {
        const data = await resp.json().catch(() => ({}));
        throw new Error(data.error || "Erro ao gerar relatório");
      }

      if (!resp.body) throw new Error("Sem resposta");

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let reportSoFar = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        let idx: number;
        while ((idx = buffer.indexOf("\n")) !== -1) {
          let line = buffer.slice(0, idx);
          buffer = buffer.slice(idx + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (!line.startsWith("data: ")) continue;
          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") break;
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              reportSoFar += content;
              setReport(reportSoFar);
            }
          } catch {
            buffer = line + "\n" + buffer;
            break;
          }
        }
      }

      toast.success("Relatório gerado!");
    } catch (err: any) {
      toast.error(err.message || "Erro");
    } finally {
      setLoading(false);
    }
  };

  const downloadReport = () => {
    const blob = new Blob([report], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `relatorio-${tipo}-${new Date().toISOString().split("T")[0]}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-4 pb-24">
      <div>
        <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
          <FileText className="h-5 w-5 text-primary" />
          Relatórios IA
        </h2>
        <p className="text-[11px] text-muted-foreground">Relatórios financeiros gerados por IA com dados reais</p>
      </div>

      <div className="flex items-center gap-2">
        <div className="flex gap-1 p-1 rounded-lg bg-secondary/30">
          {(["semanal", "mensal"] as const).map((t) => (
            <button key={t} onClick={() => setTipo(t)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${tipo === t ? "bg-primary/20 text-primary border border-primary/30" : "text-muted-foreground hover:text-foreground"}`}>
              <Calendar className="h-3 w-3 inline mr-1" />
              {t === "semanal" ? "Semanal" : "Mensal"}
            </button>
          ))}
        </div>
        <button onClick={generateReport} disabled={loading}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50">
          {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FileText className="h-3.5 w-3.5" />}
          {loading ? "Gerando..." : "Gerar Relatório"}
        </button>
        {report && !loading && (
          <button onClick={downloadReport}
            className="flex items-center gap-1 px-3 py-2 rounded-lg text-xs font-medium bg-secondary/30 text-foreground hover:bg-secondary/50 transition-colors border border-border/30">
            <Download className="h-3.5 w-3.5" /> Baixar .md
          </button>
        )}
      </div>

      {(report || loading) && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="rounded-xl p-4 md:p-6 min-h-[200px]"
          style={{ background: "rgba(14,20,35,0.85)", backdropFilter: "blur(16px)", border: "1px solid rgba(245,158,11,0.08)", boxShadow: "0 4px 24px rgba(0,0,0,0.3)" }}>
          {loading && !report ? (
            <div className="flex items-center justify-center py-12 gap-2">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
              <span className="text-xs text-muted-foreground">Analisando dados financeiros...</span>
            </div>
          ) : (
            <div className="prose prose-sm prose-invert max-w-none text-xs leading-relaxed [&_strong]:text-primary [&_h1]:text-base [&_h1]:font-bold [&_h2]:text-sm [&_h2]:font-semibold [&_h3]:text-xs [&_p]:text-xs [&_li]:text-xs [&_table]:text-[10px] [&_th]:px-2 [&_th]:py-1.5 [&_td]:px-2 [&_td]:py-1 [&_th]:bg-secondary/30 [&_tr]:border-b [&_tr]:border-border/10">
              <ReactMarkdown>{report}</ReactMarkdown>
              {loading && <span className="inline-block w-1.5 h-4 bg-primary animate-pulse ml-0.5" />}
            </div>
          )}
        </motion.div>
      )}
    </motion.div>
  );
};

export default RelatoriosIA;
