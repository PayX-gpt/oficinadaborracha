import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";

// ─── Types ───
interface CheckItem {
  text: string;
  note?: string;
  done: boolean;
}

interface CheckGroup {
  title: string;
  items: CheckItem[];
}

// ─── Data ───
const CHECKLIST_TABS = [
  { id: "abertura", label: "Abertura" },
  { id: "gestor", label: "Sócio/Gestor" },
  { id: "tecnico", label: "Técnico" },
  { id: "borracheiro", label: "Borracheiro" },
  { id: "atendente", label: "Atendente" },
  { id: "fechamento", label: "Fechamento" },
  { id: "semanal", label: "Semanal" },
];

const CHECKLIST_DATA: Record<string, CheckGroup[]> = {
  abertura: [
    {
      title: "Espiritual / Motivacional",
      items: [
        { text: "Oração de abertura com toda a equipe", note: "Tradição da família — 5 min antes de tudo", done: false },
        { text: "Palavras de motivação do sócio responsável", note: "Meta do dia, prioridades, reconhecimento", done: false },
      ],
    },
    {
      title: "Limpeza e Apresentação",
      items: [
        { text: "Varrer piso das baias de trabalho", done: false },
        { text: "Limpar bancadas e superfícies", done: false },
        { text: "Banheiro: papel, sabão, limpo", done: false },
        { text: "Recepção e área de espera do cliente: ok", done: false },
        { text: "Fachada limpa e visível da rua", done: false },
      ],
    },
    {
      title: "Ferramentas e Equipamentos",
      items: [
        { text: "Checar shadow board — alguma ferramenta faltando?", note: "Silhueta vazia = fora do lugar", done: false },
        { text: "Testar elevador hidráulico / macaco", done: false },
        { text: "Checar compressor (pressão adequada)", done: false },
        { text: "EPIs disponíveis: luvas, óculos, botinas", done: false },
        { text: "Capas de banco e tapetes estocados", note: "Padrão premium — obrigatório", done: false },
      ],
    },
    {
      title: "Estoque",
      items: [
        { text: "Borracha bruta (mínimo: 30 kg)", done: false },
        { text: "Composto vulcanizador (mínimo: 5 L)", done: false },
        { text: "Selos de garantia disponíveis", done: false },
        { text: "Papel OS, termos de garantia, canetas", done: false },
      ],
    },
  ],
  gestor: [
    {
      title: "Planejamento",
      items: [
        { text: "Conferir OS abertas e pendentes", note: "Priorizar por data prometida ao cliente", done: false },
        { text: "Verificar agendamentos do dia", done: false },
        { text: "Distribuir OS para técnico e borracheiro", done: false },
        { text: "Briefing de 5 min com equipe", done: false },
        { text: "Verificar veículos da véspera", note: "Confirmar prazo com cliente se necessário", done: false },
      ],
    },
    {
      title: "Financeiro",
      items: [
        { text: "Abrir caixa e conferir saldo inicial", done: false },
        { text: "Verificar pagamentos pendentes", done: false },
        { text: "Checar contas a pagar do dia / semana", done: false },
        { text: "Conferir fechamento do dia anterior", done: false },
      ],
    },
    {
      title: "Qualidade Premium",
      items: [
        { text: "Inspecionar serviços antes de avisar cliente", done: false },
        { text: "Verificar selos ODB aplicados nas peças", note: "Padrão obrigatório em toda peça fabricada", done: false },
        { text: "Checar fotos na OS (antes/durante/depois)", done: false },
        { text: "Verificar limpeza dos veículos antes da entrega", done: false },
        { text: "Confirmar que Termo de Garantia foi emitido", done: false },
      ],
    },
    {
      title: "Digital",
      items: [
        { text: "WhatsApp — responder todas as pendências", done: false },
        { text: "Verificar avaliações Google e Instagram", done: false },
        { text: "Postar conteúdo programado", done: false },
      ],
    },
  ],
  tecnico: [
    {
      title: "Início do Turno",
      items: [
        { text: "Uniformizar: macacão, crachá, EPIs", done: false },
        { text: "Retirar OS atribuídas", done: false },
        { text: "Ler OS e confirmar entendimento", done: false },
        { text: "Fotografar veículo antes de iniciar", note: "Proteção jurídica da empresa", done: false },
        { text: "Colocar capa de banco + tapete de assoalho", note: "Obrigatório em todo veículo", done: false },
      ],
    },
    {
      title: "Durante o Serviço",
      items: [
        { text: "Fotografar peças removidas (antes)", done: false },
        { text: "Registrar na OS diagnóstico e o que foi feito", done: false },
        { text: "Sinalizar problema adicional ao sócio", note: "Nunca executar sem aprovação do cliente", done: false },
      ],
    },
    {
      title: "Conclusão",
      items: [
        { text: "Confirmar selo ODB em cada borracha fabricada", done: false },
        { text: "Realizar test drive ou verificação funcional", done: false },
        { text: "Fotografar serviço concluído (depois)", done: false },
        { text: "Limpar chassi, rodas e interior do veículo", done: false },
        { text: "Retirar capa de banco e tapete", done: false },
        { text: "Assinar e datar OS como concluída", done: false },
        { text: "Limpar bancada · devolver ferramentas ao shadow board", done: false },
      ],
    },
  ],
  borracheiro: [
    {
      title: "Preparação",
      items: [
        { text: "Verificar pedidos de fabricação do dia", done: false },
        { text: "Checar borracha bruta (mín: 30 kg)", done: false },
        { text: "Verificar moldes: limpos, sem resíduos", done: false },
        { text: "Checar temperatura da prensa/vulcanizador", done: false },
        { text: "Separar compostos para o dia", done: false },
      ],
    },
    {
      title: "Produção e Qualidade",
      items: [
        { text: "Registrar peças produzidas (tipo + qtd)", done: false },
        { text: "Inspecionar cada peça: sem bolhas, rebarbas, deformidades", done: false },
        { text: "Aplicar SELO ODB em cada peça aprovada", note: "Padrão obrigatório — sem exceção", done: false },
        { text: "Etiquetar peças (modelo / aplicação)", done: false },
        { text: "Separar peças prontas por OS", done: false },
        { text: "Limpar área de fabricação ao final", done: false },
        { text: "Guardar sobra · registrar consumo do dia", done: false },
      ],
    },
  ],
  atendente: [
    {
      title: "Manhã",
      items: [
        { text: "WhatsApp: responder todas as mensagens", note: "Meta: sem resposta pendente por mais de 30 min", done: false },
        { text: "Confirmar agendamentos do dia", done: false },
        { text: "Preparar OSs para veículos esperados", done: false },
        { text: "Ligar para clientes com prazo hoje", done: false },
        { text: "Verificar orçamentos vencendo essa semana", done: false },
      ],
    },
    {
      title: "Recepção",
      items: [
        { text: "Saudação padrão com sorriso", note: '"Bom dia! Bem-vindo à Oficina da Borracha!"', done: false },
        { text: "Oferecer café / água durante a espera", done: false },
        { text: "Preencher OS com todos os campos", done: false },
        { text: "Informar prazo e valor antes de iniciar", done: false },
        { text: "Assinatura do cliente na OS", done: false },
      ],
    },
    {
      title: "Entrega e Pós-serviço",
      items: [
        { text: "Avisar cliente quando pronto", done: false },
        { text: "Entregar Termo de Garantia + OS assinada", done: false },
        { text: 'Apresentar QR Code de review Google', note: '"Você toparia deixar uma avaliação?"', done: false },
        { text: "Salvar contato com etiqueta correta no WhatsApp", done: false },
        { text: "Agendar follow-up 30 dias depois", done: false },
      ],
    },
  ],
  fechamento: [
    {
      title: "Toda a Equipe",
      items: [
        { text: "Limpeza completa de todas as áreas", done: false },
        { text: "Guardar ferramentas no shadow board", done: false },
        { text: "Desligar equipamentos", done: false },
        { text: "Trancar veículos de clientes dentro", done: false },
        { text: "Apagar luzes e desligar tomadas", done: false },
      ],
    },
    {
      title: "Sócio Responsável",
      items: [
        { text: "Fechar caixa e registrar total do dia", done: false },
        { text: "Registrar OS encerradas e pendentes", done: false },
        { text: "Responder mensagens pendentes do WhatsApp", done: false },
        { text: "Checar agenda de amanhã", done: false },
        { text: "Trancar portões · alarme · câmeras", done: false },
      ],
    },
  ],
  semanal: [
    {
      title: "Toda Sexta-feira",
      items: [
        { text: "Reunião de 15 min com equipe", note: "Resultados, problemas, reconhecimento", done: false },
        { text: "Limpeza geral mais profunda", done: false },
        { text: "Conferir estoque e gerar pedidos da semana", done: false },
        { text: "Atualizar controle financeiro semanal", done: false },
        { text: "Compartilhar resultados com os sócios", done: false },
      ],
    },
    {
      title: "Todo Primeiro do Mês",
      items: [
        { text: "Fechamento financeiro por unidade", done: false },
        { text: "Análise de KPIs: faturamento, ticket médio, prazo", done: false },
        { text: "Reunião dos 4 sócios", note: "Decisões estratégicas, distribuição de resultados", done: false },
        { text: "Revisão de avaliações Google", done: false },
        { text: "Manutenção preventiva: elevador, prensa, compressor", done: false },
      ],
    },
  ],
};

