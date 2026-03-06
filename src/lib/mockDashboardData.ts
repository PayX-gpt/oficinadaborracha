// Mock data for the enterprise dashboard
export const mockKPIs = {
  receitaBruta: { value: 29850, prev: 26200, services: 47, pecasAvulsas: 12, sparkline: [3200, 4100, 3800, 4500, 5200, 4800, 4150] },
  lucroBruto: { value: 21390, prev: 18700, margin: 71.6, sparkline: [2100, 3200, 2800, 3400, 3900, 3500, 2490] },
  lucroLiquido: { value: 12540, prev: 11200, sparkline: [1200, 1900, 1600, 2100, 2400, 1800, 1540] },
  despesas: { value: 8850, prev: 7500, count: 23, maiorCategoria: "Matéria-Prima", sparkline: [900, 1200, 1100, 1400, 1600, 1350, 1300] },
  ticketMedio: { value: 635, prev: 580, sparkline: [580, 620, 610, 650, 700, 640, 635] },
  ganhoPorHora: { value: 155, prev: 140, sparkline: [130, 150, 145, 160, 170, 155, 155] },
};

export const mockOperational = {
  margemFabricadas: { percent: 85, receita: 18500, custo: 2775, pecas: 38 },
  margemCompradas: { percent: 18, receita: 7200, custo: 5904, pecas: 14 },
  taxaDesconto: { percent: 22, total: 1850, count: 10, media: 185 },
  impactoTaxas: { percent: 3.2, total: 955, credito: 650, debito: 305 },
};

export const mockPaymentMethods = [
  { method: "PIX", qty: 45, bruto: 12500, taxas: 0, liquido: 12500, percent: 42, color: "#10B981" },
  { method: "Dinheiro", qty: 30, bruto: 8200, taxas: 0, liquido: 8200, percent: 28, color: "#F59E0B" },
  { method: "Débito", qty: 15, bruto: 4500, taxas: 67, liquido: 4433, percent: 15, color: "#3B82F6" },
  { method: "Crédito", qty: 12, bruto: 4300, taxas: 107, liquido: 4193, percent: 15, color: "#8B5CF6" },
];

export const mockRevenueByDay = [
  { day: "Seg", maoDeObra: 3200, fabricadas: 2800, compradas: 1200, total: 7200 },
  { day: "Ter", maoDeObra: 4100, fabricadas: 3100, compradas: 1500, total: 8700 },
  { day: "Qua", maoDeObra: 3800, fabricadas: 2600, compradas: 1100, total: 7500 },
  { day: "Qui", maoDeObra: 4500, fabricadas: 3400, compradas: 1800, total: 9700 },
  { day: "Sex", maoDeObra: 5200, fabricadas: 3900, compradas: 2100, total: 11200 },
  { day: "Sáb", maoDeObra: 4800, fabricadas: 3200, compradas: 1600, total: 9600 },
  { day: "Dom", maoDeObra: 0, fabricadas: 0, compradas: 0, total: 0 },
];

export const mockProfitByDay = [
  { day: "Seg", lucroBruto: 5100, lucroLiquido: 2800 },
  { day: "Ter", lucroBruto: 6200, lucroLiquido: 3600 },
  { day: "Qua", lucroBruto: 5400, lucroLiquido: 2900 },
  { day: "Qui", lucroBruto: 7000, lucroLiquido: 4200 },
  { day: "Sex", lucroBruto: 8100, lucroLiquido: 5100 },
  { day: "Sáb", lucroBruto: 6800, lucroLiquido: 3800 },
  { day: "Dom", lucroBruto: 0, lucroLiquido: 0 },
];

export const mockExpensesByCategory = [
  { category: "Matéria-Prima (Borracha)", value: 2775, percent: 31, color: "#F59E0B" },
  { category: "Peças Compradas", value: 1800, percent: 20, color: "#3B82F6" },
  { category: "Aluguel", value: 1500, percent: 17, color: "#8B5CF6" },
  { category: "Energia Elétrica", value: 850, percent: 10, color: "#06B6D4" },
  { category: "Funcionários", value: 1200, percent: 14, color: "#EF4444" },
  { category: "Outros", value: 725, percent: 8, color: "#64748B" },
];

export const mockBranchComparison = [
  { filial: "Centro", receita: 12500, custo: 4200, lucro: 8300, margem: 66.4, ticket: 680, servicos: 18 },
  { filial: "Norte", receita: 9800, custo: 3600, lucro: 6200, margem: 63.3, ticket: 612, servicos: 16 },
  { filial: "Sul", receita: 7550, custo: 2800, lucro: 4750, margem: 62.9, ticket: 580, servicos: 13 },
];

