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
  // Comparatives (vs previous period)
  prevReceita: number;
  prevLucroBruto: number;
  prevLucroLiquido: number;
  prevDespesas: number;
  prevTicketMedio: number;
  prevServicos: number;
  // Sparkline data (last 7 data points)
  sparkReceita: number[];
  sparkLucroBruto: number[];
  sparkLucroLiquido: number[];
  sparkDespesas: number[];
  sparkTicket: number[];
  sparkGanhoHora: number[];
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
  // Branch comparison
  branchComparison: { filial: string; filialId: string; receita: number; lucro: number; servicos: number; ticket: number }[];
  // Month projection
  monthProjection: { receitaProj: number; lucroProj: number; diasPassados: number; diasNoMes: number; progressPercent: number };
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

function getPreviousRange(period: string): { start: Date; end: Date } {
  const now = new Date();
  switch (period) {
    case "Hoje": {
      const s = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
      const e = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      return { start: s, end: e };
    }
    case "Ontem": {
      const s = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 2);
      const e = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
      return { start: s, end: e };
    }
    case "7 Dias": {
      const s = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 14);
      const e = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
      return { start: s, end: e };
    }
    case "30 Dias": {
      const s = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 60);
      const e = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 30);
      return { start: s, end: e };
    }
    case "Este Mês": {
      const s = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const e = new Date(now.getFullYear(), now.getMonth(), 1);
      return { start: s, end: e };
    }
    case "Mês Anterior": {
      const s = new Date(now.getFullYear(), now.getMonth() - 2, 1);
      const e = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      return { start: s, end: e };
    }
    default: {
      const s = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
      const e = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      return { start: s, end: e };
    }
  }
}

