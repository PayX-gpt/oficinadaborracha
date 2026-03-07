import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface DashboardData {
  lancamentos: any[];
  despesas: any[];
  totalReceita: number;
  totalCusto: number;
  totalDespesas: number;
  totalDesconto: number;
  totalTaxas: number;
  lucroBruto: number;
  lucroLiquido: number;
  totalServicos: number;
  ticketMedio: number;
}

export function useDashboardData(period: string) {
  return useQuery({
    queryKey: ["dashboard", period],
    queryFn: async (): Promise<DashboardData> => {
      const now = new Date();
      let startDate: Date;

      switch (period) {
        case "Hoje":
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          break;
        case "Ontem":
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
          break;
        case "7 Dias":
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
          break;
        case "30 Dias":
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 30);
          break;
        case "Este Mês":
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
        default:
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      }

      const isoStart = startDate.toISOString();

      const [lancRes, despRes] = await Promise.all([
        supabase.from("lancamentos").select("*").gte("created_at", isoStart).order("created_at", { ascending: false }),
        supabase.from("despesas").select("*").gte("created_at", isoStart).order("created_at", { ascending: false }),
      ]);

      if (lancRes.error) throw lancRes.error;
      if (despRes.error) throw despRes.error;

      const lancamentos = lancRes.data || [];
      const despesas = despRes.data || [];

      const totalReceita = lancamentos.reduce((s, l) => s + Number(l.valor_bruto), 0);
      const totalCusto = lancamentos.reduce((s, l) => s + Number(l.custo_total), 0);
      const totalDesconto = lancamentos.reduce((s, l) => s + Number(l.desconto), 0);
      const totalTaxas = lancamentos.reduce((s, l) => s + Number(l.taxa_valor), 0);
      const totalDespesas = despesas.reduce((s, d) => s + Number(d.valor), 0);
      const lucroBruto = totalReceita - totalCusto;
      const lucroLiquido = totalReceita - totalCusto - totalDespesas - totalTaxas - totalDesconto;
      const totalServicos = lancamentos.length;
      const ticketMedio = totalServicos > 0 ? totalReceita / totalServicos : 0;

      return {
        lancamentos,
        despesas,
        totalReceita,
        totalCusto,
        totalDespesas,
        totalDesconto,
        totalTaxas,
        lucroBruto,
        lucroLiquido,
        totalServicos,
        ticketMedio,
      };
    },
    refetchInterval: 30000,
  });
}
