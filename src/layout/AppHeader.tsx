import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router";
import { MessageSquareText } from "lucide-react";
import { useSidebar } from "../context/SidebarContext";
import { ThemeToggleButton } from "../components/common/ThemeToggleButton";
import NotificationDropdown from "../components/header/NotificationDropdown";
import UserDropdown from "../components/header/UserDropdown";
import { useAuthStore } from "@/stores/authStore";
import useThreads from "@/features/messaging/hooks/useThreads";

const AppHeader: React.FC = () => {
  const inputRef = useRef<HTMLInputElement>(null);
  const { toggleMobileSidebar, isMobile } = useSidebar();
  const { company } = useAuthStore();
  const { totalUnread } = useThreads({ autoLoad: false, archived: false });
  const [searchOpen, setSearchOpen] = useState(false);

  const greeting = useMemo(() => {
    const now = new Date();
    const hour = now.getHours();
    if (hour < 12) return "Chào buổi sáng";
    if (hour < 18) return "Chào buổi chiều";
    return "Chào buổi tối";
  }, []);

  const displayName = company?.ceoName ?? "HR";
  const companyName = company?.name ?? "Doanh nghiệp của bạn";
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        inputRef.current?.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-gray-200 bg-white/90 backdrop-blur dark:border-gray-800 dark:bg-gray-900/95">
      {/* Mobile search overlay */}
      {searchOpen && isMobile && (
        <div className="absolute inset-x-0 top-0 z-50 flex items-center gap-2 bg-white px-3 py-2 dark:bg-gray-900">
          <form className="flex flex-1 items-center gap-2" onSubmit={(e) => e.preventDefault()}>
            <input
              type="text"
              autoFocus
              placeholder="Tìm kiếm..."
              className="h-11 flex-1 rounded-xl border border-gray-200 bg-white/80 py-2.5 pl-4 pr-4 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-primary focus:outline-hidden focus:ring-3 focus:ring-primary/15 dark:border-gray-700 dark:bg-white/10 dark:text-gray-100 dark:placeholder:text-gray-400"
            />
            <button
              type="button"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              onClick={() => setSearchOpen(false)}
              aria-label="Đóng tìm kiếm"
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 6l8 8M6 14L14 6" />
              </svg>
            </button>
          </form>
        </div>
      )}
      <div className="flex w-full items-center justify-between gap-3 px-3 py-2 md:px-6 md:py-3">
        <div className="flex shrink-0 items-center gap-3">
          <button
            type="button"
            className="flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-700 shadow-sm transition hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-primary md:hidden dark:border-gray-800 dark:bg-white/5 dark:text-gray-200"
            aria-label="Mở menu điều hướng"
            onClick={toggleMobileSidebar}
          >
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>
          {/* Mobile search trigger */}
          {isMobile && (
            <button
              type="button"
              className="flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-700 shadow-sm transition hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-primary dark:border-gray-800 dark:bg-white/5 dark:text-gray-200"
              aria-label="Tìm kiếm"
              onClick={() => setSearchOpen(true)}
            >
              <svg className="h-5 w-5" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path fillRule="evenodd" clipRule="evenodd" d="M3.04175 9.37363C3.04175 5.87693 5.87711 3.04199 9.37508 3.04199C12.8731 3.04199 15.7084 5.87693 15.7084 9.37363C15.7084 12.8703 12.8731 15.7053 9.37508 15.7053C5.87711 15.7053 3.04175 12.8703 3.04175 9.37363ZM9.37508 1.54199C5.04902 1.54199 1.54175 5.04817 1.54175 9.37363C1.54175 13.6991 5.04902 17.2053 9.37508 17.2053C11.2674 17.2053 13.003 16.5344 14.357 15.4176L17.177 18.238C17.4699 18.5309 17.9448 18.5309 18.2377 18.238C18.5306 17.9451 18.5306 17.4703 18.2377 17.1774L15.418 14.3573C16.5365 13.0033 17.2084 11.2669 17.2084 9.37363C17.2084 5.04817 13.7011 1.54199 9.37508 1.54199Z" fill="currentColor" />
              </svg>
            </button>
          )}
          <div className="space-y-1">
            {/* Greeting: hidden on mobile */}
            {!isMobile && (
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                {greeting},{" "}
                <span className="text-gray-900 dark:text-gray-100">
                  {displayName}
                </span>
              </p>
            )}
            <div className="flex flex-col text-sm text-gray-700 dark:text-gray-200 md:flex-row md:items-center md:gap-2">
              <span className="font-semibold text-gray-900 dark:text-gray-100 truncate max-w-[180px] md:max-w-none">
                {companyName}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 2xsm:gap-3">
          <ThemeToggleButton />
          <Link
            to="/messages"
            aria-label={`Open messages inbox${
              totalUnread > 0 ? ` (${totalUnread} unread)` : ""
            }`}
            className="relative flex h-11 w-11 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
          >
            {totalUnread > 0 ? (
              <>
                <span
                  aria-hidden="true"
                  className="absolute -right-0.5 -top-0.5 h-5 min-w-5 rounded-full bg-brand-500/40 motion-safe:animate-ping"
                />
                <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-500 px-1 text-[10px] font-semibold text-white shadow-sm motion-safe:animate-pulse">
                  {totalUnread > 99 ? "99+" : totalUnread}
                </span>
              </>
            ) : null}
            <MessageSquareText className="h-5 w-5" />
          </Link>
          <NotificationDropdown />
          <UserDropdown />
        </div>
      </div>
    </header>
  );
};

export default AppHeader;