export function useDashboardData(period: string, branch: string = "all") {
  return useQuery({
    queryKey: ["dashboard", period, branch],
    queryFn: async (): Promise<DashboardData> => {
      const { start, end } = getDateRange(period);
      const prev = getPreviousRange(period);
      const isoStart = start.toISOString();

      let lancQ = supabase.from("lancamentos").select("*").gte("created_at", isoStart);
      let despQ = supabase.from("despesas").select("*").gte("created_at", isoStart);
      let itemsQ = supabase.from("lancamento_items").select("*").gte("created_at", isoStart);

      // Previous period
      let prevLancQ = supabase.from("lancamentos").select("valor_bruto, custo_total, desconto, taxa_valor").gte("created_at", prev.start.toISOString()).lt("created_at", prev.end.toISOString());
      let prevDespQ = supabase.from("despesas").select("valor").gte("created_at", prev.start.toISOString()).lt("created_at", prev.end.toISOString());

      // Sparkline: last 7 days
      const spark7Start = new Date();
      spark7Start.setDate(spark7Start.getDate() - 7);
      spark7Start.setHours(0, 0, 0, 0);
      let sparkLancQ = supabase.from("lancamentos").select("created_at, valor_bruto, custo_total, desconto, taxa_valor").gte("created_at", spark7Start.toISOString());
      let sparkDespQ = supabase.from("despesas").select("created_at, valor").gte("created_at", spark7Start.toISOString());

      // Branch comparison
      let branchLancQ = supabase.from("lancamentos").select("filial_id, valor_bruto, lucro").gte("created_at", isoStart);
      let filiaisQ = supabase.from("filiais").select("id, nome").eq("ativa", true);

      if (end) {
        lancQ = lancQ.lt("created_at", end.toISOString());
        despQ = despQ.lt("created_at", end.toISOString());
        itemsQ = itemsQ.lt("created_at", end.toISOString());
        branchLancQ = branchLancQ.lt("created_at", end.toISOString());
      }
      if (branch !== "all") {
        lancQ = lancQ.eq("filial_id", branch);
        despQ = despQ.eq("filial_id", branch);
        prevLancQ = prevLancQ.eq("filial_id", branch);
        prevDespQ = prevDespQ.eq("filial_id", branch);
        sparkLancQ = sparkLancQ.eq("filial_id", branch);
        sparkDespQ = sparkDespQ.eq("filial_id", branch);
      }

      const [lancRes, despRes, itemsRes, prevLancRes, prevDespRes, sparkLancRes, sparkDespRes, branchLancRes, filiaisRes] = await Promise.all([
        lancQ.order("created_at", { ascending: false }),
        despQ.order("created_at", { ascending: false }),
        itemsQ.order("created_at", { ascending: false }),
        prevLancQ,
        prevDespQ,
        sparkLancQ,
        sparkDespQ,
        branchLancQ,
        filiaisQ,
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

      // Previous period totals
      const prevLancs = prevLancRes.data || [];
      const prevDesps = prevDespRes.data || [];
      const prevReceita = prevLancs.reduce((s, l) => s + Number(l.valor_bruto), 0);
      const prevCusto = prevLancs.reduce((s, l) => s + Number(l.custo_total), 0);
      const prevDesconto = prevLancs.reduce((s, l) => s + Number(l.desconto), 0);
      const prevTaxasVal = prevLancs.reduce((s, l) => s + Number(l.taxa_valor), 0);
      const prevDespesasVal = prevDesps.reduce((s, d) => s + Number(d.valor), 0);
      const prevLucroBruto = prevReceita - prevCusto;
      const prevLucroLiquido = prevReceita - prevCusto - prevDespesasVal - prevTaxasVal - prevDesconto;
      const prevServicos = prevLancs.length;
      const prevTicketMedio = prevServicos > 0 ? prevReceita / prevServicos : 0;

      // Sparkline data: aggregate by day for last 7 days
      const sparkLancs = sparkLancRes.data || [];
      const sparkDesps = sparkDespRes.data || [];
      const sparkDayMap = new Map<string, { receita: number; custo: number; desconto: number; taxas: number; despesas: number; servicos: number }>();
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const key = d.toISOString().split("T")[0];
        sparkDayMap.set(key, { receita: 0, custo: 0, desconto: 0, taxas: 0, despesas: 0, servicos: 0 });
      }
      sparkLancs.forEach(l => {
        const key = new Date(l.created_at).toISOString().split("T")[0];
        const cur = sparkDayMap.get(key);
        if (cur) {
          cur.receita += Number(l.valor_bruto);
          cur.custo += Number(l.custo_total);
          cur.desconto += Number(l.desconto);
          cur.taxas += Number(l.taxa_valor);
          cur.servicos++;
        }
      });
      sparkDesps.forEach(d => {
        const key = new Date(d.created_at).toISOString().split("T")[0];
        const cur = sparkDayMap.get(key);
        if (cur) cur.despesas += Number(d.valor);
      });
      const sparkArr = Array.from(sparkDayMap.values());
      const sparkReceita = sparkArr.map(d => d.receita);
      const sparkLucroBruto = sparkArr.map(d => d.receita - d.custo);
      const sparkLucroLiquido = sparkArr.map(d => d.receita - d.custo - d.despesas - d.taxas - d.desconto);
      const sparkDespesasArr = sparkArr.map(d => d.despesas);
      const sparkTicket = sparkArr.map(d => d.servicos > 0 ? d.receita / d.servicos : 0);
      const sparkGanhoHora = sparkArr.map(d => d.servicos > 0 ? (d.receita - d.custo - d.despesas - d.taxas - d.desconto) / (d.servicos * 0.5) : 0);

      // Branch comparison
      const branchLancs = branchLancRes.data || [];
      const filiais = filiaisRes.data || [];
      const branchMap = new Map<string, { receita: number; lucro: number; servicos: number }>();
      branchLancs.forEach(l => {
        const fid = l.filial_id || "sem_filial";
        const cur = branchMap.get(fid) || { receita: 0, lucro: 0, servicos: 0 };
        cur.receita += Number(l.valor_bruto);
        cur.lucro += Number(l.lucro);
        cur.servicos++;
        branchMap.set(fid, cur);
      });
      const branchComparison = filiais.map(f => {
        const d = branchMap.get(f.id) || { receita: 0, lucro: 0, servicos: 0 };
        return { filial: f.nome, filialId: f.id, receita: d.receita, lucro: d.lucro, servicos: d.servicos, ticket: d.servicos > 0 ? Math.round(d.receita / d.servicos) : 0 };
      }).sort((a, b) => b.receita - a.receita);

      // Month projection
      const now = new Date();
      const diasNoMes = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
      const diasPassados = now.getDate();
      const mediaDiaria = diasPassados > 0 ? totalReceita / diasPassados : 0;
      const mediaLucroDiario = diasPassados > 0 ? lucroLiquido / diasPassados : 0;
      const receitaProj = mediaDiaria * diasNoMes;
      const lucroProj = mediaLucroDiario * diasNoMes;
      const progressPercent = Math.round((diasPassados / diasNoMes) * 100);
      const monthProjection = { receitaProj, lucroProj, diasPassados, diasNoMes, progressPercent };

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
          method, qty: v.qty, bruto: v.bruto, taxas: v.taxas,
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
          category, value,
          percent: totalDespesas > 0 ? Math.round((value / totalDespesas) * 100) : 0,
          color: EXPENSE_COLORS[i % EXPENSE_COLORS.length],
        }))
        .sort((a, b) => b.value - a.value);

      // Revenue/Profit by day
      const dayRevMap = new Map<number, { maoDeObra: number; fabricadas: number; compradas: number; total: number; custo: number }>();
      lancamentos.forEach((l) => {
        const dow = new Date(l.created_at).getDay();
        const cur = dayRevMap.get(dow) || { maoDeObra: 0, fabricadas: 0, compradas: 0, total: 0, custo: 0 };
        cur.total += Number(l.valor_bruto);
        cur.custo += Number(l.custo_total);
        dayRevMap.set(dow, cur);
      });

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
          if (it.tipo === "fabricada" || it.tipo === "peca_fabricada") cur.fabricadas += val;
          else if (it.tipo === "comprada" || it.tipo === "peca_comprada") cur.compradas += val;
          else cur.maoDeObra += val;
        });
        if (litems.length === 0) cur.maoDeObra += Number(l.valor_bruto);
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

      // Manufacturing
      const fabItems = items.filter((it) => it.tipo === "fabricada" || it.tipo === "peca_fabricada");
      const mfgReceita = fabItems.reduce((s, it) => s + Number(it.valor_cobrado), 0);
      const mfgCusto = fabItems.reduce((s, it) => s + Number(it.custo), 0);
      const mfgPecas = fabItems.length;
      const mfgMargem = mfgReceita > 0 ? Math.round(((mfgReceita - mfgCusto) / mfgReceita) * 100) : 0;

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
        receita: mfgReceita, custoMP: mfgCusto, margem: mfgMargem, pecas: mfgPecas,
        custoMedioPeca: mfgPecas > 0 ? mfgCusto / mfgPecas : 0,
        precoMedioCobrado: mfgPecas > 0 ? mfgReceita / mfgPecas : 0,
        roi: mfgCusto > 0 ? Number((mfgReceita / mfgCusto).toFixed(1)) : 0,
        timeline: mfgTimeline,
      };

      // Operational
      const compItems = items.filter((it) => it.tipo === "comprada" || it.tipo === "peca_comprada");
      const compReceita = compItems.reduce((s, it) => s + Number(it.valor_cobrado), 0);
      const compCusto = compItems.reduce((s, it) => s + Number(it.custo), 0);
      const descontoCount = lancamentos.filter((l) => Number(l.desconto) > 0).length;
      const creditoTaxas = lancamentos.filter((l) => (l.metodo_pagamento || "").toLowerCase().includes("créd")).reduce((s, l) => s + Number(l.taxa_valor), 0);
      const debitoTaxas = lancamentos.filter((l) => (l.metodo_pagamento || "").toLowerCase().includes("déb")).reduce((s, l) => s + Number(l.taxa_valor), 0);

      const operational = {
        margemFabricadas: { percent: mfgMargem, receita: mfgReceita, custo: mfgCusto, pecas: mfgPecas },
        margemCompradas: {
          percent: compReceita > 0 ? Math.round(((compReceita - compCusto) / compReceita) * 100) : 0,
          receita: compReceita, custo: compCusto, pecas: compItems.length,
        },
        taxaDesconto: {
          percent: totalServicos > 0 ? Math.round((descontoCount / totalServicos) * 100) : 0,
          total: totalDesconto, count: descontoCount, media: descontoCount > 0 ? totalDesconto / descontoCount : 0,
        },
        impactoTaxas: {
          percent: totalReceita > 0 ? Number(((totalTaxas / totalReceita) * 100).toFixed(1)) : 0,
          total: totalTaxas, credito: creditoTaxas, debito: debitoTaxas,
        },
      };

      // Service intelligence
      const svcMap = new Map<string, { qty: number; receita: number; custo: number; veiculos: Map<string, number> }>();
      items.forEach((it) => {
        const desc = it.descricao || "Serviço";
        const cur = svcMap.get(desc) || { qty: 0, receita: 0, custo: 0, veiculos: new Map() };
        cur.qty++;
        cur.receita += Number(it.valor_cobrado);
        cur.custo += Number(it.custo);
        const parent = lancamentos.find((l) => l.id === it.lancamento_id);
        if (parent?.veiculo_desc) cur.veiculos.set(parent.veiculo_desc, (cur.veiculos.get(parent.veiculo_desc) || 0) + 1);
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

      const topServices = allServices.sort((a, b) => b.lucro - a.lucro).slice(0, 5).map((s, i) => ({ ...s, pos: i + 1 }));
      const lowMarginServices = allServices.filter((s) => s.margem < 50 && s.qty > 0).sort((a, b) => a.margem - b.margem).slice(0, 5).map((s, i) => ({ ...s, pos: i + 1 }));

      // Vehicle ranking
      const vMap = new Map<string, { servicos: number; receita: number; items: Map<string, number> }>();
      lancamentos.forEach((l) => {
        const v = l.veiculo_desc || "Não informado";
        const cur = vMap.get(v) || { servicos: 0, receita: 0, items: new Map() };
        cur.servicos++;
        cur.receita += Number(l.valor_bruto);
        const litems = itemsByLanc.get(l.id) || [];
        litems.forEach((it) => { cur.items.set(it.descricao, (cur.items.get(it.descricao) || 0) + 1); });
        vMap.set(v, cur);
      });
      const vehicleRanking = Array.from(vMap.entries())
        .map(([veiculo, v]) => ({
          veiculo, servicos: v.servicos, receita: v.receita,
          ticket: v.servicos > 0 ? Math.round(v.receita / v.servicos) : 0,
          servicoComum: v.items.size > 0 ? Array.from(v.items.entries()).sort((a, b) => b[1] - a[1])[0][0] : "—",
        }))
        .sort((a, b) => b.receita - a.receita)
        .slice(0, 10);

      return {
        lancamentos, despesas, items,
        totalReceita, totalCusto, totalDespesas, totalDesconto, totalTaxas,
        lucroBruto, lucroLiquido, totalServicos, ticketMedio,
        prevReceita, prevLucroBruto, prevLucroLiquido, prevDespesas: prevDespesasVal, prevTicketMedio, prevServicos,
        sparkReceita, sparkLucroBruto, sparkLucroLiquido, sparkDespesas: sparkDespesasArr, sparkTicket, sparkGanhoHora,
        paymentMethods, hourlyRevenue, expenseCategories,
        revenueByDay, profitByDay, manufacturing, operational,
        topServices, lowMarginServices, vehicleRanking,
        branchComparison, monthProjection,
      };
    },
    refetchInterval: 30000,
  });
}
