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

const Dashboard = () => {
  const [selectedBranch, setSelectedBranch] = useState("all");
  const [selectedPeriod, setSelectedPeriod] = useState("Hoje");

  return (
    <div className="space-y-4 pb-24" style={{ background: "#070B14", minHeight: "100vh", margin: "-1.5rem", padding: "1.5rem" }}>
      <AnimatePresence mode="wait">
        <motion.div key={`${selectedBranch}-${selectedPeriod}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }} className="space-y-4">
          <DashboardHeader
            selectedBranch={selectedBranch}
            onBranchChange={setSelectedBranch}
            selectedPeriod={selectedPeriod}
            onPeriodChange={setSelectedPeriod}
          />
          <KPICards />
          <OperationalMetrics />
          <FinancialHealth />
          <PerformanceCharts />
          <PaymentMethods />
          <ProfitSplit />
          <ServiceIntelligence />
          <HourlyPerformance />
          <ManufacturingAnalysis />
          <LiveFeed />
          <AIInsights />
          <DetailedTable />
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default Dashboard;
