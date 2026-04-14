import { useCallback, useEffect, useRef } from "react";
import messagingApi from "@/features/messaging/api/messagingApi";
import { useMessagingStore } from "@/features/messaging/store/messagingStore";

const THREAD_PAGE_SIZE = 20;

const resolveErrorMessage = (error: unknown): string => {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return "Không thể tải danh sách hội thoại.";
};

interface UseThreadsOptions {
  autoLoad?: boolean;
}

export const useThreads = ({ autoLoad = true }: UseThreadsOptions = {}) => {
  const hasInitializedRef = useRef(false);

  const threads = useMessagingStore((state) => state.threads);
  const threadsLoading = useMessagingStore((state) => state.threadsLoading);
  const threadsError = useMessagingStore((state) => state.threadsError);
  const threadsPage = useMessagingStore((state) => state.threadsPage);
  const threadsHasMore = useMessagingStore((state) => state.threadsHasMore);
  const selectedThreadId = useMessagingStore((state) => state.selectedThreadId);
  const totalUnread = useMessagingStore((state) => state.totalUnread);

  const setSelectedThreadId = useMessagingStore(
    (state) => state.setSelectedThreadId
  );
  const setThreadsLoading = useMessagingStore((state) => state.setThreadsLoading);
  const setThreadsError = useMessagingStore((state) => state.setThreadsError);
  const setThreadsPage = useMessagingStore((state) => state.setThreadsPage);
  const setThreadsHasMore = useMessagingStore((state) => state.setThreadsHasMore);
  const replaceThreads = useMessagingStore((state) => state.replaceThreads);
  const appendThreads = useMessagingStore((state) => state.appendThreads);
  const upsertThreadSummary = useMessagingStore(
    (state) => state.upsertThreadSummary
  );
  const setTotalUnread = useMessagingStore((state) => state.setTotalUnread);

  const fetchThreads = useCallback(
    async (options?: { reset?: boolean }) => {
      const reset = Boolean(options?.reset);
      const page = reset ? 0 : threadsPage;

      if (!reset && (threadsLoading || !threadsHasMore)) {
        return;
      }

      setThreadsLoading(true);
      setThreadsError(null);

      try {
        const response = await messagingApi.getThreads(page, THREAD_PAGE_SIZE);

        if (reset) {
          replaceThreads(response.content);
        } else {
          appendThreads(response.content);
        }

        setThreadsPage(page + 1);
        setThreadsHasMore(!response.last && page + 1 < response.totalPages);
      } catch (error: unknown) {
        setThreadsError(resolveErrorMessage(error));
      } finally {
        setThreadsLoading(false);
      }
    },
    [
      appendThreads,
      replaceThreads,
      setThreadsError,
      setThreadsHasMore,
      setThreadsLoading,
      setThreadsPage,
      threadsHasMore,
      threadsLoading,
      threadsPage,
    ]
  );

  const refreshUnreadCount = useCallback(async () => {
    try {
      const count = await messagingApi.getUnreadCount();
      setTotalUnread(count);
    } catch {
      // Silent fallback: unread badge can be derived from thread list.
    }
  }, [setTotalUnread]);

  const refreshThreads = useCallback(async () => {
    await fetchThreads({ reset: true });
    await refreshUnreadCount();
  }, [fetchThreads, refreshUnreadCount]);

  const loadMoreThreads = useCallback(async () => {
    await fetchThreads({ reset: false });
  }, [fetchThreads]);

  const openThread = useCallback(
    (threadId: string | null) => {
      setSelectedThreadId(threadId);
      if (threadId) {
        useMessagingStore.getState().markThreadOpenedAsRead(threadId);
      }
    },
    [setSelectedThreadId]
  );

  const ensureThread = useCallback(
    async (params: { candidateId?: string; companyId?: string; applicationId?: string }) => {
      const thread = await messagingApi.getOrCreateThread(params);
      upsertThreadSummary(thread);
      return thread;
    },
    [upsertThreadSummary]
  );

  useEffect(() => {
    if (!autoLoad || hasInitializedRef.current) {
      return;
    }

    hasInitializedRef.current = true;

    void refreshThreads();
  }, [autoLoad, refreshThreads]);

  return {
    threads,
    threadsLoading,
    threadsError,
    threadsHasMore,
    selectedThreadId,
    totalUnread,
    fetchThreads,
    refreshThreads,
    loadMoreThreads,
    refreshUnreadCount,
    openThread,
    ensureThread,
  };
};

export default useThreads;
