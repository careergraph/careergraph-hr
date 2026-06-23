import { useEffect } from "react";
import { toast } from "sonner";
import api from "@/config/axiosConfig";
import useNotifications from "@/features/notifications/hooks/useNotifications";
import {
  requestBrowserNotificationPermission,
  type NotificationPayload,
  useNotifySocket,
} from "@/features/notifications/hooks/useNotifySocket";
import companyService from "@/services/companyService";
import {
  buildBlockedSessionNotice,
  persistSessionNotice,
} from "@/lib/sessionNotice";
import { useAuthStore } from "@/stores/authStore";

const UNREAD_SYNC_INTERVAL_MS = 30000;

export function NotificationRealtimeBootstrap() {
  const token = useAuthStore((state) => state.accessToken);
  const setAccessToken = useAuthStore((state) => state.setAccessToken);
  const setCompany = useAuthStore((state) => state.setCompany);
  const updateUser = useAuthStore((state) => state.updateUser);
  const clearState = useAuthStore((state) => state.clearState);
  const {
    items,
    unreadCount,
    initialized,
    refreshUnreadCount,
    fetchNotifications,
    handleSocketNotification,
    handleSocketUnreadCounts,
  } = useNotifications();

  const refreshCurrentPage = () => {
    const url = new URL(window.location.href);
    url.searchParams.set("refresh", "1");
    url.searchParams.set("ts", String(Date.now()));
    window.location.assign(url.toString());
  };

  const extractAccessToken = (payload: unknown): string | null => {
    if (!payload || typeof payload !== "object") {
      return null;
    }

    const response = payload as Record<string, unknown>;
    if (typeof response.accessToken === "string") {
      return response.accessToken;
    }

    if (response.data && typeof response.data === "object") {
      const nested = response.data as Record<string, unknown>;
      if (typeof nested.accessToken === "string") {
        return nested.accessToken;
      }
    }

    return null;
  };

  const handleRealtimeBusinessNotification = async (notification: NotificationPayload) => {
    if (notification.type === "COMPANY_BLOCKED") {
      persistSessionNotice(buildBlockedSessionNotice(notification.body));
      clearState();
      toast.error("Doanh nghiệp đã bị khóa. Bạn sẽ được chuyển về màn hình đăng nhập.");
      window.location.assign("/signin?session=blocked");
      return;
    }

    if (notification.type === "COMPANY_VERIFICATION_APPROVED") {
      try {
        const refreshResponse = await api.post("/auth/refresh");
        const nextToken = extractAccessToken(refreshResponse.data);
        if (nextToken) {
          setAccessToken(nextToken);
        }

        const currentCompany = await companyService.getMyCompany();
        if (currentCompany) {
          setCompany(currentCompany);
          updateUser({
            company: currentCompany,
            companyId: currentCompany.id,
            role: currentCompany.role,
            email: currentCompany.email,
          });
        }

        toast.success("Doanh nghiệp đã được xác thực thành công. Hệ thống đang làm mới phiên đăng nhập.");
        refreshCurrentPage();
      } catch (error) {
        console.error("Failed to refresh session after verification approval", error);
        toast.success("Doanh nghiệp đã được xác thực. Vui lòng đăng nhập lại để làm mới quyền truy cập.");
        window.location.assign("/signin?session=approved");
      }
    }
  };

  useNotifySocket({
    token,
    onNotification: (notification) => {
      handleSocketNotification(notification);
      void handleRealtimeBusinessNotification(notification);
    },
    onUnreadCounts: handleSocketUnreadCounts,
    enableNativeNotification: true,
    onConnect: () => {
      void refreshUnreadCount();

      if (initialized && (items.length > 0 || unreadCount > 0)) {
        void fetchNotifications({ reset: true });
      }
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
