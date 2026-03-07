import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bot, Send, Loader2, Trash2, TrendingUp, PiggyBank, BarChart3, HelpCircle } from "lucide-react";
import odbLogo from "@/assets/odb-logo.png";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-chat`;

const quickActions = [
  { icon: TrendingUp, label: "Como está meu faturamento?", prompt: "Como está meu faturamento nos últimos 30 dias? Compare com períodos anteriores se possível." },
  { icon: PiggyBank, label: "Onde posso economizar?", prompt: "Analise minhas despesas e identifique onde posso reduzir custos sem impactar a operação." },
  { icon: BarChart3, label: "Quais serviços mais lucram?", prompt: "Quais são os serviços mais rentáveis e quais têm menor margem? Sugira estratégias." },
  { icon: HelpCircle, label: "Resumo executivo do mês", prompt: "Gere um resumo executivo completo do mês com os principais indicadores, tendências e recomendações." },
];

async function streamChat({
  message,
  history,
  onDelta,
  onDone,
  onError,
}: {
  message: string;
  history: Message[];
  onDelta: (text: string) => void;
  onDone: () => void;
  onError: (err: string) => void;
}) {
  const resp = await fetch(CHAT_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
    },
    body: JSON.stringify({ message, history: history.slice(-10) }),
  });

  if (!resp.ok) {
    const data = await resp.json().catch(() => ({}));
    onError(data.error || "Erro ao processar pergunta");
    return;
  }

  if (!resp.body) { onError("Sem resposta"); return; }

  const reader = resp.body.getReader();
  const decoder = new TextDecoder();
  let textBuffer = "";
  let streamDone = false;

  while (!streamDone) {
    const { done, value } = await reader.read();
    if (done) break;
    textBuffer += decoder.decode(value, { stream: true });

    let newlineIndex: number;
    while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
      let line = textBuffer.slice(0, newlineIndex);
      textBuffer = textBuffer.slice(newlineIndex + 1);

      if (line.endsWith("\r")) line = line.slice(0, -1);
      if (line.startsWith(":") || line.trim() === "") continue;
      if (!line.startsWith("data: ")) continue;

      const jsonStr = line.slice(6).trim();
      if (jsonStr === "[DONE]") { streamDone = true; break; }

      try {
        const parsed = JSON.parse(jsonStr);
        const content = parsed.choices?.[0]?.delta?.content as string | undefined;
        if (content) onDelta(content);
      } catch {
        textBuffer = line + "\n" + textBuffer;
        break;
      }
    }
  }

  // Final flush
  if (textBuffer.trim()) {
    for (let raw of textBuffer.split("\n")) {
      if (!raw) continue;
      if (raw.endsWith("\r")) raw = raw.slice(0, -1);
      if (raw.startsWith(":") || raw.trim() === "") continue;
      if (!raw.startsWith("data: ")) continue;
      const jsonStr = raw.slice(6).trim();
      if (jsonStr === "[DONE]") continue;
      try {
        const parsed = JSON.parse(jsonStr);
        const content = parsed.choices?.[0]?.delta?.content as string | undefined;
        if (content) onDelta(content);
      } catch { /* ignore */ }
    }
  }

  onDone();
}

const ChatFinanceiro = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (text?: string) => {
    const msg = text || input.trim();
    if (!msg || loading) return;

    const userMsg: Message = { role: "user", content: msg };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInput("");
    setLoading(true);

    let assistantSoFar = "";
    const upsertAssistant = (chunk: string) => {
      assistantSoFar += chunk;
      setMessages(prev => {
        const last = prev[prev.length - 1];
        if (last?.role === "assistant") {
          return prev.map((m, i) => (i === prev.length - 1 ? { ...m, content: assistantSoFar } : m));
        }
        return [...prev, { role: "assistant", content: assistantSoFar }];
      });
    };

    try {
      await streamChat({
        message: msg,
        history: messages,
        onDelta: (chunk) => upsertAssistant(chunk),
        onDone: () => setLoading(false),
        onError: (err) => {
          toast.error(err);
          setMessages(prev => [...prev, { role: "assistant", content: "❌ " + err }]);
          setLoading(false);
        },
      });
    } catch (err: any) {
      toast.error(err.message || "Erro de conexão");
      setMessages(prev => [...prev, { role: "assistant", content: "❌ Erro de conexão. Tente novamente." }]);
      setLoading(false);
    } finally {
      inputRef.current?.focus();
    }
  };

  const clearChat = () => {
    setMessages([]);
    toast.success("Conversa limpa");
  };

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col h-[calc(100vh-8rem)] pb-4">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
            <Bot className="h-5 w-5 text-primary" />
            Chat Financeiro IA
          </h2>
          <p className="text-[11px] text-muted-foreground">Respostas em tempo real com streaming</p>
        </div>
        {messages.length > 0 && (
          <button onClick={clearChat} className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-colors">
            <Trash2 className="h-3.5 w-3.5" /> Limpar
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto space-y-3 pr-1 scrollbar-thin scrollbar-thumb-border/30">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full space-y-6">
            <div className="relative">
              <motion.div
                animate={{ scale: [1, 1.05, 1], opacity: [0.5, 0.8, 0.5] }}
                transition={{ duration: 3, repeat: Infinity }}
                className="absolute inset-0 rounded-full bg-primary/20 blur-xl"
              />
              <div className="relative flex h-20 w-20 items-center justify-center rounded-2xl bg-primary/10 border border-primary/20 overflow-hidden">
                <img src={odbLogo} alt="ODB" className="h-16 w-16 object-contain" />
              </div>
            </div>
            <div className="text-center space-y-1">
              <p className="text-sm font-medium text-foreground">Assistente Financeiro</p>
              <p className="text-xs text-muted-foreground max-w-sm">
                Analiso seus dados em tempo real com streaming. Pergunte sobre faturamento, despesas, margem, tendências ou peça recomendações.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-lg">
              {quickActions.map((qa, i) => {
                const Icon = qa.icon;
                return (
                  <button key={i} onClick={() => sendMessage(qa.prompt)}
                    className="flex items-center gap-2.5 p-3 rounded-xl text-left transition-all hover:scale-[1.02]"
                    style={{ background: "rgba(14,20,35,0.7)", border: "1px solid rgba(245,158,11,0.1)" }}>
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                      <Icon className="h-4 w-4 text-primary" />
                    </div>
                    <span className="text-xs text-muted-foreground leading-tight">{qa.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          <>
            <AnimatePresence>
              {messages.map((msg, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 }}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                    msg.role === "user"
                      ? "bg-primary text-primary-foreground rounded-br-md"
                      : "rounded-bl-md"
                  }`}
                    style={msg.role === "assistant" ? { background: "rgba(14,20,35,0.8)", border: "1px solid rgba(245,158,11,0.1)" } : undefined}
                  >
                    {msg.role === "assistant" ? (
                      <div className="prose prose-sm prose-invert max-w-none text-xs leading-relaxed [&_strong]:text-primary [&_h1]:text-sm [&_h2]:text-xs [&_h3]:text-xs [&_p]:text-xs [&_li]:text-xs [&_table]:text-[10px] [&_th]:px-2 [&_th]:py-1 [&_td]:px-2 [&_td]:py-1 [&_th]:bg-secondary/30 [&_tr]:border-b [&_tr]:border-border/10">
                        <ReactMarkdown>{msg.content}</ReactMarkdown>
                      </div>
                    ) : (
                      <p className="text-xs leading-relaxed">{msg.content}</p>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            {loading && messages[messages.length - 1]?.role !== "assistant" && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
                <div className="flex items-center gap-2 px-4 py-3 rounded-2xl rounded-bl-md"
                  style={{ background: "rgba(14,20,35,0.8)", border: "1px solid rgba(245,158,11,0.1)" }}>
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  <span className="text-xs text-muted-foreground">Conectando...</span>
                </div>
              </motion.div>
            )}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      <div className="mt-3 flex gap-2">
        <div className="flex-1 relative">
          <input
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && !e.shiftKey && sendMessage()}
            placeholder="Pergunte sobre suas finanças..."
            disabled={loading}
            className="w-full h-11 rounded-xl px-4 pr-12 text-sm bg-secondary/30 border border-border/30 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/40 focus:ring-1 focus:ring-primary/20 transition-all disabled:opacity-50"
          />
          <button
            onClick={() => sendMessage()}
            disabled={loading || !input.trim()}
            className="absolute right-1.5 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground transition-all hover:bg-primary/90 disabled:opacity-30"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default ChatFinanceiro;
