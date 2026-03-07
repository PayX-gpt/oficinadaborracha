import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, ChevronLeft, Car, User, Wrench, CreditCard, StickyNote, Save } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
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
  PIX: 0, Dinheiro: 0, Débito: 1.5, "Crédito 1x": 2.5, "Crédito 2x": 3.5, "Crédito 3x": 4.5,
};

const formatBRL = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

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
      <Icon className="h-3.5 w-3.5 text-primary" />
      <h3 className="text-xs font-semibold text-foreground uppercase tracking-wide">{title}</h3>
    </div>
    {children}
  </div>
);

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
  const handleMetodoChange = (m: string) => { setMetodo(m); setTaxa(String(defaultTaxes[m] ?? 0)); };

  const summary = useMemo(() => {
    const valorBruto = items.reduce((sum, i) => sum + (parseFloat(i.valor_cobrado) || 0), 0);
    const custoPecas = items.reduce((sum, i) => (i.tipo === "peca_comprada" ? sum + (parseFloat(i.custo) || 0) : sum), 0);
    const descontoVal = parseFloat(desconto) || 0;
    const taxaPerc = parseFloat(taxa) || 0;
    const taxaVal = ((valorBruto - descontoVal) * taxaPerc) / 100;
    const lucroBruto = valorBruto - descontoVal - taxaVal - custoPecas;
    return { valorBruto, custoPecas, taxaVal, lucroBruto, descontoVal };
  }, [items, desconto, taxa]);

  const handleSave = () => { toast.success("Lançamento salvo com sucesso!"); navigate("/dashboard"); };

  return (
    <div className="space-y-4 pb-44">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate("/launch")} className="flex items-center justify-center h-8 w-8 rounded-lg bg-secondary/50 text-muted-foreground hover:text-foreground transition-colors">
          <ChevronLeft className="h-4 w-4" />
        </button>
        <div>
          <h2 className="text-lg font-bold text-foreground">Lançamento Manual</h2>
          <p className="text-[11px] text-muted-foreground">Preencha os dados do serviço</p>
        </div>
      </div>

      {/* Cliente */}
      <SectionCard icon={User} title="Cliente">
        <Input placeholder="Nome do cliente" value={cliente} onChange={(e) => setCliente(e.target.value)} className="bg-background/30 border-border/50 h-9 text-sm" />
      </SectionCard>

      {/* Veículo */}
      <SectionCard icon={Car} title="Veículo">
        <div className="grid grid-cols-2 gap-2">
          <Input placeholder="Marca" value={marca} onChange={(e) => setMarca(e.target.value)} className="bg-background/30 border-border/50 h-9 text-sm" />
          <Input placeholder="Modelo" value={modelo} onChange={(e) => setModelo(e.target.value)} className="bg-background/30 border-border/50 h-9 text-sm" />
          <Input placeholder="Ano" value={ano} onChange={(e) => setAno(e.target.value)} className="bg-background/30 border-border/50 h-9 text-sm" />
          <Input placeholder="Placa" value={placa} onChange={(e) => setPlaca(e.target.value)} className="bg-background/30 border-border/50 h-9 text-sm" />
        </div>
      </SectionCard>

      {/* Itens */}
      <SectionCard icon={Wrench} title="Itens do Serviço">
        <AnimatePresence>
          {items.map((item, idx) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-2 rounded-lg bg-secondary/30 p-3 border border-border/30"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Item {idx + 1}</span>
                {items.length > 1 && (
                  <button onClick={() => removeItem(item.id)} className="text-red-400 hover:text-red-300 transition-colors">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
              <Input placeholder="Descrição do item" value={item.descricao} onChange={(e) => updateItem(item.id, "descricao", e.target.value)} className="bg-background/20 border-border/40 h-8 text-xs" />
              <Select value={item.tipo} onValueChange={(v) => updateItem(item.id, "tipo", v)}>
                <SelectTrigger className="bg-background/20 border-border/40 h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="mao_de_obra">Mão de Obra</SelectItem>
                  <SelectItem value="peca_fabricada">Peça Fabricada</SelectItem>
                  <SelectItem value="peca_comprada">Peça Comprada</SelectItem>
                </SelectContent>
              </Select>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-[10px] text-muted-foreground">Valor (R$)</Label>
                  <Input type="number" placeholder="0,00" value={item.valor_cobrado} onChange={(e) => updateItem(item.id, "valor_cobrado", e.target.value)} className="bg-background/20 border-border/40 h-8 text-xs" />
                </div>
                {item.tipo === "peca_comprada" && (
                  <div>
                    <Label className="text-[10px] text-muted-foreground">Custo (R$)</Label>
                    <Input type="number" placeholder="0,00" value={item.custo} onChange={(e) => updateItem(item.id, "custo", e.target.value)} className="bg-background/20 border-border/40 h-8 text-xs" />
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        <button onClick={addItem} className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg border border-dashed border-primary/30 text-primary text-xs font-medium hover:bg-primary/5 transition-colors">
          <Plus className="h-3.5 w-3.5" /> Adicionar Item
        </button>
      </SectionCard>

      {/* Pagamento */}
      <SectionCard icon={CreditCard} title="Pagamento">
        <div className="space-y-3">
          <div>
            <Label className="text-[10px] text-muted-foreground">Desconto (R$)</Label>
            <Input type="number" placeholder="0,00" value={desconto} onChange={(e) => setDesconto(e.target.value)} className="bg-background/30 border-border/50 h-9 text-sm" />
          </div>
          <div>
            <Label className="text-[10px] text-muted-foreground mb-1.5 block">Método</Label>
            <div className="grid grid-cols-3 gap-1.5">
              {paymentMethods.map((m) => (
                <button
                  key={m}
                  onClick={() => handleMetodoChange(m)}
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
          </div>
          {metodo && (
            <div>
              <Label className="text-[10px] text-muted-foreground">Taxa ({taxa}%)</Label>
              <Input type="number" placeholder="0" value={taxa} onChange={(e) => setTaxa(e.target.value)} className="bg-background/30 border-border/50 h-9 text-sm" />
            </div>
          )}
        </div>
      </SectionCard>

      {/* Observações */}
      <SectionCard icon={StickyNote} title="Observações">
        <Textarea placeholder="Notas adicionais..." value={observacoes} onChange={(e) => setObservacoes(e.target.value)} className="bg-background/30 border-border/50 min-h-[60px] text-sm resize-none" />
      </SectionCard>

      {/* Summary Footer */}
      <div className="fixed bottom-16 md:bottom-0 left-0 right-0 z-40 md:left-64">
        <div className="mx-auto max-w-4xl px-3 pb-2 md:pb-4">
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="rounded-xl p-3 border border-primary/20"
            style={{
              background: "rgba(14,20,35,0.95)",
              backdropFilter: "blur(20px)",
              boxShadow: "0 -4px 24px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.03)",
            }}
          >
            <div className="grid grid-cols-4 gap-2 mb-3 text-center">
              <div>
                <p className="text-[9px] text-muted-foreground uppercase tracking-wider">Bruto</p>
                <p className="text-xs font-bold text-foreground">{formatBRL(summary.valorBruto)}</p>
              </div>
              <div>
                <p className="text-[9px] text-muted-foreground uppercase tracking-wider">Custos</p>
                <p className="text-xs font-bold text-red-400">-{formatBRL(summary.custoPecas)}</p>
              </div>
              <div>
                <p className="text-[9px] text-muted-foreground uppercase tracking-wider">Taxas</p>
                <p className="text-xs font-bold text-red-400">-{formatBRL(summary.taxaVal)}</p>
              </div>
              <div>
                <p className="text-[9px] text-muted-foreground uppercase tracking-wider">Lucro</p>
                <p className={`text-xs font-bold ${summary.lucroBruto >= 0 ? "text-emerald-500" : "text-red-400"}`}>
                  {formatBRL(summary.lucroBruto)}
                </p>
              </div>
            </div>
            <Button onClick={handleSave} className="w-full h-10 bg-primary text-primary-foreground hover:bg-primary/90 font-semibold text-sm gap-2" style={{ boxShadow: "0 0 20px rgba(245,158,11,0.25)" }}>
              <Save className="h-4 w-4" /> Salvar Lançamento
            </Button>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default LaunchManual;