const BRAND_ITEMS = [
  { num: "01", title: "Selo de Garantia nas Peças", desc: "Etiqueta autoadesiva com logo ODB em cada borracha fabricada. Contém número da OS, data e prazo de garantia (12 meses).", tags: [{ label: "Logo ODB", type: "gold" }, { label: "Nº OS", type: "chrome" }, { label: "Data + Validade", type: "chrome" }] },
  { num: "02", title: "Capa de Banco Personalizada", desc: "Tecido preto com logo ODB bordado. Obrigatória em todo veículo durante o serviço e test drive.", tags: [{ label: "Tecido preto", type: "red" }, { label: "Logo bordado", type: "gold" }] },
  { num: "03", title: "Capa de Volante + Tapete de Assoalho", desc: "Capa descartável de volante + tapete de papel com logo ODB no assoalho. Padrão de concessionária aplicado na oficina." },
  { num: "04", title: "Embalagem / Saco Personalizado", desc: "Saco kraft com logo ODB para entregar peças ou materiais ao cliente." },
  { num: "05", title: "Uniforme Padrão", desc: "Macacão preto com logo ODB bordado e nome do colaborador. Mesmo padrão nas 3 unidades.", tags: [{ label: "Macacão preto", type: "chrome" }, { label: "Logo bordado", type: "gold" }, { label: "Nome", type: "chrome" }] },
  { num: "06", title: "Shadow Board de Ferramentas", desc: "Painel com silhueta de cada ferramenta (fundo vermelho ODB, silhueta preta). Ferramenta fora do lugar = visível de imediato." },
  { num: "07", title: "Área de Espera Premium", desc: "Cadeiras padronizadas, TV com conteúdo ODB, café disponível, Wi-Fi com cartão personalizado. QR Code de avaliação Google visível." },
  { num: "08", title: "Termo de Garantia Impresso", desc: "Folha timbrada ODB com dados do serviço, prazo de garantia e assinatura do técnico.", tags: [{ label: "Papel timbrado", type: "gold" }, { label: "Assinatura do técnico", type: "red" }] },
];

// ─── Styles (CSS-in-JS matching the playbook design system) ───
const PB = {
  black: "#090909", d1: "#111", d2: "#161616", d3: "#1E1E1E", d4: "#272727", d5: "#323232",
  red: "#D20A0A", redD: "#900505", redL: "#FF3333",
  chrome: "#BEBEBE", chromeL: "#E5E5E5", chromeD: "#666",
  white: "#F2F2F2", text: "#B8B8B8", dim: "#666",
  gold: "#C9A84C", goldD: "#7A6230",
};

const tagStyles: Record<string, React.CSSProperties> = {
  red: { background: PB.redD, color: "#FFAAAA" },
  chrome: { background: PB.d4, color: PB.chrome },
  green: { background: "#0A220A", color: "#55EE55" },
  yellow: { background: "#221800", color: "#DDBB00" },
  gold: { background: "#221800", color: PB.gold },
};

const Tag = ({ label, type = "chrome" }: { label: string; type?: string }) => (
  <span style={{
    display: "inline-block", fontSize: 9, fontWeight: 600, letterSpacing: 1,
    textTransform: "uppercase", padding: "3px 8px", margin: "2px 2px 2px 0",
    ...tagStyles[type] || tagStyles.chrome,
  }}>{label}</span>
);

// ─── Components ───

const SectionHeader = ({ num, title, sub }: { num: string; title: string; sub: string }) => (
  <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 28 }}>
    <div style={{
      fontFamily: "'DM Mono', monospace", fontSize: 9, color: PB.red,
      border: `1px solid ${PB.redD}`, padding: "4px 8px", letterSpacing: 2,
      whiteSpace: "nowrap", marginTop: 4,
    }}>{num}</div>
    <div>
      <div style={{
        fontFamily: "'Antonio', sans-serif", fontSize: 24, fontWeight: 700,
        color: PB.white, textTransform: "uppercase", letterSpacing: 2, lineHeight: 1.1,
      }}>{title}</div>
      <div style={{
        fontSize: 10, color: PB.chromeD, letterSpacing: 1.5,
        textTransform: "uppercase", marginTop: 5,
      }}>{sub}</div>
    </div>
  </div>
);

const Label = ({ children }: { children: React.ReactNode }) => (
  <span style={{
    fontSize: 9, fontWeight: 600, letterSpacing: 2.5,
    textTransform: "uppercase", color: PB.red, marginBottom: 10, display: "block",
  }}>{children}</span>
);

const ChecklistItem = ({ item, onToggle }: { item: CheckItem; onToggle: () => void }) => (
  <div
    onClick={onToggle}
    style={{
      display: "flex", alignItems: "flex-start", gap: 14, padding: "12px 14px",
      marginBottom: 3, background: PB.d2, border: "1px solid transparent",
      cursor: "pointer", transition: "background .15s", minHeight: 44,
      opacity: item.done ? 0.45 : 1,
    }}
  >
    <div style={{
      width: 18, height: 18, minWidth: 18, border: `1px solid ${PB.chromeD}`,
      display: "flex", alignItems: "center", justifyContent: "center",
      marginTop: 1, fontSize: 10, transition: "all .15s",
      ...(item.done ? { background: PB.red, borderColor: PB.red, color: "#fff" } : {}),
    }}>{item.done ? "✓" : ""}</div>
    <div>
      <div style={{
        fontSize: 13, color: PB.text, lineHeight: 1.5,
        textDecoration: item.done ? "line-through" : "none",
      }}>{item.text}</div>
      {item.note && <div style={{ fontSize: 10, color: PB.dim, marginTop: 3, lineHeight: 1.4 }}>{item.note}</div>}
    </div>
  </div>
);