export const mockSocios = [
  { nome: "João", filiais: "Centro, Norte", percent: 40, valorBruto: 4800, retiradas: 3000, saldo: 1800 },
  { nome: "Pedro", filiais: "Centro, Sul", percent: 35, valorBruto: 4200, retiradas: 2500, saldo: 1700 },
  { nome: "Carlos", filiais: "Norte, Sul", percent: 25, valorBruto: 3000, retiradas: 2000, saldo: 1000 },
];

export const mockTopServices = [
  { pos: 1, nome: "Bucha Bandeja Dianteira", veiculo: "Toyota Corolla", qty: 28, receita: 8400, custo: 1260, margem: 85, lucro: 7140, badge: ["🔥", "💎"] },
  { pos: 2, nome: "Coxim Amortecedor", veiculo: "Honda Civic", qty: 22, receita: 7150, custo: 1430, margem: 80, lucro: 5720, badge: ["🔥"] },
  { pos: 3, nome: "Bucha Estabilizadora", veiculo: "VW Gol", qty: 18, receita: 3600, custo: 540, margem: 85, lucro: 3060, badge: ["💎"] },
  { pos: 4, nome: "Batente Amortecedor", veiculo: "Hyundai HB20", qty: 15, receita: 3750, custo: 750, margem: 80, lucro: 3000, badge: [] },
  { pos: 5, nome: "Coifa Homocinetica", veiculo: "Fiat Argo", qty: 12, receita: 4200, custo: 1260, margem: 70, lucro: 2940, badge: ["⚡"] },
];

export const mockLowMarginServices = [
  { pos: 1, nome: "Pastilha Freio Dianteira", veiculo: "Diversos", qty: 8, receita: 1600, custo: 1200, margem: 25, lucro: 400 },
  { pos: 2, nome: "Disco Freio Traseiro", veiculo: "Diversos", qty: 5, receita: 1750, custo: 1400, margem: 20, lucro: 350 },
  { pos: 3, nome: "Amortecedor Completo", veiculo: "Diversos", qty: 4, receita: 2800, custo: 2380, margem: 15, lucro: 420 },
];

export const mockVehicleRanking = [
  { veiculo: "Toyota Corolla", servicos: 28, receita: 8400, ticket: 300, servicoComum: "Bucha Bandeja" },
  { veiculo: "Honda Civic", servicos: 22, receita: 7150, ticket: 325, servicoComum: "Coxim Amortecedor" },
  { veiculo: "VW Gol", servicos: 18, receita: 3600, ticket: 200, servicoComum: "Bucha Estabilizadora" },
  { veiculo: "Hyundai HB20", servicos: 15, receita: 3750, ticket: 250, servicoComum: "Batente Amortecedor" },
  { veiculo: "Fiat Argo", servicos: 12, receita: 4200, ticket: 350, servicoComum: "Coifa Homocinetica" },
];

export const mockHourlyRevenue = [
  { hour: "7h", value: 0, services: 0 },
  { hour: "8h", value: 1200, services: 2 },
  { hour: "9h", value: 2800, services: 4 },
  { hour: "10h", value: 4500, services: 6 },
  { hour: "11h", value: 3800, services: 5 },
  { hour: "12h", value: 1200, services: 2 },
  { hour: "13h", value: 2400, services: 3 },
  { hour: "14h", value: 4200, services: 6 },
  { hour: "15h", value: 3600, services: 5 },
  { hour: "16h", value: 3200, services: 4 },
  { hour: "17h", value: 2100, services: 3 },
  { hour: "18h", value: 850, services: 1 },
];

export const mockManufacturing = {
  receita: 18500,
  custoMP: 2775,
  margem: 85,
  pecas: 38,
  custoMedioPeca: 73,
  precoMedioCobrado: 487,
  roi: 6.7,
  timeline: [
    { day: "Seg", receita: 2800, custo: 420 },
    { day: "Ter", receita: 3100, custo: 465 },
    { day: "Qua", receita: 2600, custo: 390 },
    { day: "Qui", receita: 3400, custo: 510 },
    { day: "Sex", receita: 3900, custo: 585 },
    { day: "Sáb", receita: 2700, custo: 405 },
  ],
};

