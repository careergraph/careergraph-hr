import { useCallback, useEffect, useRef, type MutableRefObject } from "react";
import { jwtDecode } from "jwt-decode";
import { io, type Socket } from "socket.io-client";
import { toast } from "sonner";
import { useAuthStore } from "@/stores/authStore";
import { useMessagingStore } from "@/features/messaging/store/messagingStore";
import type {
  Message,
  MessageContentType,
  ThreadMessagesReadEvent,
  TypingStatus,
  UserSummary,
} from "@/features/messaging/types/messaging.types";

const CHAT_SOCKET_URL =
  import.meta.env.VITE_RTC_BASE_URL ?? "http://localhost:4000";

type ChatSocket = Socket;

interface JwtClaims {
  sub?: string;
}

let sharedSocket: ChatSocket | null = null;
let sharedToken: string | null = null;
let activeConsumers = 0;
let listenersAttached = false;
const subscribedThreadIds = new Map<string, number>();

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const toStringSafe = (value: unknown, fallback = ""): string =>
  typeof value === "string" ? value : fallback;

const toBooleanSafe = (value: unknown, fallback = false): boolean =>
  typeof value === "boolean" ? value : fallback;

const HAS_TIMEZONE_SUFFIX = /(?:[zZ]|[+-]\d{2}(?::?\d{2})?)$/;

const normalizeIsoTimestamp = (value: unknown, fallback = ""): string => {
  if (typeof value !== "string") {
    return fallback;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return fallback;
  }

  const withSeparator = trimmed.includes("T") ? trimmed : trimmed.replace(" ", "T");
  const withZone = HAS_TIMEZONE_SUFFIX.test(withSeparator)
    ? withSeparator
    : `${withSeparator}Z`;
  const millisNormalized = withZone.replace(/\.(\d{3})\d+/, ".$1");

  const parsed = new Date(millisNormalized);
  if (Number.isNaN(parsed.getTime())) {
    return fallback;
  }

  return parsed.toISOString();
};

const resolveTypingDisplayName = (payload: unknown, fallback: string): string => {
  const source = isRecord(payload) ? payload : {};
  const displayName = toStringSafe(source.displayName).trim();
  if (displayName && !displayName.includes("@")) {
    return displayName;
  }

  const firstName = toStringSafe(source.firstName).trim();
  const lastName = toStringSafe(source.lastName).trim();
  const fullName = `${firstName} ${lastName}`.trim();
  if (fullName) {
    return fullName;
  }

  return fallback;
};

const normalizeUser = (payload: unknown): UserSummary => {
  const source = isRecord(payload) ? payload : {};
  const displayName = toStringSafe(source.displayName).trim();
  const displayParts = displayName ? displayName.split(/\s+/) : [];

  return {
    id: toStringSafe(source.id, toStringSafe(source.userId)),
    firstName: toStringSafe(source.firstName, displayParts[0] ?? ""),
    lastName: toStringSafe(source.lastName, displayParts.slice(1).join(" ")),
    email: toStringSafe(source.email),
    avatarUrl: toStringSafe(source.avatarUrl, toStringSafe(source.avatar)) || undefined,
  };
};

const normalizeMessage = (payload: unknown, threadId: string): Message => {
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
    threadId: toStringSafe(source.threadId, threadId),
    sender: normalizeUser(senderPayload),
    content: toStringSafe(source.content),
    contentType: toStringSafe(
      source.contentType,
      "TEXT"
    ) as MessageContentType,
    fileUrl: toStringSafe(source.fileUrl) || undefined,
    fileName: toStringSafe(source.fileName) || undefined,
    fileSize:
      typeof source.fileSize === "number" && Number.isFinite(source.fileSize)
        ? source.fileSize
        : undefined,
    deleted: toBooleanSafe(source.deleted),
    createdAt: normalizeIsoTimestamp(source.createdAt, new Date().toISOString()),
    isRead: toBooleanSafe(source.isRead),
    readAt: normalizeIsoTimestamp(source.readAt, "") || undefined,
    localStatus: "sent",
  };
};

const resolveCurrentUserId = (): string => {
  const state = useAuthStore.getState();

  if (state.user?.id) {
    return state.user.id;
  }

  if (state.accessToken) {
    try {
      const claims = jwtDecode<JwtClaims>(state.accessToken);
      if (claims.sub) {
        return claims.sub;
      }
    } catch {
      return "";
    }
  }

  return "";
};

