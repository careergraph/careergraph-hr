export interface NotificationItem {
  id: string;
  type: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  createdAt: string;
  read: boolean;
}

export interface NotificationPageResponse {
  notifications: NotificationItem[];
  totalUnread: number;
  hasMore: boolean;
}

export interface UnreadCountsPayload {
  messages?: number;
  notifications?: number;
}

export interface NotificationState {
  items: NotificationItem[];
  loading: boolean;
  error: string | null;
  unreadCount: number;
  page: number;
  hasMore: boolean;
  initialized: boolean;
}
