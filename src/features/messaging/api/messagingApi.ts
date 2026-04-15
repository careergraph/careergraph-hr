import api from "@/config/axiosConfig";
import type {
  BlockedUserDto,
  BlockStatusDto,
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

  const displayName = toStringSafe(source.displayName);
  const normalizedDisplayName = displayName.trim();
  const nameParts = normalizedDisplayName ? normalizedDisplayName.split(/\s+/) : [];
  const fallbackFirstName = nameParts[0] ?? "";
  const fallbackLastName = nameParts.slice(1).join(" ");

  return {
    id: toStringSafe(source.id, toStringSafe(source.userId)),
    firstName: toStringSafe(source.firstName, fallbackFirstName),
    lastName: toStringSafe(source.lastName, fallbackLastName),
    email: toStringSafe(source.email),
    avatarUrl:
      toStringSafe(source.avatarUrl, toStringSafe(source.avatar)) || undefined,
  };
};

const normalizeThreadSummary = (payload: unknown): ThreadSummary => {
  const source = isRecord(payload) ? payload : {};

  const partyPayload =
    isRecord(source.otherUser)
      ? source.otherUser
      : isRecord(source.otherParty)
        ? source.otherParty
        : {};

  const otherUser = normalizeUserSummary(partyPayload);

  const application = isRecord(source.application)
    ? {
        id: toStringSafe(source.application.id),
        jobTitle: toStringSafe(source.application.jobTitle),
        status: toStringSafe(
          source.application.status,
          toStringSafe(source.application.currentStage)
        ),
      }
    : undefined;

  return {
    threadId: toStringSafe(source.threadId),
    otherUser,
    application,
    lastMessagePreview: toStringSafe(source.lastMessagePreview),
    lastMessageAt: toStringSafe(source.lastMessageAt) || null,
    unreadCount: toNumberSafe(source.unreadCount),
    isOnline: toBooleanSafe(source.isOnline, toBooleanSafe(source.online)),
    isArchived: toBooleanSafe(source.isArchived, toBooleanSafe(source.archived)),
    isBlocked: toBooleanSafe(source.isBlocked, toBooleanSafe(source.blocked)),
  };
};

const normalizeBlockedUser = (payload: unknown): BlockedUserDto => {
  const source = isRecord(payload) ? payload : {};

  return {
    userId: toStringSafe(source.userId),
    fullName: toStringSafe(source.fullName),
    email: toStringSafe(source.email),
    avatarUrl: toStringSafe(source.avatarUrl) || undefined,
    blockedAt: toStringSafe(source.blockedAt, new Date().toISOString()),
    reason: toStringSafe(source.reason) || undefined,
  };
};

const normalizeBlockStatus = (payload: unknown): BlockStatusDto => {
  const source = isRecord(payload) ? payload : {};

  return {
    blocked: toBooleanSafe(source.isBlocked, toBooleanSafe(source.blocked)),
    blockedAt: toStringSafe(source.blockedAt) || undefined,
    reason: toStringSafe(source.reason) || undefined,
  };
};

const normalizeMessage = (payload: unknown): Message => {
  const source = isRecord(payload) ? payload : {};

  const senderPayload = isRecord(source.sender)
    ? source.sender
    : {
        id: toStringSafe(source.senderId),
        displayName: toStringSafe(source.senderName),
        avatar: toStringSafe(source.senderAvatar),
      };

  return {
    id: toStringSafe(source.id),
    threadId: toStringSafe(source.threadId),
    sender: normalizeUserSummary(senderPayload),
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
  size = DEFAULT_PAGE_SIZE,
  archived = false
): Promise<PageResponse<ThreadSummary>> => {
  const response = await api.get<RestEnvelope<PageResponse<ThreadSummary>>>(
    "/messages/threads",
    {
      params: { page, size, sort: "lastMessageAt,desc", archived },
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

const unsendMessage = async (messageId: string): Promise<void> => {
  await api.delete(`/messages/${messageId}/unsend`);
};

const deleteThread = async (threadId: string): Promise<void> => {
  await api.delete(`/messages/threads/${threadId}`);
};

const archiveThread = async (threadId: string): Promise<void> => {
  await api.post(`/messages/threads/${threadId}/archive`);
};

const unarchiveThread = async (threadId: string): Promise<void> => {
  await api.post(`/messages/threads/${threadId}/unarchive`);
};

const blockUser = async (userId: string, reason?: string): Promise<void> => {
  await api.post(`/users/${userId}/block`, { reason });
};

const unblockUser = async (userId: string): Promise<void> => {
  await api.delete(`/users/${userId}/block`);
};

const getBlockedUsers = async (): Promise<BlockedUserDto[]> => {
  const response = await api.get<RestEnvelope<BlockedUserDto[]>>("/users/blocked");
  const unwrapped = unwrapEnvelope<unknown>(response.data);
  const list = Array.isArray(unwrapped) ? unwrapped : [];
  return list.map((item) => normalizeBlockedUser(item));
};

const getBlockStatus = async (userId: string): Promise<BlockStatusDto> => {
  const response = await api.get<RestEnvelope<BlockStatusDto>>(`/users/${userId}/block`);
  const unwrapped = unwrapEnvelope<unknown>(response.data);
  return normalizeBlockStatus(unwrapped);
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
  unsendMessage,
  deleteThread,
  archiveThread,
  unarchiveThread,
  blockUser,
  unblockUser,
  getBlockedUsers,
  getBlockStatus,
  getUnreadCount,
};

export default messagingApi;