const GoldBox = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div style={{
    background: PB.d3, border: `1px solid ${PB.goldD}`, borderLeft: `3px solid ${PB.gold}`,
    padding: "16px 18px", margin: "14px 0",
  }}>
    <strong style={{ color: PB.gold }}>{title}</strong>
    <p style={{ fontSize: 13, color: PB.text, lineHeight: 1.7, marginTop: 6 }}>{children}</p>
  </div>
);

const FinCard = ({ children }: { children: React.ReactNode }) => (
  <div style={{ background: PB.d2, border: `1px solid ${PB.d4}`, padding: 18, marginBottom: 14 }}>
    {children}
  </div>
);

const FinRow = ({ label, value, valueColor }: { label: string; value: string; valueColor?: string }) => (
  <div style={{
    display: "flex", justifyContent: "space-between", alignItems: "center",
    padding: "10px 0", borderBottom: `1px solid ${PB.d3}`,
  }}>
    <span style={{ fontSize: 12, color: PB.dim }}>{label}</span>
    <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 13, color: valueColor || PB.white }}>{value}</span>
  </div>
);

// ─── Main Component ───
const PlaybookPage = () => {
  const [activeCheckTab, setActiveCheckTab] = useState("abertura");
  const [checks, setChecks] = useState<Record<string, CheckGroup[]>>(
    JSON.parse(JSON.stringify(CHECKLIST_DATA))
  );
  const [activeSection, setActiveSection] = useState("unidades");

  const toggleCheck = useCallback((tabId: string, groupIdx: number, itemIdx: number) => {
    setChecks(prev => {
      const next = JSON.parse(JSON.stringify(prev));
      next[tabId][groupIdx].items[itemIdx].done = !next[tabId][groupIdx].items[itemIdx].done;
      return next;
    });
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      const sections = document.querySelectorAll("[data-pb-section]");
      let current = "unidades";
      sections.forEach(s => {
        if (window.scrollY >= (s as HTMLElement).offsetTop - 120) {
          current = s.getAttribute("data-pb-section") || current;
        }
      });
      setActiveSection(current);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const sectionStyle: React.CSSProperties = { padding: "32px 20px", borderBottom: `1px solid ${PB.d3}` };
  const cardStyle = (border: string): React.CSSProperties => ({
    background: PB.d2, border: `1px solid ${PB.d4}`, borderTop: `3px solid ${border}`, padding: 18, marginBottom: 14,
  });

  const bottomNavItems = [
    { id: "unidades", label: "Unidades", icon: "M3,3H10V10H3ZM14,3H21V10H14ZM3,14H10V21H3ZM14,14H21V21H14Z" },
    { id: "premium", label: "Premium", icon: "M12,2L15.09,8.26L22,9.27L17,14.14L18.18,21.02L12,17.77L5.82,21.02L7,14.14L2,9.27L8.91,8.26Z" },
    { id: "operacoes", label: "Checklist", icon: "M9,11L12,14L22,4M21,12V19A2,2,0,0,1,19,21H5A2,2,0,0,1,3,19V5A2,2,0,0,1,5,3H16" },
    { id: "lancamento", label: "Lançamento", icon: "M22,2L11,13M22,2L15,22L11,13L2,9L22,2Z" },
    { id: "financeiro", label: "Financeiro", icon: "M12,1V23M17,5H9.5A3.5,3.5,0,0,0,9.5,12H14.5A3.5,3.5,0,0,1,14.5,19H6" },
  ];

  return (
    <div style={{
      background: PB.black, color: PB.text, fontFamily: "'Chakra Petch', sans-serif",
      lineHeight: 1.6, minHeight: "100vh", paddingBottom: 80,
    }}>
      {/* Google Fonts */}
      <link href="https://fonts.googleapis.com/css2?family=Antonio:wght@400;700&family=Chakra+Petch:wght@300;400;600&family=DM+Mono:wght@400;500&display=swap" rel="stylesheet" />

      {/* TOP BAR */}
      <div style={{
        background: PB.d1, borderBottom: `2px solid ${PB.red}`, padding: "14px 20px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        position: "sticky", top: 0, zIndex: 200,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{
            width: 40, height: 40, background: PB.red, display: "flex", alignItems: "center",
            justifyContent: "center", fontFamily: "'Antonio', sans-serif", fontSize: 14,
            fontWeight: 700, color: "#fff", letterSpacing: 1,
          }}>ODB</div>
          <div>
            <div style={{ fontFamily: "'Antonio', sans-serif", fontSize: 17, fontWeight: 700, color: PB.white, letterSpacing: 2, textTransform: "uppercase", lineHeight: 1 }}>Oficina da Borracha</div>
            <div style={{ fontSize: 9, color: PB.red, letterSpacing: 2.5, textTransform: "uppercase", marginTop: 3 }}>Business Playbook v4 · Confidencial</div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 9, letterSpacing: 1.5, padding: "4px 10px", border: `1px solid ${PB.redD}`, color: PB.redL, textTransform: "uppercase" }}>
          <motion.div animate={{ opacity: [1, 0.2, 1] }} transition={{ duration: 2, repeat: Infinity }} style={{ width: 5, height: 5, borderRadius: "50%", background: PB.redL }} />
          Washington Soares
        </div>
      </div>

      {/* DESKTOP NAV */}
      <nav style={{
        display: "none", background: PB.d2, borderBottom: `1px solid ${PB.d4}`,
        padding: "0 40px", overflowX: "auto", position: "sticky", top: 70, zIndex: 100,
      }} className="pb-desknav">
        {["unidades", "premium", "operacoes", "pessoas", "lancamento", "marketing", "financeiro", "roadmap"].map(id => (
          <a key={id} href={`#pb-${id}`} style={{
            display: "inline-block", padding: "13px 16px", fontSize: 10, fontWeight: 600,
            letterSpacing: 2, textTransform: "uppercase", color: PB.chromeD,
            borderBottom: "2px solid transparent", whiteSpace: "nowrap", textDecoration: "none",
          }}>{id === "operacoes" ? "Operações" : id.charAt(0).toUpperCase() + id.slice(1)}</a>
        ))}
      </nav>

      {/* ═══ 01 · UNIDADES ═══ */}
      <section style={sectionStyle} data-pb-section="unidades" id="pb-unidades">
        <SectionHeader num="01" title="As 3 Unidades" sub="4 Sócios · Dinho · Neto · Eduardo · John" />

        <div style={{ display: "flex", flexDirection: "column", gap: 1, background: PB.d4, marginBottom: 28 }} className="pb-units-strip">
          {[
            { lbl: "Unidade 01 · Fátima", name: "Aguanambi", socio: "Neto", rev: "R$ 50–60k", isNew: false },
            { lbl: "Unidade 02 · Aldeota", name: "Aldeota", socio: "Eduardo", rev: "R$ 30–40k", isNew: false },
            { lbl: "Unidade 03 · Em abertura", name: "Washington Soares", socio: "John", rev: "Em estruturação", isNew: true },
          ].map((u, i) => (
            <div key={i} style={{
              background: PB.d2, padding: 20,
              borderLeft: `3px solid ${u.isNew ? PB.gold : PB.red}`,
            }}>
              <div style={{ fontSize: 9, letterSpacing: 2.5, textTransform: "uppercase", color: PB.chromeD, marginBottom: 6 }}>
                {u.lbl} {u.isNew && <motion.span animate={{ opacity: [1, 0.2, 1] }} transition={{ duration: 2, repeat: Infinity }} style={{ display: "inline-block", width: 5, height: 5, borderRadius: "50%", background: PB.redL, marginLeft: 4 }} />}
              </div>
              <div style={{ fontFamily: "'Antonio', sans-serif", fontSize: 20, color: PB.white, textTransform: "uppercase", letterSpacing: 1 }}>{u.name}</div>
              <div style={{ fontSize: 11, color: u.isNew ? PB.gold : PB.redL, margin: "4px 0 10px" }}>Sócio resp.: {u.socio}</div>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: u.isNew ? 15 : 22, color: u.isNew ? PB.dim : PB.gold }}>{u.rev}</div>
              <div style={{ fontSize: 9, color: PB.dim, letterSpacing: 2, marginTop: 2 }}>{u.isNew ? "fabricação própria" : "líquido / mês"}</div>
            </div>
          ))}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2, background: PB.d4, marginBottom: 28 }} className="pb-metrics">
          {[
            { val: "3", lbl: "Unidades", color: PB.gold },
            { val: "R$100k+", lbl: "Fat./Mês", color: PB.gold },
            { val: "25", lbl: "Anos", color: PB.redL },
            { val: "4", lbl: "Sócios", color: PB.gold },
          ].map((m, i) => (
            <div key={i} style={{ background: PB.d3, padding: "16px 14px", textAlign: "center" }}>
              <span style={{ fontFamily: "'Antonio', sans-serif", fontSize: m.val.length > 3 ? 22 : 28, fontWeight: 700, color: m.color, display: "block", lineHeight: 1 }}>{m.val}</span>
              <span style={{ fontSize: 9, color: PB.dim, letterSpacing: 1.5, textTransform: "uppercase", marginTop: 5, display: "block" }}>{m.lbl}</span>
            </div>
          ))}
        </div>

        {/* Organograma */}
        <Label>Estrutura Societária</Label>
        <div style={{ overflowX: "auto", padding: "16px 0 24px", WebkitOverflowScrolling: "touch" }}>
          <div style={{ minWidth: 480, padding: "0 20px" }}>
            <div style={{ display: "flex", justifyContent: "center", marginBottom: 0 }}>
              <div style={{ ...cardStyle(PB.gold), minWidth: 220, textAlign: "center", borderTop: `3px solid ${PB.gold}` }}>
                <div style={{ fontFamily: "'Antonio', sans-serif", fontSize: 12, color: PB.white, textTransform: "uppercase", letterSpacing: 1 }}>Sociedade ODB</div>
                <div style={{ fontSize: 9, color: PB.dim, marginTop: 2 }}>Dinho · Neto · Eduardo · John</div>
                <div style={{ fontSize: 9, color: PB.goldD, marginTop: 2 }}>Valmic Septimio Ramos Neto LTDA</div>
              </div>
            </div>
            <div style={{ display: "flex", justifyContent: "center", height: 20 }}><div style={{ width: 1, background: PB.d5, flex: 1 }} /></div>
            <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
              {[
                { name: "Aguanambi", loc: "Fátima", mgr: "Neto", isNew: false },
                { name: "Aldeota", loc: "Aldeota", mgr: "Eduardo", isNew: false },
                { name: "Washington Soares", loc: "Washington Soares", mgr: "John ★", isNew: true },
              ].map((b, i) => (
                <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                  <div style={{ ...cardStyle(b.isNew ? PB.gold : PB.red), textAlign: "center", padding: "10px 14px" }}>
                    <div style={{ fontFamily: "'Antonio', sans-serif", fontSize: 12, color: PB.white, textTransform: "uppercase", letterSpacing: 1 }}>{b.name}</div>
                    <div style={{ fontSize: 9, color: PB.dim, marginTop: 2 }}>{b.loc}</div>
                    <div style={{ fontSize: 9, color: b.isNew ? PB.gold : PB.redL, marginTop: 2 }}>{b.mgr}</div>
                  </div>
                  <div style={{ display: "flex", justifyContent: "center", height: 20 }}><div style={{ width: 1, background: PB.d5 }} /></div>
                  <div style={{ display: "flex", gap: 4, justifyContent: "center" }}>
                    {["Técnicos", "Borracheiro", "Atendente"].map((role, j) => (
                      <div key={j} style={{ background: PB.d3, border: `1px solid ${PB.d5}`, padding: "7px 10px", textAlign: "center" }}>
                        <div style={{ fontFamily: "'Antonio', sans-serif", fontSize: 10, color: PB.white, textTransform: "uppercase" }}>{role}</div>
                        <div style={{ fontSize: 8, color: PB.dim, marginTop: 1 }}>{j === 0 ? "Suspensão" : j === 1 ? "Fabricação" : "Recepção"}</div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Unit detail cards */}
        <div className="pb-grid3" style={{ display: "grid", gridTemplateColumns: "1fr", gap: 14, marginBottom: 20 }}>
          <div style={cardStyle(PB.chrome)}>
            <h3 style={{ fontFamily: "'Antonio', sans-serif", fontSize: 14, color: PB.white, textTransform: "uppercase", letterSpacing: 2, marginBottom: 10 }}>Aguanambi</h3>
            <Label>Sócio</Label><p style={{ color: PB.dim, fontSize: 13, marginBottom: 12 }}>Neto</p>
            <Label>Fat. Líquido</Label><span style={{ color: PB.gold, fontFamily: "'DM Mono', monospace" }}>R$ 50–60k/mês</span>
            <div style={{ marginTop: 12 }}>
              <Tag label="Fabricação borrachas" type="red" /><Tag label="Suspensão completa" type="red" />
              <Tag label="Amortecedor" /><Tag label="Caixa direção" /><Tag label="Motor · Freio · Óleo" />
              <Tag label="Injeção eletrônica" /><Tag label="Industrial" />
            </div>
          </div>
          <div style={cardStyle(PB.chrome)}>
            <h3 style={{ fontFamily: "'Antonio', sans-serif", fontSize: 14, color: PB.white, textTransform: "uppercase", letterSpacing: 2, marginBottom: 10 }}>Aldeota</h3>
            <Label>Sócio</Label><p style={{ color: PB.dim, fontSize: 13, marginBottom: 12 }}>Eduardo</p>
            <Label>Fat. Líquido</Label><span style={{ color: PB.gold, fontFamily: "'DM Mono', monospace" }}>R$ 30–40k/mês</span><br />
            <Label>Meta 12m</Label><span style={{ color: PB.redL, fontFamily: "'DM Mono', monospace" }}>R$ 50k/mês</span>
            <div style={{ marginTop: 12 }}>
              <Tag label="Fabricação borrachas" type="red" /><Tag label="Suspensão completa" type="red" /><Tag label="Demais serviços" />
            </div>
          </div>
          <div style={cardStyle(PB.gold)}>
            <h3 style={{ fontFamily: "'Antonio', sans-serif", fontSize: 14, color: PB.white, textTransform: "uppercase", letterSpacing: 2, marginBottom: 10 }}>Washington Soares <Tag label="NOVA" type="red" /></h3>
            <Label>Sócio</Label><p style={{ color: PB.dim, fontSize: 13, marginBottom: 12 }}>John</p>
            <Label>Meta 6 meses</Label><span style={{ color: PB.gold, fontFamily: "'DM Mono', monospace" }}>R$ 30k/mês</span><br />
            <Label>Meta 12 meses</Label><span style={{ color: PB.gold, fontFamily: "'DM Mono', monospace" }}>R$ 50–60k/mês</span>
            <div style={{ marginTop: 12 }}>
              <Tag label="Fabricação própria" type="gold" /><Tag label="Padrão premium" type="gold" />
            </div>
          </div>
        </div>
      </section>

      {/* ═══ 02 · PADRÃO PREMIUM ═══ */}
      <section style={sectionStyle} data-pb-section="premium" id="pb-premium">
        <SectionHeader num="02" title="Padrão Premium" sub="A experiência nas 3 unidades sem exceção" />
        <GoldBox title="Visão:">
          Quando o cliente entra em qualquer unidade ODB, ele percebe imediatamente que é diferente. Cada detalhe — do WhatsApp ao chassi — comunica autoridade e cuidado. Mesmo padrão nas 3 unidades, sem exceção.
        </GoldBox>

        <Label>Itens de Identidade e Experiência</Label>
        {BRAND_ITEMS.map((item, i) => (
          <div key={i} style={{
            display: "flex", gap: 14, alignItems: "flex-start", padding: 16,
            background: PB.d2, border: `1px solid ${PB.d4}`, marginBottom: 10,
            borderLeft: `3px solid ${PB.gold}`,
          }}>
            <div style={{
              width: 36, height: 36, minWidth: 36, background: PB.goldD,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontFamily: "'Antonio', sans-serif", fontSize: 14, color: PB.gold,
            }}>{item.num}</div>
            <div>
              <h4 style={{ fontFamily: "'Antonio', sans-serif", fontSize: 13, color: PB.white, textTransform: "uppercase", letterSpacing: 1, marginBottom: 5 }}>{item.title}</h4>
              <p style={{ fontSize: 12, color: PB.dim, lineHeight: 1.6 }}>{item.desc}</p>
              {item.tags && <div style={{ marginTop: 6 }}>{item.tags.map((t, j) => <Tag key={j} label={t.label} type={t.type} />)}</div>}
            </div>
          </div>
        ))}

        <hr style={{ border: "none", borderTop: `1px solid ${PB.d3}`, margin: "24px 0" }} />
        <Label>Scripts de Atendimento Padrão</Label>
        <div className="pb-grid3" style={{ display: "grid", gridTemplateColumns: "1fr", gap: 14 }}>
          {[
            { title: "Recepção Presencial", scriptLabel: "Script", script: '"Bom dia/tarde! Bem-vindo à Oficina da Borracha. Como posso te ajudar?"\n\n[Após ouvir:]\n"Vou chamar nosso técnico para analisar, ok? O orçamento é gratuito."', note: "Obrigatório: capa de banco + tapete antes de mover o veículo." },
            { title: "WhatsApp Business", scriptLabel: "Boas-vindas automático", script: '"Olá! Bem-vindo à ODB 🔧\nSomos especialistas em suspensão com 25 anos.\n\nQual é seu carro e o que está sentindo? Respondemos em até 30 min 👇"', note: "Regra: sem resposta por mais de 30 min = inaceitável." },
            { title: "Entrega + Review", scriptLabel: "Script de Entrega", script: '"[NOME], seu [CARRO] tá pronto!\nFizemos [SERVIÇO].\n\nAqui seu Termo de Garantia: [X] meses.\n\nVocê toparia deixar uma avaliação no Google? [QR CODE] 🙏"' },
          ].map((s, i) => (
            <div key={i} style={cardStyle(PB.red)}>
              <h3 style={{ fontFamily: "'Antonio', sans-serif", fontSize: 14, color: PB.white, textTransform: "uppercase", letterSpacing: 2, marginBottom: 10 }}>{s.title}</h3>
              <div style={{
                background: PB.d3, border: `1px solid ${PB.d5}`, padding: "16px 18px", margin: "10px 0",
                fontFamily: "'DM Mono', monospace", fontSize: 12, color: PB.chromeL, lineHeight: 1.9, whiteSpace: "pre-wrap",
              }}>
                <div style={{ fontSize: 8, letterSpacing: 2, color: PB.red, textTransform: "uppercase", marginBottom: 8 }}>{s.scriptLabel}</div>
                {s.script}
              </div>
              {s.note && <p style={{ fontSize: 11, marginTop: 8, color: PB.dim }}><strong style={{ color: PB.white }}>{s.note.split(":")[0]}:</strong>{s.note.split(":").slice(1).join(":")}</p>}
            </div>
          ))}
        </div>
      </section>

      {/* ═══ 03 · OPERAÇÕES ═══ */}
      <section style={sectionStyle} data-pb-section="operacoes" id="pb-operacoes">
        <SectionHeader num="03" title="Operações" sub="Checklists diários · Toque para marcar" />

        <div style={{ display: "flex", overflowX: "auto", borderBottom: `1px solid ${PB.d4}`, marginBottom: 20, WebkitOverflowScrolling: "touch" }} className="scrollbar-none">
          {CHECKLIST_TABS.map(tab => (
            <button key={tab.id} onClick={() => setActiveCheckTab(tab.id)} style={{
              flexShrink: 0, padding: "12px 16px", fontFamily: "'Chakra Petch', sans-serif",
              fontSize: 10, fontWeight: 600, letterSpacing: 1.5, textTransform: "uppercase",
              color: activeCheckTab === tab.id ? PB.redL : PB.dim, background: "none", border: "none",
              borderBottom: `2px solid ${activeCheckTab === tab.id ? PB.red : "transparent"}`,
              cursor: "pointer", minHeight: 44,
            }}>{tab.label}</button>
          ))}
        </div>

        <div className="pb-grid2" style={{ display: "grid", gridTemplateColumns: "1fr", gap: 14 }}>
          {checks[activeCheckTab]?.map((group, gi) => (
            <div key={gi} style={{ marginBottom: 22 }}>
              <div style={{
                fontSize: 9, fontWeight: 600, letterSpacing: 2.5, textTransform: "uppercase",
                color: PB.chromeD, marginBottom: 8, paddingBottom: 6, borderBottom: `1px solid ${PB.d4}`,
              }}>{group.title}</div>
              {group.items.map((item, ii) => (
                <ChecklistItem key={ii} item={item} onToggle={() => toggleCheck(activeCheckTab, gi, ii)} />
              ))}
            </div>
          ))}
        </div>
      </section>

      {/* ═══ 04 · PESSOAS ═══ */}
      <section style={sectionStyle} data-pb-section="pessoas" id="pb-pessoas">
        <SectionHeader num="04" title="Gestão de Pessoas" sub="Contratação · Funções · Salários · Avaliação" />

        <Label>Processo de Contratação</Label>
        <div style={{ display: "flex", flexDirection: "column" }}>
          {[
            { n: "1", title: "Definir Perfil", desc: "Função, requisitos técnicos, experiência mínima, salário. Escrever descrição clara antes de publicar." },
            { n: "2", title: "Publicar a Vaga", desc: "SINE Fortaleza (gratuito), stories Instagram, grupos WhatsApp do setor. Bônus para quem indicar candidato aprovado." },
            { n: "3", title: "Entrevista e Teste Prático", desc: "Entrevista de 20–30 min. Para técnicos e borracheiros: teste prático. Avaliar postura, comprometimento, experiência." },
            { n: "4", title: "Período de Experiência", desc: "45 + 45 dias (CLT). Feedback semanal. Critérios claros de aprovação definidos antes de iniciar." },
            { n: "5", title: "Onboarding ODB", desc: "Apresentar: valores, checklist de funções, padrão premium, OS, EPIs. Primeiro mês: acompanhamento diário pelo sócio responsável." },
          ].map((step, i, arr) => (
            <div key={i} style={{ display: "flex", alignItems: "stretch" }}>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: 44, minWidth: 44 }}>
                <div style={{
                  width: 30, height: 30, background: PB.red, display: "flex", alignItems: "center",
                  justifyContent: "center", fontFamily: "'DM Mono', monospace", fontSize: 11, color: "#fff", flexShrink: 0,
                }}>{step.n}</div>
                {i < arr.length - 1 && <div style={{ width: 1, background: PB.d5, flex: 1, minHeight: 16 }} />}
              </div>
              <div style={{ flex: 1, padding: "2px 0 20px 16px" }}>
                <div style={{ fontFamily: "'Antonio', sans-serif", fontSize: 14, color: PB.white, textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>{step.title}</div>
                <div style={{ fontSize: 12, color: PB.dim, lineHeight: 1.7 }}>{step.desc}</div>
              </div>
            </div>
          ))}
        </div>

        <hr style={{ border: "none", borderTop: `1px solid ${PB.d3}`, margin: "24px 0" }} />

        <div className="pb-grid2" style={{ display: "grid", gridTemplateColumns: "1fr", gap: 14 }}>
          <div>
            <Label>Salários Referência Fortaleza 2026</Label>
            <div style={{ overflowX: "auto", WebkitOverflowScrolling: "touch", marginBottom: 20 }}>
              <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 320 }}>
                <thead>
                  <tr>
                    {["Função", "Faixa", "Obs."].map(h => (
                      <th key={h} style={{ textAlign: "left", fontSize: 9, fontWeight: 600, letterSpacing: 2, textTransform: "uppercase", color: PB.chromeD, padding: "9px 12px", borderBottom: `1px solid ${PB.d4}`, background: PB.d2, whiteSpace: "nowrap" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[
                    ["Mecânico Suspensão", "R$ 2.200–3.500", "+ comissão"],
                    ["Borracheiro", "R$ 1.800–2.800", "skill técnico"],
                    ["Atendente", "R$ 1.600–2.000", "+ bônus reviews"],
                  ].map((r, i) => (
                    <tr key={i}>
                      <td style={{ padding: "11px 12px", fontSize: 13, color: PB.text, borderBottom: `1px solid ${PB.d3}` }}>{r[0]}</td>
                      <td style={{ padding: "11px 12px", fontSize: 13, color: PB.gold, fontWeight: 600, fontFamily: "'DM Mono', monospace", borderBottom: `1px solid ${PB.d3}` }}>{r[1]}</td>
                      <td style={{ padding: "11px 12px", fontSize: 13, color: PB.text, borderBottom: `1px solid ${PB.d3}` }}>{r[2]}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <div>
            <Label>Avaliação Trimestral</Label>
            <div style={cardStyle(PB.gold)}>
              <h3 style={{ fontFamily: "'Antonio', sans-serif", fontSize: 14, color: PB.white, textTransform: "uppercase", letterSpacing: 2, marginBottom: 10 }}>Critérios</h3>
              <p style={{ color: PB.dim, fontSize: 13, lineHeight: 1.7 }}>
                <strong style={{ color: PB.white }}>Qualidade dos serviços</strong> — 30%<br />
                <strong style={{ color: PB.white }}>Produtividade (OS/dia)</strong> — 25%<br />
                <strong style={{ color: PB.white }}>Atendimento ao cliente</strong> — 20%<br />
                <strong style={{ color: PB.white }}>Organização / Limpeza</strong> — 15%<br />
                <strong style={{ color: PB.white }}>Pontualidade</strong> — 10%<br /><br />
                ≥ 8 → reconhecimento + bônus<br />
                5–7 → plano de melhoria<br />
                &lt; 5 → advertência formal
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ 05 · LANÇAMENTO WS ═══ */}
      <section style={sectionStyle} data-pb-section="lancamento" id="pb-lancamento">
        <SectionHeader num="05" title="Lançamento WS" sub="Washington Soares · Sócio John · Plano de abertura" />
        <GoldBox title="Estratégia:">
          A Washington Soares abre com o padrão mais alto das 3 unidades. Cada detalhe da abertura gera conteúdo, autoridade e clientes recorrentes desde o dia 1.
        </GoldBox>

        <div className="pb-grid2" style={{ display: "grid", gridTemplateColumns: "1fr", gap: 14 }}>
          <div>
            <Label>Checklist Pré-abertura</Label>
            {[
              { title: "Identidade Visual", items: ["Fachada com logo ODB iluminado", "Shadow board instalado e pintado", "Uniformes prontos antes da abertura", "Área de espera montada (cadeiras, TV, café, Wi-Fi)", "Placa de serviços na recepção", "QR Code Google review posicionado"] },
              { title: "Operacional", items: ["Equipamentos instalados e testados", "Estoque inicial abastecido", "Selos, capas, tapetes, embalagens estocados", "WhatsApp Business configurado", "Google Meu Negócio verificado", "Equipe contratada e treinada"] },
            ].map((g, gi) => (
              <div key={gi} style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 9, fontWeight: 600, letterSpacing: 2.5, textTransform: "uppercase", color: PB.chromeD, marginBottom: 8, paddingBottom: 6, borderBottom: `1px solid ${PB.d4}` }}>{g.title}</div>
                {g.items.map((item, ii) => (
                  <div key={ii} onClick={(e) => { const el = e.currentTarget; el.classList.toggle("pb-done"); }} style={{
                    display: "flex", alignItems: "flex-start", gap: 14, padding: "12px 14px",
                    marginBottom: 3, background: PB.d2, cursor: "pointer", minHeight: 44,
                  }}>
                    <div style={{ width: 18, height: 18, minWidth: 18, border: `1px solid ${PB.chromeD}`, display: "flex", alignItems: "center", justifyContent: "center", marginTop: 1, fontSize: 10 }} />
                    <div style={{ fontSize: 13, color: PB.text, lineHeight: 1.5 }}>{item}</div>
                  </div>
                ))}
              </div>
            ))}
          </div>
          <div>
            <Label>Timeline de Lançamento</Label>
            <div style={{ position: "relative", paddingLeft: 28, marginBottom: 20 }}>
              <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 1, background: PB.d5 }} />
              {[
                { phase: "2 semanas antes", title: "Antecipação", desc: 'Reels mostrando a montagem. "Em breve, ODB Washington Soares." Stories diários do processo.' },
                { phase: "1 semana antes", title: "Divulgação", desc: "Anunciar data oficial. Abrir agenda com desconto de inauguração. Impulsionar post (R$50–100). Compartilhar nos grupos automotivos." },
                { phase: "Dia de Inauguração", title: "Experiência Total", desc: "Primeiro atendimento filmado. Equipe uniformizada. Brinde para primeiros clientes. Cobertura completa em Stories e Reels." },
                { phase: "Primeiros 30 dias", title: "Consolidação", desc: "Meta: 20 reviews Google na 1ª semana. Publicar antes/depois diário. Acompanhar KPIs. Ajustar operação." },
              ].map((t, i) => (
                <div key={i} style={{ position: "relative", marginBottom: 24 }}>
                  <div style={{ position: "absolute", left: -33, top: 3, width: 9, height: 9, background: PB.red }} />
                  <div style={{ fontSize: 9, letterSpacing: 2, color: PB.red, textTransform: "uppercase", marginBottom: 4 }}>{t.phase}</div>
                  <div style={{ fontFamily: "'Antonio', sans-serif", fontSize: 15, color: PB.white, textTransform: "uppercase", letterSpacing: 1, marginBottom: 5 }}>{t.title}</div>
                  <div style={{ fontSize: 12, color: PB.dim, lineHeight: 1.7 }}>{t.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ═══ 06 · MARKETING ═══ */}
      <section style={sectionStyle} data-pb-section="marketing" id="pb-marketing">
        <SectionHeader num="06" title="Marketing" sub="Instagram · Google · WhatsApp · Parcerias" />

        <div style={{ background: PB.d3, borderLeft: `3px solid ${PB.gold}`, padding: "14px 18px", margin: "0 0 24px", fontSize: 13, color: PB.text }}>
          <strong style={{ color: PB.gold }}>Posicionamento ODB:</strong> "A única oficina de suspensão do Nordeste com fabricação própria em tecnologia americana — 25 anos de pioneirismo, 3 unidades em Fortaleza."
        </div>

        <div className="pb-grid2" style={{ display: "grid", gridTemplateColumns: "1fr", gap: 14 }}>
          <div>
            <Label>Calendário de Conteúdo Instagram</Label>
            <div style={{ overflowX: "auto", marginBottom: 20 }}>
              <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 320 }}>
                <thead><tr>{["Formato", "Freq.", "Objetivo"].map(h => <th key={h} style={{ textAlign: "left", fontSize: 9, fontWeight: 600, letterSpacing: 2, textTransform: "uppercase", color: PB.chromeD, padding: "9px 12px", borderBottom: `1px solid ${PB.d4}`, background: PB.d2, whiteSpace: "nowrap" }}>{h}</th>)}</tr></thead>
                <tbody>
                  {[
                    ["Reels antes/depois", "2×/sem", "Alcance", PB.gold],
                    ["Reels fabricação", "1×/sem", "Diferencial", PB.gold],
                    ["Carrossel educativo", "1×/sem", "Autoridade", PB.gold],
                    ["Stories veículos", "Diário", "Engajamento", PB.gold],
                    ["Depoimento cliente", "2×/mês", "Prova social", PB.redL],
                    ["Bastidores equipe", "1×/mês", "Humanização", PB.redL],
                  ].map((r, i) => (
                    <tr key={i}>
                      <td style={{ padding: "11px 12px", fontSize: 13, color: PB.text, borderBottom: `1px solid ${PB.d3}` }}>{r[0]}</td>
                      <td style={{ padding: "11px 12px", fontSize: 13, color: r[3], fontWeight: 600, fontFamily: "'DM Mono', monospace", borderBottom: `1px solid ${PB.d3}` }}>{r[1]}</td>
                      <td style={{ padding: "11px 12px", fontSize: 13, color: PB.text, borderBottom: `1px solid ${PB.d3}` }}>{r[2]}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <Label>Top 10 Conteúdos</Label>
            <div style={cardStyle(PB.red)}>
              <p style={{ color: PB.dim, fontSize: 13 }}>
                <Tag label="1. Fabricação do zero ao zero" type="red" />
                <Tag label="2. Antes/depois suspensão destruída" type="red" />
                <Tag label="3. 5 sinais que sua suspensão está ruim" type="red" />
                <Tag label="4. Sintética vs borracha americana ODB" />
                <Tag label="5. Carro importado? A gente faz sua peça" />
                <Tag label="6. O que é o selo de garantia ODB?" />
                <Tag label="7. Tour pela nova unidade Washington Soares" type="green" />
                <Tag label="8. 25 anos — história da família" type="green" />
                <Tag label="9. Cliente reage ao ver chassi antes vs depois" type="yellow" />
                <Tag label="10. Quiz: você sabe o que é uma bucha?" type="yellow" />
              </p>
            </div>
          </div>
          <div>
            <Label>WhatsApp Business · Etiquetas</Label>
            <div style={{ overflowX: "auto", marginBottom: 20 }}>
              <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 320 }}>
                <thead><tr>{["Etiqueta", "Quando usar"].map(h => <th key={h} style={{ textAlign: "left", fontSize: 9, fontWeight: 600, letterSpacing: 2, textTransform: "uppercase", color: PB.chromeD, padding: "9px 12px", borderBottom: `1px solid ${PB.d4}`, background: PB.d2, whiteSpace: "nowrap" }}>{h}</th>)}</tr></thead>
                <tbody>
                  {[
                    [<Tag label="Novo Lead" type="yellow" />, "Primeiro contato"],
                    [<Tag label="Orçamento Enviado" type="red" />, "Proposta mandada"],
                    [<Tag label="Em Serviço" type="green" />, "Veículo na oficina"],
                    [<Tag label="Pronto p/ Retirar" />, "Aguardando cliente"],
                    [<Tag label="Entregue" type="green" />, "Veículo retirado"],
                    [<Tag label="Follow-up 30d" type="gold" />, "Pós-serviço"],
                    [<Tag label="Cliente Fiel" />, "3ª visita ou mais"],
                  ].map((r, i) => (
                    <tr key={i}>
                      <td style={{ padding: "11px 12px", borderBottom: `1px solid ${PB.d3}` }}>{r[0]}</td>
                      <td style={{ padding: "11px 12px", fontSize: 13, color: PB.text, borderBottom: `1px solid ${PB.d3}` }}>{r[1]}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <Label>Parcerias Estratégicas</Label>
            <div style={cardStyle(PB.gold)}>
              <h3 style={{ fontFamily: "'Antonio', sans-serif", fontSize: 14, color: PB.white, textTransform: "uppercase", letterSpacing: 2, marginBottom: 10 }}>Canais de Indicação</h3>
              <p style={{ color: PB.dim, fontSize: 13, lineHeight: 1.7 }}>
                <strong style={{ color: PB.white }}>Mecânicas gerais</strong> — indicam clientes, recebem 5–10% por OS fechada.<br /><br />
                <strong style={{ color: PB.white }}>Concessionárias</strong> — veículos fora de garantia. Acordo B2B.<br /><br />
                <strong style={{ color: PB.white }}>Despachantes</strong> — laudos de suspensão. Canal recorrente.<br /><br />
                <strong style={{ color: PB.white }}>Influenciadores auto CE</strong> — review em troca de serviço gratuito.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ 07 · FINANCEIRO ═══ */}
      <section style={sectionStyle} data-pb-section="financeiro" id="pb-financeiro">
        <SectionHeader num="07" title="Financeiro" sub="Visão consolidada · Metas · Precificação" />

        <div className="pb-grid3" style={{ display: "grid", gridTemplateColumns: "1fr", gap: 14, marginBottom: 20 }}>
          <FinCard>
            <Label>Faturamento Atual</Label>
            <div style={{ fontFamily: "'Antonio', sans-serif", fontSize: 36, color: PB.gold, letterSpacing: 1 }}>~R$100k</div>
            <div style={{ fontSize: 9, letterSpacing: 2, color: PB.dim, textTransform: "uppercase", marginTop: 3 }}>líquido / mês · 2 unidades</div>
            <hr style={{ border: "none", borderTop: `1px solid ${PB.d3}`, margin: "12px 0" }} />
            <FinRow label="Aguanambi (Neto)" value="R$50–60k" />
            <FinRow label="Aldeota (Eduardo)" value="R$30–40k" />
            <FinRow label="Washington Soares (John)" value="Em abertura" valueColor={PB.dim} />
          </FinCard>
          <FinCard>
            <Label>Meta 12 Meses</Label>
            <div style={{ fontFamily: "'Antonio', sans-serif", fontSize: 36, color: PB.gold, letterSpacing: 1 }}>R$180k+</div>
            <div style={{ fontSize: 9, letterSpacing: 2, color: PB.dim, textTransform: "uppercase", marginTop: 3 }}>consolidado · 3 unidades</div>
            <hr style={{ border: "none", borderTop: `1px solid ${PB.d3}`, margin: "12px 0" }} />
            <FinRow label="Aguanambi" value="R$ 70k" valueColor={PB.gold} />
            <FinRow label="Aldeota" value="R$ 50k" valueColor={PB.gold} />
            <FinRow label="Washington Soares" value="R$50–60k" valueColor={PB.gold} />
          </FinCard>
          <FinCard>
            <Label>Regras de Caixa</Label>
            <FinRow label="Margem mínima" value="40%" valueColor={PB.gold} />
            <FinRow label="Margem ideal" value="55–65%" valueColor={PB.gold} />
            <FinRow label="Reserva emergência" value="3 meses" valueColor={PB.gold} />
            <FinRow label="Controle atual" value="Migrar caderno" valueColor={PB.redL} />
            <FinRow label="Conta PJ" value="Separar pessoal" valueColor={PB.redL} />
          </FinCard>
        </div>

        <div style={{ background: PB.d3, borderLeft: `3px solid ${PB.gold}`, padding: "14px 18px", fontSize: 13, color: PB.text }}>
          <strong style={{ color: PB.gold }}>Prioridade imediata:</strong> Migrar o caderno para planilha ou app. Com 3 unidades e ~R$100k/mês, o caderno não sustenta mais.
        </div>
      </section>

      {/* ═══ 08 · ROADMAP ═══ */}
      <section style={sectionStyle} data-pb-section="roadmap" id="pb-roadmap">
        <SectionHeader num="08" title="Roadmap 2026" sub="Do urgente ao estratégico" />

        <div className="pb-grid3" style={{ display: "grid", gridTemplateColumns: "1fr", gap: 14 }}>
          {[
            { title: "Agora · 30 dias", border: PB.red, tag: "Urgente", tagType: "red", items: ["Abrir Washington Soares com padrão premium", "Imprimir selos de garantia ODB", "Comprar capas de banco personalizadas", "Shadow board nas 3 unidades", "QR Code review Google por unidade", "Conteúdo de antecipação no Instagram"] },
            { title: "Curto · 90 dias", border: PB.chrome, tag: "Importante", tagType: "chrome", items: ["Migrar financeiro do caderno para planilha", "Padronizar uniformes nas 3 unidades", "Meta: 50 reviews Google totais", "Reels educativos semanais", "Termo de Garantia timbrado ODB", "Reunião mensal dos 4 sócios estruturada"] },
            { title: "Longo · 12 meses", border: PB.gold, tag: "Estratégico", tagType: "gold", items: ["R$ 180k+/mês com as 3 unidades", "Programa de fidelidade para clientes", "Venda B2B de borrachas para oficinas NE", "OS digital (eliminar papel)", "ODB como referência em suspensão no CE", "Avaliar quarta unidade"] },
          ].map((col, i) => (
            <div key={i} style={cardStyle(col.border)}>
              <h3 style={{ fontFamily: "'Antonio', sans-serif", fontSize: 14, color: PB.white, textTransform: "uppercase", letterSpacing: 2, marginBottom: 10 }}>{col.title}</h3>
              <Tag label={col.tag} type={col.tagType} />
              <p style={{ color: PB.dim, fontSize: 13, lineHeight: 1.7, marginTop: 12 }}>
                {col.items.map((item, j) => <span key={j}>▸ {item}<br /><br /></span>)}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* FOOTER */}
      <div style={{
        background: PB.d1, borderTop: `1px solid ${PB.d3}`, padding: "24px 20px 32px",
        textAlign: "center", fontSize: 10, color: PB.dim, letterSpacing: 1.5, lineHeight: 1.8,
      }}>
        ODB — Oficina da Borracha<br />
        Valmic Septimio Ramos Neto LTDA<br />
        Sócios: Dinho · Neto · Eduardo · John<br />
        Aguanambi · Aldeota · Washington Soares — Fortaleza, CE<br /><br />
        <span style={{ color: PB.red }}>Business Playbook v4.0 · Confidencial · Março 2026</span>
      </div>

      {/* BOTTOM NAV */}
      <nav style={{
        position: "fixed", bottom: 0, left: 0, right: 0, background: PB.d1,
        borderTop: `1px solid ${PB.d4}`, display: "flex", zIndex: 200, height: 56,
      }} className="md:hidden">
        {bottomNavItems.map(item => (
          <a key={item.id} href={`#pb-${item.id}`} style={{
            flex: 1, display: "flex", flexDirection: "column", alignItems: "center",
            justifyContent: "center", gap: 4, padding: "8px 4px", fontSize: 8,
            letterSpacing: 1, textTransform: "uppercase", textDecoration: "none",
            color: activeSection === item.id ? PB.redL : PB.dim,
            borderTop: `2px solid ${activeSection === item.id ? PB.red : "transparent"}`,
            transition: "all .2s", minHeight: 44,
          }}>
            <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
              <path d={item.icon} />
            </svg>
            {item.label}
          </a>
        ))}
      </nav>

      {/* Responsive styles */}
      <style>{`
        @media(min-width:640px){
          .pb-units-strip{flex-direction:row!important}
          .pb-units-strip>div{flex:1}
          .pb-metrics{grid-template-columns:repeat(4,1fr)!important}
          .pb-grid2{grid-template-columns:1fr 1fr!important}
          .pb-grid3{grid-template-columns:1fr 1fr!important}
        }
        @media(min-width:1024px){
          .pb-desknav{display:block!important}
          .pb-grid3{grid-template-columns:repeat(3,1fr)!important}
        }
      `}</style>
    </div>
  );
};

export default PlaybookPage;
