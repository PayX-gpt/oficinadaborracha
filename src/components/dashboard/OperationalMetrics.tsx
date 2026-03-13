import DonutCard from "./DonutCard";
import type { DashboardData } from "@/hooks/useDashboardData";

const formatCurrency = (v: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

const OperationalMetrics = ({ data }: { data?: DashboardData }) => {
  const m = data?.operational ?? {
    margemFabricadas: { percent: 0, receita: 0, custo: 0, pecas: 0 },
    margemCompradas: { percent: 0, receita: 0, custo: 0, pecas: 0 },
    taxaDesconto: { percent: 0, total: 0, count: 0, media: 0 },
    impactoTaxas: { percent: 0, total: 0, credito: 0, debito: 0 },
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
      <DonutCard index={0} title="Margem Peças Fabricadas" percent={m.margemFabricadas.percent} details={[
        `${formatCurrency(m.margemFabricadas.receita)} receita`,
        `${formatCurrency(m.margemFabricadas.custo)} custo | ${m.margemFabricadas.pecas} pç`,
      ]} />
      <DonutCard index={1} title="Margem Peças Compradas" percent={m.margemCompradas.percent} details={[
        `${formatCurrency(m.margemCompradas.receita)} receita`,
        `${formatCurrency(m.margemCompradas.custo)} custo | ${m.margemCompradas.pecas} pç`,
      ]} />
      <DonutCard index={2} title="Taxa de Desconto" percent={m.taxaDesconto.percent} details={[
        `${formatCurrency(m.taxaDesconto.total)} em descontos`,
        `${m.taxaDesconto.count} serv. | Méd: ${formatCurrency(m.taxaDesconto.media)}`,
      ]} color="#C9A84C" />
      <DonutCard index={3} title="Impacto Taxas Máquina" percent={m.impactoTaxas.percent} details={[
        `${formatCurrency(m.impactoTaxas.total)} em taxas`,
        `Créd: ${formatCurrency(m.impactoTaxas.credito)} | Déb: ${formatCurrency(m.impactoTaxas.debito)}`,
      ]} color="#BEBEBE" />
    </div>
  );
};

export default OperationalMetrics;
