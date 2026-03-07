import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface DashboardData {
  lancamentos: any[];
  despesas: any[];
  items: any[];
  totalReceita: number;
  totalCusto: number;
  totalDespesas: number;
  totalDesconto: number;
  totalTaxas: number;
  lucroBruto: number;
  lucroLiquido: number;
  totalServicos: number;
  ticketMedio: number;
  // Payment methods breakdown
  paymentMethods: { method: string; qty: number; bruto: number; taxas: number; liquido: number; percent: number; color: string }[];
  // Hourly breakdown
  hourlyRevenue: { hour: string; value: number; services: number }[];
  // Expense categories
  expenseCategories: { category: string; value: number; percent: number; color: string }[];
  // Revenue by day
  revenueByDay: { day: string; maoDeObra: number; fabricadas: number; compradas: number; total: number }[];
  // Profit by day
  profitByDay: { day: string; lucroBruto: number; lucroLiquido: number }[];
  // Manufacturing
  manufacturing: {
    receita: number; custoMP: number; margem: number; pecas: number;
    custoMedioPeca: number; precoMedioCobrado: number; roi: number;
    timeline: { day: string; receita: number; custo: number }[];
  };
  // Operational
  operational: {
    margemFabricadas: { percent: number; receita: number; custo: number; pecas: number };
    margemCompradas: { percent: number; receita: number; custo: number; pecas: number };
    taxaDesconto: { percent: number; total: number; count: number; media: number };
    impactoTaxas: { percent: number; total: number; credito: number; debito: number };
  };
  // Service intelligence
  topServices: { pos: number; nome: string; veiculo: string; qty: number; receita: number; custo: number; margem: number; lucro: number }[];
  lowMarginServices: { pos: number; nome: string; qty: number; receita: number; custo: number; margem: number; lucro: number }[];
  vehicleRanking: { veiculo: string; servicos: number; receita: number; ticket: number; servicoComum: string }[];
}

const PAYMENT_COLORS: Record<string, string> = {
  PIX: "#10B981", Dinheiro: "#F59E0B", Débito: "#3B82F6",
  Crédito: "#8B5CF6", Cartão: "#8B5CF6",
};
const EXPENSE_COLORS = ["#F59E0B", "#3B82F6", "#8B5CF6", "#06B6D4", "#EF4444", "#64748B", "#10B981", "#EC4899"];
const DAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

function getDateRange(period: string): { start: Date; end?: Date } {
  const now = new Date();
  switch (period) {
    case "Hoje":
      return { start: new Date(now.getFullYear(), now.getMonth(), now.getDate()) };
    case "Ontem": {
      const s = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
      const e = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      return { start: s, end: e };
    }
    case "7 Dias":
      return { start: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7) };
    case "30 Dias":
      return { start: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 30) };
    case "Este Mês":
      return { start: new Date(now.getFullYear(), now.getMonth(), 1) };
    case "Mês Anterior": {
      const s = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const e = new Date(now.getFullYear(), now.getMonth(), 1);
      return { start: s, end: e };
    }
    default:
      return { start: new Date(now.getFullYear(), now.getMonth(), now.getDate()) };
  }
}

