import { useState, useRef, useEffect } from "react";
import { Camera, Mic, MicOff, Pencil, Receipt, Send, X, Image, Loader2, Check, Paperclip, Plus } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import odbLogo from "@/assets/odb-logo.png";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

type MessageType = "user" | "odb" | "system";

interface ChatMessage {
  id: string;
  type: MessageType;
  content: string;
  timestamp: Date;
  imageUrl?: string;
  audioUrl?: string;
  card?: ODBCard | null;
  buttons?: ChatButton[];
  isDespesa?: boolean;
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
  const [textInput, setTextInput] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [showDespesaMenu, setShowDespesaMenu] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const recognitionRef = useRef<any>(null);
  const [transcript, setTranscript] = useState("");
  const lastCardRef = useRef<{ card: ODBCard | null; veiculo: any }>(null);

  const isGerente = profile?.role === "gerente";

  useEffect(() => {
    if (messages.length === 0) {
      setMessages([
        {
          id: "welcome",
          type: "odb",
          content: `Olá${profile?.nome ? `, ${profile.nome}` : ""}! 👋\n\nSou o Agente ODB — seu assistente inteligente.\n\n📸 Envie uma foto do orçamento\n🎤 Grave um áudio descrevendo o serviço\n✍️ Ou simplesmente digite\n💸 Clique no ícone de despesa para registrar saídas`,
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

  // ── FILE HANDLING ──
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve((reader.result as string).split(",")[1]);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    addMessage({ type: "user", content: "📸 Foto do orçamento", imageUrl: url });
    setShowAttachMenu(false);
    try {
      const base64 = await fileToBase64(file);
      processWithODB("foto", "", base64, file.type);
    } catch {
      processWithODB("foto", "Foto enviada para análise");
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // ── AUDIO RECORDING ──
  const handleStartRecording = async () => {
    setShowAttachMenu(false);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];
      mediaRecorder.ondataavailable = (e) => chunksRef.current.push(e.data);
      mediaRecorder.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
      };
      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      setTranscript("");
      timerRef.current = setInterval(() => setRecordingTime((t) => t + 1), 1000);

      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = "pt-BR";
        recognition.onresult = (event: any) => {
          let full = "";
          for (let i = 0; i < event.results.length; i++) full += event.results[i][0].transcript;
          setTranscript(full);
        };
        recognition.start();
        recognitionRef.current = recognition;
      }
    } catch {
      toast.error("Não foi possível acessar o microfone.");
    }
  };

  const handleStopRecording = () => {
    mediaRecorderRef.current?.stop();
    recognitionRef.current?.stop();
    setIsRecording(false);
    if (timerRef.current) clearInterval(timerRef.current);
    const finalTranscript = transcript || "Áudio sem transcrição detectada";
    addMessage({ type: "user", content: `🎤 ${finalTranscript}` });
    processWithODB("audio", finalTranscript);
  };

  // ── TEXT SUBMIT ──
  const handleTextSubmit = () => {
    if (!textInput.trim()) return;
    addMessage({ type: "user", content: textInput });
    const text = textInput;
    setTextInput("");
    processWithODB("texto", text);
  };

  // ── DESPESA ──
  const handleDespesaSelect = (categoria: string) => {
    setShowDespesaMenu(false);
    addMessage({ type: "user", content: `💸 Despesa: ${categoria}`, isDespesa: true });
    addMessage({
      type: "odb",
      content: `Certo! Despesa de **${categoria}**.\n\nQual o valor?`,
      buttons: [
        { label: "Informar valor", value: "valor_despesa", variant: "primary" },
      ],
    });
  };

  // ── BUTTON ACTIONS ──
  const handleButtonClick = (button: ChatButton) => {
    addMessage({ type: "user", content: button.label });

    if (button.value === "entrada") {
      addMessage({
        type: "odb",
        content: "Salvo como serviço em andamento! 🔔\n\nQuando o carro ficar pronto, abra aqui que eu lembro de tudo.",
      });
    } else if (button.value === "pagamento") {
      addMessage({
        type: "odb",
        content: "Como foi o pagamento?",
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
      const resumo = `Salvo! 🎉\n\n💰 Total via ${metodo}\n${!isGerente ? "📊 Margem calculada automaticamente\n⚡ Ganho/hora registrado" : ""}\n\n💪 Bom serviço!`;
      addMessage({
        type: "odb",
        content: resumo,
        buttons: [
          { label: "📋 Ver Histórico", value: "historico", variant: "default" },
          { label: "🔄 Novo Lançamento", value: "novo", variant: "primary" },
        ],
      });
    } else if (button.value === "novo") {
      setMessages([{
        id: crypto.randomUUID(),
        type: "odb",
        content: "Pronto para o próximo! 🚀",
        timestamp: new Date(),
      }]);
    }
  };

  // ── AI PROCESSING ──
  const processWithODB = async (fonte: string, content: string, imageBase64?: string, mimeType?: string) => {
    setIsProcessing(true);
    try {
      const body: any = { tipo: fonte };
      if (fonte === "foto" && imageBase64) {
        body.imageBase64 = imageBase64;
        body.mimeType = mimeType || "image/jpeg";
      } else {
        body.conteudo = content;
      }

      const { data, error } = await supabase.functions.invoke("odb-processar", { body });
      if (error) throw error;

      const result = data?.result;
      if (!result || result.raw) {
        addMessage({ type: "odb", content: `Não consegui analisar completamente. ${result?.raw || "Tente novamente."}` });
        setIsProcessing(false);
        return;
      }

      const allDianteira = (result.itens_dianteira || []).map((it: any) => ({
        descricao: it.descricao, tipo: it.tipo, valor: it.valor_cobrado || 0, confianca: it.confianca || "media",
      }));
      const allTraseira = (result.itens_traseira || []).map((it: any) => ({
        descricao: it.descricao, tipo: it.tipo, valor: it.valor_cobrado || 0, confianca: it.confianca || "media",
      }));
      const allGeral = (result.itens_geral || []).map((it: any) => ({
        descricao: it.descricao, tipo: it.tipo, valor: it.valor_cobrado || 0, confianca: it.confianca || "media",
      }));

      const allItems = [...allDianteira, ...allTraseira, ...allGeral];
      const subtotal = result.valor_total || allItems.reduce((s: number, i: any) => s + (i.valor || 0), 0);

      const card: ODBCard = {
        cliente: result.cliente?.nome ? { nome: result.cliente.nome, confianca: result.cliente.confianca || "media" } : undefined,
        veiculo: result.veiculo?.marca ? {
          marca: result.veiculo.marca, modelo: result.veiculo.modelo || "",
          ano: result.veiculo.ano, placa: result.veiculo.placa,
          confianca: result.veiculo.confianca || "media",
        } : undefined,
        itens_dianteira: allDianteira.length > 0 ? allDianteira : (allGeral.length > 0 ? allGeral : undefined),
        itens_traseira: allTraseira.length > 0 ? allTraseira : undefined,
        subtotal,
        status: "aguardando",
      };

      let extraContent = "Entendi! Aqui está o que identifiquei:";
      if (result.transcricao) extraContent = `📝 "${result.transcricao}"\n\n${extraContent}`;
      if (result.correcoes_feitas?.length > 0) {
        extraContent += `\n\n🔧 Correções: ${result.correcoes_feitas.map((c: any) => `${c.original} → ${c.corrigido}`).join(", ")}`;
      }

      const buttons: ChatButton[] = result.metodo_pagamento
        ? [
            { label: "✅ Confirmar e Salvar", value: "pagamento_direto_" + result.metodo_pagamento, variant: "success" },
            { label: "✏️ Editar", value: "pagamento", variant: "default" },
          ]
        : [
            { label: "⏳ Entrada", value: "entrada", variant: "default" },
            { label: "💰 Pagamento", value: "pagamento", variant: "primary" },
          ];

      // Store card data for learning when confirmed
      lastCardRef.current = {
        card,
        veiculo: result.veiculo ? { marca: result.veiculo.marca, modelo: result.veiculo.modelo } : null,
      };

      addMessage({ type: "odb", content: extraContent, card, buttons });
    } catch (e: any) {
      console.error("ODB error:", e);
      toast.error(e?.message || "Erro ao processar com IA");
      addMessage({ type: "odb", content: "😅 Desculpa, tive um problema. Tente novamente." });
    } finally {
      setIsProcessing(false);
    }
  };

  const formatTime = (s: number) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  const confiancaBadge = (c: string) => {
    if (c === "alta") return <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 font-medium">Alta</span>;
    if (c === "media") return <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-yellow-500/15 text-yellow-400 font-medium">Média</span>;
    return <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-red-500/15 text-red-400 font-medium">Baixa</span>;
  };

  const tipoBadge = (t: string) => {
    const map: Record<string, { label: string; cls: string }> = {
      peca_fabricada: { label: "Fabricada", cls: "text-emerald-400 bg-emerald-500/10" },
      peca_comprada: { label: "Comprada", cls: "text-blue-400 bg-blue-500/10" },
      recuperacao: { label: "Recuperação", cls: "text-violet-400 bg-violet-500/10" },
    };
    const info = map[t] || { label: "Mão de obra", cls: "text-muted-foreground bg-secondary/30" };
    return <span className={`text-[9px] px-1.5 py-0.5 rounded ${info.cls}`}>{info.label}</span>;
  };

  return (
    <div className="flex flex-col h-[calc(100vh-7.5rem)] md:h-[calc(100vh-4.5rem)] -mx-3 md:-mx-4 -mt-3 md:-mt-4">
      {/* Compact header */}
      <div className="flex items-center gap-3 px-4 py-2.5 border-b border-border/20" style={{ background: "rgba(7,11,20,0.8)", backdropFilter: "blur(20px)" }}>
        <motion.div
          className="flex h-9 w-9 items-center justify-center rounded-full overflow-hidden border border-primary/25"
          animate={{ borderColor: ["hsl(var(--primary) / 0.15)", "hsl(var(--primary) / 0.4)", "hsl(var(--primary) / 0.15)"] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <img src={odbLogo} alt="ODB" className="h-8 w-8 object-contain" />
        </motion.div>
        <div className="flex-1 min-w-0">
          <h2 className="text-sm font-bold text-foreground leading-tight">Agente ODB</h2>
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span className="text-[10px] text-muted-foreground">Online • Assistente inteligente</span>
          </div>
        </div>
        <span className="text-[10px] text-muted-foreground bg-secondary/40 px-2 py-1 rounded-full shrink-0">🧠 IA</span>
      </div>

      {/* Chat messages area */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3 scrollbar-none">
        <AnimatePresence>
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className={`flex ${msg.type === "user" ? "justify-end" : "justify-start"}`}
            >
              <div className={`max-w-[88%] ${msg.type === "user" ? "" : ""}`}>
                {/* ODB avatar + name */}
                {msg.type === "odb" && (
                  <div className="flex items-center gap-1.5 mb-1 ml-1">
                    <img src={odbLogo} alt="ODB" className="h-3.5 w-3.5 object-contain" />
                    <span className="text-[10px] font-semibold text-primary">ODB</span>
                  </div>
                )}

                <div
                  className={`rounded-2xl px-3.5 py-2.5 text-[13px] leading-relaxed ${
                    msg.type === "user"
                      ? msg.isDespesa
                        ? "bg-red-500/15 text-foreground border border-red-500/20 rounded-br-sm"
                        : "bg-primary/15 text-foreground border border-primary/20 rounded-br-sm"
                      : "bg-secondary/50 text-foreground border border-border/15 rounded-bl-sm"
                  }`}
                >
                  {msg.imageUrl && (
                    <img src={msg.imageUrl} alt="foto" className="rounded-lg mb-2 max-h-40 w-full object-cover" />
                  )}

                  <p className="whitespace-pre-line">{msg.content}</p>

                  {/* ODB Card */}
                  {msg.card && (
                    <div className="mt-3 space-y-2 bg-background/30 rounded-xl p-3 border border-border/20">
                      {msg.card.cliente && (
                        <div className="flex items-center gap-2">
                          <span className="text-sm">👤</span>
                          <span className="font-semibold text-[12px]">{msg.card.cliente.nome}</span>
                          {confiancaBadge(msg.card.cliente.confianca)}
                        </div>
                      )}
                      {msg.card.veiculo && (
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm">🚗</span>
                          <span className="text-[12px]">{msg.card.veiculo.marca} {msg.card.veiculo.modelo} {msg.card.veiculo.ano}</span>
                          {msg.card.veiculo.placa && <span className="text-[10px] text-muted-foreground">• {msg.card.veiculo.placa}</span>}
                          {confiancaBadge(msg.card.veiculo.confianca)}
                        </div>
                      )}

                      {msg.card.itens_dianteira && msg.card.itens_dianteira.length > 0 && (
                        <div className="space-y-1">
                          <p className="text-[9px] font-bold text-primary/70 uppercase tracking-widest">Dianteira</p>
                          {msg.card.itens_dianteira.map((item, i) => (
                            <div key={i} className="flex items-center justify-between py-0.5">
                              <div className="flex items-center gap-1.5 flex-1 min-w-0">
                                <span className="text-[11px] text-foreground truncate">{item.descricao}</span>
                                {tipoBadge(item.tipo)}
                              </div>
                              <span className="text-[11px] font-bold text-foreground ml-2 tabular-nums">R$ {item.valor.toFixed(2)}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {msg.card.itens_traseira && msg.card.itens_traseira.length > 0 && (
                        <div className="space-y-1">
                          <p className="text-[9px] font-bold text-primary/70 uppercase tracking-widest">Traseira</p>
                          {msg.card.itens_traseira.map((item, i) => (
                            <div key={i} className="flex items-center justify-between py-0.5">
                              <div className="flex items-center gap-1.5 flex-1 min-w-0">
                                <span className="text-[11px] text-foreground truncate">{item.descricao}</span>
                                {tipoBadge(item.tipo)}
                              </div>
                              <span className="text-[11px] font-bold text-foreground ml-2 tabular-nums">R$ {item.valor.toFixed(2)}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {msg.card.subtotal != null && msg.card.subtotal > 0 && (
                        <div className="flex items-center justify-between pt-2 border-t border-primary/15">
                          <span className="text-[11px] font-bold text-primary">TOTAL</span>
                          <span className="text-[13px] font-bold text-foreground tabular-nums">R$ {msg.card.subtotal.toFixed(2)}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Buttons */}
                  {msg.buttons && msg.buttons.length > 0 && (
                    <div className="mt-2.5 flex flex-wrap gap-1.5">
                      {msg.buttons.map((btn, i) => (
                        <button
                          key={i}
                          onClick={() => handleButtonClick(btn)}
                          className={`px-3 py-1.5 rounded-full text-[11px] font-medium border transition-all active:scale-95 ${
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
                </div>

                <p className={`text-[9px] text-muted-foreground/60 mt-0.5 ${msg.type === "user" ? "text-right mr-1" : "ml-1"}`}>
                  {msg.timestamp.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Processing indicator */}
        {isProcessing && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
            <div className="bg-secondary/50 border border-border/15 rounded-2xl rounded-bl-sm px-4 py-3">
              <div className="flex items-center gap-2">
                <div className="flex gap-1">
                  {[0, 1, 2].map((i) => (
                    <motion.div
                      key={i}
                      className="w-2 h-2 rounded-full bg-primary"
                      animate={{ scale: [0.8, 1.2, 0.8], opacity: [0.4, 1, 0.4] }}
                      transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.15 }}
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

      {/* Despesa category popup */}
      <AnimatePresence>
        {showDespesaMenu && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="mx-3 mb-2 p-3 rounded-2xl border border-border/20 bg-card/95 backdrop-blur-xl"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-foreground">Tipo de despesa</span>
              <button onClick={() => setShowDespesaMenu(false)} className="text-muted-foreground hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              {despesaCategorias.map((cat) => (
                <button
                  key={cat.label}
                  onClick={() => handleDespesaSelect(cat.label)}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl bg-secondary/40 border border-border/15 text-[11px] text-foreground hover:bg-secondary/60 transition-all active:scale-95 text-left"
                >
                  <span className="text-base">{cat.icon}</span>
                  <span className="truncate">{cat.label}</span>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Attach menu popup */}
      <AnimatePresence>
        {showAttachMenu && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            className="mx-3 mb-2 flex gap-3"
          >
            <button
              onClick={() => { fileInputRef.current?.click(); }}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-medium hover:bg-blue-500/20 transition-all active:scale-95"
            >
              <Camera className="h-4 w-4" />
              Câmera
            </button>
            <button
              onClick={() => {
                if (fileInputRef.current) {
                  fileInputRef.current.removeAttribute("capture");
                  fileInputRef.current.click();
                }
              }}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-violet-500/10 border border-violet-500/20 text-violet-400 text-xs font-medium hover:bg-violet-500/20 transition-all active:scale-95"
            >
              <Image className="h-4 w-4" />
              Galeria
            </button>
            <button
              onClick={() => setShowAttachMenu(false)}
              className="flex items-center justify-center w-10 rounded-xl bg-secondary/40 border border-border/20 text-muted-foreground hover:text-foreground transition-all"
            >
              <X className="h-4 w-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Recording overlay */}
      <AnimatePresence>
        {isRecording && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mx-3 mb-2 p-4 rounded-2xl border border-red-500/20 bg-card/95 backdrop-blur-xl"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <motion.div
                  className="w-3 h-3 rounded-full bg-red-500"
                  animate={{ opacity: [1, 0.3, 1] }}
                  transition={{ duration: 1, repeat: Infinity }}
                />
                <span className="text-lg font-mono font-bold text-foreground tabular-nums">{formatTime(recordingTime)}</span>
                <div className="flex gap-0.5">
                  {[...Array(5)].map((_, i) => (
                    <motion.div
                      key={i}
                      animate={{ scaleY: [1, 2, 1] }}
                      transition={{ repeat: Infinity, duration: 0.35, delay: i * 0.07 }}
                      className="h-4 w-0.5 rounded-full bg-red-400 origin-center"
                    />
                  ))}
                </div>
              </div>
              <button
                onClick={handleStopRecording}
                className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-red-500/15 border border-red-500/25 text-red-400 text-xs font-semibold hover:bg-red-500/25 transition-all active:scale-95"
              >
                <MicOff className="h-3.5 w-3.5" />
                Parar
              </button>
            </div>
            {transcript && (
              <p className="text-[11px] text-muted-foreground mt-2 italic truncate">"{transcript}"</p>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── INPUT BAR ── ChatGPT style */}
      {!isRecording && (
        <div className="px-3 pb-2 pt-1.5 border-t border-border/15" style={{ background: "rgba(7,11,20,0.9)", backdropFilter: "blur(20px)" }}>
          <div className="flex items-end gap-1.5">
            {/* Attach button */}
            <button
              onClick={() => { setShowAttachMenu(!showAttachMenu); setShowDespesaMenu(false); }}
              className={`flex items-center justify-center h-10 w-10 shrink-0 rounded-full transition-all ${
                showAttachMenu ? "bg-primary/15 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-secondary/40"
              }`}
            >
              <Plus className={`h-5 w-5 transition-transform ${showAttachMenu ? "rotate-45" : ""}`} />
            </button>

            {/* Despesa button */}
            <button
              onClick={() => { setShowDespesaMenu(!showDespesaMenu); setShowAttachMenu(false); }}
              className={`flex items-center justify-center h-10 w-10 shrink-0 rounded-full transition-all ${
                showDespesaMenu ? "bg-red-500/15 text-red-400" : "text-muted-foreground hover:text-foreground hover:bg-secondary/40"
              }`}
              title="Registrar despesa"
            >
              <Receipt className="h-4.5 w-4.5" />
            </button>

            {/* Text input */}
            <div className="flex-1 relative">
              <input
                ref={inputRef}
                type="text"
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleTextSubmit()}
                placeholder="Descreva o serviço..."
                className="w-full h-10 px-4 rounded-full bg-secondary/40 border border-border/20 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-primary/30 focus:ring-1 focus:ring-primary/20 transition-all"
                style={{ fontSize: 16 }}
                disabled={isProcessing}
              />
            </div>

            {/* Mic or Send button */}
            {textInput.trim() ? (
              <motion.button
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                onClick={handleTextSubmit}
                className="flex items-center justify-center h-10 w-10 shrink-0 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition-all active:scale-90"
                style={{ boxShadow: "0 0 12px hsl(var(--primary) / 0.3)" }}
              >
                <Send className="h-4 w-4" />
              </motion.button>
            ) : (
              <button
                onClick={handleStartRecording}
                disabled={isProcessing}
                className="flex items-center justify-center h-10 w-10 shrink-0 rounded-full text-muted-foreground hover:text-foreground hover:bg-secondary/40 transition-all disabled:opacity-40"
              >
                <Mic className="h-5 w-5" />
              </button>
            )}
          </div>
        </div>
      )}

      <input ref={fileInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFileSelected} />
    </div>
  );
};

export default ODBPage;
