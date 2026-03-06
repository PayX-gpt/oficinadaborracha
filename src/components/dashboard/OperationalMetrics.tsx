import DonutCard from "./DonutCard";
import { mockOperational, formatCurrency } from "@/lib/mockDashboardData";

const OperationalMetrics = () => {
  const m = mockOperational;
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
      <DonutCard index={0} title="Margem Peças Fabricadas" percent={m.margemFabricadas.percent} details={[
        `${formatCurrency(m.margemFabricadas.receita)} receita`,
        `${formatCurrency(m.margemFabricadas.custo)} custo | ${m.margemFabricadas.pecas} peças`,
      ]} />
      <DonutCard index={1} title="Margem Peças Compradas" percent={m.margemCompradas.percent} details={[
        `${formatCurrency(m.margemCompradas.receita)} receita`,
        `${formatCurrency(m.margemCompradas.custo)} custo | ${m.margemCompradas.pecas} peças`,
      ]} />
      <DonutCard index={2} title="Taxa de Desconto" percent={m.taxaDesconto.percent} details={[
        `${formatCurrency(m.taxaDesconto.total)} em descontos`,
        `${m.taxaDesconto.count} serviços | Média: ${formatCurrency(m.taxaDesconto.media)}`,
      ]} color="#F59E0B" />
      <DonutCard index={3} title="Impacto Taxas Máquina" percent={m.impactoTaxas.percent} details={[
        `${formatCurrency(m.impactoTaxas.total)} em taxas`,
        `Créd: ${formatCurrency(m.impactoTaxas.credito)} | Déb: ${formatCurrency(m.impactoTaxas.debito)}`,
      ]} color="#3B82F6" />
    </div>
  );
};

export default OperationalMetrics;
