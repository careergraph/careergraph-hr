import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, Circle } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import MessageBubble from "@/features/messaging/components/MessageBubble";
import MessageInput from "@/features/messaging/components/MessageInput";
import TypingIndicator from "@/features/messaging/components/TypingIndicator";
import EmptyChat from "@/features/messaging/components/EmptyChat";
import useChatSocket from "@/features/messaging/hooks/useChatSocket";
import useMessages from "@/features/messaging/hooks/useMessages";
import { useMessagingStore } from "@/features/messaging/store/messagingStore";
import type { Message } from "@/features/messaging/types/messaging.types";
import { useAuthStore } from "@/stores/authStore";
import { cn } from "@/lib/utils";

interface ChatWindowProps {
  threadId: string;
  compact?: boolean;
  onBackMobile?: () => void;
}

const FIVE_MINUTES = 5 * 60 * 1000;

const getInitials = (firstName: string, lastName: string, email: string): string => {
  const fullName = `${firstName} ${lastName}`.trim();

  if (!fullName) {
    return email.slice(0, 2).toUpperCase();
  }

  return fullName
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
};

const isNearBottom = (element: HTMLDivElement): boolean => {
  const distance = element.scrollHeight - element.scrollTop - element.clientHeight;
  return distance < 120;
};

const isGroupedWithPrevious = (messages: Message[], index: number): boolean => {
  if (index <= 0) {
    return false;
  }

  const current = messages[index];
  const previous = messages[index - 1];

  if (current.sender.id !== previous.sender.id) {
    return false;
  }

  const currentTime = new Date(current.createdAt).getTime();
  const previousTime = new Date(previous.createdAt).getTime();

  if (Number.isNaN(currentTime) || Number.isNaN(previousTime)) {
    return false;
  }

  return currentTime - previousTime <= FIVE_MINUTES;
};

