import api from "@/config/axiosConfig";
import type {
  NotificationItem,
  NotificationPageResponse,
} from "@/features/notifications/types/notification.types";

const NOTIFICATION_PAGE_SIZE = 20;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const toStringSafe = (value: unknown, fallback = ""): string =>
  typeof value === "string" ? value : fallback;

const toNumberSafe = (value: unknown, fallback = 0): number =>
  typeof value === "number" && Number.isFinite(value) ? value : fallback;

const toBooleanSafe = (value: unknown, fallback = false): boolean =>
  typeof value === "boolean" ? value : fallback;

const unwrapEnvelope = <T>(payload: unknown): T => {
  if (isRecord(payload) && "data" in payload) {
    return payload.data as T;
  }

  return payload as T;
};

const normalizeNotification = (payload: unknown): NotificationItem => {
  const source = isRecord(payload) ? payload : {};
  const readValue =
    typeof source.read === "boolean"
      ? source.read
      : toBooleanSafe(source.isRead);

  return {
    id: toStringSafe(source.id),
    type: toStringSafe(source.type),
    title: toStringSafe(source.title),
    body: toStringSafe(source.body),
    data: isRecord(source.data) ? source.data : undefined,
    createdAt: toStringSafe(source.createdAt, new Date().toISOString()),
    read: readValue,
  };
};

const countUnread = (items: NotificationItem[]): number =>
  items.reduce((total, item) => total + (item.read ? 0 : 1), 0);

const normalizePage = (payload: unknown): NotificationPageResponse => {
  const source = isRecord(payload) ? payload : {};
  const rawNotifications = Array.isArray(source.notifications)
    ? source.notifications
    : Array.isArray(source.content)
      ? source.content
      : [];
  const notifications = rawNotifications.map((item) => normalizeNotification(item));

  const hasMoreFromPage = (() => {
    const size = toNumberSafe(source.size, NOTIFICATION_PAGE_SIZE);
    const totalElements = toNumberSafe(source.totalElements, notifications.length);
    const totalPages = toNumberSafe(
      source.totalPages,
      size > 0 ? Math.ceil(totalElements / size) : 1
    );
    const pageNumber = toNumberSafe(source.number, 0);
    const isLast = toBooleanSafe(source.last, pageNumber >= totalPages - 1);
    return !isLast && pageNumber + 1 < totalPages;
  })();

  return {
    notifications,
    totalUnread: toNumberSafe(source.totalUnread, countUnread(notifications)),
    hasMore: toBooleanSafe(source.hasMore, hasMoreFromPage),
  };
};

const getNotifications = async (
  page = 0,
  size = NOTIFICATION_PAGE_SIZE
): Promise<NotificationPageResponse> => {
  const response = await api.get("/notifications", {
    params: { page, size },
  });

  const data = unwrapEnvelope<unknown>(response.data);
  return normalizePage(data);
};

const markAsRead = async (notificationId: string): Promise<void> => {
  await api.post(`/notifications/${notificationId}/read`);
};

const markAllAsRead = async (): Promise<void> => {
  await api.post("/notifications/read-all");
};

const getUnreadCount = async (): Promise<number> => {
  const response = await api.get("/notifications/unread-count");
  const data = unwrapEnvelope<unknown>(response.data);

  if (isRecord(data) && typeof data.count === "number") {
    return data.count;
  }

  return 0;
};

export const notificationApi = {
  getNotifications,
  markAsRead,
  markAllAsRead,
  getUnreadCount,
};

export default notificationApi;
