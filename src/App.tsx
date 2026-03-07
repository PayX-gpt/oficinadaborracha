import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import Login from "./pages/Login";
import AppLayout from "./components/AppLayout";
import Dashboard from "./pages/Dashboard";
import GerenteDashboard from "./pages/GerenteDashboard";
import ODBPage from "./pages/ODBPage";
import Launch from "./pages/Launch";
import LaunchManual from "./pages/LaunchManual";
import LaunchPhoto from "./pages/LaunchPhoto";
import LaunchAudio from "./pages/LaunchAudio";
import LaunchExpense from "./pages/LaunchExpense";
import History from "./pages/History";
import SettingsPage from "./pages/SettingsPage";
import ChatFinanceiro from "./pages/ChatFinanceiro";
import ClientesPage from "./pages/ClientesPage";
import PecasPage from "./pages/PecasPage";
import RelatoriosIA from "./pages/RelatoriosIA";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="/login" element={<Login />} />
            <Route element={<AppLayout />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/gerente" element={<GerenteDashboard />} />
              <Route path="/odb" element={<ODBPage />} />
              <Route path="/launch" element={<Launch />} />
              <Route path="/launch/manual" element={<LaunchManual />} />
              <Route path="/launch/photo" element={<LaunchPhoto />} />
              <Route path="/launch/audio" element={<LaunchAudio />} />
              <Route path="/launch/expense" element={<LaunchExpense />} />
              <Route path="/history" element={<History />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="/chat-financeiro" element={<ChatFinanceiro />} />
              <Route path="/clientes" element={<ClientesPage />} />
              <Route path="/pecas" element={<PecasPage />} />
              <Route path="/relatorios" element={<RelatoriosIA />} />
              <Route path="/equipe" element={<div className="text-foreground"><h2 className="text-lg font-bold">Equipe</h2><p className="text-xs text-muted-foreground">Em breve — gestão de gerentes e operadores</p></div>} />
              <Route path="/perfil" element={<div className="text-foreground"><h2 className="text-lg font-bold">Meu Perfil</h2><p className="text-xs text-muted-foreground">Em breve</p></div>} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