const attachSocketListeners = (currentUserIdRef: MutableRefObject<string>) => {
  if (!sharedSocket || listenersAttached) {
    return;
  }

  const addMessageToThread = useMessagingStore.getState().addMessageToThread;
  const setTypingStatus = useMessagingStore.getState().setTypingStatus;
  const setUserOnline = useMessagingStore.getState().setUserOnline;
  const applyThreadReadEvent = useMessagingStore.getState().applyThreadReadEvent;
  const applyMessageDeletedEvent = useMessagingStore.getState().applyMessageDeletedEvent;
  const applyThreadOnlineUsers = useMessagingStore.getState().applyThreadOnlineUsers;
  const patchThreadSummary = useMessagingStore.getState().patchThreadSummary;

  sharedSocket.on("new-message", (payload: unknown) => {
    if (!isRecord(payload)) return;

    const threadId = toStringSafe(payload.threadId);
    if (!threadId) return;

    const message = normalizeMessage(payload.message, threadId);
    addMessageToThread(threadId, message, { incoming: true });
  });

  sharedSocket.on("typing-start", (payload: unknown) => {
    if (!isRecord(payload)) return;

    const threadId = toStringSafe(payload.threadId);
    const userId = toStringSafe(payload.userId);
    const displayName = resolveTypingDisplayName(payload, "Ứng viên");

    if (!threadId || !userId || userId === currentUserIdRef.current) return;

    const typing: TypingStatus = {
      threadId,
      userId,
      displayName,
    };

    setTypingStatus(typing, true);
  });

  sharedSocket.on("typing-stop", (payload: unknown) => {
    if (!isRecord(payload)) return;

    const threadId = toStringSafe(payload.threadId);
    const userId = toStringSafe(payload.userId);

    if (!threadId || !userId || userId === currentUserIdRef.current) return;

    setTypingStatus(
      {
        threadId,
        userId,
        displayName: "",
      },
      false
    );
  });

  sharedSocket.on("user-online", (payload: unknown) => {
    if (!isRecord(payload)) return;

    const threadId = toStringSafe(payload.threadId);
    const userId = toStringSafe(payload.userId);
    if (!threadId || !userId || userId === currentUserIdRef.current) return;

    setUserOnline(userId, true);
    patchThreadSummary(threadId, { isOnline: true });
  });

  sharedSocket.on("user-offline", (payload: unknown) => {
    if (!isRecord(payload)) return;

    const threadId = toStringSafe(payload.threadId);
    const userId = toStringSafe(payload.userId);
    if (!threadId || !userId || userId === currentUserIdRef.current) return;

    setUserOnline(userId, false);
    patchThreadSummary(threadId, { isOnline: false });
  });

  sharedSocket.on("thread-online-users", (payload: unknown) => {
    if (!isRecord(payload)) return;

    const threadId = toStringSafe(payload.threadId);
    const onlineUsers = Array.isArray(payload.onlineUsers)
      ? payload.onlineUsers.filter((userId): userId is string => typeof userId === "string")
      : [];

    if (!threadId) return;

    applyThreadOnlineUsers(threadId, onlineUsers);

    const hasPeerOnline = onlineUsers.some((userId) => userId !== currentUserIdRef.current);
    patchThreadSummary(threadId, { isOnline: hasPeerOnline });
  });

  sharedSocket.on("messages-read", (payload: unknown) => {
    if (!isRecord(payload)) return;

    const userId = toStringSafe(payload.userId);
    if (!userId || userId === currentUserIdRef.current) return;

    const event: ThreadMessagesReadEvent = {
      threadId: toStringSafe(payload.threadId),
      userId,
      lastReadMessageId: toStringSafe(payload.lastReadMessageId) || undefined,
      readAt: normalizeIsoTimestamp(payload.readAt, new Date().toISOString()),
    };

    if (!event.threadId) return;

    applyThreadReadEvent(event, currentUserIdRef.current);
  });

  sharedSocket.on("message-deleted", (payload: unknown) => {
    if (!isRecord(payload)) return;

    const threadId = toStringSafe(payload.threadId);
    const messageId = toStringSafe(payload.messageId);

    if (!threadId || !messageId) return;

    applyMessageDeletedEvent({
      threadId,
      messageId,
      deletedAt: normalizeIsoTimestamp(payload.deletedAt, new Date().toISOString()),
    });
  });

  sharedSocket.on("blocked-by-hr", (payload: unknown) => {
    if (!isRecord(payload)) return;

    const threadId = toStringSafe(payload.threadId);
    if (!threadId) return;

    patchThreadSummary(threadId, { isBlocked: true });
    toast.warning("Bạn đã bị chặn bởi nhà tuyển dụng trong cuộc trò chuyện này.");
  });

  sharedSocket.on("unblocked-by-hr", (payload: unknown) => {
    if (!isRecord(payload)) return;

    const threadId = toStringSafe(payload.threadId);
    if (!threadId) return;

    patchThreadSummary(threadId, { isBlocked: false });
  });

  listenersAttached = true;
};

