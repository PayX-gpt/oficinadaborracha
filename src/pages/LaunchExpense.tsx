import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Upload } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";

const categories = [
  "Peças Compradas",
  "Matéria-Prima (Borracha)",
  "Aluguel",
  "Energia",
  "Água",
  "Internet",
  "Salário Funcionário",
  "Alimentação/Almoço",
  "Ferramentas",
  "Manutenção",
  "Imposto",
  "Aporte de Sócio",
  "Marketing",
  "Outros",
];

const paymentMethods = ["PIX", "Dinheiro", "Débito", "Crédito", "Transferência"];

const LaunchExpense = () => {
  const navigate = useNavigate();
  const [categoria, setCategoria] = useState("");
  const [subcategoria, setSubcategoria] = useState("");
  const [valor, setValor] = useState("");
  const [pagoPor, setPagoPor] = useState("");
  const [metodo, setMetodo] = useState("");
  const [observacoes, setObservacoes] = useState("");

  const handleSave = () => {
    if (!categoria || !valor) {
      toast.error("Preencha categoria e valor.");
      return;
    }
    toast.success("Despesa registrada com sucesso!");
    navigate("/dashboard");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate("/launch")} className="text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h2 className="text-xl font-bold text-foreground">Registrar Despesa</h2>
          <p className="text-sm text-muted-foreground">Registre saídas e custos</p>
        </div>
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-4 space-y-4">
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">Categoria</Label>
          <Select value={categoria} onValueChange={setCategoria}>
            <SelectTrigger className="bg-secondary border-border">
              <SelectValue placeholder="Selecione a categoria" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((c) => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">Subcategoria</Label>
          <Input placeholder="Ex: Borracha Natural 5kg" value={subcategoria} onChange={(e) => setSubcategoria(e.target.value)} className="bg-secondary border-border" />
        </div>

        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">Valor (R$)</Label>
          <Input type="number" placeholder="0,00" value={valor} onChange={(e) => setValor(e.target.value)} className="bg-secondary border-border" />
        </div>

        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">Pago por</Label>
          <Input placeholder="Nome de quem pagou" value={pagoPor} onChange={(e) => setPagoPor(e.target.value)} className="bg-secondary border-border" />
        </div>

        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">Método de Pagamento</Label>
          <div className="flex flex-wrap gap-2">
            {paymentMethods.map((m) => (
              <button
                key={m}
                onClick={() => setMetodo(m)}
                className={`rounded-full px-3 py-1.5 text-xs font-medium transition-all border ${
                  metodo === m
                    ? "bg-primary/20 border-primary text-primary"
                    : "bg-secondary border-border text-muted-foreground hover:border-primary/30"
                }`}
              >
                {m}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">Comprovante (foto)</Label>
          <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-border bg-secondary/50 p-4 text-sm text-muted-foreground hover:border-primary/30 transition-colors">
            <Upload className="h-5 w-5" />
            <span>Toque para anexar foto</span>
            <input type="file" accept="image/*" className="hidden" />
          </label>
        </div>

        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">Observações</Label>
          <Textarea placeholder="Notas adicionais..." value={observacoes} onChange={(e) => setObservacoes(e.target.value)} className="bg-secondary border-border min-h-[80px]" />
        </div>

        <Button onClick={handleSave} className="w-full bg-destructive text-destructive-foreground hover:bg-destructive/90 font-semibold">
          Registrar Despesa
        </Button>
      </motion.div>
    </div>
  );
};

export default LaunchExpense;
