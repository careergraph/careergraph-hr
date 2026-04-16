import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";
import { ArrowLeft, Circle, ShieldAlert } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import messagingApi from "@/features/messaging/api/messagingApi";
import JobContextSelector from "@/features/messaging/components/JobContextSelector";
import JobDivider from "@/features/messaging/components/JobDivider";
import JobFilterBar from "@/features/messaging/components/JobFilterBar";
import MessageBubble from "@/features/messaging/components/MessageBubble";
import MessageInput from "@/features/messaging/components/MessageInput";
import TypingIndicator from "@/features/messaging/components/TypingIndicator";
import EmptyChat from "@/features/messaging/components/EmptyChat";
import useChatSocket from "@/features/messaging/hooks/useChatSocket";
import useMessages from "@/features/messaging/hooks/useMessages";
import { useMessagingStore } from "@/features/messaging/store/messagingStore";
import type { Message, ThreadJob, ThreadSummary } from "@/features/messaging/types/messaging.types";
import { useAuthStore } from "@/stores/authStore";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface ChatWindowProps {
  threadId: string;
  compact?: boolean;
  onBackMobile?: () => void;
}

const FIVE_MINUTES = 5 * 60 * 1000;
const EMPTY_TYPING_USERS: { userId: string; threadId: string; displayName: string }[] = [];

const normalize = (value: string | null | undefined): string =>
  (value ?? "").trim().toLowerCase();

const isOwnMessage = (message: Message, currentUser: { id: string; email: string }): boolean => {
  const senderId = normalize(message.sender.id);
  const currentUserId = normalize(currentUser.id);

  if (senderId && currentUserId && senderId === currentUserId) {
    return true;
  }

  const senderEmail = normalize(message.sender.email);
  const currentUserEmail = normalize(currentUser.email);

  return Boolean(senderEmail && currentUserEmail && senderEmail === currentUserEmail);
};

const resolveDisplayName = (thread: ThreadSummary | null): string => {
  if (!thread) {
    return "Ứng viên";
  }

  const fullName = `${thread.otherUser.firstName ?? ""} ${thread.otherUser.lastName ?? ""}`.trim();
  if (fullName) {
    return fullName;
  }

  return "Ứng viên";
};

const resolveTypingDisplayName = (typingName: string, thread: ThreadSummary | null): string => {
  const normalized = typingName.trim();
  if (normalized && !normalized.includes("@")) {
    return normalized;
  }

  return resolveDisplayName(thread);
};

