import { create } from "zustand";
import type {
  NotificationItem,
  NotificationState,
} from "@/features/notifications/types/notification.types";

interface NotificationStore extends NotificationState {
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setUnreadCount: (count: number) => void;
  setPage: (page: number) => void;
  setHasMore: (hasMore: boolean) => void;
  setInitialized: (initialized: boolean) => void;
  replaceItems: (items: NotificationItem[]) => void;
  appendItems: (items: NotificationItem[]) => void;
  prependItem: (item: NotificationItem) => void;
  markRead: (notificationId: string) => void;
  markAllRead: () => void;
  reset: () => void;
}

const initialState: NotificationState = {
  items: [],
  loading: false,
  error: null,
  unreadCount: 0,
  page: 0,
  hasMore: true,
  initialized: false,
};

const mergeItems = (
  current: NotificationItem[],
  incoming: NotificationItem[]
): NotificationItem[] => {
  const byId = new Map<string, NotificationItem>();

  for (const item of current) {
    byId.set(item.id, item);
  }

  for (const item of incoming) {
    byId.set(item.id, item);
  }

  return Array.from(byId.values()).sort(
    (a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
};

const countUnread = (items: NotificationItem[]): number =>
  items.reduce((total, item) => total + (item.read ? 0 : 1), 0);

export const useNotificationStore = create<NotificationStore>()((set, get) => ({
  ...initialState,

  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  setUnreadCount: (unreadCount) => set({ unreadCount: Math.max(0, unreadCount) }),
  setPage: (page) => set({ page }),
  setHasMore: (hasMore) => set({ hasMore }),
  setInitialized: (initialized) => set({ initialized }),

  replaceItems: (items) =>
    set({
      items,
      unreadCount: countUnread(items),
    }),

  appendItems: (items) => {
    const merged = mergeItems(get().items, items);

    set({
      items: merged,
      unreadCount: countUnread(merged),
    });
  },

  prependItem: (item) => {
    const merged = mergeItems([item], get().items);

    set({
      items: merged,
      unreadCount: countUnread(merged),
    });
  },

  markRead: (notificationId) => {
    const nextItems = get().items.map((item) =>
      item.id === notificationId
        ? {
            ...item,
            read: true,
          }
        : item
    );

    set({
      items: nextItems,
      unreadCount: countUnread(nextItems),
    });
  },

  markAllRead: () => {
    const nextItems = get().items.map((item) => ({
      ...item,
      read: true,
    }));

    set({
      items: nextItems,
      unreadCount: 0,
    });
  },

  reset: () => set({ ...initialState }),
}));

export default useNotificationStore;
