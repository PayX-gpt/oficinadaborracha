import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const DEFAULT_TAXAS: Record<string, number> = {
  PIX: 0, Dinheiro: 0, Débito: 1.5, "Crédito 1x": 2.5, "Crédito 2x": 3.5, "Crédito 3x": 4.5,
};

export function useTaxas() {
  const { data: taxas } = useQuery({
    queryKey: ["taxas-maquina"],
    queryFn: async () => {
      const { data } = await supabase.from("taxas_maquina").select("*");
      if (!data || data.length === 0) return DEFAULT_TAXAS;
      const map: Record<string, number> = {};
      data.forEach((t: any) => { map[t.metodo] = Number(t.taxa_percentual); });
      return map;
    },
    staleTime: 60000,
  });

  return taxas || DEFAULT_TAXAS;
}
