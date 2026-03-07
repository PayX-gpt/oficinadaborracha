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
import DetailedTable from "@/components/dashboard/DetailedTable";
import { useDashboardData } from "@/hooks/useDashboardData";

const Dashboard = () => {
  const [selectedBranch, setSelectedBranch] = useState("all");
  const [selectedPeriod, setSelectedPeriod] = useState("Hoje");
  const { data } = useDashboardData(selectedPeriod, selectedBranch);

  return (
    <div className="space-y-4 pb-24">
      <AnimatePresence mode="wait">
        <motion.div key={`${selectedBranch}-${selectedPeriod}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }} className="space-y-4">
          <DashboardHeader
            selectedBranch={selectedBranch}
            onBranchChange={setSelectedBranch}
            selectedPeriod={selectedPeriod}
            onPeriodChange={setSelectedPeriod}
          />
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
          <AIInsights />
          <DetailedTable />
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default Dashboard;
