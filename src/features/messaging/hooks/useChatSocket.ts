import { useEffect, useRef, type MutableRefObject } from "react";
import { jwtDecode } from "jwt-decode";
import { io, type Socket } from "socket.io-client";
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

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const toStringSafe = (value: unknown, fallback = ""): string =>
  typeof value === "string" ? value : fallback;

const toBooleanSafe = (value: unknown, fallback = false): boolean =>
  typeof value === "boolean" ? value : fallback;

const normalizeUser = (payload: unknown): UserSummary => {
  const source = isRecord(payload) ? payload : {};

  return {
    id: toStringSafe(source.id, toStringSafe(source.userId)),
    firstName: toStringSafe(source.firstName),
    lastName: toStringSafe(source.lastName),
    email: toStringSafe(source.email),
    avatarUrl: toStringSafe(source.avatarUrl) || undefined,
  };
};

const normalizeMessage = (payload: unknown, threadId: string): Message => {
  const source = isRecord(payload) ? payload : {};

  return {
    id: toStringSafe(source.id),
    threadId: toStringSafe(source.threadId, threadId),
    sender: normalizeUser(source.sender),
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
    createdAt: toStringSafe(source.createdAt, new Date().toISOString()),
    isRead: toBooleanSafe(source.isRead),
    readAt: toStringSafe(source.readAt) || undefined,
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
    const displayName = toStringSafe(payload.displayName);

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

    const userId = toStringSafe(payload.userId);
    if (!userId) return;

    setUserOnline(userId, true);
  });

  sharedSocket.on("user-offline", (payload: unknown) => {
    if (!isRecord(payload)) return;

    const userId = toStringSafe(payload.userId);
    if (!userId) return;

    setUserOnline(userId, false);
  });

  sharedSocket.on("thread-online-users", (payload: unknown) => {
    if (!isRecord(payload)) return;

    const threadId = toStringSafe(payload.threadId);
    const onlineUsers = Array.isArray(payload.onlineUsers)
      ? payload.onlineUsers.filter((userId): userId is string => typeof userId === "string")
      : [];

    if (!threadId) return;

    applyThreadOnlineUsers(threadId, onlineUsers);
  });

  sharedSocket.on("messages-read", (payload: unknown) => {
    if (!isRecord(payload)) return;

    const userId = toStringSafe(payload.userId);
    if (!userId || userId === currentUserIdRef.current) return;

    const event: ThreadMessagesReadEvent = {
      threadId: toStringSafe(payload.threadId),
      userId,
      lastReadMessageId: toStringSafe(payload.lastReadMessageId) || undefined,
      readAt: toStringSafe(payload.readAt, new Date().toISOString()),
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
      deletedAt: toStringSafe(payload.deletedAt, new Date().toISOString()),
    });
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

  listenersAttached = false;
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
    reconnectionAttempts: 5,
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
      }
    };
  }, [token]);

  const joinThread = (threadId: string) => {
    sharedSocket?.emit("join-thread", threadId);
  };

  const leaveThread = (threadId: string) => {
    sharedSocket?.emit("leave-thread", threadId);
  };

  const sendTypingStart = (threadId: string) => {
    sharedSocket?.emit("typing-start", { threadId });
  };

  const sendTypingStop = (threadId: string) => {
    sharedSocket?.emit("typing-stop", { threadId });
  };

  const broadcastNewMessage = (threadId: string, message: Message) => {
    sharedSocket?.emit("new-message", { threadId, message });
  };

  const broadcastRead = (threadId: string, lastReadMessageId?: string) => {
    sharedSocket?.emit("messages-read", { threadId, lastReadMessageId });
  };

  const broadcastDeleted = (threadId: string, messageId: string) => {
    sharedSocket?.emit("message-deleted", { threadId, messageId });
  };

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
