import { Outlet, Navigate } from "react-router-dom";
import AppHeader from "./AppHeader";
import BottomNav from "./BottomNav";
import DesktopSidebar from "./DesktopSidebar";
import { useAuth } from "@/hooks/useAuth";
import { Loader2 } from "lucide-react";

const AppLayout = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center" style={{ background: "#070B14" }}>
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen" style={{ background: "#070B14" }}>
      <AppHeader />
      <div className="flex">
        <DesktopSidebar />
        <main className="flex-1 pt-14 pb-20 md:pb-4 md:pl-64">
          <div className="mx-auto max-w-5xl p-4">
            <Outlet />
          </div>
        </main>
      </div>
      <BottomNav />
    </div>
  );
};

export default AppLayout;
