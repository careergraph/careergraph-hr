import api from "@/config/axiosConfig";
import type {
  Message,
  MessageContentType,
  PageResponse,
  RestEnvelope,
  ThreadSummary,
  UserSummary,
} from "@/features/messaging/types/messaging.types";

const DEFAULT_PAGE_SIZE = 20;
const DEFAULT_MESSAGE_PAGE_SIZE = 30;

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

const normalizeUserSummary = (payload: unknown): UserSummary => {
  const source = isRecord(payload) ? payload : {};

  return {
    id: toStringSafe(source.id, toStringSafe(source.userId)),
    firstName: toStringSafe(source.firstName),
    lastName: toStringSafe(source.lastName),
    email: toStringSafe(source.email),
    avatarUrl: toStringSafe(source.avatarUrl) || undefined,
  };
};

const normalizeThreadSummary = (payload: unknown): ThreadSummary => {
  const source = isRecord(payload) ? payload : {};
  const otherUser = normalizeUserSummary(source.otherUser);

  const application = isRecord(source.application)
    ? {
        id: toStringSafe(source.application.id),
        jobTitle: toStringSafe(source.application.jobTitle),
        status: toStringSafe(source.application.status),
      }
    : undefined;

  return {
    threadId: toStringSafe(source.threadId),
    otherUser,
    application,
    lastMessagePreview: toStringSafe(source.lastMessagePreview),
    lastMessageAt: toStringSafe(source.lastMessageAt) || null,
    unreadCount: toNumberSafe(source.unreadCount),
    isOnline: toBooleanSafe(source.isOnline),
  };
};

const normalizeMessage = (payload: unknown): Message => {
  const source = isRecord(payload) ? payload : {};

  return {
    id: toStringSafe(source.id),
    threadId: toStringSafe(source.threadId),
    sender: normalizeUserSummary(source.sender),
    content: toStringSafe(source.content),
    contentType:
      toStringSafe(source.contentType, "TEXT") as MessageContentType,
    fileUrl: toStringSafe(source.fileUrl) || undefined,
    fileName: toStringSafe(source.fileName) || undefined,
    fileSize:
      typeof source.fileSize === "number" && Number.isFinite(source.fileSize)
        ? source.fileSize
        : undefined,
    deleted: toBooleanSafe(source.deleted),
    createdAt: toStringSafe(source.createdAt, new Date().toISOString()),
    isRead: toBooleanSafe(source.isRead),
    readAt: toStringSafe(source.readAt) || undefined,
    localStatus: "sent",
  };
};

const normalizePageResponse = <T>(
  payload: unknown,
  mapper: (item: unknown) => T,
  pageSizeFallback: number
): PageResponse<T> => {
  const source = isRecord(payload) ? payload : {};
  const contentRaw = Array.isArray(source.content) ? source.content : [];

  const size = toNumberSafe(source.size, pageSizeFallback);
  const totalElements = toNumberSafe(source.totalElements, contentRaw.length);
  const totalPages = toNumberSafe(
    source.totalPages,
    size > 0 ? Math.ceil(totalElements / size) : 1
  );
  const pageNumber = toNumberSafe(source.number, 0);

  return {
    content: contentRaw.map((item) => mapper(item)),
    totalElements,
    totalPages,
    size,
    number: pageNumber,
    first: toBooleanSafe(source.first, pageNumber <= 0),
    last: toBooleanSafe(source.last, pageNumber >= totalPages - 1),
    empty: toBooleanSafe(source.empty, contentRaw.length === 0),
  };
};

const getThreads = async (
  page = 0,
  size = DEFAULT_PAGE_SIZE
): Promise<PageResponse<ThreadSummary>> => {
  const response = await api.get<RestEnvelope<PageResponse<ThreadSummary>>>(
    "/messages/threads",
    {
      params: { page, size, sort: "lastMessageAt,desc" },
    }
  );

  const unwrapped = unwrapEnvelope<unknown>(response.data);
  return normalizePageResponse(unwrapped, normalizeThreadSummary, size);
};

const getOrCreateThread = async (params: {
  candidateId?: string;
  companyId?: string;
  applicationId?: string;
}): Promise<ThreadSummary> => {
  const response = await api.post<RestEnvelope<ThreadSummary>>(
    "/messages/threads",
    {
      candidateId: params.candidateId,
      companyId: params.companyId,
      applicationId: params.applicationId,
    }
  );

  const unwrapped = unwrapEnvelope<unknown>(response.data);
  return normalizeThreadSummary(unwrapped);
};

const getMessages = async (
  threadId: string,
  page = 0,
  size = DEFAULT_MESSAGE_PAGE_SIZE
): Promise<PageResponse<Message>> => {
  const response = await api.get<RestEnvelope<PageResponse<Message>>>(
    `/messages/threads/${threadId}/messages`,
    {
      params: { page, size },
    }
  );

  const unwrapped = unwrapEnvelope<unknown>(response.data);
  return normalizePageResponse(unwrapped, normalizeMessage, size);
};

const sendMessage = async (
  threadId: string,
  content: string,
  contentType: MessageContentType = "TEXT"
): Promise<Message> => {
  const response = await api.post<RestEnvelope<Message>>(
    `/messages/threads/${threadId}/messages`,
    {
      content,
      contentType,
    }
  );

  const unwrapped = unwrapEnvelope<unknown>(response.data);
  return normalizeMessage(unwrapped);
};

const markThreadAsRead = async (threadId: string): Promise<void> => {
  await api.post(`/messages/threads/${threadId}/read`);
};

const deleteMessage = async (messageId: string): Promise<void> => {
  await api.delete(`/messages/${messageId}`);
};

const getUnreadCount = async (): Promise<number> => {
  const response = await api.get<RestEnvelope<{ count: number }>>(
    "/messages/unread-count"
  );

  const unwrapped = unwrapEnvelope<unknown>(response.data);
  if (isRecord(unwrapped) && typeof unwrapped.count === "number") {
    return unwrapped.count;
  }

  return 0;
};

export const messagingApi = {
  getThreads,
  getOrCreateThread,
  getMessages,
  sendMessage,
  markThreadAsRead,
  deleteMessage,
  getUnreadCount,
};

export default messagingApi;