export function ChatWindow({
  threadId,
  compact = false,
  onBackMobile,
}: ChatWindowProps) {
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const previousMessageCountRef = useRef(0);
  const loadingOlderRef = useRef(false);
  const lastReadBroadcastRef = useRef<string | null>(null);

  const [showNewMessageBanner, setShowNewMessageBanner] = useState(false);

  const thread = useMessagingStore(
    useCallback(
      (state) => state.threads.find((item) => item.threadId === threadId) ?? null,
      [threadId]
    )
  );

  const typingUsers = useMessagingStore(
    useCallback((state) => state.typingUsers[threadId] ?? [], [threadId])
  );

  const clearThreadTyping = useMessagingStore((state) => state.clearThreadTyping);

  const { accessToken } = useAuthStore();
  const {
    joinThread,
    leaveThread,
    sendTypingStart,
    sendTypingStop,
    broadcastDeleted,
    broadcastNewMessage,
    broadcastRead,
  } = useChatSocket(accessToken);

  const {
    currentUser,
    messages,
    messagesError,
    hasMoreMessages,
    isMessagesLoading,
    isLoadingOlderMessages,
    loadLatestMessages,
    loadOlderMessages,
    sendMessage,
    retryMessage,
    deleteSentMessage,
    markThreadAsRead,
  } = useMessages(threadId);

  const peerTypingUsers = useMemo(
    () => typingUsers.filter((user) => user.userId !== currentUser.id),
    [currentUser.id, typingUsers]
  );

  const lastOwnMessageId = useMemo(() => {
    for (let index = messages.length - 1; index >= 0; index -= 1) {
      if (messages[index].sender.id === currentUser.id) {
        return messages[index].id;
      }
    }

    return null;
  }, [currentUser.id, messages]);

  const scrollToBottom = useCallback((behavior: ScrollBehavior = "auto") => {
    if (!viewportRef.current) {
      return;
    }

    viewportRef.current.scrollTo({
      top: viewportRef.current.scrollHeight,
      behavior,
    });
  }, []);

  const markAsReadIfNeeded = useCallback(async () => {
    if (!messages.length) {
      return;
    }

    const lastMessage = messages[messages.length - 1];
    const isIncoming = lastMessage.sender.id !== currentUser.id;

    if (!isIncoming) {
      return;
    }

    if (lastReadBroadcastRef.current === lastMessage.id) {
      return;
    }

    await markThreadAsRead();
    broadcastRead(threadId, lastMessage.id);
    lastReadBroadcastRef.current = lastMessage.id;
  }, [broadcastRead, currentUser.id, markThreadAsRead, messages, threadId]);

  const loadOlderMessagesWithPosition = useCallback(async () => {
    if (!viewportRef.current || loadingOlderRef.current || !hasMoreMessages) {
      return;
    }

    loadingOlderRef.current = true;

    const previousHeight = viewportRef.current.scrollHeight;
    const previousTop = viewportRef.current.scrollTop;

    const loaded = await loadOlderMessages();

    if (loaded) {
      requestAnimationFrame(() => {
        if (!viewportRef.current) {
          return;
        }

        const currentHeight = viewportRef.current.scrollHeight;
        viewportRef.current.scrollTop = currentHeight - previousHeight + previousTop;
      });
    }

    loadingOlderRef.current = false;
  }, [hasMoreMessages, loadOlderMessages]);

  useEffect(() => {
    joinThread(threadId);
    clearThreadTyping(threadId);

    void loadLatestMessages().then(() => {
      requestAnimationFrame(() => {
        scrollToBottom();
      });
      void markAsReadIfNeeded();
    });

    return () => {
      leaveThread(threadId);
      sendTypingStop(threadId);
      clearThreadTyping(threadId);
    };
  }, [
    clearThreadTyping,
    joinThread,
    leaveThread,
    loadLatestMessages,
    markAsReadIfNeeded,
    scrollToBottom,
    sendTypingStop,
    threadId,
  ]);

  useEffect(() => {
    if (isMessagesLoading) {
      return;
    }

    if (!viewportRef.current) {
      return;
    }

    const previousCount = previousMessageCountRef.current;
    const currentCount = messages.length;

    if (currentCount === 0) {
      previousMessageCountRef.current = 0;
      return;
    }

    const appended = currentCount > previousCount;

    if (!appended) {
      previousMessageCountRef.current = currentCount;
      return;
    }

    const latest = messages[currentCount - 1];
    const nearBottom = isNearBottom(viewportRef.current);

    if (nearBottom || latest.sender.id === currentUser.id) {
      requestAnimationFrame(() => {
        scrollToBottom("smooth");
      });
      setShowNewMessageBanner(false);
    } else {
      setShowNewMessageBanner(true);
    }

    previousMessageCountRef.current = currentCount;
  }, [currentUser.id, isMessagesLoading, messages, scrollToBottom]);

  useEffect(() => {
    void markAsReadIfNeeded();
  }, [markAsReadIfNeeded]);

  const handleSendMessage = useCallback(
    async (content: string): Promise<boolean> => {
      const result = await sendMessage(content, "TEXT");

      if (result.ok && result.message) {
        broadcastNewMessage(threadId, result.message);
      }

      return result.ok;
    },
    [broadcastNewMessage, sendMessage, threadId]
  );

  const handleRetryMessage = useCallback(
    async (messageId: string) => {
      const result = await retryMessage(messageId);

      if (result.ok && result.message) {
        broadcastNewMessage(threadId, result.message);
      }
    },
    [broadcastNewMessage, retryMessage, threadId]
  );

  const handleDeleteMessage = useCallback(
    async (messageId: string) => {
      const deleted = await deleteSentMessage(messageId);

      if (deleted) {
        broadcastDeleted(threadId, messageId);
      }
    },
    [broadcastDeleted, deleteSentMessage, threadId]
  );

  const displayName =
    `${thread?.otherUser.firstName ?? ""} ${thread?.otherUser.lastName ?? ""}`.trim() ||
    thread?.otherUser.email ||
    "Ứng viên";

  return (
    <section className="flex h-full min-h-0 flex-1 flex-col bg-white dark:bg-gray-900">
      {!compact ? (
        <header className="flex items-center justify-between gap-3 border-b border-gray-200 px-3 py-3 dark:border-gray-800 sm:px-4">
          <div className="flex items-center gap-3">
            {onBackMobile ? (
              <Button
                type="button"
                variant="outline"
                size="icon-sm"
                className="md:hidden"
                onClick={onBackMobile}
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
            ) : null}

            <Avatar className="h-10 w-10 border border-gray-200 dark:border-gray-700">
              {thread?.otherUser.avatarUrl ? (
                <AvatarImage src={thread.otherUser.avatarUrl} alt={displayName} />
              ) : null}
              <AvatarFallback className="text-xs font-semibold uppercase">
                {thread
                  ? getInitials(
                      thread.otherUser.firstName,
                      thread.otherUser.lastName,
                      thread.otherUser.email
                    )
                  : "NA"}
              </AvatarFallback>
            </Avatar>

            <div>
              <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                {displayName}
              </p>
              <p className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                <Circle
                  className={cn(
                    "h-2.5 w-2.5 fill-current",
                    thread?.isOnline ? "text-emerald-500" : "text-gray-300"
                  )}
                />
                {thread?.isOnline ? "Đang hoạt động" : "Ngoại tuyến"}
              </p>
            </div>
          </div>

          {thread?.application ? (
            <div className="hidden rounded-xl border border-gray-200 bg-gray-50 px-3 py-1 text-xs text-gray-600 md:block dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300">
              {thread.application.jobTitle}
            </div>
          ) : null}
        </header>
      ) : null}

      <div className="relative flex min-h-0 flex-1 flex-col">
        <div
          ref={viewportRef}
          className="custom-scrollbar flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-3 py-3 sm:px-4"
          onScroll={() => {
            if (!viewportRef.current) {
              return;
            }

            if (viewportRef.current.scrollTop < 80 && hasMoreMessages && !isLoadingOlderMessages) {
              void loadOlderMessagesWithPosition();
            }

            if (isNearBottom(viewportRef.current)) {
              setShowNewMessageBanner(false);
            }
          }}
        >
          {isMessagesLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 6 }).map((_, index) => (
                <div
                  key={`msg-skeleton-${index}`}
                  className="messaging-pulse h-12 w-3/4 rounded-2xl bg-gray-100 dark:bg-gray-800"
                />
              ))}
            </div>
          ) : null}

          {!isMessagesLoading && messages.length === 0 ? (
            <EmptyChat
              compact={compact}
              title="Bắt đầu cuộc trò chuyện"
              description="Hãy gửi lời chào đầu tiên để trao đổi với ứng viên này."
            />
          ) : null}

          {messages.map((message, index) => {
            const grouped = isGroupedWithPrevious(messages, index);
            const isOwn = message.sender.id === currentUser.id;

            return (
              <div
                key={message.id}
                className={cn(grouped ? "mt-1" : "mt-2")}
              >
                <MessageBubble
                  message={message}
                  isOwn={isOwn}
                  showAvatar={!grouped}
                  showReadReceipt={message.id === lastOwnMessageId}
                  otherUser={thread?.otherUser}
                  onDelete={handleDeleteMessage}
                  onRetry={(messageId) => {
                    void handleRetryMessage(messageId);
                  }}
                />
              </div>
            );
          })}

          {peerTypingUsers.length > 0 ? (
            <TypingIndicator users={peerTypingUsers} />
          ) : null}
        </div>

        {showNewMessageBanner ? (
          <div className="pointer-events-none absolute bottom-20 left-0 right-0 flex justify-center">
            <Button
              type="button"
              size="sm"
              className="pointer-events-auto rounded-full px-4 shadow-lg"
              onClick={() => {
                scrollToBottom("smooth");
                setShowNewMessageBanner(false);
              }}
            >
              Có tin nhắn mới
            </Button>
          </div>
        ) : null}

        {messagesError ? (
          <div className="border-t border-red-100 bg-red-50 px-4 py-2 text-xs text-red-600 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300">
            {messagesError}
          </div>
        ) : null}

        <MessageInput
          onSend={handleSendMessage}
          onTypingStart={() => sendTypingStart(threadId)}
          onTypingStop={() => sendTypingStop(threadId)}
          compact={compact}
        />
      </div>
    </section>
  );
}

export default ChatWindow;
