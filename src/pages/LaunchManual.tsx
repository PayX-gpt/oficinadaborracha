import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";

type ItemTipo = "mao_de_obra" | "peca_fabricada" | "peca_comprada";

interface ServiceItem {
  id: string;
  descricao: string;
  tipo: ItemTipo;
  valor_cobrado: string;
  custo: string;
}

const paymentMethods = ["PIX", "Dinheiro", "Débito", "Crédito 1x", "Crédito 2x", "Crédito 3x"];

const defaultTaxes: Record<string, number> = {
  PIX: 0,
  Dinheiro: 0,
  Débito: 1.5,
  "Crédito 1x": 2.5,
  "Crédito 2x": 3.5,
  "Crédito 3x": 4.5,
};

const LaunchManual = () => {
  const navigate = useNavigate();
  const [cliente, setCliente] = useState("");
  const [marca, setMarca] = useState("");
  const [modelo, setModelo] = useState("");
  const [ano, setAno] = useState("");
  const [placa, setPlaca] = useState("");
  const [items, setItems] = useState<ServiceItem[]>([
    { id: crypto.randomUUID(), descricao: "", tipo: "mao_de_obra", valor_cobrado: "", custo: "" },
  ]);
  const [desconto, setDesconto] = useState("");
  const [metodo, setMetodo] = useState("");
  const [taxa, setTaxa] = useState("");
  const [observacoes, setObservacoes] = useState("");

  const addItem = () =>
    setItems([...items, { id: crypto.randomUUID(), descricao: "", tipo: "mao_de_obra", valor_cobrado: "", custo: "" }]);

  const removeItem = (id: string) => setItems(items.filter((i) => i.id !== id));

  const updateItem = (id: string, field: keyof ServiceItem, value: string) =>
    setItems(items.map((i) => (i.id === id ? { ...i, [field]: value } : i)));

  const handleMetodoChange = (m: string) => {
    setMetodo(m);
    setTaxa(String(defaultTaxes[m] ?? 0));
  };

  const summary = useMemo(() => {
    const valorBruto = items.reduce((sum, i) => sum + (parseFloat(i.valor_cobrado) || 0), 0);
    const custoPecas = items.reduce(
      (sum, i) => (i.tipo === "peca_comprada" ? sum + (parseFloat(i.custo) || 0) : sum),
      0
    );
    const descontoVal = parseFloat(desconto) || 0;
    const taxaPerc = parseFloat(taxa) || 0;
    const taxaVal = ((valorBruto - descontoVal) * taxaPerc) / 100;
    const lucroBruto = valorBruto - descontoVal - taxaVal - custoPecas;

    return { valorBruto, custoPecas, taxaVal, lucroBruto, descontoVal };
  }, [items, desconto, taxa]);

  const handleSave = () => {
    toast.success("Lançamento salvo com sucesso!");
    navigate("/dashboard");
  };

  return (
    <div className="space-y-6 pb-36">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate("/launch")} className="text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h2 className="text-xl font-bold text-foreground">Lançamento Manual</h2>
          <p className="text-sm text-muted-foreground">Preencha os dados do serviço</p>
        </div>
      </div>

      {/* Cliente */}
      <div className="glass-card p-4 space-y-3">
        <h3 className="text-sm font-semibold text-foreground">Cliente</h3>
        <Input placeholder="Nome do cliente" value={cliente} onChange={(e) => setCliente(e.target.value)} className="bg-secondary border-border" />
      </div>

      {/* Veículo */}
      <div className="glass-card p-4 space-y-3">
        <h3 className="text-sm font-semibold text-foreground">Veículo</h3>
        <div className="grid grid-cols-2 gap-3">
          <Input placeholder="Marca" value={marca} onChange={(e) => setMarca(e.target.value)} className="bg-secondary border-border" />
          <Input placeholder="Modelo" value={modelo} onChange={(e) => setModelo(e.target.value)} className="bg-secondary border-border" />
          <Input placeholder="Ano" value={ano} onChange={(e) => setAno(e.target.value)} className="bg-secondary border-border" />
          <Input placeholder="Placa" value={placa} onChange={(e) => setPlaca(e.target.value)} className="bg-secondary border-border" />
        </div>
      </div>

      {/* Itens */}
      <div className="glass-card p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-foreground">Itens do Serviço</h3>
          <Button onClick={addItem} size="sm" variant="outline" className="gap-1 text-xs border-primary/30 text-primary hover:bg-primary/10">
            <Plus className="h-3 w-3" /> Adicionar
          </Button>
        </div>

        {items.map((item, idx) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-2 rounded-lg bg-secondary/50 p-3"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">Item {idx + 1}</span>
              {items.length > 1 && (
                <button onClick={() => removeItem(item.id)} className="text-destructive hover:text-destructive/80">
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
            <Input placeholder="Descrição" value={item.descricao} onChange={(e) => updateItem(item.id, "descricao", e.target.value)} className="bg-background/50 border-border text-sm" />
            <Select value={item.tipo} onValueChange={(v) => updateItem(item.id, "tipo", v)}>
              <SelectTrigger className="bg-background/50 border-border text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="mao_de_obra">Mão de Obra</SelectItem>
                <SelectItem value="peca_fabricada">Peça Fabricada</SelectItem>
                <SelectItem value="peca_comprada">Peça Comprada</SelectItem>
              </SelectContent>
            </Select>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-[11px] text-muted-foreground">Valor Cobrado (R$)</Label>
                <Input type="number" placeholder="0,00" value={item.valor_cobrado} onChange={(e) => updateItem(item.id, "valor_cobrado", e.target.value)} className="bg-background/50 border-border text-sm" />
              </div>
              {item.tipo === "peca_comprada" && (
                <div>
                  <Label className="text-[11px] text-muted-foreground">Custo (R$)</Label>
                  <Input type="number" placeholder="0,00" value={item.custo} onChange={(e) => updateItem(item.id, "custo", e.target.value)} className="bg-background/50 border-border text-sm" />
                </div>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Pagamento */}
      <div className="glass-card p-4 space-y-3">
        <h3 className="text-sm font-semibold text-foreground">Pagamento</h3>
        <div>
          <Label className="text-[11px] text-muted-foreground">Desconto (R$)</Label>
          <Input type="number" placeholder="0,00" value={desconto} onChange={(e) => setDesconto(e.target.value)} className="bg-secondary border-border" />
        </div>
        <div>
          <Label className="text-[11px] text-muted-foreground">Método de Pagamento</Label>
          <div className="flex flex-wrap gap-2 mt-1">
            {paymentMethods.map((m) => (
              <button
                key={m}
                onClick={() => handleMetodoChange(m)}
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
        <div>
          <Label className="text-[11px] text-muted-foreground">Taxa da Máquina (%)</Label>
          <Input type="number" placeholder="0" value={taxa} onChange={(e) => setTaxa(e.target.value)} className="bg-secondary border-border" />
        </div>
      </div>

      {/* Observações */}
      <div className="glass-card p-4 space-y-3">
        <h3 className="text-sm font-semibold text-foreground">Observações</h3>
        <Textarea placeholder="Notas adicionais..." value={observacoes} onChange={(e) => setObservacoes(e.target.value)} className="bg-secondary border-border min-h-[80px]" />
      </div>

      {/* Summary Footer */}
      <div className="fixed bottom-20 md:bottom-4 left-0 right-0 z-40 md:left-64">
        <div className="mx-auto max-w-4xl px-4">
          <div className="glass-card border-primary/20 p-4 space-y-3">
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
              <span className="text-muted-foreground">Valor Bruto</span>
              <span className="text-right font-semibold text-foreground">R$ {summary.valorBruto.toFixed(2)}</span>
              <span className="text-muted-foreground">Custo Peças</span>
              <span className="text-right font-semibold text-destructive">-R$ {summary.custoPecas.toFixed(2)}</span>
              <span className="text-muted-foreground">Taxa Máquina</span>
              <span className="text-right font-semibold text-destructive">-R$ {summary.taxaVal.toFixed(2)}</span>
              <span className="text-muted-foreground font-semibold">Lucro Bruto</span>
              <span className={`text-right font-bold ${summary.lucroBruto >= 0 ? "text-success" : "text-destructive"}`}>
                R$ {summary.lucroBruto.toFixed(2)}
              </span>
            </div>
            <Button onClick={handleSave} className="w-full bg-primary text-primary-foreground hover:bg-primary/90 btn-glow font-semibold">
              Salvar Lançamento
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LaunchManual;
