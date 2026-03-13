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
  prevReceita: number;
  prevLucroBruto: number;
  prevLucroLiquido: number;
  prevDespesas: number;
  prevTicketMedio: number;
  prevServicos: number;
  sparkReceita: number[];
  sparkLucroBruto: number[];
  sparkLucroLiquido: number[];
  sparkDespesas: number[];
  sparkTicket: number[];
  sparkGanhoHora: number[];
  paymentMethods: { method: string; qty: number; bruto: number; taxas: number; liquido: number; percent: number; color: string }[];
  hourlyRevenue: { hour: string; value: number; services: number }[];
  expenseCategories: { category: string; value: number; percent: number; color: string }[];
  revenueByDay: { day: string; maoDeObra: number; fabricadas: number; compradas: number; total: number }[];
  profitByDay: { day: string; lucroBruto: number; lucroLiquido: number }[];
  manufacturing: {
    receita: number; custoMP: number; margem: number; pecas: number;
    custoMedioPeca: number; precoMedioCobrado: number; roi: number;
    timeline: { day: string; receita: number; custo: number }[];
  };
  operational: {
    margemFabricadas: { percent: number; receita: number; custo: number; pecas: number };
    margemCompradas: { percent: number; receita: number; custo: number; pecas: number };
    taxaDesconto: { percent: number; total: number; count: number; media: number };
    impactoTaxas: { percent: number; total: number; credito: number; debito: number };
  };
  topServices: { pos: number; nome: string; veiculo: string; qty: number; receita: number; custo: number; margem: number; lucro: number }[];
  lowMarginServices: { pos: number; nome: string; qty: number; receita: number; custo: number; margem: number; lucro: number }[];
  vehicleRanking: { veiculo: string; servicos: number; receita: number; ticket: number; servicoComum: string }[];
  branchComparison: { filial: string; filialId: string; receita: number; lucro: number; servicos: number; ticket: number }[];
  monthProjection: { receitaProj: number; lucroProj: number; diasPassados: number; diasNoMes: number; progressPercent: number };
}

