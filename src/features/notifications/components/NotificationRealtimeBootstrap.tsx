import { useEffect } from "react";
import useNotifications from "@/features/notifications/hooks/useNotifications";
import {
  requestBrowserNotificationPermission,
  useNotifySocket,
} from "@/features/notifications/hooks/useNotifySocket";
import { useAuthStore } from "@/stores/authStore";

const UNREAD_SYNC_INTERVAL_MS = 30000;

export function NotificationRealtimeBootstrap() {
  const token = useAuthStore((state) => state.accessToken);
  const {
    items,
    unreadCount,
    refreshUnreadCount,
    fetchNotifications,
    handleSocketNotification,
    handleSocketUnreadCounts,
  } = useNotifications();

  useNotifySocket({
    token,
    onNotification: handleSocketNotification,
    onUnreadCounts: handleSocketUnreadCounts,
    enableNativeNotification: true,
    onConnect: () => {
      void refreshUnreadCount();
    },
  });

  useEffect(() => {
    if (!token) {
      return;
    }

    void requestBrowserNotificationPermission();
  }, [token]);

  useEffect(() => {
    if (!token) {
      return;
    }

    const syncUnread = () => {
      void refreshUnreadCount();
    };

    const handleWindowFocus = () => {
      syncUnread();
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        syncUnread();
      }
    };

    const intervalId = window.setInterval(syncUnread, UNREAD_SYNC_INTERVAL_MS);

    window.addEventListener("focus", handleWindowFocus);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener("focus", handleWindowFocus);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [refreshUnreadCount, token]);

  useEffect(() => {
    if (!token) {
      return;
    }

    if (unreadCount > 0 && items.length === 0) {
      void fetchNotifications({ reset: true });
    }
  }, [fetchNotifications, items.length, token, unreadCount]);

  return null;
}

export default NotificationRealtimeBootstrap;
