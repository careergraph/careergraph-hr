import { useCallback, useEffect, useRef, useState } from "react";
import { Bell } from "lucide-react";
import NotificationDropdown from "@/features/notifications/components/NotificationDropdown";
import useNotifications from "@/features/notifications/hooks/useNotifications";
import {
  requestBrowserNotificationPermission,
  useNotifySocket,
} from "@/features/notifications/hooks/useNotifySocket";
import { useAuthStore } from "@/stores/authStore";

export function NotificationBell() {
  const token = useAuthStore((state) => state.accessToken);
  const [isOpen, setIsOpen] = useState(false);
  const bellContainerRef = useRef<HTMLDivElement | null>(null);
  const bellButtonRef = useRef<HTMLButtonElement | null>(null);
  const {
    unreadCount,
    handleSocketNotification,
    handleSocketUnreadCounts,
  } = useNotifications();

  useNotifySocket({
    token,
    onNotification: handleSocketNotification,
    onUnreadCounts: handleSocketUnreadCounts,
    enableNativeNotification: true,
  });

  useEffect(() => {
    if (!token) {
      return;
    }

    void requestBrowserNotificationPermission();
  }, [token]);

  const closeDropdown = useCallback(() => {
    setIsOpen(false);
    bellButtonRef.current?.focus();
  }, []);

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof Node)) {
        return;
      }

      if (bellContainerRef.current?.contains(target)) {
        return;
      }

      setIsOpen(false);
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
        bellButtonRef.current?.focus();
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  return (
    <div className="relative" ref={bellContainerRef}>
      <button
        type="button"
        ref={bellButtonRef}
        className="dropdown-toggle relative flex h-11 w-11 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label="Mở danh sách thông báo"
      >
        {unreadCount > 0 ? (
          <>
            <span
              aria-hidden="true"
              className="absolute -right-0.5 -top-0.5 h-5 min-w-5 rounded-full bg-brand-500/40 motion-safe:animate-ping"
            />
            <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-500 px-1 text-[10px] font-semibold text-white shadow-sm motion-safe:animate-pulse">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          </>
        ) : null}

        <Bell className="h-5 w-5" />
      </button>

      <NotificationDropdown
        dropdownId="hr-notification-dropdown"
        isOpen={isOpen}
        onClose={closeDropdown}
      />
    </div>
  );
}

export default NotificationBell;
