import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useFiliais() {
  return useQuery({
    queryKey: ["filiais"],
    queryFn: async () => {
      const { data } = await supabase.from("filiais").select("*").eq("ativa", true).order("nome");
      return data || [];
    },
    staleTime: 60000,
  });
}