export const mockLiveFeed = [
  { id: 1, hora: "16:45", operador: "Carlos", tipo: "manual", desc: "Bucha Bandeja — Corolla 2020", valor: 350, pagamento: "PIX", filial: "Centro" },
  { id: 2, hora: "16:32", operador: "João", tipo: "foto", desc: "Coxim Amortecedor — Civic 2019", valor: 420, pagamento: "Crédito", filial: "Norte" },
  { id: 3, hora: "16:18", operador: "Pedro", tipo: "despesa", desc: "Compra de borracha natural", valor: -850, pagamento: "PIX", filial: "Centro" },
  { id: 4, hora: "15:55", operador: "Carlos", tipo: "audio", desc: "Bucha Estabilizadora — Gol 2018", valor: 200, pagamento: "Dinheiro", filial: "Sul" },
  { id: 5, hora: "15:40", operador: "João", tipo: "manual", desc: "Coifa Homocinetica — Argo 2021", valor: 380, pagamento: "Débito", filial: "Centro" },
  { id: 6, hora: "15:22", operador: "Pedro", tipo: "foto", desc: "Batente Amortecedor — HB20 2022", valor: 280, pagamento: "PIX", filial: "Norte" },
  { id: 7, hora: "14:58", operador: "Carlos", tipo: "manual", desc: "Bucha Bandeja — Onix 2020", valor: 320, pagamento: "Dinheiro", filial: "Sul" },
  { id: 8, hora: "14:32", operador: "João", tipo: "despesa", desc: "Energia Elétrica — Filial Centro", valor: -450, pagamento: "PIX", filial: "Centro" },
];

export const mockAIInsights = [
  { type: "opportunity" as const, title: "Margem de fabricação em alta", desc: "Sua margem de 85% em peças fabricadas está 20% acima da média do setor. Considere expandir a linha de produtos fabricados para Toyota e Honda.", action: "Avalie novos moldes para modelos de alta demanda." },
  { type: "alert" as const, title: "Despesas com energia subiram 18%", desc: "O gasto com energia elétrica aumentou R$ 130 este mês comparado ao anterior. Verifique se há equipamentos ligados desnecessariamente.", action: "Faça uma auditoria energética nas 3 filiais." },
  { type: "trend" as const, title: "Toyota Corolla domina o faturamento", desc: "28 serviços em Corolla representam 28% da receita total. Este é o veículo mais lucrativo da oficina.", action: "Mantenha estoque de peças para Corolla sempre em dia." },
  { type: "savings" as const, title: "PIX reduz custos de taxa em R$ 955/mês", desc: "42% dos pagamentos são via PIX (taxa zero). Se converter 50% dos cartões para PIX, economia adicional de R$ 478/mês.", action: "Ofereça 2% de desconto para pagamento via PIX." },
  { type: "recommendation" as const, title: "Reajuste pastilhas de freio", desc: "Margem de apenas 25% em pastilhas. Concorrentes cobram R$ 30 a mais por serviço. Aumente o preço sem perder competitividade.", action: "Reajuste de R$ 200 para R$ 230 por serviço." },
];

export const mockTransactions = [
  { id: 1, hora: "16:45", operador: "Carlos", cliente: "José Silva", veiculo: "Corolla 2020", placa: "ABC-1234", tipo: "Serviço", itens: 2, bruto: 350, custo: 52, desconto: 0, taxa: 0, liquido: 350, lucro: 298, margem: 85, pagamento: "PIX", fonte: "manual" },
  { id: 2, hora: "16:32", operador: "João", cliente: "Maria Santos", veiculo: "Civic 2019", placa: "DEF-5678", tipo: "Serviço", itens: 1, bruto: 420, custo: 84, desconto: 20, taxa: 10.5, liquido: 389.5, lucro: 305.5, margem: 73, pagamento: "Crédito", fonte: "foto" },
  { id: 3, hora: "16:18", operador: "Pedro", cliente: "—", veiculo: "—", placa: "—", tipo: "Despesa", itens: 0, bruto: 0, custo: 850, desconto: 0, taxa: 0, liquido: -850, lucro: -850, margem: 0, pagamento: "PIX", fonte: "manual" },
  { id: 4, hora: "15:55", operador: "Carlos", cliente: "Paulo Lima", veiculo: "Gol 2018", placa: "GHI-9012", tipo: "Serviço", itens: 1, bruto: 200, custo: 30, desconto: 0, taxa: 0, liquido: 200, lucro: 170, margem: 85, pagamento: "Dinheiro", fonte: "audio" },
  { id: 5, hora: "15:40", operador: "João", cliente: "Ana Costa", veiculo: "Argo 2021", placa: "JKL-3456", tipo: "Serviço", itens: 2, bruto: 380, custo: 114, desconto: 0, taxa: 5.7, liquido: 374.3, lucro: 260.3, margem: 69, pagamento: "Débito", fonte: "manual" },
];

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

export function calcChange(current: number, previous: number): { percent: number; positive: boolean } {
  if (previous === 0) return { percent: 0, positive: true };
  const percent = ((current - previous) / previous) * 100;
  return { percent: Math.abs(percent), positive: percent >= 0 };
}
