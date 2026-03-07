import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronLeft, Upload, Tag, DollarSign, User, CreditCard, StickyNote, Save } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";

const categories = [
  "Peças Compradas", "Matéria-Prima (Borracha)", "Aluguel", "Energia", "Água", "Internet",
  "Salário Funcionário", "Alimentação/Almoço", "Ferramentas", "Manutenção", "Imposto",
  "Aporte de Sócio", "Marketing", "Outros",
];

const paymentMethods = ["PIX", "Dinheiro", "Débito", "Crédito", "Transferência"];

const SectionCard = ({ icon: Icon, title, children }: { icon: any; title: string; children: React.ReactNode }) => (
  <div
    className="rounded-xl p-4 space-y-3 border transition-all duration-200"
    style={{
      background: "rgba(14,20,35,0.7)",
      backdropFilter: "blur(12px)",
      borderColor: "rgba(245,158,11,0.08)",
    }}
  >
    <div className="flex items-center gap-2">
      <Icon className="h-3.5 w-3.5 text-red-400" />
      <h3 className="text-xs font-semibold text-foreground uppercase tracking-wide">{title}</h3>
    </div>
    {children}
  </div>
);

const LaunchExpense = () => {
  const navigate = useNavigate();
  const [categoria, setCategoria] = useState("");
  const [subcategoria, setSubcategoria] = useState("");
  const [valor, setValor] = useState("");
  const [pagoPor, setPagoPor] = useState("");
  const [metodo, setMetodo] = useState("");
  const [observacoes, setObservacoes] = useState("");

  const handleSave = () => {
    if (!categoria || !valor) { toast.error("Preencha categoria e valor."); return; }
    toast.success("Despesa registrada com sucesso!");
    navigate("/dashboard");
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate("/launch")} className="flex items-center justify-center h-8 w-8 rounded-lg bg-secondary/50 text-muted-foreground hover:text-foreground transition-colors">
          <ChevronLeft className="h-4 w-4" />
        </button>
        <div>
          <h2 className="text-lg font-bold text-foreground">Registrar Despesa</h2>
          <p className="text-[11px] text-muted-foreground">Registre saídas e custos operacionais</p>
        </div>
      </div>

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
        <SectionCard icon={Tag} title="Categoria">
          <Select value={categoria} onValueChange={setCategoria}>
            <SelectTrigger className="bg-background/30 border-border/50 h-9 text-sm">
              <SelectValue placeholder="Selecione a categoria" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((c) => (<SelectItem key={c} value={c}>{c}</SelectItem>))}
            </SelectContent>
          </Select>
          <Input placeholder="Subcategoria (ex: Borracha Natural 5kg)" value={subcategoria} onChange={(e) => setSubcategoria(e.target.value)} className="bg-background/30 border-border/50 h-9 text-sm" />
        </SectionCard>

        <SectionCard icon={DollarSign} title="Valor">
          <Input type="number" placeholder="0,00" value={valor} onChange={(e) => setValor(e.target.value)} className="bg-background/30 border-border/50 h-9 text-sm text-lg font-bold" />
        </SectionCard>

        <SectionCard icon={User} title="Pago por">
          <Input placeholder="Nome de quem pagou" value={pagoPor} onChange={(e) => setPagoPor(e.target.value)} className="bg-background/30 border-border/50 h-9 text-sm" />
        </SectionCard>

        <SectionCard icon={CreditCard} title="Pagamento">
          <div className="grid grid-cols-3 gap-1.5">
            {paymentMethods.map((m) => (
              <button
                key={m}
                onClick={() => setMetodo(m)}
                className={`rounded-lg px-2 py-2 text-[11px] font-medium transition-all border ${
                  metodo === m
                    ? "bg-primary/20 border-primary/40 text-primary"
                    : "bg-secondary/30 border-border/30 text-muted-foreground hover:border-primary/20"
                }`}
              >
                {m}
              </button>
            ))}
          </div>
        </SectionCard>

        <SectionCard icon={Upload} title="Comprovante">
          <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-border/40 bg-secondary/20 p-3 text-xs text-muted-foreground hover:border-primary/30 transition-colors">
            <Upload className="h-4 w-4" />
            <span>Toque para anexar foto</span>
            <input type="file" accept="image/*" className="hidden" />
          </label>
        </SectionCard>

        <SectionCard icon={StickyNote} title="Observações">
          <Textarea placeholder="Notas adicionais..." value={observacoes} onChange={(e) => setObservacoes(e.target.value)} className="bg-background/30 border-border/50 min-h-[60px] text-sm resize-none" />
        </SectionCard>

        <Button
          onClick={handleSave}
          className="w-full h-11 bg-red-500 text-white hover:bg-red-600 font-semibold text-sm gap-2"
          style={{ boxShadow: "0 0 16px rgba(239,68,68,0.2)" }}
        >
          <Save className="h-4 w-4" /> Registrar Despesa
        </Button>
      </motion.div>
    </div>
  );
};

export default LaunchExpense;
