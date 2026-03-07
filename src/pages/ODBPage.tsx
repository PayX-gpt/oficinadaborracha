import { useState, useRef, useEffect } from "react";
import { Camera, Mic, Pencil, Receipt, Sparkles, Send, X, Image, Loader2, Check, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

type MessageType = "user" | "odb" | "system";
type InputMode = null | "foto" | "audio" | "texto" | "despesa";

interface ChatMessage {
  id: string;
  type: MessageType;
  content: string;
  timestamp: Date;
  imageUrl?: string;
  audioUrl?: string;
  card?: ODBCard | null;
  buttons?: ChatButton[];
}

interface ChatButton {
  label: string;
  value: string;
  icon?: string;
  variant?: "default" | "primary" | "success";
}

interface ODBCardItem {
  descricao: string;
  tipo: string;
  valor: number;
  confianca: string;
}

interface ODBCard {
  cliente?: { nome: string; confianca: string };
  veiculo?: { marca: string; modelo: string; ano?: number; placa?: string; confianca: string };
  itens_dianteira?: ODBCardItem[];
  itens_traseira?: ODBCardItem[];
  subtotal?: number;
  status?: "aguardando" | "confirmado";
}

const actionButtons = [
  { mode: "foto" as InputMode, label: "Foto", icon: Camera, color: "text-blue-400", bg: "bg-blue-500/10 border-blue-500/20" },
  { mode: "audio" as InputMode, label: "Áudio", icon: Mic, color: "text-violet-400", bg: "bg-violet-500/10 border-violet-500/20" },
  { mode: "texto" as InputMode, label: "Texto", icon: Pencil, color: "text-primary", bg: "bg-primary/10 border-primary/20" },
  { mode: "despesa" as InputMode, label: "Despesa", icon: Receipt, color: "text-red-400", bg: "bg-red-500/10 border-red-500/20" },
];

const despesaCategorias = [
  { icon: "🔧", label: "Peças/Fornecedor" },
  { icon: "🧱", label: "Matéria-Prima" },
  { icon: "🏠", label: "Aluguel" },
  { icon: "⚡", label: "Energia/Água" },
  { icon: "👷", label: "Salário" },
  { icon: "🍽️", label: "Alimentação" },
  { icon: "🔨", label: "Ferramentas" },
  { icon: "🏛️", label: "Imposto/Contador" },
  { icon: "💰", label: "Aporte Sócio" },
  { icon: "📦", label: "Outros" },
];

const ODBPage = () => {
  const { profile } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMode, setInputMode] = useState<InputMode>(null);
  const [textInput, setTextInput] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isFormMode, setIsFormMode] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const isGerente = profile?.role === "gerente";

  useEffect(() => {
    if (messages.length === 0) {
      setMessages([
        {
          id: "welcome",
          type: "odb",
          content: `Olá${profile?.nome ? `, ${profile.nome}` : ""}! Sou o Agente ODB 🤖\n\nManda foto, áudio ou texto do serviço que eu organizo tudo.\nQuanto mais eu trabalho, mais inteligente fico!`,
          timestamp: new Date(),
        },
      ]);
    }
  }, [profile]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const addMessage = (msg: Omit<ChatMessage, "id" | "timestamp">) => {
    setMessages((prev) => [...prev, { ...msg, id: crypto.randomUUID(), timestamp: new Date() }]);
  };

  const handlePhotoCapture = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    addMessage({ type: "user", content: "📸 Foto do orçamento", imageUrl: url });
    setInputMode(null);
    processWithODB("foto", "Foto enviada para análise");
  };

  const handleStartRecording = () => {
    setIsRecording(true);
    setRecordingTime(0);
    timerRef.current = setInterval(() => setRecordingTime((t) => t + 1), 1000);
    toast.info("Gravando áudio...");
  };

  const handleStopRecording = () => {
    setIsRecording(false);
    if (timerRef.current) clearInterval(timerRef.current);
    addMessage({ type: "user", content: `🎤 Áudio gravado (${recordingTime}s)` });
    setInputMode(null);
    processWithODB("audio", "Áudio enviado para análise");
  };

  const handleTextSubmit = () => {
    if (!textInput.trim()) return;
    addMessage({ type: "user", content: textInput });
    const text = textInput;
    setTextInput("");
    setInputMode(null);
    processWithODB("texto", text);
  };

  const handleDespesaSelect = (categoria: string) => {
    addMessage({ type: "user", content: `📋 Despesa: ${categoria}` });
    setInputMode(null);
    addMessage({
      type: "odb",
      content: `Certo! Despesa de ${categoria}.\n\nQual o valor?`,
      buttons: [
        { label: "Informar valor", value: "valor_despesa", variant: "primary" },
      ],
    });
  };

  const handleButtonClick = (button: ChatButton) => {
    addMessage({ type: "user", content: button.label });

    if (button.value === "entrada") {
      addMessage({
        type: "odb",
        content: "Entendi! Salvei como serviço em andamento. 🔔\n\nQuando o carro ficar pronto, é só abrir aqui que eu lembro de tudo!\n\nO serviço vai aparecer na aba \"Em Andamento\" do Dashboard com destaque.",
      });
    } else if (button.value === "pagamento") {
      addMessage({
        type: "odb",
        content: "Quase lá! Só mais isso:",
        buttons: [
          { label: "PIX", value: "pix", variant: "success" },
          { label: "Dinheiro", value: "dinheiro", variant: "default" },
          { label: "Débito", value: "debito", variant: "default" },
          { label: "Crédito", value: "credito", variant: "default" },
          { label: "Misto", value: "misto", variant: "default" },
        ],
      });
    } else if (["pix", "dinheiro", "debito", "credito", "misto"].includes(button.value)) {
      const metodo = button.label;
      const resumo = `Salvo! 🎉\n\n═══ RESUMO FINAL ═══\n👤 Cliente • 🚗 Veículo\n\n💰 Total: R$ 730,00 via ${metodo}\n${!isGerente ? "📊 Lucro bruto: R$ 580,00 (margem 79.5%)\n⚡ Ganho/hora: R$ 121,50/h\n\n💪 Bom serviço! Margem acima da média." : ""}`;
      addMessage({
        type: "odb",
        content: resumo,
        buttons: [
          { label: "📋 Ver no Histórico", value: "historico", variant: "default" },
          { label: "🔄 Novo Lançamento", value: "novo", variant: "primary" },
        ],
      });
    } else if (button.value === "novo") {
      setMessages([
        {
          id: crypto.randomUUID(),
          type: "odb",
          content: `Pronto para o próximo! Manda foto, áudio ou texto. 🚀`,
          timestamp: new Date(),
        },
      ]);
    }
  };

  const processWithODB = (fonte: string, content: string) => {
    setIsProcessing(true);
    // Simulate ODB processing (will be replaced by real Gemini call in Phase 2)
    setTimeout(() => {
      setIsProcessing(false);
      const mockCard: ODBCard = {
        cliente: { nome: "João Silva", confianca: "alta" },
        veiculo: { marca: "Toyota", modelo: "Corolla", ano: 2020, placa: "ABC-1234", confianca: "alta" },
        itens_dianteira: [
          { descricao: "Bucha da bandeja inferior (par)", tipo: "peca_fabricada", valor: 180, confianca: "alta" },
          { descricao: "Coxim do amortecedor (par)", tipo: "peca_fabricada", valor: 120, confianca: "alta" },
          { descricao: "Mão de obra dianteira", tipo: "mao_de_obra", valor: 150, confianca: "alta" },
        ],
        itens_traseira: [
          { descricao: "Bucha do braço de suspensão (par)", tipo: "peca_fabricada", valor: 160, confianca: "alta" },
          { descricao: "Mão de obra traseira", tipo: "mao_de_obra", valor: 120, confianca: "alta" },
        ],
        subtotal: 730,
        status: "aguardando",
      };

      addMessage({
        type: "odb",
        content: "Entendi! Aqui está o que identifiquei:",
        card: mockCard,
        buttons: [
          { label: "⏳ Entrada — carro fica na oficina", value: "entrada", variant: "default" },
          { label: "💰 Pagamento — serviço concluído", value: "pagamento", variant: "primary" },
        ],
      });
    }, 2000);
  };

  const formatTime = (s: number) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  const confiancaBadge = (c: string) => {
    if (c === "alta") return <span className="text-[10px] text-emerald-400">✅ Alta</span>;
    if (c === "media") return <span className="text-[10px] text-yellow-400">🟡 Média</span>;
    return <span className="text-[10px] text-red-400">🔴 Baixa</span>;
  };

  const tipoBadge = (t: string) => {
    if (t === "peca_fabricada") return <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">🏭 Fabricada</span>;
    if (t === "peca_comprada") return <span className="text-[10px] text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded">🛒 Comprada</span>;
    if (t === "recuperacao") return <span className="text-[10px] text-violet-400 bg-violet-500/10 px-1.5 py-0.5 rounded">🔄 Recuperação</span>;
    return <span className="text-[10px] text-muted-foreground bg-secondary/30 px-1.5 py-0.5 rounded">🔧 Mão de obra</span>;
  };

  return (
    <div className="flex flex-col h-[calc(100vh-7.5rem)] md:h-[calc(100vh-4.5rem)]">
      {/* Header */}
      <div className="flex items-center justify-between px-1 pb-3">
        <div className="flex items-center gap-3">
          <motion.div
            className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/15 border border-primary/25"
            animate={{ borderColor: ["rgba(245,158,11,0.15)", "rgba(245,158,11,0.4)", "rgba(245,158,11,0.15)"] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <Sparkles className="h-5 w-5 text-primary" />
          </motion.div>
          <div>
            <h2 className="text-sm font-bold text-foreground">Agente ODB</h2>
            <p className="text-[10px] text-muted-foreground">Seu assistente inteligente</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-muted-foreground bg-secondary/30 px-2 py-1 rounded-full">🧠 0 serviços aprendidos</span>
          <div className="flex items-center bg-secondary/30 rounded-lg overflow-hidden border border-border/30">
            <button
              onClick={() => setIsFormMode(false)}
              className={`px-2.5 py-1 text-[10px] font-medium transition-colors ${!isFormMode ? "bg-primary/15 text-primary" : "text-muted-foreground"}`}
            >
              💬 Conversa
            </button>
            <button
              onClick={() => setIsFormMode(true)}
              className={`px-2.5 py-1 text-[10px] font-medium transition-colors ${isFormMode ? "bg-primary/15 text-primary" : "text-muted-foreground"}`}
            >
              📝 Formulário
            </button>
          </div>
        </div>
      </div>

      {isFormMode ? (
        // Redirect to manual form
        <div className="flex-1 flex flex-col items-center justify-center text-center p-6">
          <Sparkles className="h-12 w-12 text-primary/40 mb-4" />
          <p className="text-sm text-muted-foreground mb-4">
            O modo formulário usa a tela de lançamento manual com autocomplete inteligente do ODB.
          </p>
          <Button
            onClick={() => window.location.href = "/launch/manual"}
            className="bg-primary text-primary-foreground gap-2"
          >
            <Pencil className="h-4 w-4" /> Abrir Formulário
          </Button>
        </div>
      ) : (
        <>
          {/* Chat area */}
          <div className="flex-1 overflow-y-auto space-y-3 px-1 py-2 scrollbar-none">
            <AnimatePresence>
              {messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25 }}
                  className={`flex ${msg.type === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-[13px] leading-relaxed ${
                      msg.type === "user"
                        ? "bg-primary/15 text-foreground border border-primary/20 rounded-br-md"
                        : "bg-secondary/40 text-foreground border border-border/20 rounded-bl-md"
                    }`}
                  >
                    {msg.type === "odb" && (
                      <div className="flex items-center gap-1.5 mb-1.5">
                        <Sparkles className="h-3 w-3 text-primary" />
                        <span className="text-[10px] font-bold text-primary">Agente ODB</span>
                      </div>
                    )}

                    {msg.imageUrl && (
                      <img src={msg.imageUrl} alt="foto" className="rounded-lg mb-2 max-h-48 w-full object-cover" />
                    )}

                    <p className="whitespace-pre-line">{msg.content}</p>

                    {/* ODB Card */}
                    {msg.card && (
                      <div className="mt-3 space-y-2.5 bg-background/40 rounded-xl p-3 border border-border/30">
                        {msg.card.cliente && (
                          <div className="flex items-center gap-2">
                            <span>👤</span>
                            <span className="font-semibold text-[12px]">{msg.card.cliente.nome}</span>
                            {confiancaBadge(msg.card.cliente.confianca)}
                          </div>
                        )}
                        {msg.card.veiculo && (
                          <div className="flex items-center gap-2">
                            <span>🚗</span>
                            <span className="text-[12px]">{msg.card.veiculo.marca} {msg.card.veiculo.modelo} {msg.card.veiculo.ano}</span>
                            {msg.card.veiculo.placa && <span className="text-[10px] text-muted-foreground">• {msg.card.veiculo.placa}</span>}
                            {confiancaBadge(msg.card.veiculo.confianca)}
                          </div>
                        )}

                        {msg.card.itens_dianteira && msg.card.itens_dianteira.length > 0 && (
                          <div>
                            <p className="text-[10px] font-bold text-primary uppercase tracking-wider mb-1.5">═══ Dianteira ═══</p>
                            {msg.card.itens_dianteira.map((item, i) => (
                              <div key={i} className="flex items-center justify-between py-1 border-b border-border/10 last:border-0">
                                <div className="flex-1 min-w-0">
                                  <p className="text-[11px] text-foreground truncate">{item.descricao}</p>
                                  <div className="flex items-center gap-1.5 mt-0.5">{tipoBadge(item.tipo)}</div>
                                </div>
                                <span className="text-[12px] font-bold text-foreground ml-2 tabular-nums">R$ {item.valor.toFixed(2)}</span>
                              </div>
                            ))}
                          </div>
                        )}

                        {msg.card.itens_traseira && msg.card.itens_traseira.length > 0 && (
                          <div>
                            <p className="text-[10px] font-bold text-primary uppercase tracking-wider mb-1.5">═══ Traseira ═══</p>
                            {msg.card.itens_traseira.map((item, i) => (
                              <div key={i} className="flex items-center justify-between py-1 border-b border-border/10 last:border-0">
                                <div className="flex-1 min-w-0">
                                  <p className="text-[11px] text-foreground truncate">{item.descricao}</p>
                                  <div className="flex items-center gap-1.5 mt-0.5">{tipoBadge(item.tipo)}</div>
                                </div>
                                <span className="text-[12px] font-bold text-foreground ml-2 tabular-nums">R$ {item.valor.toFixed(2)}</span>
                              </div>
                            ))}
                          </div>
                        )}

                        {msg.card.subtotal && (
                          <div className="flex items-center justify-between pt-2 border-t border-primary/20">
                            <span className="text-[12px] font-bold text-primary">💰 SUBTOTAL</span>
                            <span className="text-[14px] font-bold text-foreground tabular-nums">R$ {msg.card.subtotal.toFixed(2)}</span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Action Buttons */}
                    {msg.buttons && msg.buttons.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {msg.buttons.map((btn, i) => (
                          <button
                            key={i}
                            onClick={() => handleButtonClick(btn)}
                            className={`px-3 py-1.5 rounded-lg text-[11px] font-medium border transition-all active:scale-95 ${
                              btn.variant === "primary"
                                ? "bg-primary/15 text-primary border-primary/25 hover:bg-primary/25"
                                : btn.variant === "success"
                                ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/25 hover:bg-emerald-500/25"
                                : "bg-secondary/30 text-foreground border-border/30 hover:bg-secondary/50"
                            }`}
                          >
                            {btn.label}
                          </button>
                        ))}
                      </div>
                    )}

                    <p className="text-[9px] text-muted-foreground mt-1.5">
                      {msg.timestamp.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {/* Processing indicator */}
            {isProcessing && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
                <div className="bg-secondary/40 border border-border/20 rounded-2xl rounded-bl-md px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-3 w-3 text-primary" />
                    <span className="text-[10px] font-bold text-primary">Agente ODB</span>
                  </div>
                  <div className="flex items-center gap-2 mt-1.5">
                    <div className="flex gap-1">
                      {[0, 1, 2].map((i) => (
                        <motion.div
                          key={i}
                          className="w-1.5 h-1.5 rounded-full bg-primary"
                          animate={{ opacity: [0.3, 1, 0.3] }}
                          transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                        />
                      ))}
                    </div>
                    <span className="text-[11px] text-muted-foreground">Analisando...</span>
                  </div>
                </div>
              </motion.div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input area */}
          <div className="border-t border-border/20 pt-3 pb-1">
            {/* Recording UI */}
            <AnimatePresence>
              {isRecording && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="flex flex-col items-center py-6"
                >
                  <motion.div
                    className="flex h-20 w-20 items-center justify-center rounded-full bg-primary mb-3"
                    animate={{ scale: [1, 1.1, 1], boxShadow: ["0 0 20px rgba(245,158,11,0.2)", "0 0 40px rgba(245,158,11,0.4)", "0 0 20px rgba(245,158,11,0.2)"] }}
                    transition={{ duration: 1, repeat: Infinity }}
                  >
                    <Mic className="h-8 w-8 text-primary-foreground" />
                  </motion.div>
                  <p className="text-lg font-bold text-foreground tabular-nums">{formatTime(recordingTime)}</p>
                  <p className="text-[11px] text-muted-foreground mt-1">Gravando... toque para parar</p>
                  <Button onClick={handleStopRecording} variant="outline" size="sm" className="mt-3 gap-1.5">
                    <Check className="h-3.5 w-3.5" /> Finalizar
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Text input mode */}
            {inputMode === "texto" && !isRecording && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mb-3">
                <div className="flex gap-2">
                  <Input
                    value={textInput}
                    onChange={(e) => setTextInput(e.target.value)}
                    placeholder="Descreva como quiser... Ex: 'Gol 2018 pastilha freio 120 pix'"
                    className="flex-1 bg-secondary/30 border-border/30 text-sm h-10"
                    style={{ fontSize: 16 }}
                    onKeyDown={(e) => e.key === "Enter" && handleTextSubmit()}
                    autoFocus
                  />
                  <Button onClick={handleTextSubmit} size="sm" className="h-10 w-10 p-0 bg-primary text-primary-foreground">
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
                <button onClick={() => setInputMode(null)} className="text-[10px] text-muted-foreground mt-1.5 hover:text-foreground">
                  ← Voltar
                </button>
              </motion.div>
            )}

            {/* Despesa category selection */}
            {inputMode === "despesa" && !isRecording && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mb-3">
                <p className="text-[11px] text-muted-foreground mb-2">Qual tipo de despesa?</p>
                <div className="grid grid-cols-2 gap-1.5">
                  {despesaCategorias.map((cat) => (
                    <button
                      key={cat.label}
                      onClick={() => handleDespesaSelect(cat.label)}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg bg-secondary/30 border border-border/20 text-[11px] text-foreground hover:bg-secondary/50 transition-colors text-left"
                    >
                      <span>{cat.icon}</span>
                      <span>{cat.label}</span>
                    </button>
                  ))}
                </div>
                <button onClick={() => setInputMode(null)} className="text-[10px] text-muted-foreground mt-1.5 hover:text-foreground">
                  ← Voltar
                </button>
              </motion.div>
            )}

            {/* Action buttons row */}
            {!inputMode && !isRecording && (
              <div className="flex gap-2">
                {actionButtons.map((btn) => {
                  const Icon = btn.icon;
                  return (
                    <motion.button
                      key={btn.label}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => {
                        if (btn.mode === "foto") handlePhotoCapture();
                        else if (btn.mode === "audio") handleStartRecording();
                        else setInputMode(btn.mode);
                      }}
                      className={`flex-1 flex items-center justify-center gap-1.5 h-12 rounded-xl border ${btn.bg} transition-all hover:scale-[1.02]`}
                    >
                      <Icon className={`h-4 w-4 ${btn.color}`} />
                      <span className={`text-[11px] font-semibold ${btn.color}`}>{btn.label}</span>
                    </motion.button>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}

      <input ref={fileInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFileSelected} />
    </div>
  );
};

export default ODBPage;
