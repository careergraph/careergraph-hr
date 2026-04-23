import { useLocation, useNavigate } from "react-router";
import { useSidebar } from "@/context/SidebarContext";
import useThreads from "@/features/messaging/hooks/useThreads";
import {
  GridIcon,
  TableIcon,
  ChatIcon,
  VideoIcon,
} from "@/icons";

const MenuIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
  </svg>
);

type BottomNavItem = {
  icon: React.ReactNode;
  label: string;
  path?: string;
  action?: () => void;
};

const BottomNav: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { toggleMobileSidebar } = useSidebar();
  const { totalUnread } = useThreads({ autoLoad: true, archived: false });

  const items: BottomNavItem[] = [
    { icon: <GridIcon />, label: "Dashboard", path: "/dashboard" },
    { icon: <TableIcon />, label: "Jobs", path: "/jobs" },
    { icon: <ChatIcon />, label: "Tin nhắn", path: "/messages" },
    { icon: <VideoIcon />, label: "Phỏng vấn", path: "/interviews" },
    { icon: <MenuIcon />, label: "Thêm", action: toggleMobileSidebar },
  ];

  const isActive = (path?: string) => path && location.pathname.startsWith(path);

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 flex items-end border-t border-gray-200 bg-white/95 backdrop-blur dark:border-gray-800 dark:bg-gray-900/95"
      style={{ height: "var(--bottom-nav-height)", paddingBottom: "var(--safe-area-bottom)" }}
    >
      {items.map((item) => {
        const active = isActive(item.path);
        return (
          <button
            key={item.label}
            type="button"
            className={`touch-target relative flex flex-1 flex-col items-center justify-center gap-0.5 py-1.5 transition-colors ${
              active
                ? "text-brand-500"
                : "text-gray-500 dark:text-gray-400"
            }`}
            onClick={() => {
              if (item.action) {
                item.action();
              } else if (item.path) {
                navigate(item.path);
              }
            }}
          >
            {/* Active indicator dot */}
            {active && (
              <span className="absolute top-1 left-1/2 -translate-x-1/2 h-1 w-1 rounded-full bg-brand-500" />
            )}
            <span className="relative h-5 w-5">
              {item.icon}
              {/* Unread badge for messages */}
              {item.path === "/messages" && totalUnread > 0 && (
                <span className="absolute -top-1 -right-1 inline-flex min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold leading-4 text-white">
                  {totalUnread > 99 ? "99+" : totalUnread}
                </span>
              )}
            </span>
            <span className="text-[10px] leading-tight">{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
};

export default BottomNav;
