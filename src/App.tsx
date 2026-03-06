import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import AppLayout from "./components/AppLayout";
import Dashboard from "./pages/Dashboard";
import Launch from "./pages/Launch";
import LaunchManual from "./pages/LaunchManual";
import LaunchPhoto from "./pages/LaunchPhoto";
import LaunchAudio from "./pages/LaunchAudio";
import LaunchExpense from "./pages/LaunchExpense";
import History from "./pages/History";
import SettingsPage from "./pages/SettingsPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<Login />} />
          <Route element={<AppLayout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/launch" element={<Launch />} />
            <Route path="/launch/manual" element={<LaunchManual />} />
            <Route path="/launch/photo" element={<LaunchPhoto />} />
            <Route path="/launch/audio" element={<LaunchAudio />} />
            <Route path="/launch/expense" element={<LaunchExpense />} />
            <Route path="/history" element={<History />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
