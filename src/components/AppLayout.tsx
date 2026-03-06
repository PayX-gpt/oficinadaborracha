import { Outlet } from "react-router-dom";
import AppHeader from "./AppHeader";
import BottomNav from "./BottomNav";
import DesktopSidebar from "./DesktopSidebar";

const AppLayout = () => {
  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <div className="flex">
        <DesktopSidebar />
        <main className="flex-1 pt-14 pb-20 md:pb-4 md:pl-64">
          <div className="mx-auto max-w-4xl p-4">
            <Outlet />
          </div>
        </main>
      </div>
      <BottomNav />
    </div>
  );
};

export default AppLayout;
