import { useState, useRef, useEffect, useCallback } from "react";
import { Camera, Mic, MicOff, Send, X, Image, Loader2, Plus, User, Car, FileText, Brain, Search, Settings, Database, CheckCircle2, Package } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import odbLogo from "@/assets/odb-logo.png";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import ReactMarkdown from "react-markdown";
import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent } from "@/components/ui/dialog";

// ── TYPES ──
interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  imageUrl?: string;
  hasImage?: boolean;
  tipoAcao?: string;
  dados?: any;
  salvar?: boolean;
  botoes?: Array<{ label: string; value: string; variant?: string }>;
}

// ── LOADING STEPS ──
const LOADING_STEPS = [
  { icon: Camera, text: "Recebendo...", color: "text-blue-400" },
  { icon: Search, text: "Analisando conteúdo...", color: "text-violet-400" },
  { icon: Settings, text: "Identificando peças e valores...", color: "text-amber-400" },
  { icon: Database, text: "Cruzando com banco de dados...", color: "text-emerald-400" },
  { icon: CheckCircle2, text: "Pronto!", color: "text-emerald-400" },
];

const ODBPage = () => {
  const { profile } = useAuth();
  const { data: filiais = [] } = useQuery({
    queryKey: ["filiais-odb"],
    queryFn: async () => { const { data } = await supabase.from("filiais").select("id, nome").eq("ativa", true); return data || []; },
    staleTime: 60000,
  });
  const filialNome = filiais.find(f => f.id === profile?.filial_id)?.nome || null;

  // Fetch active cars for welcome message
  const { data: carrosAtivos = [] } = useQuery({
    queryKey: ["carros-ativos-odb"],
    queryFn: async () => {
      const { data } = await supabase
        .from("lancamentos")
        .select("id, cliente_nome, veiculo_desc, placa, created_at, valor_bruto")
        .eq("status", "em_andamento")
        .order("created_at", { ascending: false })
        .limit(10);
      return data || [];
    },
    staleTime: 30000,
  });

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [textInput, setTextInput] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [fullscreenImage, setFullscreenImage] = useState<string | null>(null);

  const [pendingImageBase64, setPendingImageBase64] = useState<string | null>(null);
  const [pendingImageMime, setPendingImageMime] = useState<string>("image/jpeg");
  const [pendingImageUrl, setPendingImageUrl] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const recognitionRef = useRef<any>(null);
  const loadingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Build welcome message based on active cars
  const buildWelcomeMessage = useCallback(() => {
    const now = new Date();
    let content = `👋 Olá${profile?.nome ? `, ${profile.nome}` : ""}!`;

    if (carrosAtivos.length > 0) {
      content += ` Você tem **${carrosAtivos.length} carro${carrosAtivos.length > 1 ? "s" : ""} em andamento** hoje:\n\n`;
      carrosAtivos.forEach(c => {
        const dias = Math.floor((now.getTime() - new Date(c.created_at).getTime()) / (1000 * 60 * 60 * 24));
        const alerta = dias >= 3 ? ` ⚠️ ${dias} dias!` : dias >= 1 ? ` (${dias} dia${dias > 1 ? "s" : ""})` : "";
        content += `• **${c.veiculo_desc || "Veículo"}** — ${c.cliente_nome || "Cliente"}${c.placa ? ` [${c.placa}]` : ""}${alerta}\n`;
      });
      content += `\nAlgum ficou pronto? Ou quer registrar algo novo?`;
    } else {
      content += ` Tudo tranquilo por aqui. Mande uma foto, áudio ou texto para registrar um serviço.`;
    }
    return content;
  }, [profile?.nome, carrosAtivos]);

  // Welcome message
  useEffect(() => {
    if (messages.length === 0 && profile) {
      setMessages([{
        id: "welcome",
        role: "assistant",
        content: buildWelcomeMessage(),
        timestamp: new Date(),
        botoes: [
          { label: "📷 Foto", value: "action_foto", variant: "primary" },
          { label: "🎙️ Áudio", value: "action_audio" },
          { label: "📋 Nota de peças", value: "action_nota" },
          { label: "💸 Despesa", value: "action_despesa" },
        ],
      }]);
    }
  }, [profile, carrosAtivos]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loadingStep]);

  // Loading step animation
  useEffect(() => {
    if (isProcessing) {
      setLoadingStep(0);
      let step = 0;
      loadingIntervalRef.current = setInterval(() => {
        step++;
        if (step < LOADING_STEPS.length) {
          setLoadingStep(step);
        }
      }, 1200);
    } else {
      if (loadingIntervalRef.current) clearInterval(loadingIntervalRef.current);
      setLoadingStep(0);
    }
    return () => { if (loadingIntervalRef.current) clearInterval(loadingIntervalRef.current); };
  }, [isProcessing]);

  // ── HELPERS ──
  const addUserMessage = (content: string, extras?: Partial<ChatMessage>) => {
    const msg: ChatMessage = { id: crypto.randomUUID(), role: "user", content, timestamp: new Date(), ...extras };
    setMessages(prev => [...prev, msg]);
    return msg;
  };

  const addAssistantMessage = (data: any) => {
    const msg: ChatMessage = {
      id: crypto.randomUUID(), role: "assistant",
      content: data.mensagem || data.content || "",
      timestamp: new Date(),
      tipoAcao: data.tipo_acao, dados: data.dados, salvar: data.salvar, botoes: data.botoes,
    };
    setMessages(prev => [...prev, msg]);
    return msg;
  };

  const buildHistory = useCallback(() => {
    return messages.slice(-20).map(m => ({
      role: m.role === "assistant" ? "assistant" : "user",
      content: m.role === "assistant"
        ? JSON.stringify({ mensagem: m.content, tipo_acao: m.tipoAcao, dados: m.dados, salvar: m.salvar })
        : m.content,
      hasImage: !!m.hasImage,
    }));
  }, [messages]);

  // ── SEND TO AI ──
  const sendToODB = async (userContent: string, imageBase64?: string, imageMime?: string) => {
    setIsProcessing(true);
    try {
      const history = [
        ...buildHistory(),
        { role: "user", content: userContent, hasImage: !!imageBase64, isLatest: true },
      ];

      const body: any = { history, filial_id: profile?.filial_id || null, filial_nome: filialNome || null };
      if (imageBase64) { body.imageBase64 = imageBase64; body.mimeType = imageMime || "image/jpeg"; }

      const { data, error } = await supabase.functions.invoke("odb-processar", { body });

      if (error) {
        const errorMsg = (error as any)?.message || "Erro ao processar";
        if (errorMsg.includes("429") || errorMsg.includes("rate")) toast.error("Muitas requisições. Aguarde um momento.");
        else if (errorMsg.includes("402")) toast.error("Créditos de IA insuficientes.");
        throw error;
      }

      const result = data?.result;
      if (!result) { addAssistantMessage({ mensagem: "Não consegui processar. Tente novamente.", tipo_acao: "pergunta" }); return; }

      // Auto-save if salvar is true
      if (result.salvar && result.dados) {
        await saveData(result.tipo_acao, result.dados);
        result.mensagem = (result.mensagem || "") + "\n\n✅ **Salvo com sucesso!** 🎉";
        result.salvar = false;
        result.botoes = [{ label: "🔄 Novo lançamento", value: "novo", variant: "primary" }];

        // Learning
        if (result.tipo_acao === "saida" && result.dados) {
          const allItems = [...(result.dados.itens_dianteira || []), ...(result.dados.itens_traseira || []), ...(result.dados.itens_geral || [])].filter((i: any) => i.valor_cobrado > 0);
          if (allItems.length > 0) {
            supabase.functions.invoke("odb-processar", {
              body: { salvar_aprendizado: true, itens_confirmados: allItems.map((i: any) => ({ descricao: i.descricao, tipo: i.tipo, valor_cobrado: i.valor_cobrado, custo: i.custo_estimado || 0 })), veiculo_info: result.dados.veiculo },
            }).catch(err => console.error("Learning error:", err));
          }
        }
      }

      addAssistantMessage(result);
    } catch (e: any) {
      console.error("ODB error:", e);
      addAssistantMessage({ mensagem: "Ocorreu um erro. Tente novamente.", tipo_acao: "pergunta" });
    } finally {
      setIsProcessing(false);
    }
  };

  // ── SAVE DATA TO DB ──
  const saveData = async (tipoAcao: string, dados: any) => {
    const userId = profile?.id;
    if (!userId) return;

    if (tipoAcao === "entrada" || tipoAcao === "saida" || tipoAcao === "confirmacao") {
      const status = (tipoAcao === "entrada" || dados.status === "em_andamento") ? "em_andamento" : "finalizado";
      const allItems = [
        ...(dados.itens_dianteira || []).map((i: any) => ({ ...i, posicao: "dianteira" })),
        ...(dados.itens_traseira || []).map((i: any) => ({ ...i, posicao: "traseira" })),
        ...(dados.itens_geral || []).map((i: any) => ({ ...i, posicao: "geral" })),
        ...(dados.servicos_previstos || []).map((i: any) => ({ descricao: i.descricao, tipo: "mao_de_obra", valor_cobrado: 0, custo_estimado: 0, posicao: i.posicao || "geral" })),
      ];
      const valorBruto = dados.valor_total || allItems.reduce((s: number, i: any) => s + (i.valor_cobrado || 0), 0);
      const desconto = dados.desconto || 0;
      const custoTotal = allItems.reduce((s: number, i: any) => s + (i.custo_estimado || 0), 0);

      let clienteId = null;
      if (dados.cliente?.nome) {
        const { data: existing } = await supabase.from("clientes").select("id").ilike("nome", dados.cliente.nome).maybeSingle();
        if (existing) { clienteId = existing.id; }
        else { const { data: newC } = await supabase.from("clientes").insert({ nome: dados.cliente.nome, telefone: dados.cliente.telefone, created_by: userId }).select("id").single(); clienteId = newC?.id || null; }
      }

      let veiculoId = null;
      let veiculoDesc = "";
      if (dados.veiculo?.marca) {
        veiculoDesc = `${dados.veiculo.marca} ${dados.veiculo.modelo || ""} ${dados.veiculo.ano || ""}`.trim();
        const placa = dados.veiculo.placa?.toUpperCase() || null;
        if (placa) {
          const { data: existing } = await supabase.from("veiculos").select("id").eq("placa", placa).maybeSingle();
          if (existing) { veiculoId = existing.id; }
          else { const { data: newV } = await supabase.from("veiculos").insert({ marca: dados.veiculo.marca, modelo: dados.veiculo.modelo || "", ano: dados.veiculo.ano?.toString(), placa, cliente_id: clienteId }).select("id").single(); veiculoId = newV?.id || null; }
        }
      }

      const { data: lancamento } = await supabase.from("lancamentos").insert({
        user_id: userId, filial_id: profile?.filial_id || null,
        cliente_id: clienteId, cliente_nome: dados.cliente?.nome || null,
        veiculo_id: veiculoId, veiculo_desc: veiculoDesc || null,
        placa: dados.veiculo?.placa?.toUpperCase() || null,
        valor_bruto: valorBruto, desconto, custo_total: custoTotal,
        valor_liquido: valorBruto - desconto, lucro: valorBruto - desconto - custoTotal,
        metodo_pagamento: dados.metodo_pagamento || null,
        status, fonte: "ia", tipo: "servico",
        hora_entrada: status === "em_andamento" ? new Date().toISOString() : null,
      }).select("id").single();

      if (lancamento && allItems.length > 0) {
        await supabase.from("lancamento_items").insert(
          allItems.map((item: any) => ({
            lancamento_id: lancamento.id, descricao: item.descricao,
            tipo: item.tipo || "mao_de_obra", valor_cobrado: item.valor_cobrado || 0,
            custo: item.custo_estimado || 0, posicao: item.posicao || "geral",
          }))
        );
      }
    } else if (tipoAcao === "despesa") {
      await supabase.from("despesas").insert({
        user_id: userId, filial_id: profile?.filial_id || null,
        categoria: dados.categoria || "Outros", descricao: dados.descricao || null,
        valor: dados.valor || 0, metodo_pagamento: dados.metodo_pagamento || null,
        pago_por: dados.pago_por || null, observacoes: dados.observacoes || null,
      });
    } else if (tipoAcao === "nota_pecas") {
      const { data: nota } = await supabase.from("notas_fiscais_pecas").insert({
        filial_id: profile?.filial_id || null, fornecedor: dados.fornecedor || null,
        numero_nota: dados.numero_nota || null, valor_total: dados.valor_total || 0, registrado_por: userId,
      }).select("id").single();

      if (nota && dados.itens?.length > 0) {
        await supabase.from("nota_fiscal_items").insert(
          dados.itens.map((item: any) => ({
            nota_fiscal_id: nota.id, descricao: item.descricao,
            quantidade: item.quantidade || 1, valor_unitario: item.valor_unitario || 0, valor_total: item.valor_total || 0,
          }))
        );
      }
    }
  };

  // ── FILE HANDLING ──
  const fileToBase64 = (file: File): Promise<string> => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve((reader.result as string).split(",")[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

  const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setShowAttachMenu(false);
    const url = URL.createObjectURL(file);

    try {
      const base64 = await fileToBase64(file);
      setPendingImageBase64(base64);
      setPendingImageMime(file.type || "image/jpeg");
      setPendingImageUrl(url);
      addUserMessage("📷 Imagem enviada", { imageUrl: url, hasImage: true });
      await sendToODB("Analise esta imagem e me diga o que identificou. Extraia todas as informações visíveis.", base64, file.type || "image/jpeg");
      setPendingImageBase64(null);
      setPendingImageUrl(null);
    } catch { toast.error("Erro ao processar imagem"); }
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
      mediaRecorder.onstop = () => stream.getTracks().forEach(t => t.stop());
      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      setTranscript("");
      timerRef.current = setInterval(() => setRecordingTime(t => t + 1), 1000);

      const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SR) {
        const recognition = new SR();
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
    } catch { toast.error("Não foi possível acessar o microfone."); }
  };

  const handleStopRecording = () => {
    mediaRecorderRef.current?.stop();
    recognitionRef.current?.stop();
    setIsRecording(false);
    if (timerRef.current) clearInterval(timerRef.current);
    const finalTranscript = transcript || "Áudio sem transcrição detectada";
    addUserMessage(`🎙️ ${finalTranscript}`);
    sendToODB(finalTranscript);
  };

  // ── TEXT SUBMIT ──
  const handleTextSubmit = () => {
    if (!textInput.trim() || isProcessing) return;
    const text = textInput.trim();
    setTextInput("");
    if (pendingImageBase64) {
      addUserMessage(text, { imageUrl: pendingImageUrl || undefined, hasImage: true });
      sendToODB(text, pendingImageBase64, pendingImageMime);
      setPendingImageBase64(null);
      setPendingImageUrl(null);
      return;
    }
    addUserMessage(text);
    sendToODB(text);
  };

  // ── BUTTON CLICK ──
  const handleButtonClick = (btn: { label: string; value: string }) => {
    if (btn.value === "action_foto") { setShowAttachMenu(true); return; }
    if (btn.value === "action_audio") { handleStartRecording(); return; }
    if (btn.value === "action_nota") { setShowAttachMenu(true); return; }
    if (btn.value === "action_despesa") {
      addUserMessage("Quero registrar uma despesa");
      sendToODB("Quero registrar uma despesa da oficina. Me pergunte os detalhes.");
      return;
    }
    if (btn.value === "novo") {
      setMessages([{
        id: crypto.randomUUID(), role: "assistant",
        content: "Pronto pra mais! Manda aí 🔧",
        timestamp: new Date(),
        botoes: [
          { label: "📷 Foto", value: "action_foto", variant: "primary" },
          { label: "🎙️ Áudio", value: "action_audio" },
          { label: "📋 Nota de peças", value: "action_nota" },
          { label: "💸 Despesa", value: "action_despesa" },
        ],
      }]);
      return;
    }
    addUserMessage(btn.label);
    sendToODB(btn.label);
  };

  const formatTime = (s: number) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  // ── RENDER DATA CARD ──
  const renderDataCard = (msg: ChatMessage) => {
    if (!msg.dados) return null;
    const d = msg.dados.dados || msg.dados;

    if (msg.tipoAcao === "saida" || msg.tipoAcao === "entrada" || msg.tipoAcao === "confirmacao") {
      const hasItems = d.itens_dianteira?.length > 0 || d.itens_traseira?.length > 0 || d.itens_geral?.length > 0 || d.servicos_previstos?.length > 0;
      return (
        <div className="mt-3 space-y-2.5 bg-card/50 rounded-xl p-3.5 border border-primary/10">
          {d.cliente?.nome && (
            <div className="flex items-center gap-2">
              <User className="h-3.5 w-3.5 text-primary/70" />
              <span className="font-semibold text-xs">{d.cliente.nome}</span>
              {d.cliente.telefone && <span className="text-[10px] text-muted-foreground">• {d.cliente.telefone}</span>}
            </div>
          )}
          {d.veiculo?.marca && (
            <div className="flex items-center gap-2">
              <Car className="h-3.5 w-3.5 text-primary/70" />
              <span className="text-xs font-medium">{d.veiculo.marca} {d.veiculo.modelo} {d.veiculo.ano || ""}</span>
              {d.veiculo.placa && <span className="text-[10px] bg-secondary px-1.5 py-0.5 rounded font-mono">{d.veiculo.placa}</span>}
            </div>
          )}
          {hasItems && (
            <div className="space-y-2 pt-1">
              {renderItemsList("Dianteira", d.itens_dianteira)}
              {renderItemsList("Traseira", d.itens_traseira)}
              {renderItemsList("Geral", d.itens_geral)}
              {renderItemsList("Serviços Previstos", d.servicos_previstos)}
            </div>
          )}
          {d.valor_total != null && (
            <div className="flex items-center justify-between pt-2.5 border-t border-primary/10">
              <span className="text-xs font-bold text-primary">TOTAL</span>
              <span className="text-sm font-bold tabular-nums">R$ {Number(d.valor_total).toFixed(2)}</span>
            </div>
          )}
          {d.desconto > 0 && (
            <div className="flex items-center justify-between text-[11px] text-muted-foreground">
              <span>Desconto</span>
              <span>-R$ {Number(d.desconto).toFixed(2)}</span>
            </div>
          )}
          {d.metodo_pagamento && (
            <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <span>Pagamento: <strong className="text-foreground">{d.metodo_pagamento}</strong></span>
            </div>
          )}
        </div>
      );
    }

    if (msg.tipoAcao === "despesa") {
      return (
        <div className="mt-3 space-y-2 bg-card/50 rounded-xl p-3.5 border border-red-500/10">
          <div className="flex items-center gap-2">
            <Package className="h-3.5 w-3.5 text-red-400" />
            <span className="font-semibold text-xs">Despesa</span>
          </div>
          {d.categoria && <p className="text-[11px] text-muted-foreground">Categoria: {d.categoria}</p>}
          {d.descricao && <p className="text-xs">{d.descricao}</p>}
          {d.valor != null && (
            <div className="flex items-center justify-between pt-2 border-t border-red-500/10">
              <span className="text-xs font-bold text-red-400">VALOR</span>
              <span className="text-sm font-bold tabular-nums">R$ {Number(d.valor).toFixed(2)}</span>
            </div>
          )}
        </div>
      );
    }

    if (msg.tipoAcao === "nota_pecas") {
      return (
        <div className="mt-3 space-y-2 bg-card/50 rounded-xl p-3.5 border border-blue-500/10">
          <div className="flex items-center gap-2">
            <FileText className="h-3.5 w-3.5 text-blue-400" />
            <span className="font-semibold text-xs">Nota Fiscal de Peças</span>
          </div>
          {d.fornecedor && <p className="text-[11px] text-muted-foreground">Fornecedor: {d.fornecedor}</p>}
          {d.numero_nota && <p className="text-[11px] text-muted-foreground">Nota Nº: {d.numero_nota}</p>}
          {d.itens?.length > 0 && (
            <div className="space-y-1">
              {d.itens.map((item: any, i: number) => (
                <div key={i} className="flex items-center justify-between py-0.5">
                  <div className="flex items-center gap-1.5 flex-1 min-w-0">
                    <span className="text-[11px] truncate">{item.descricao}</span>
                    {item.quantidade > 1 && <span className="text-[9px] text-muted-foreground">x{item.quantidade}</span>}
                  </div>
                  <span className="text-[11px] font-bold ml-2 tabular-nums">R$ {Number(item.valor_total).toFixed(2)}</span>
                </div>
              ))}
            </div>
          )}
          {d.valor_total != null && (
            <div className="flex items-center justify-between pt-2 border-t border-blue-500/10">
              <span className="text-xs font-bold text-blue-400">TOTAL</span>
              <span className="text-sm font-bold tabular-nums">R$ {Number(d.valor_total).toFixed(2)}</span>
            </div>
          )}
        </div>
      );
    }

    return null;
  };

  const renderItemsList = (label: string, items?: any[]) => {
    if (!items || items.length === 0) return null;
    const tipoBadge = (t: string) => {
      const map: Record<string, { label: string; cls: string }> = {
        peca_fabricada: { label: "Fabricada", cls: "text-emerald-400 bg-emerald-500/10" },
        peca_comprada: { label: "Comprada", cls: "text-blue-400 bg-blue-500/10" },
        recuperacao: { label: "Recuperação", cls: "text-violet-400 bg-violet-500/10" },
      };
      const info = map[t] || { label: "M.O.", cls: "text-muted-foreground bg-secondary/50" };
      return <span className={`text-[9px] px-1.5 py-0.5 rounded-full ${info.cls}`}>{info.label}</span>;
    };

    return (
      <div className="space-y-1">
        <p className="text-[9px] font-bold text-primary/60 uppercase tracking-widest">{label}</p>
        {items.map((item: any, i: number) => (
          <div key={i} className="flex items-center justify-between py-0.5">
            <div className="flex items-center gap-1.5 flex-1 min-w-0">
              <span className="text-[11px] truncate">{item.descricao}</span>
              {item.tipo && tipoBadge(item.tipo)}
            </div>
            {(item.valor_cobrado != null && item.valor_cobrado > 0) && (
              <span className="text-[11px] font-bold ml-2 tabular-nums">R$ {Number(item.valor_cobrado).toFixed(2)}</span>
            )}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8.5rem)] md:h-[calc(100vh-5.5rem)] -mx-3 md:-mx-4 -mt-3 md:-mt-4 overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-2.5 border-b border-border/20 shrink-0 bg-background/80 backdrop-blur-xl z-10">
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
            <span className="text-[10px] text-muted-foreground">
              {isProcessing ? "Processando..." : `${carrosAtivos.length} carro${carrosAtivos.length !== 1 ? "s" : ""} na oficina`}
            </span>
          </div>
        </div>
        <span className="text-[10px] text-muted-foreground bg-secondary/40 px-2 py-1 rounded-full shrink-0 flex items-center gap-1">
          <Brain className="h-3 w-3" /> IA Pro
        </span>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3 scrollbar-none">
        <AnimatePresence>
          {messages.map(msg => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div className="max-w-[88%]">
                {msg.role === "assistant" && (
                  <div className="flex items-center gap-1.5 mb-1 ml-1">
                    <img src={odbLogo} alt="ODB" className="h-3.5 w-3.5 object-contain" />
                    <span className="text-[10px] font-semibold text-primary">ODB</span>
                  </div>
                )}

                <div className={`rounded-2xl px-3.5 py-2.5 text-[13px] leading-relaxed ${
                  msg.role === "user"
                    ? "bg-primary/10 text-foreground border border-primary/15 rounded-br-sm"
                    : "bg-secondary/40 text-foreground border border-primary/8 rounded-bl-sm"
                }`}>
                  {msg.imageUrl && (
                    <img
                      src={msg.imageUrl} alt="foto"
                      className="rounded-lg mb-2 max-h-40 w-full object-cover cursor-pointer hover:opacity-90 transition-opacity"
                      onClick={() => setFullscreenImage(msg.imageUrl!)}
                    />
                  )}

                  <div className="prose prose-sm prose-invert max-w-none text-[13px] [&_p]:text-[13px] [&_p]:leading-relaxed [&_strong]:text-primary [&_p]:my-0.5 [&_ul]:my-1 [&_li]:my-0">
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  </div>

                  {msg.role === "assistant" && renderDataCard(msg)}

                  {/* Buttons as chips */}
                  {msg.botoes && msg.botoes.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {msg.botoes.map((btn, i) => (
                        <button
                          key={i}
                          onClick={() => handleButtonClick(btn)}
                          disabled={isProcessing}
                          className={`px-3.5 py-2 rounded-xl text-[11px] font-medium border transition-all active:scale-95 disabled:opacity-40 ${
                            btn.variant === "primary" ? "bg-primary/10 text-primary border-primary/20 hover:bg-primary/20"
                            : btn.variant === "success" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20"
                            : btn.variant === "warning" ? "bg-amber-500/10 text-amber-400 border-amber-500/20 hover:bg-amber-500/20"
                            : "bg-secondary/40 text-foreground border-border/20 hover:bg-secondary/60"
                          }`}
                        >
                          {btn.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <p className={`text-[9px] text-muted-foreground/60 mt-0.5 ${msg.role === "user" ? "text-right mr-1" : "ml-1"}`}>
                  {msg.timestamp.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Loading with animated steps */}
        {isProcessing && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
            <div className="max-w-[80%]">
              <div className="flex items-center gap-1.5 mb-1 ml-1">
                <img src={odbLogo} alt="ODB" className="h-3.5 w-3.5 object-contain" />
                <span className="text-[10px] font-semibold text-primary">ODB</span>
              </div>
              <div className="bg-secondary/40 border border-primary/8 rounded-2xl rounded-bl-sm px-4 py-3 space-y-2">
                {LOADING_STEPS.map((step, i) => {
                  const StepIcon = step.icon;
                  const isActive = i === loadingStep;
                  const isDone = i < loadingStep;
                  const isHidden = i > loadingStep;
                  if (isHidden) return null;
                  return (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: isDone ? 0.5 : 1, x: 0 }}
                      transition={{ duration: 0.3 }}
                      className={`flex items-center gap-2.5 ${isDone ? "opacity-50" : ""}`}
                    >
                      {isActive ? (
                        <Loader2 className={`h-3.5 w-3.5 animate-spin ${step.color}`} />
                      ) : isDone ? (
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                      ) : (
                        <StepIcon className={`h-3.5 w-3.5 ${step.color}`} />
                      )}
                      <span className={`text-[11px] ${isActive ? "text-foreground font-medium" : "text-muted-foreground"}`}>
                        {step.text}
                      </span>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Fullscreen image dialog */}
      <Dialog open={!!fullscreenImage} onOpenChange={() => setFullscreenImage(null)}>
        <DialogContent className="max-w-[95vw] max-h-[95vh] p-1 bg-background/95">
          {fullscreenImage && (
            <img src={fullscreenImage} alt="Foto ampliada" className="w-full h-full object-contain rounded-lg" />
          )}
        </DialogContent>
      </Dialog>

      {/* Attach menu */}
      <AnimatePresence>
        {showAttachMenu && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 16 }} className="mx-3 mb-2 flex gap-3">
            <button onClick={() => { if (fileInputRef.current) { fileInputRef.current.setAttribute("capture", "environment"); fileInputRef.current.click(); } }} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-500/10 border border-blue-500/15 text-blue-400 text-xs font-medium hover:bg-blue-500/20 transition-all active:scale-95">
              <Camera className="h-4 w-4" /> Câmera
            </button>
            <button onClick={() => { if (fileInputRef.current) { fileInputRef.current.removeAttribute("capture"); fileInputRef.current.click(); } }} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-violet-500/10 border border-violet-500/15 text-violet-400 text-xs font-medium hover:bg-violet-500/20 transition-all active:scale-95">
              <Image className="h-4 w-4" /> Galeria
            </button>
            <button onClick={() => setShowAttachMenu(false)} className="flex items-center justify-center w-10 rounded-xl bg-secondary/40 border border-border/15 text-muted-foreground hover:text-foreground transition-all">
              <X className="h-4 w-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Recording overlay */}
      <AnimatePresence>
        {isRecording && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="mx-3 mb-2 p-4 rounded-2xl border border-red-500/20 bg-card/95 backdrop-blur-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <motion.div className="w-3 h-3 rounded-full bg-red-500" animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 1, repeat: Infinity }} />
                <span className="text-lg font-mono font-bold text-foreground tabular-nums">{formatTime(recordingTime)}</span>
                <div className="flex gap-0.5">
                  {[...Array(5)].map((_, i) => (
                    <motion.div key={i} animate={{ scaleY: [1, 2, 1] }} transition={{ repeat: Infinity, duration: 0.35, delay: i * 0.07 }} className="h-4 w-0.5 rounded-full bg-red-400 origin-center" />
                  ))}
                </div>
              </div>
              <button onClick={handleStopRecording} className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-red-500/15 border border-red-500/25 text-red-400 text-xs font-semibold hover:bg-red-500/25 transition-all active:scale-95">
                <MicOff className="h-3.5 w-3.5" /> Parar
              </button>
            </div>
            {transcript && <p className="text-[11px] text-muted-foreground mt-2 italic truncate">"{transcript}"</p>}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input bar */}
      {!isRecording && (
        <div className="px-3 pb-2 pt-1.5 border-t border-border/15 bg-background/90 backdrop-blur-xl">
          {pendingImageBase64 && (
            <div className="flex items-center gap-2 mb-1.5 px-2 py-1 rounded-lg bg-primary/5 border border-primary/10 text-[10px] text-primary">
              <Camera className="h-3 w-3" />
              <span>Imagem carregada — digite para adicionar contexto</span>
              <button onClick={() => { setPendingImageBase64(null); setPendingImageUrl(null); }} className="ml-auto"><X className="h-3 w-3" /></button>
            </div>
          )}
          <div className="flex items-end gap-1.5">
            <button
              onClick={() => setShowAttachMenu(!showAttachMenu)}
              className={`flex items-center justify-center h-10 w-10 shrink-0 rounded-full transition-all ${showAttachMenu ? "bg-primary/15 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-secondary/40"}`}
            >
              <Plus className={`h-5 w-5 transition-transform ${showAttachMenu ? "rotate-45" : ""}`} />
            </button>

            <div className="flex-1 relative">
              <input
                ref={inputRef}
                type="text"
                value={textInput}
                onChange={e => setTextInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && !e.shiftKey && handleTextSubmit()}
                placeholder="Foto, áudio ou texto..."
                className="w-full h-10 px-4 rounded-full bg-secondary/30 border border-border/15 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/25 focus:ring-1 focus:ring-primary/15 transition-all"
                style={{ fontSize: 16 }}
                disabled={isProcessing}
              />
            </div>

            {textInput.trim() ? (
              <motion.button
                initial={{ scale: 0 }} animate={{ scale: 1 }}
                onClick={handleTextSubmit}
                disabled={isProcessing}
                className="flex items-center justify-center h-10 w-10 shrink-0 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition-all active:scale-90 disabled:opacity-40"
                style={{ boxShadow: "0 0 12px hsl(var(--primary) / 0.3)" }}
              >
                <Send className="h-4 w-4" />
              </motion.button>
            ) : (
              <button onClick={handleStartRecording} disabled={isProcessing} className="flex items-center justify-center h-10 w-10 shrink-0 rounded-full text-muted-foreground hover:text-foreground hover:bg-secondary/40 transition-all disabled:opacity-40">
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
