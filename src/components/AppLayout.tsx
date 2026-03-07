import { Outlet, Navigate, useLocation } from "react-router-dom";
import AppHeader from "./AppHeader";
import BottomNav from "./BottomNav";
import DesktopSidebar from "./DesktopSidebar";
import { useAuth } from "@/hooks/useAuth";
import { Loader2 } from "lucide-react";

const AppLayout = () => {
  const { user, profile, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Redirect based on role for /dashboard
  if (location.pathname === "/dashboard" && profile?.role === "gerente") {
    return <Navigate to="/gerente" replace />;
  }

  // Operador should default to ODB
  if (location.pathname === "/dashboard" && profile?.role === "operador") {
    return <Navigate to="/odb" replace />;
  }

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <AppHeader />
      <div className="flex">
        <DesktopSidebar />
        <main className="flex-1 pt-14 pb-20 md:pb-4 md:pl-60 w-full min-w-0">
          <div className="mx-auto max-w-5xl p-3 md:p-4">
            <Outlet />
          </div>
        </main>
      </div>
      <BottomNav />
    </div>
  );
};

export default AppLayout;
