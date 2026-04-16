import { useEffect, useRef } from "react";
import { io, type Socket } from "socket.io-client";

export interface NotificationPayload {
  id: string;
  type: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  read?: boolean;
  isRead?: boolean;
  createdAt: string;
}

export interface UnreadCounts {
  messages: number;
  notifications: number;
}

interface UseNotifySocketOptions {
  token: string | null;
  onNotification: (notification: NotificationPayload) => void;
  onUnreadCounts: (counts: UnreadCounts) => void;
  enableNativeNotification?: boolean;
}

const NOTIFY_SOCKET_URL =
  import.meta.env.VITE_RTC_BASE_URL ?? "http://localhost:4000";

const canUseBrowserNotifications = (): boolean =>
  typeof window !== "undefined" && "Notification" in window;

export const requestBrowserNotificationPermission = async (): Promise<void> => {
  if (!canUseBrowserNotifications()) {
    return;
  }

  if (Notification.permission === "default") {
    await Notification.requestPermission();
  }
};

export function useNotifySocket({
  token,
  onNotification,
  onUnreadCounts,
  enableNativeNotification = true,
}: UseNotifySocketOptions) {
  const socketRef = useRef<Socket | null>(null);
  const onNotificationRef = useRef(onNotification);
  const onUnreadCountsRef = useRef(onUnreadCounts);

  useEffect(() => {
    onNotificationRef.current = onNotification;
  }, [onNotification]);

  useEffect(() => {
    onUnreadCountsRef.current = onUnreadCounts;
  }, [onUnreadCounts]);

  useEffect(() => {
    if (!token) {
      return;
    }

    const socket = io(`${NOTIFY_SOCKET_URL}/notify`, {
      auth: { token },
      transports: ["websocket"],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    socketRef.current = socket;

    socket.on("notification", (notification: NotificationPayload) => {
      onNotificationRef.current(notification);

      if (
        enableNativeNotification &&
        canUseBrowserNotifications() &&
        Notification.permission === "granted"
      ) {
        const browserNotification = new Notification(notification.title, {
          body: notification.body,
          icon: "/favicon.ico",
          tag: notification.id,
        });

        browserNotification.onclick = () => {
          window.focus();
          browserNotification.close();
        };
      }
    });

    socket.on("unread-counts", (counts: UnreadCounts) => {
      onUnreadCountsRef.current(counts);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [enableNativeNotification, token]);
}

export default useNotifySocket;