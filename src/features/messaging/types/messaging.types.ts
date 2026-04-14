export type MessageContentType = "TEXT" | "IMAGE" | "FILE";

export type MessageDeliveryStatus = "sending" | "sent" | "failed";

export interface RestEnvelope<T> {
  status?: string;
  message?: string;
  data: T;
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
  empty: boolean;
}

export interface UserSummary {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  avatarUrl?: string;
}

export interface ThreadApplicationSummary {
  id: string;
  jobTitle: string;
  status: string;
}

export interface ThreadSummary {
  threadId: string;
  otherUser: UserSummary;
  application?: ThreadApplicationSummary;
  lastMessagePreview: string;
  lastMessageAt: string | null;
  unreadCount: number;
  isOnline: boolean;
}

export interface Message {
  id: string;
  threadId: string;
  sender: UserSummary;
  content: string;
  contentType: MessageContentType;
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  deleted: boolean;
  createdAt: string;
  isRead: boolean;
  readAt?: string;
  localStatus?: MessageDeliveryStatus;
}

export interface TypingStatus {
  threadId: string;
  userId: string;
  displayName: string;
}

export interface ThreadMessagesMeta {
  nextOlderPage: number | null;
  hasMore: boolean;
  loading: boolean;
  loadingOlder: boolean;
}

export interface MessagingState {
  threads: ThreadSummary[];
  threadsLoading: boolean;
  threadsError: string | null;
  threadsPage: number;
  threadsHasMore: boolean;
  selectedThreadId: string | null;
  messages: Record<string, Message[]>;
  messageMeta: Record<string, ThreadMessagesMeta>;
  typingUsers: Record<string, TypingStatus[]>;
  onlineUsers: Record<string, boolean>;
  totalUnread: number;
}

export interface ThreadMessagesReadEvent {
  threadId: string;
  userId: string;
  lastReadMessageId?: string;
  readAt: string;
}

export interface MessageDeletedEvent {
  threadId: string;
  messageId: string;
  deletedAt: string;
}
