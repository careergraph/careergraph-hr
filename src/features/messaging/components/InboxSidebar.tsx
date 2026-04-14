import { useMemo, useState } from "react";
import { MessageSquareMore, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import ThreadItem from "@/features/messaging/components/ThreadItem";
import useThreads from "@/features/messaging/hooks/useThreads";
import { cn } from "@/lib/utils";

interface InboxSidebarProps {
  selectedThreadId: string | null;
  onSelectThread: (threadId: string) => void;
  className?: string;
}

function ThreadSkeleton() {
  return (
    <div className="rounded-2xl border border-gray-100 bg-gray-50 px-3 py-3 dark:border-gray-800 dark:bg-gray-800/50">
      <div className="flex items-start gap-3">
        <div className="messaging-pulse h-11 w-11 rounded-full bg-gray-200 dark:bg-gray-700" />
        <div className="flex-1 space-y-2">
          <div className="messaging-pulse h-3 w-2/3 rounded bg-gray-200 dark:bg-gray-700" />
          <div className="messaging-pulse h-2.5 w-1/2 rounded bg-gray-200 dark:bg-gray-700" />
          <div className="messaging-pulse h-2.5 w-4/5 rounded bg-gray-200 dark:bg-gray-700" />
        </div>
      </div>
    </div>
  );
}

export function InboxSidebar({
  selectedThreadId,
  onSelectThread,
  className,
}: InboxSidebarProps) {
  const [keyword, setKeyword] = useState("");

  const {
    threads,
    threadsLoading,
    threadsError,
    threadsHasMore,
    totalUnread,
    loadMoreThreads,
    refreshThreads,
  } = useThreads({ autoLoad: true });

  const filteredThreads = useMemo(() => {
    const normalizedKeyword = keyword.trim().toLowerCase();

    if (!normalizedKeyword) {
      return threads;
    }

    return threads.filter((thread) => {
      const fullName = `${thread.otherUser.firstName} ${thread.otherUser.lastName}`
        .trim()
        .toLowerCase();

      const email = thread.otherUser.email.toLowerCase();
      const jobTitle = thread.application?.jobTitle?.toLowerCase() ?? "";
      const preview = thread.lastMessagePreview.toLowerCase();

      return (
        fullName.includes(normalizedKeyword) ||
        email.includes(normalizedKeyword) ||
        jobTitle.includes(normalizedKeyword) ||
        preview.includes(normalizedKeyword)
      );
    });
  }, [keyword, threads]);

  return (
    <aside
      className={cn(
        "flex h-full flex-col border-r border-gray-200 bg-white/95 dark:border-gray-800 dark:bg-gray-900/95",
        className
      )}
    >
      <div className="border-b border-gray-200 px-3 py-3 dark:border-gray-800 sm:px-4">
        <div className="mb-3 flex items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-semibold text-gray-900 dark:text-white/90">
              Hộp thư
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {totalUnread > 0
                ? `${totalUnread} tin chưa đọc`
                : "Không có tin nhắn chưa đọc"}
            </p>
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 rounded-lg px-2 text-xs"
            onClick={() => {
              void refreshThreads();
            }}
          >
            Làm mới
          </Button>
        </div>

        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
            placeholder="Tìm theo tên ứng viên, công việc..."
            className="h-10 rounded-xl border-gray-200 bg-gray-50 pl-9 text-sm dark:border-gray-700 dark:bg-gray-800"
          />
        </div>
      </div>

      <div className="custom-scrollbar flex-1 overflow-y-auto px-2 py-2 sm:px-3">
        {threadsLoading && threads.length === 0 ? (
          <div className="space-y-2 py-1">
            {Array.from({ length: 6 }).map((_, index) => (
              <ThreadSkeleton key={`thread-skeleton-${index}`} />
            ))}
          </div>
        ) : null}

        {!threadsLoading && threadsError ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 dark:border-red-400/40 dark:bg-red-500/10 dark:text-red-300">
            {threadsError}
          </div>
        ) : null}

        {!threadsLoading && !threadsError && filteredThreads.length === 0 ? (
          <div className="mt-6 flex flex-col items-center rounded-2xl border border-dashed border-gray-300 px-4 py-8 text-center dark:border-gray-700">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-300">
              <MessageSquareMore className="h-6 w-6" />
            </div>
            <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">
              Chưa có cuộc hội thoại
            </p>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Khi bạn nhắn tin với ứng viên, hội thoại sẽ xuất hiện tại đây.
            </p>
          </div>
        ) : null}

        <div className="space-y-1">
          {filteredThreads.map((thread) => (
            <ThreadItem
              key={thread.threadId}
              thread={thread}
              isSelected={selectedThreadId === thread.threadId}
              onClick={() => onSelectThread(thread.threadId)}
            />
          ))}
        </div>
      </div>

      {threadsHasMore ? (
        <div className="border-t border-gray-200 p-3 dark:border-gray-800">
          <Button
            type="button"
            variant="outline"
            className="w-full rounded-xl"
            disabled={threadsLoading}
            onClick={() => {
              void loadMoreThreads();
            }}
          >
            {threadsLoading ? "Đang tải..." : "Xem thêm hội thoại"}
          </Button>
        </div>
      ) : null}
    </aside>
  );
}

export default InboxSidebar;
