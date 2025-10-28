import { useEffect, useMemo, useRef } from "react";
import { useSidebar } from "../context/SidebarContext";
import { ThemeToggleButton } from "../components/common/ThemeToggleButton";
import NotificationDropdown from "../components/header/NotificationDropdown";
import UserDropdown from "../components/header/UserDropdown";
import { useAuthStore } from "@/stores/authStore";

const AppHeader: React.FC = () => {
  const inputRef = useRef<HTMLInputElement>(null);
  const { toggleMobileSidebar } = useSidebar();
  const { company } = useAuthStore();

  const greeting = useMemo(() => {
    const now = new Date();
    const hour = now.getHours();
    if (hour < 12) return "Chào buổi sáng";
    if (hour < 18) return "Chào buổi chiều";
    return "Chào buổi tối";
  }, []);

  const displayName = company?.ceoName ?? "HR";
  const companyName = company?.name ?? "Doanh nghiệp của bạn";
  const primaryAddress = company?.addresses?.[0];
  const companyLocation = primaryAddress?.city
    ? `${primaryAddress.city}${
        primaryAddress.country ? `, ${primaryAddress.country}` : ""
      }`
    : primaryAddress?.country ?? undefined;

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
          <div className="space-y-1">
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
              {greeting},{" "}
              <span className="text-gray-900 dark:text-gray-100">
                {displayName}
              </span>
            </p>
            <div className="flex flex-col text-sm text-gray-700 dark:text-gray-200 md:flex-row md:items-center md:gap-2">
              <span className="font-semibold text-gray-900 dark:text-gray-100">
                {companyName}
              </span>
              {companyLocation && (
                <span className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  {companyLocation}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="hidden flex-1 justify-center md:flex">
          <form className="w-full max-w-xl">
            <div className="relative">
              <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500">
                <svg
                  className="h-5 w-5"
                  viewBox="0 0 20 20"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M3.04175 9.37363C3.04175 5.87693 5.87711 3.04199 9.37508 3.04199C12.8731 3.04199 15.7084 5.87693 15.7084 9.37363C15.7084 12.8703 12.8731 15.7053 9.37508 15.7053C5.87711 15.7053 3.04175 12.8703 3.04175 9.37363ZM9.37508 1.54199C5.04902 1.54199 1.54175 5.04817 1.54175 9.37363C1.54175 13.6991 5.04902 17.2053 9.37508 17.2053C11.2674 17.2053 13.003 16.5344 14.357 15.4176L17.177 18.238C17.4699 18.5309 17.9448 18.5309 18.2377 18.238C18.5306 17.9451 18.5306 17.4703 18.2377 17.1774L15.418 14.3573C16.5365 13.0033 17.2084 11.2669 17.2084 9.37363C17.2084 5.04817 13.7011 1.54199 9.37508 1.54199Z"
                    fill="currentColor"
                  />
                </svg>
              </span>
              <input
                ref={inputRef}
                type="text"
                placeholder="Tìm kiếm ứng viên, công việc hoặc ghi chú..."
                className="h-11 w-full rounded-xl border border-gray-200 bg-white/80 py-2.5 pl-12 pr-14 text-sm text-gray-800 shadow-theme-xs backdrop-blur placeholder:text-gray-400 focus:border-primary focus:outline-hidden focus:ring-3 focus:ring-primary/15 dark:border-gray-700 dark:bg-white/10 dark:text-gray-100 dark:placeholder:text-gray-400 dark:focus:border-primary"
              />
              <button
                type="button"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-lg border border-gray-200 bg-gray-50 px-[7px] py-[4.5px] text-xs -tracking-[0.2px] text-gray-500 dark:border-gray-700 dark:bg-white/10 dark:text-gray-300"
              >
                <span>⌘</span>
                <span className="ml-1">K</span>
              </button>
            </div>
          </form>
        </div>

        <div className="flex items-center gap-2 2xsm:gap-3">
          <ThemeToggleButton />
          <NotificationDropdown />
          <UserDropdown />
        </div>
      </div>
    </header>
  );
};

export default AppHeader;