const detachSocketListeners = () => {
  if (!sharedSocket) return;

  sharedSocket.removeAllListeners("new-message");
  sharedSocket.removeAllListeners("typing-start");
  sharedSocket.removeAllListeners("typing-stop");
  sharedSocket.removeAllListeners("user-online");
  sharedSocket.removeAllListeners("user-offline");
  sharedSocket.removeAllListeners("thread-online-users");
  sharedSocket.removeAllListeners("messages-read");
  sharedSocket.removeAllListeners("message-deleted");
  sharedSocket.removeAllListeners("blocked-by-hr");
  sharedSocket.removeAllListeners("unblocked-by-hr");

  listenersAttached = false;
};

const emitJoinThread = (threadId: string) => {
  if (!threadId) return;
  sharedSocket?.emit("join-thread", threadId);
};

const emitLeaveThread = (threadId: string) => {
  if (!threadId) return;
  sharedSocket?.emit("leave-thread", threadId);
};

const rejoinSubscribedThreads = () => {
  for (const threadId of subscribedThreadIds.keys()) {
    emitJoinThread(threadId);
  }
};

const ensureSocket = (token: string): ChatSocket => {
  if (sharedSocket && sharedToken === token) {
    return sharedSocket;
  }

  if (sharedSocket) {
    detachSocketListeners();
    sharedSocket.disconnect();
  }

  sharedSocket = io(`${CHAT_SOCKET_URL}/chat`, {
    auth: { token },
    transports: ["websocket"],
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 10000,
    reconnectionAttempts: Infinity,
  });

  sharedSocket.on("connect", () => {
    rejoinSubscribedThreads();
  });

  sharedToken = token;
  listenersAttached = false;

  return sharedSocket;
};

interface UseChatSocketResult {
  isConnected: boolean;
  joinThread: (threadId: string) => void;
  leaveThread: (threadId: string) => void;
  sendTypingStart: (threadId: string) => void;
  sendTypingStop: (threadId: string) => void;
  broadcastNewMessage: (threadId: string, message: Message) => void;
  broadcastRead: (threadId: string, lastReadMessageId?: string) => void;
  broadcastDeleted: (threadId: string, messageId: string) => void;
}

export const useChatSocket = (token: string | null): UseChatSocketResult => {
  const currentUserIdRef = useRef<string>(resolveCurrentUserId());

  currentUserIdRef.current = resolveCurrentUserId();

  useEffect(() => {
    if (!token) {
      return;
    }

    activeConsumers += 1;

    const socket = ensureSocket(token);
    attachSocketListeners(currentUserIdRef);

    const handleConnectError = (error: Error) => {
      console.error("[chat socket] connect error:", error.message);
    };

    socket.on("connect_error", handleConnectError);

    return () => {
      socket.off("connect_error", handleConnectError);
      activeConsumers = Math.max(0, activeConsumers - 1);

      if (activeConsumers === 0 && sharedSocket) {
        detachSocketListeners();
        sharedSocket.disconnect();
        sharedSocket = null;
        sharedToken = null;
        subscribedThreadIds.clear();
      }
    };
  }, [token]);

  const joinThread = useCallback((threadId: string) => {
    if (!threadId) return;
    const currentCount = subscribedThreadIds.get(threadId) ?? 0;
    subscribedThreadIds.set(threadId, currentCount + 1);
    if (currentCount > 0) return;
    emitJoinThread(threadId);
  }, []);

  const leaveThread = useCallback((threadId: string) => {
    if (!threadId) return;
    const currentCount = subscribedThreadIds.get(threadId) ?? 0;
    if (currentCount > 1) {
      subscribedThreadIds.set(threadId, currentCount - 1);
      return;
    }

    subscribedThreadIds.delete(threadId);
    emitLeaveThread(threadId);
  }, []);

  const sendTypingStart = useCallback((threadId: string) => {
    sharedSocket?.emit("typing-start", { threadId });
  }, []);

  const sendTypingStop = useCallback((threadId: string) => {
    sharedSocket?.emit("typing-stop", { threadId });
  }, []);

  const broadcastNewMessage = useCallback((threadId: string, message: Message) => {
    sharedSocket?.emit("new-message", { threadId, message });
  }, []);

  const broadcastRead = useCallback((threadId: string, lastReadMessageId?: string) => {
    sharedSocket?.emit("messages-read", { threadId, lastReadMessageId });
  }, []);

  const broadcastDeleted = useCallback((threadId: string, messageId: string) => {
    sharedSocket?.emit("message-deleted", { threadId, messageId });
  }, []);

  return {
    isConnected: Boolean(sharedSocket?.connected),
    joinThread,
    leaveThread,
    sendTypingStart,
    sendTypingStop,
    broadcastNewMessage,
    broadcastRead,
    broadcastDeleted,
  };
};

export default useChatSocket;