const firstLetter = (value: string): string => {
  const char = value.trim().charAt(0);
  return char ? char.toUpperCase() : "U";
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

interface MessageGroup {
  jobId: string | null;
  jobTitle: string | null;
  firstDate: string;
  messages: Message[];
}

const groupMessagesByJob = (messages: Message[]): MessageGroup[] => {
  const groups: MessageGroup[] = [];

  for (const message of messages) {
    const jobId = message.jobContext?.jobId ?? null;
    const jobTitle = message.jobContext?.jobTitle ?? null;
    const currentGroup = groups[groups.length - 1];

    if (!currentGroup || currentGroup.jobId !== jobId) {
      groups.push({
        jobId,
        jobTitle,
        firstDate: message.createdAt,
        messages: [message],
      });
      continue;
    }

    currentGroup.messages.push(message);
  }

  return groups;
};

const toRelativeDate = (dateString: string): string => {
  const parsed = new Date(dateString);
  if (Number.isNaN(parsed.getTime())) {
    return "";
  }

  return formatDistanceToNow(parsed, { addSuffix: true, locale: vi });
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
  const [threadJobs, setThreadJobs] = useState<ThreadJob[]>([]);
  const [composeJobId, setComposeJobId] = useState<string | null>(null);
  const [activeFilterJobId, setActiveFilterJobId] = useState<string | null>(null);

  const thread = useMessagingStore(
    useCallback(
      (state) => state.threads.find((item) => item.threadId === threadId) ?? null,
      [threadId]
    )
  );

  const typingUsers = useMessagingStore(
    useCallback(
      (state) => state.typingUsers[threadId] ?? EMPTY_TYPING_USERS,
      [threadId]
    )
  );

  const clearThreadTyping = useMessagingStore((state) => state.clearThreadTyping);
  const patchThreadSummary = useMessagingStore((state) => state.patchThreadSummary);

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
  } = useMessages(threadId, activeFilterJobId);

  useEffect(() => {
    const fallbackJobs = thread?.jobs ?? [];

    let mounted = true;

    const loadThreadJobs = async () => {
      try {
        const jobs = await messagingApi.getThreadJobs(threadId);
        if (!mounted) {
          return;
        }

        const nextJobs = jobs.length > 0 ? jobs : fallbackJobs;
        setThreadJobs(nextJobs);
        setComposeJobId(thread?.primaryJob?.jobId ?? null);
      } catch {
        if (!mounted) {
          return;
        }

        setThreadJobs(fallbackJobs);
        setComposeJobId(thread?.primaryJob?.jobId ?? null);
      }
    };

    void loadThreadJobs();

    return () => {
      mounted = false;
    };
  }, [thread?.jobs, thread?.primaryJob?.jobId, threadId]);

  useEffect(() => {
    if (!activeFilterJobId) {
      return;
    }

    const exists = threadJobs.some((job) => job.jobId === activeFilterJobId);
    if (!exists) {
      setActiveFilterJobId(null);
    }
  }, [activeFilterJobId, threadJobs]);

  const peerTypingUsers = useMemo(
    () =>
      typingUsers
        .filter((user) => user.userId !== currentUser.id)
        .map((user) => ({
          ...user,
          displayName: resolveTypingDisplayName(user.displayName, thread),
        })),
    [currentUser.id, thread, typingUsers]
  );

  const lastOwnMessageId = useMemo(() => {
    for (let index = messages.length - 1; index >= 0; index -= 1) {
      if (isOwnMessage(messages[index], currentUser)) {
        return messages[index].id;
      }
    }

    return null;
  }, [currentUser, messages]);

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
    const isIncoming = !isOwnMessage(lastMessage, currentUser);

    if (!isIncoming) {
      return;
    }

    if (lastReadBroadcastRef.current === lastMessage.id) {
      return;
    }

    await markThreadAsRead();
    broadcastRead(threadId, lastMessage.id);
    lastReadBroadcastRef.current = lastMessage.id;
  }, [broadcastRead, currentUser, markThreadAsRead, messages, threadId]);

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

    return () => {
      leaveThread(threadId);
      sendTypingStop(threadId);
      clearThreadTyping(threadId);
    };
  }, [clearThreadTyping, joinThread, leaveThread, sendTypingStop, threadId]);

  useEffect(() => {
    previousMessageCountRef.current = 0;
    lastReadBroadcastRef.current = null;

    void loadLatestMessages().then(() => {
      requestAnimationFrame(() => {
        scrollToBottom();
      });
    });
  }, [loadLatestMessages, scrollToBottom, threadId]);

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

    if (nearBottom || isOwnMessage(latest, currentUser)) {
      requestAnimationFrame(() => {
        scrollToBottom("smooth");
      });
      setShowNewMessageBanner(false);
    } else {
      setShowNewMessageBanner(true);
    }

    previousMessageCountRef.current = currentCount;
  }, [currentUser, isMessagesLoading, messages, scrollToBottom]);

  useEffect(() => {
    void markAsReadIfNeeded();
  }, [markAsReadIfNeeded]);

  const handleSendMessage = useCallback(
    async (content: string): Promise<boolean> => {
      const result = await sendMessage(content, "TEXT", composeJobId);

      if (result.ok && result.message) {
        broadcastNewMessage(threadId, result.message);
      }

      return result.ok;
    },
    [broadcastNewMessage, composeJobId, sendMessage, threadId]
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

  const handleUnblock = useCallback(async () => {
    if (!thread?.isBlocked) {
      return;
    }

    try {
      await messagingApi.unblockUser(thread.otherUser.id);
      patchThreadSummary(thread.threadId, { isBlocked: false });
      toast.success("Đã bỏ chặn ứng viên. Bạn có thể tiếp tục nhắn tin.");
      await loadLatestMessages();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Không thể bỏ chặn ứng viên.";
      toast.error(message);
    }
  }, [loadLatestMessages, patchThreadSummary, thread]);

  const displayName = resolveDisplayName(thread);

  const avatarFallback = firstLetter(displayName);

  const groupedMessages = useMemo(() => groupMessagesByJob(messages), [messages]);
  const selectedComposeJob = useMemo(
    () => threadJobs.find((job) => job.jobId === composeJobId) ?? null,
    [composeJobId, threadJobs]
  );


  return (
    <section className="flex h-full min-h-0 flex-1 flex-col overflow-hidden bg-white dark:bg-gray-900">
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
                  ? avatarFallback
                  : "U"}
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

      <JobFilterBar
        jobs={threadJobs}
        activeFilter={activeFilterJobId}
        onFilter={setActiveFilterJobId}
      />

      <div className="relative flex min-h-0 flex-1 flex-col">
        {thread?.isBlocked ? (
          <div className="mx-3 mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-200 sm:mx-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="inline-flex items-center gap-2 font-medium">
                <ShieldAlert className="h-4 w-4" />
                Bạn đã chặn ứng viên này. Họ không thể gửi tin nhắn cho bạn.
              </p>
              <Button type="button" variant="outline" size="sm" onClick={() => {
                void handleUnblock();
              }}>
                Bỏ chặn
              </Button>
            </div>
          </div>
        ) : null}

        <div
          ref={viewportRef}
          className="custom-scrollbar flex min-h-0 flex-1 scroll-smooth flex-col gap-3 overflow-y-auto overscroll-contain px-3 py-3 sm:px-4"
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


          {!isMessagesLoading && messages.length === 0 ? (
            <EmptyChat
              compact={compact}
              title="Bắt đầu cuộc trò chuyện"
              description="Hãy gửi lời chào đầu tiên để trao đổi với ứng viên này."
            />
          ) : null}

          {groupedMessages.map((group, groupIndex) => (
            <div key={`group-${group.jobId ?? "general"}-${groupIndex}`}>
              <JobDivider
                jobTitle={group.jobTitle}
                date={toRelativeDate(group.firstDate)}
              />

              {group.messages.map((message, index) => {
                const grouped = isGroupedWithPrevious(group.messages, index);
                const isOwn = isOwnMessage(message, currentUser);

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
            </div>
          ))}

        </div>

        <div className="pointer-events-none absolute bottom-16 left-3 right-3 z-20 sm:left-4 sm:right-4">
          {peerTypingUsers.length > 0 ? <TypingIndicator users={peerTypingUsers} /> : null}
        </div>

        {showNewMessageBanner ? (
          <div className="pointer-events-none absolute bottom-24 left-0 right-0 z-10 flex justify-center px-3">
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

        <JobContextSelector
          jobs={threadJobs}
          selectedJobId={composeJobId}
          onSelect={setComposeJobId}
        />

        <MessageInput
          onSend={handleSendMessage}
          onTypingStart={() => sendTypingStart(threadId)}
          onTypingStop={() => sendTypingStop(threadId)}
          disabled={Boolean(thread?.isBlocked)}
          placeholder={
            thread?.isBlocked
              ? "Bỏ chặn để tiếp tục nhắn tin"
              : selectedComposeJob
              ? `Nhắn về ${selectedComposeJob.jobTitle}...`
              : "Nhập tin nhắn..."
          }
          compact={compact}
        />
      </div>
    </section>
  );
}

export default ChatWindow;
