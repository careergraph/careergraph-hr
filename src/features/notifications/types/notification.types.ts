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
  content: NotificationItem[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
  empty: boolean;
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