export function useDashboardData(period: string, branch: string = "all") {
  return useQuery({
    queryKey: ["dashboard", period, branch],
    queryFn: async (): Promise<DashboardData> => {
      const { start, end } = getDateRange(period);
      const isoStart = start.toISOString();

      let lancQ = supabase.from("lancamentos").select("*").gte("created_at", isoStart);
      let despQ = supabase.from("despesas").select("*").gte("created_at", isoStart);
      let itemsQ = supabase.from("lancamento_items").select("*").gte("created_at", isoStart);

      if (end) {
        lancQ = lancQ.lt("created_at", end.toISOString());
        despQ = despQ.lt("created_at", end.toISOString());
        itemsQ = itemsQ.lt("created_at", end.toISOString());
      }
      if (branch !== "all") {
        lancQ = lancQ.eq("filial_id", branch);
        despQ = despQ.eq("filial_id", branch);
      }

      const [lancRes, despRes, itemsRes] = await Promise.all([
        lancQ.order("created_at", { ascending: false }),
        despQ.order("created_at", { ascending: false }),
        itemsQ.order("created_at", { ascending: false }),
      ]);

      if (lancRes.error) throw lancRes.error;
      if (despRes.error) throw despRes.error;

      const lancamentos = lancRes.data || [];
      const despesas = despRes.data || [];
      const items = itemsRes.data || [];

      // Basic totals
      const totalReceita = lancamentos.reduce((s, l) => s + Number(l.valor_bruto), 0);
      const totalCusto = lancamentos.reduce((s, l) => s + Number(l.custo_total), 0);
      const totalDesconto = lancamentos.reduce((s, l) => s + Number(l.desconto), 0);
      const totalTaxas = lancamentos.reduce((s, l) => s + Number(l.taxa_valor), 0);
      const totalDespesas = despesas.reduce((s, d) => s + Number(d.valor), 0);
      const lucroBruto = totalReceita - totalCusto;
      const lucroLiquido = totalReceita - totalCusto - totalDespesas - totalTaxas - totalDesconto;
      const totalServicos = lancamentos.length;
      const ticketMedio = totalServicos > 0 ? totalReceita / totalServicos : 0;

      // Payment methods
      const pmMap = new Map<string, { qty: number; bruto: number; taxas: number }>();
      lancamentos.forEach((l) => {
        const m = l.metodo_pagamento || "Outro";
        const cur = pmMap.get(m) || { qty: 0, bruto: 0, taxas: 0 };
        cur.qty++;
        cur.bruto += Number(l.valor_bruto);
        cur.taxas += Number(l.taxa_valor);
        pmMap.set(m, cur);
      });
      const paymentMethods = Array.from(pmMap.entries())
        .map(([method, v]) => ({
          method,
          qty: v.qty,
          bruto: v.bruto,
          taxas: v.taxas,
          liquido: v.bruto - v.taxas,
          percent: totalReceita > 0 ? Math.round((v.bruto / totalReceita) * 100) : 0,
          color: PAYMENT_COLORS[method] || "#64748B",
        }))
        .sort((a, b) => b.bruto - a.bruto);

      // Hourly breakdown
      const hourMap = new Map<number, { value: number; services: number }>();
      lancamentos.forEach((l) => {
        const h = new Date(l.created_at).getHours();
        const cur = hourMap.get(h) || { value: 0, services: 0 };
        cur.value += Number(l.valor_bruto);
        cur.services++;
        hourMap.set(h, cur);
      });
      const hourlyRevenue = Array.from({ length: 12 }, (_, i) => {
        const h = i + 7;
        const d = hourMap.get(h) || { value: 0, services: 0 };
        return { hour: `${h}h`, value: d.value, services: d.services };
      });

      // Expense categories
      const ecMap = new Map<string, number>();
      despesas.forEach((d) => {
        ecMap.set(d.categoria, (ecMap.get(d.categoria) || 0) + Number(d.valor));
      });
      const expenseCategories = Array.from(ecMap.entries())
        .map(([category, value], i) => ({
          category,
          value,
          percent: totalDespesas > 0 ? Math.round((value / totalDespesas) * 100) : 0,
          color: EXPENSE_COLORS[i % EXPENSE_COLORS.length],
        }))
        .sort((a, b) => b.value - a.value);

      // Revenue/Profit by day of week
      const dayRevMap = new Map<number, { maoDeObra: number; fabricadas: number; compradas: number; total: number; custo: number }>();
      lancamentos.forEach((l) => {
        const dow = new Date(l.created_at).getDay();
        const cur = dayRevMap.get(dow) || { maoDeObra: 0, fabricadas: 0, compradas: 0, total: 0, custo: 0 };
        cur.total += Number(l.valor_bruto);
        cur.custo += Number(l.custo_total);
        dayRevMap.set(dow, cur);
      });

      // Aggregate items by type per day
      const itemsByLanc = new Map<string, any[]>();
      items.forEach((it) => {
        const arr = itemsByLanc.get(it.lancamento_id) || [];
        arr.push(it);
        itemsByLanc.set(it.lancamento_id, arr);
      });

      lancamentos.forEach((l) => {
        const dow = new Date(l.created_at).getDay();
        const cur = dayRevMap.get(dow)!;
        const litems = itemsByLanc.get(l.id) || [];
        litems.forEach((it) => {
          const val = Number(it.valor_cobrado);
          if (it.tipo === "fabricada") cur.fabricadas += val;
          else if (it.tipo === "comprada") cur.compradas += val;
          else cur.maoDeObra += val;
        });
        // If no items, attribute to mao_de_obra
        if (litems.length === 0) {
          cur.maoDeObra += Number(l.valor_bruto);
        }
      });

      const revenueByDay = [1, 2, 3, 4, 5, 6, 0].map((dow) => {
        const d = dayRevMap.get(dow) || { maoDeObra: 0, fabricadas: 0, compradas: 0, total: 0, custo: 0 };
        return { day: DAYS[dow], maoDeObra: d.maoDeObra, fabricadas: d.fabricadas, compradas: d.compradas, total: d.total };
      });

      const dayDespMap = new Map<number, number>();
      despesas.forEach((d) => {
        const dow = new Date(d.created_at).getDay();
        dayDespMap.set(dow, (dayDespMap.get(dow) || 0) + Number(d.valor));
      });

      const profitByDay = [1, 2, 3, 4, 5, 6, 0].map((dow) => {
        const rev = dayRevMap.get(dow) || { total: 0, custo: 0 };
        const desp = dayDespMap.get(dow) || 0;
        return { day: DAYS[dow], lucroBruto: rev.total - rev.custo, lucroLiquido: rev.total - rev.custo - desp };
      });

      // Manufacturing (items with tipo='fabricada')
      const fabItems = items.filter((it) => it.tipo === "fabricada");
      const mfgReceita = fabItems.reduce((s, it) => s + Number(it.valor_cobrado), 0);
      const mfgCusto = fabItems.reduce((s, it) => s + Number(it.custo), 0);
      const mfgPecas = fabItems.length;
      const mfgMargem = mfgReceita > 0 ? Math.round(((mfgReceita - mfgCusto) / mfgReceita) * 100) : 0;

      // Manufacturing timeline by day
      const mfgDayMap = new Map<number, { receita: number; custo: number }>();
      fabItems.forEach((it) => {
        const dow = new Date(it.created_at).getDay();
        const cur = mfgDayMap.get(dow) || { receita: 0, custo: 0 };
        cur.receita += Number(it.valor_cobrado);
        cur.custo += Number(it.custo);
        mfgDayMap.set(dow, cur);
      });
      const mfgTimeline = [1, 2, 3, 4, 5, 6].map((dow) => {
        const d = mfgDayMap.get(dow) || { receita: 0, custo: 0 };
        return { day: DAYS[dow], receita: d.receita, custo: d.custo };
      });

      const manufacturing = {
        receita: mfgReceita,
        custoMP: mfgCusto,
        margem: mfgMargem,
        pecas: mfgPecas,
        custoMedioPeca: mfgPecas > 0 ? mfgCusto / mfgPecas : 0,
        precoMedioCobrado: mfgPecas > 0 ? mfgReceita / mfgPecas : 0,
        roi: mfgCusto > 0 ? Number((mfgReceita / mfgCusto).toFixed(1)) : 0,
        timeline: mfgTimeline,
      };

      // Operational metrics
      const compItems = items.filter((it) => it.tipo === "comprada");
      const compReceita = compItems.reduce((s, it) => s + Number(it.valor_cobrado), 0);
      const compCusto = compItems.reduce((s, it) => s + Number(it.custo), 0);

      const descontoCount = lancamentos.filter((l) => Number(l.desconto) > 0).length;
      const creditoTaxas = lancamentos.filter((l) => (l.metodo_pagamento || "").toLowerCase().includes("créd")).reduce((s, l) => s + Number(l.taxa_valor), 0);
      const debitoTaxas = lancamentos.filter((l) => (l.metodo_pagamento || "").toLowerCase().includes("déb")).reduce((s, l) => s + Number(l.taxa_valor), 0);

      const operational = {
        margemFabricadas: {
          percent: mfgMargem,
          receita: mfgReceita,
          custo: mfgCusto,
          pecas: mfgPecas,
        },
        margemCompradas: {
          percent: compReceita > 0 ? Math.round(((compReceita - compCusto) / compReceita) * 100) : 0,
          receita: compReceita,
          custo: compCusto,
          pecas: compItems.length,
        },
        taxaDesconto: {
          percent: totalServicos > 0 ? Math.round((descontoCount / totalServicos) * 100) : 0,
          total: totalDesconto,
          count: descontoCount,
          media: descontoCount > 0 ? totalDesconto / descontoCount : 0,
        },
        impactoTaxas: {
          percent: totalReceita > 0 ? Number(((totalTaxas / totalReceita) * 100).toFixed(1)) : 0,
          total: totalTaxas,
          credito: creditoTaxas,
          debito: debitoTaxas,
        },
      };

      // Service intelligence - group by item description
      const svcMap = new Map<string, { qty: number; receita: number; custo: number; veiculos: Map<string, number> }>();
      items.forEach((it) => {
        const desc = it.descricao || "Serviço";
        const cur = svcMap.get(desc) || { qty: 0, receita: 0, custo: 0, veiculos: new Map() };
        cur.qty++;
        cur.receita += Number(it.valor_cobrado);
        cur.custo += Number(it.custo);
        // Find parent lancamento for vehicle info
        const parent = lancamentos.find((l) => l.id === it.lancamento_id);
        if (parent?.veiculo_desc) {
          cur.veiculos.set(parent.veiculo_desc, (cur.veiculos.get(parent.veiculo_desc) || 0) + 1);
        }
        svcMap.set(desc, cur);
      });

      const allServices = Array.from(svcMap.entries()).map(([nome, v]) => {
        const lucro = v.receita - v.custo;
        const margem = v.receita > 0 ? Math.round((lucro / v.receita) * 100) : 0;
        const topVeiculo = v.veiculos.size > 0
          ? Array.from(v.veiculos.entries()).sort((a, b) => b[1] - a[1])[0][0]
          : "Diversos";
        return { nome, qty: v.qty, receita: v.receita, custo: v.custo, margem, lucro, veiculo: topVeiculo };
      });

      const topServices = allServices
        .sort((a, b) => b.lucro - a.lucro)
        .slice(0, 5)
        .map((s, i) => ({ ...s, pos: i + 1 }));

      const lowMarginServices = allServices
        .filter((s) => s.margem < 50 && s.qty > 0)
        .sort((a, b) => a.margem - b.margem)
        .slice(0, 5)
        .map((s, i) => ({ ...s, pos: i + 1 }));

      // Vehicle ranking
      const vMap = new Map<string, { servicos: number; receita: number; items: Map<string, number> }>();
      lancamentos.forEach((l) => {
        const v = l.veiculo_desc || "Não informado";
        const cur = vMap.get(v) || { servicos: 0, receita: 0, items: new Map() };
        cur.servicos++;
        cur.receita += Number(l.valor_bruto);
        const litems = itemsByLanc.get(l.id) || [];
        litems.forEach((it) => {
          cur.items.set(it.descricao, (cur.items.get(it.descricao) || 0) + 1);
        });
        vMap.set(v, cur);
      });
      const vehicleRanking = Array.from(vMap.entries())
        .map(([veiculo, v]) => ({
          veiculo,
          servicos: v.servicos,
          receita: v.receita,
          ticket: v.servicos > 0 ? Math.round(v.receita / v.servicos) : 0,
          servicoComum: v.items.size > 0
            ? Array.from(v.items.entries()).sort((a, b) => b[1] - a[1])[0][0]
            : "—",
        }))
        .sort((a, b) => b.receita - a.receita)
        .slice(0, 10);

      return {
        lancamentos, despesas, items,
        totalReceita, totalCusto, totalDespesas, totalDesconto, totalTaxas,
        lucroBruto, lucroLiquido, totalServicos, ticketMedio,
        paymentMethods, hourlyRevenue, expenseCategories,
        revenueByDay, profitByDay, manufacturing, operational,
        topServices, lowMarginServices, vehicleRanking,
      };
    },
    refetchInterval: 30000,
  });
}
