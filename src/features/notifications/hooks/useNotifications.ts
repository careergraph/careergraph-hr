import { useCallback, useEffect } from "react";
import { io, type Socket } from "socket.io-client";
import notificationApi from "@/features/notifications/api/notificationApi";
import { useNotificationStore } from "@/features/notifications/store/notificationStore";
import type {
  NotificationItem,
  UnreadCountsPayload,
} from "@/features/notifications/types/notification.types";
import { useMessagingStore } from "@/features/messaging/store/messagingStore";
import { useAuthStore } from "@/stores/authStore";

const NOTIFY_SOCKET_URL =
  import.meta.env.VITE_RTC_BASE_URL ?? "http://localhost:4000";

const PAGE_SIZE = 20;

type NotifySocket = Socket<Record<string, never>, Record<string, never>>;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const toStringSafe = (value: unknown, fallback = ""): string =>
  typeof value === "string" ? value : fallback;

const toBooleanSafe = (value: unknown, fallback = false): boolean =>
  typeof value === "boolean" ? value : fallback;

const normalizeNotification = (payload: unknown): NotificationItem => {
  const source = isRecord(payload) ? payload : {};

  return {
    id: toStringSafe(source.id, `notify-${Date.now()}`),
    type: toStringSafe(source.type, "GENERAL"),
    title: toStringSafe(source.title, "Thông báo mới"),
    body: toStringSafe(source.body, "Bạn có một thông báo mới."),
    data: isRecord(source.data) ? source.data : undefined,
    createdAt: toStringSafe(source.createdAt, new Date().toISOString()),
    read: toBooleanSafe(source.read),
  };
};

const resolveError = (error: unknown): string => {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return "Không thể tải thông báo.";
};

export const useNotifications = () => {
  const token = useAuthStore((state) => state.accessToken);

  const items = useNotificationStore((state) => state.items);
  const loading = useNotificationStore((state) => state.loading);
  const error = useNotificationStore((state) => state.error);
  const unreadCount = useNotificationStore((state) => state.unreadCount);
  const page = useNotificationStore((state) => state.page);
  const hasMore = useNotificationStore((state) => state.hasMore);
  const initialized = useNotificationStore((state) => state.initialized);

  const setLoading = useNotificationStore((state) => state.setLoading);
  const setError = useNotificationStore((state) => state.setError);
  const setUnreadCount = useNotificationStore((state) => state.setUnreadCount);
  const setPage = useNotificationStore((state) => state.setPage);
  const setHasMore = useNotificationStore((state) => state.setHasMore);
  const setInitialized = useNotificationStore((state) => state.setInitialized);
  const replaceItems = useNotificationStore((state) => state.replaceItems);
  const appendItems = useNotificationStore((state) => state.appendItems);
  const prependItem = useNotificationStore((state) => state.prependItem);
  const markRead = useNotificationStore((state) => state.markRead);
  const markAllReadLocal = useNotificationStore((state) => state.markAllRead);

  const fetchNotifications = useCallback(
    async (options?: { reset?: boolean }) => {
      const reset = Boolean(options?.reset);
      const targetPage = reset ? 0 : page;

      if (!reset && (!hasMore || loading)) {
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const response = await notificationApi.getNotifications(
          targetPage,
          PAGE_SIZE
        );

        if (reset) {
          replaceItems(response.content);
        } else {
          appendItems(response.content);
        }

        setPage(targetPage + 1);
        setHasMore(!response.last && targetPage + 1 < response.totalPages);
        setInitialized(true);
      } catch (reason: unknown) {
        setError(resolveError(reason));
      } finally {
        setLoading(false);
      }
    },
    [
      appendItems,
      hasMore,
      loading,
      page,
      replaceItems,
      setError,
      setHasMore,
      setInitialized,
      setLoading,
      setPage,
    ]
  );

  const refreshUnreadCount = useCallback(async () => {
    try {
      const count = await notificationApi.getUnreadCount();
      setUnreadCount(count);
    } catch {
      // Keep silent to avoid noisy header behavior.
    }
  }, [setUnreadCount]);

  const ensureLoaded = useCallback(async () => {
    if (!initialized) {
      await fetchNotifications({ reset: true });
      await refreshUnreadCount();
    }
  }, [fetchNotifications, initialized, refreshUnreadCount]);

  const markAsRead = useCallback(async (notificationId: string) => {
    markRead(notificationId);

    try {
      await notificationApi.markAsRead(notificationId);
      await refreshUnreadCount();
    } catch {
      // Ignore transient errors, optimistic state is acceptable for UX.
    }
  }, [markRead, refreshUnreadCount]);

  const markAllAsRead = useCallback(async () => {
    markAllReadLocal();

    try {
      await notificationApi.markAllAsRead();
      setUnreadCount(0);
    } catch {
      // Ignore transient errors, optimistic state is acceptable for UX.
    }
  }, [markAllReadLocal, setUnreadCount]);

  useEffect(() => {
    if (!token) {
      return;
    }

    const socket: NotifySocket = io(`${NOTIFY_SOCKET_URL}/notify`, {
      auth: { token },
      transports: ["websocket"],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    socket.on("notification", (payload: unknown) => {
      const nextItem = normalizeNotification(payload);
      prependItem(nextItem);
    });

    socket.on("unread-counts", (payload: UnreadCountsPayload) => {
      if (typeof payload.notifications === "number") {
        setUnreadCount(payload.notifications);
      }

      if (typeof payload.messages === "number") {
        useMessagingStore.getState().setTotalUnread(payload.messages);
      }
    });

    socket.on("connect_error", (reason: Error) => {
      console.error("[notify socket] connect error:", reason.message);
    });

    return () => {
      socket.disconnect();
    };
  }, [prependItem, setUnreadCount, token]);

  useEffect(() => {
    if (!token) {
      return;
    }

    void refreshUnreadCount();
  }, [refreshUnreadCount, token]);

  return {
    items,
    loading,
    error,
    unreadCount,
    hasMore,
    ensureLoaded,
    fetchNotifications,
    refreshUnreadCount,
    markAsRead,
    markAllAsRead,
  };
};

export default useNotifications;
