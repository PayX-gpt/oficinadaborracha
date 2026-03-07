import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import KPICards from "@/components/dashboard/KPICards";
import OperationalMetrics from "@/components/dashboard/OperationalMetrics";
import FinancialHealth from "@/components/dashboard/FinancialHealth";
import PerformanceCharts from "@/components/dashboard/PerformanceCharts";
import PaymentMethods from "@/components/dashboard/PaymentMethods";
import ProfitSplit from "@/components/dashboard/ProfitSplit";
import ServiceIntelligence from "@/components/dashboard/ServiceIntelligence";
import HourlyPerformance from "@/components/dashboard/HourlyPerformance";
import ManufacturingAnalysis from "@/components/dashboard/ManufacturingAnalysis";
import LiveFeed from "@/components/dashboard/LiveFeed";
import AIInsights from "@/components/dashboard/AIInsights";
import SmartAlerts from "@/components/dashboard/SmartAlerts";
import PriceRecommendation from "@/components/dashboard/PriceRecommendation";
import DetailedTable from "@/components/dashboard/DetailedTable";
import FechamentoDiario from "@/components/dashboard/FechamentoDiario";
import { useDashboardData } from "@/hooks/useDashboardData";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const Dashboard = () => {
  const [selectedBranch, setSelectedBranch] = useState("all");
  const [selectedPeriod, setSelectedPeriod] = useState("Hoje");
  const { data } = useDashboardData(selectedPeriod, selectedBranch);

  const { data: filiais = [] } = useQuery({
    queryKey: ["filiais-dash"],
    queryFn: async () => { const { data } = await supabase.from("filiais").select("id, nome"); return data || []; },
  });

  return (
    <div className="space-y-2.5 md:space-y-4 pb-24 min-w-0 overflow-hidden">
      <AnimatePresence mode="wait">
        <motion.div key={`${selectedBranch}-${selectedPeriod}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }} className="space-y-2.5 md:space-y-4">
          <div className="space-y-2">
            <DashboardHeader
              selectedBranch={selectedBranch}
              onBranchChange={setSelectedBranch}
              selectedPeriod={selectedPeriod}
              onPeriodChange={setSelectedPeriod}
            />
            <div className="flex flex-wrap gap-1.5">
              {selectedBranch !== "all" ? (
                <FechamentoDiario filialId={selectedBranch} filialNome={filiais.find(f => f.id === selectedBranch)?.nome || ""} />
              ) : filiais.map(f => (
                <FechamentoDiario key={f.id} filialId={f.id} filialNome={f.nome} />
              ))}
            </div>
          </div>
          <KPICards data={data} />
          <OperationalMetrics data={data} />
          <FinancialHealth data={data} />
          <PerformanceCharts data={data} />
          <PaymentMethods data={data} />
          <ProfitSplit data={data} />
          <ServiceIntelligence data={data} />
          <HourlyPerformance data={data} />
          <ManufacturingAnalysis data={data} />
          <LiveFeed />
          <SmartAlerts />
          <AIInsights />
          <PriceRecommendation />
          <DetailedTable />
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default Dashboard;