const PAYMENT_COLORS: Record<string, string> = {
  PIX: "#33A833", Dinheiro: "#C9A84C", Débito: "#BEBEBE",
  Crédito: "#D20A0A", Cartão: "#D20A0A",
};
const EXPENSE_COLORS = ["#D20A0A", "#C9A84C", "#BEBEBE", "#666666", "#EF4444", "#555555", "#33A833", "#999999"];
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

      let prevLancQ = supabase.from("lancamentos").select("valor_bruto, custo_total, desconto, taxa_valor").gte("created_at", prev.start.toISOString()).lt("created_at", prev.end.toISOString());
      let prevDespQ = supabase.from("despesas").select("valor").gte("created_at", prev.start.toISOString()).lt("created_at", prev.end.toISOString());

      const spark7Start = new Date();
      spark7Start.setDate(spark7Start.getDate() - 7);
      spark7Start.setHours(0, 0, 0, 0);
      let sparkLancQ = supabase.from("lancamentos").select("created_at, valor_bruto, custo_total, desconto, taxa_valor").gte("created_at", spark7Start.toISOString());
      let sparkDespQ = supabase.from("despesas").select("created_at, valor").gte("created_at", spark7Start.toISOString());

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

      const totalReceita = lancamentos.reduce((s, l) => s + Number(l.valor_bruto), 0);
      const totalCusto = lancamentos.reduce((s, l) => s + Number(l.custo_total), 0);
      const totalDesconto = lancamentos.reduce((s, l) => s + Number(l.desconto), 0);
      const totalTaxas = lancamentos.reduce((s, l) => s + Number(l.taxa_valor), 0);
      const totalDespesas = despesas.reduce((s, d) => s + Number(d.valor), 0);
      const lucroBruto = totalReceita - totalCusto;
      const lucroLiquido = totalReceita - totalCusto - totalDespesas - totalTaxas - totalDesconto;
      const totalServicos = lancamentos.length;
      const ticketMedio = totalServicos > 0 ? totalReceita / totalServicos : 0;

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
        if (cur) { cur.receita += Number(l.valor_bruto); cur.custo += Number(l.custo_total); cur.desconto += Number(l.desconto); cur.taxas += Number(l.taxa_valor); cur.servicos++; }
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

      const branchLancs = branchLancRes.data || [];
      const filiais = filiaisRes.data || [];
      const branchMap = new Map<string, { receita: number; lucro: number; servicos: number }>();
      branchLancs.forEach(l => {
        const fid = l.filial_id || "sem_filial";
        const cur = branchMap.get(fid) || { receita: 0, lucro: 0, servicos: 0 };
        cur.receita += Number(l.valor_bruto); cur.lucro += Number(l.lucro); cur.servicos++;
        branchMap.set(fid, cur);
      });
      const branchComparison = filiais.map(f => {
        const d = branchMap.get(f.id) || { receita: 0, lucro: 0, servicos: 0 };
        return { filial: f.nome, filialId: f.id, receita: d.receita, lucro: d.lucro, servicos: d.servicos, ticket: d.servicos > 0 ? Math.round(d.receita / d.servicos) : 0 };
      }).sort((a, b) => b.receita - a.receita);

      const now = new Date();
      const diasNoMes = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
      const diasPassados = now.getDate();
      const mediaDiaria = diasPassados > 0 ? totalReceita / diasPassados : 0;
      const mediaLucroDiario = diasPassados > 0 ? lucroLiquido / diasPassados : 0;
      const receitaProj = mediaDiaria * diasNoMes;
      const lucroProj = mediaLucroDiario * diasNoMes;
      const progressPercent = Math.round((diasPassados / diasNoMes) * 100);
      const monthProjection = { receitaProj, lucroProj, diasPassados, diasNoMes, progressPercent };

      const pmMap = new Map<string, { qty: number; bruto: number; taxas: number }>();
      lancamentos.forEach((l) => {
        const m = l.metodo_pagamento || "Outro";
        const cur = pmMap.get(m) || { qty: 0, bruto: 0, taxas: 0 };
        cur.qty++; cur.bruto += Number(l.valor_bruto); cur.taxas += Number(l.taxa_valor);
        pmMap.set(m, cur);
      });
      const paymentMethods = Array.from(pmMap.entries())
        .map(([method, v]) => ({ method, qty: v.qty, bruto: v.bruto, taxas: v.taxas, liquido: v.bruto - v.taxas, percent: totalReceita > 0 ? Math.round((v.bruto / totalReceita) * 100) : 0, color: PAYMENT_COLORS[method] || "#666666" }))
        .sort((a, b) => b.bruto - a.bruto);

      const hourMap = new Map<number, { value: number; services: number }>();
      lancamentos.forEach((l) => { const h = new Date(l.created_at).getHours(); const cur = hourMap.get(h) || { value: 0, services: 0 }; cur.value += Number(l.valor_bruto); cur.services++; hourMap.set(h, cur); });
      const hourlyRevenue = Array.from({ length: 12 }, (_, i) => { const h = i + 7; const d = hourMap.get(h) || { value: 0, services: 0 }; return { hour: `${h}h`, value: d.value, services: d.services }; });

      const ecMap = new Map<string, number>();
      despesas.forEach((d) => { ecMap.set(d.categoria, (ecMap.get(d.categoria) || 0) + Number(d.valor)); });
      const expenseCategories = Array.from(ecMap.entries())
        .map(([category, value], i) => ({ category, value, percent: totalDespesas > 0 ? Math.round((value / totalDespesas) * 100) : 0, color: EXPENSE_COLORS[i % EXPENSE_COLORS.length] }))
        .sort((a, b) => b.value - a.value);

      const dayRevMap = new Map<number, { maoDeObra: number; fabricadas: number; compradas: number; total: number; custo: number }>();
      lancamentos.forEach((l) => { const dow = new Date(l.created_at).getDay(); const cur = dayRevMap.get(dow) || { maoDeObra: 0, fabricadas: 0, compradas: 0, total: 0, custo: 0 }; cur.total += Number(l.valor_bruto); cur.custo += Number(l.custo_total); dayRevMap.set(dow, cur); });

      const itemsByLanc = new Map<string, any[]>();
      items.forEach((it) => { const arr = itemsByLanc.get(it.lancamento_id) || []; arr.push(it); itemsByLanc.set(it.lancamento_id, arr); });

      lancamentos.forEach((l) => {
        const dow = new Date(l.created_at).getDay();
        const cur = dayRevMap.get(dow)!;
        const litems = itemsByLanc.get(l.id) || [];
        litems.forEach((it) => { const val = Number(it.valor_cobrado); if (it.tipo === "fabricada" || it.tipo === "peca_fabricada") cur.fabricadas += val; else if (it.tipo === "comprada" || it.tipo === "peca_comprada") cur.compradas += val; else cur.maoDeObra += val; });
        if (litems.length === 0) cur.maoDeObra += Number(l.valor_bruto);
      });

      const revenueByDay = [1, 2, 3, 4, 5, 6, 0].map((dow) => { const d = dayRevMap.get(dow) || { maoDeObra: 0, fabricadas: 0, compradas: 0, total: 0, custo: 0 }; return { day: DAYS[dow], maoDeObra: d.maoDeObra, fabricadas: d.fabricadas, compradas: d.compradas, total: d.total }; });

      const dayDespMap = new Map<number, number>();
      despesas.forEach((d) => { const dow = new Date(d.created_at).getDay(); dayDespMap.set(dow, (dayDespMap.get(dow) || 0) + Number(d.valor)); });

      const profitByDay = [1, 2, 3, 4, 5, 6, 0].map((dow) => { const rev = dayRevMap.get(dow) || { total: 0, custo: 0 }; const desp = dayDespMap.get(dow) || 0; return { day: DAYS[dow], lucroBruto: rev.total - rev.custo, lucroLiquido: rev.total - rev.custo - desp }; });

      const fabItems = items.filter((it) => it.tipo === "fabricada" || it.tipo === "peca_fabricada");
      const mfgReceita = fabItems.reduce((s, it) => s + Number(it.valor_cobrado), 0);
      const mfgCusto = fabItems.reduce((s, it) => s + Number(it.custo), 0);
      const mfgPecas = fabItems.length;
      const mfgMargem = mfgReceita > 0 ? Math.round(((mfgReceita - mfgCusto) / mfgReceita) * 100) : 0;
      const custoMedioPeca = mfgPecas > 0 ? mfgCusto / mfgPecas : 0;
      const precoMedioCobrado = mfgPecas > 0 ? mfgReceita / mfgPecas : 0;
      const roi = mfgCusto > 0 ? Math.round((mfgReceita / mfgCusto) * 10) / 10 : 0;

      const mfgDayMap = new Map<string, { receita: number; custo: number }>();
      fabItems.forEach(it => { const d = new Date(it.created_at).toLocaleDateString("pt-BR", { weekday: "short" }); const cur = mfgDayMap.get(d) || { receita: 0, custo: 0 }; cur.receita += Number(it.valor_cobrado); cur.custo += Number(it.custo); mfgDayMap.set(d, cur); });
      const mfgTimeline = Array.from(mfgDayMap.entries()).map(([day, v]) => ({ day, receita: v.receita, custo: v.custo }));

      const manufacturing = { receita: mfgReceita, custoMP: mfgCusto, margem: mfgMargem, pecas: mfgPecas, custoMedioPeca, precoMedioCobrado, roi, timeline: mfgTimeline };

      const compItems = items.filter((it) => it.tipo === "comprada" || it.tipo === "peca_comprada");
      const compReceita = compItems.reduce((s, it) => s + Number(it.valor_cobrado), 0);
      const compCusto = compItems.reduce((s, it) => s + Number(it.custo), 0);
      const margemFab = mfgReceita > 0 ? Math.round(((mfgReceita - mfgCusto) / mfgReceita) * 100) : 0;
      const margemComp = compReceita > 0 ? Math.round(((compReceita - compCusto) / compReceita) * 100) : 0;
      const descCount = lancamentos.filter(l => Number(l.desconto) > 0).length;
      const taxaDesc = totalReceita > 0 ? Math.round((totalDesconto / totalReceita) * 100) : 0;
      const mediaDesc = descCount > 0 ? totalDesconto / descCount : 0;
      const taxaImpacto = totalReceita > 0 ? Math.round((totalTaxas / totalReceita) * 100) : 0;
      const credTaxas = lancamentos.filter(l => (l.metodo_pagamento || "").startsWith("Crédito")).reduce((s, l) => s + Number(l.taxa_valor), 0);
      const debTaxas = lancamentos.filter(l => l.metodo_pagamento === "Débito").reduce((s, l) => s + Number(l.taxa_valor), 0);

      const operational = {
        margemFabricadas: { percent: margemFab, receita: mfgReceita, custo: mfgCusto, pecas: mfgPecas },
        margemCompradas: { percent: margemComp, receita: compReceita, custo: compCusto, pecas: compItems.length },
        taxaDesconto: { percent: taxaDesc, total: totalDesconto, count: descCount, media: mediaDesc },
        impactoTaxas: { percent: taxaImpacto, total: totalTaxas, credito: credTaxas, debito: debTaxas },
      };

      const svcMap = new Map<string, { qty: number; receita: number; custo: number; veiculo: string }>();
      lancamentos.forEach(l => {
        const desc = l.descricao_resumo || "Serviço";
        const cur = svcMap.get(desc) || { qty: 0, receita: 0, custo: 0, veiculo: l.veiculo_desc || "" };
        cur.qty++; cur.receita += Number(l.valor_bruto); cur.custo += Number(l.custo_total);
        svcMap.set(desc, cur);
      });
      const topServices = Array.from(svcMap.entries())
        .map(([nome, v]) => ({ nome, ...v, margem: v.receita > 0 ? Math.round(((v.receita - v.custo) / v.receita) * 100) : 0, lucro: v.receita - v.custo }))
        .sort((a, b) => b.lucro - a.lucro).slice(0, 10)
        .map((s, i) => ({ pos: i + 1, ...s }));
      const lowMarginServices = Array.from(svcMap.entries())
        .map(([nome, v]) => ({ nome, ...v, margem: v.receita > 0 ? Math.round(((v.receita - v.custo) / v.receita) * 100) : 0, lucro: v.receita - v.custo }))
        .filter(s => s.margem < 30).sort((a, b) => a.margem - b.margem).slice(0, 5)
        .map((s, i) => ({ pos: i + 1, ...s }));

      const vehMap = new Map<string, { servicos: number; receita: number; svcMap: Map<string, number> }>();
      lancamentos.forEach(l => {
        const v = l.veiculo_desc || "Não informado";
        const cur = vehMap.get(v) || { servicos: 0, receita: 0, svcMap: new Map() };
        cur.servicos++; cur.receita += Number(l.valor_bruto);
        const desc = l.descricao_resumo || "Serviço";
        cur.svcMap.set(desc, (cur.svcMap.get(desc) || 0) + 1);
        vehMap.set(v, cur);
      });
      const vehicleRanking = Array.from(vehMap.entries())
        .map(([veiculo, v]) => {
          const servicoComum = Array.from(v.svcMap.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] || "";
          return { veiculo, servicos: v.servicos, receita: v.receita, ticket: v.servicos > 0 ? Math.round(v.receita / v.servicos) : 0, servicoComum };
        }).sort((a, b) => b.receita - a.receita).slice(0, 10);

      return {
        lancamentos, despesas, items,
        totalReceita, totalCusto, totalDespesas, totalDesconto, totalTaxas, lucroBruto, lucroLiquido, totalServicos, ticketMedio,
        prevReceita, prevLucroBruto, prevLucroLiquido, prevDespesas: prevDespesasVal, prevTicketMedio, prevServicos,
        sparkReceita, sparkLucroBruto, sparkLucroLiquido, sparkDespesas: sparkDespesasArr, sparkTicket, sparkGanhoHora,
        paymentMethods, hourlyRevenue, expenseCategories, revenueByDay, profitByDay, manufacturing, operational,
        topServices, lowMarginServices, vehicleRanking, branchComparison, monthProjection,
      };
    },
    refetchInterval: 60000,
  });
}
