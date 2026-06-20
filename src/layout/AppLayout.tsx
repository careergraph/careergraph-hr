import { SidebarProvider, useSidebar } from "../context/SidebarContext";
import { useMemo } from "react";
import { Outlet } from "react-router";
import { useLocation } from "react-router";
import AppHeader from "./AppHeader";
import Backdrop from "./Backdrop";
import AppSidebar from "./AppSidebar";
import BottomNav from "../components/layout/BottomNav";
import MessagingRealtimeBootstrap from "@/features/messaging/components/MessagingRealtimeBootstrap";
import NotificationRealtimeBootstrap from "@/features/notifications/components/NotificationRealtimeBootstrap";

const LayoutContent: React.FC = () => {
  const { isExpanded, isHovered, isMobileOpen, isMobile, isTablet } = useSidebar();
  const { pathname } = useLocation();
  const isMessagesRoute = pathname.startsWith("/messages");

  const mainMargin = useMemo(() => {
    if (isMobile) return '';
    if (isTablet) return 'ml-16';
    return isExpanded || isHovered ? 'lg:ml-[290px]' : 'lg:ml-[110px]';
  }, [isMobile, isTablet, isExpanded, isHovered]);

  return (
    <div className="min-h-screen xl:flex">
      <div>
        <AppSidebar />
        <Backdrop />
      </div>
      <div
        className={`flex-1 min-w-0 transition-all duration-300 ease-in-out ${mainMargin} ${isMobileOpen ? "ml-0" : ""}`}
      >
        <AppHeader />
        <NotificationRealtimeBootstrap />
        <MessagingRealtimeBootstrap />
        <div
          className={`${isMessagesRoute
            ? "h-[calc(100dvh-4.75rem)] min-h-0 w-full overflow-hidden"
            : "mx-auto w-full max-w-(--breakpoint-2xl) overflow-x-hidden p-4 md:p-6"} ${isMobile ? "pb-[var(--bottom-nav-height)]" : ""}`}
        >
          <Outlet />
        </div>
      </div>
      {isMobile && <BottomNav />}
    </div>
  );
};

const AppLayout: React.FC = () => {
  return (
    <SidebarProvider>
      <LayoutContent />
    </SidebarProvider>
  );
};

export default AppLayout;
