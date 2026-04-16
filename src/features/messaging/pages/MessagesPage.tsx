import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router";
import PageMeta from "@/components/common/PageMeta";
import ChatWindow from "@/features/messaging/components/ChatWindow";
import EmptyChat from "@/features/messaging/components/EmptyChat";
import InboxSidebar from "@/features/messaging/components/InboxSidebar";
import useThreads from "@/features/messaging/hooks/useThreads";
import "@/features/messaging/styles/messaging.css";

type InboxTab = "all" | "archived";

export function MessagesPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const queryThreadId = searchParams.get("thread");
  const [activeTab, setActiveTab] = useState<InboxTab>("all");

  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(
    queryThreadId
  );

  const { openThread, totalUnread } = useThreads({ autoLoad: true, archived: false });

  useEffect(() => {
    setSelectedThreadId(queryThreadId);
    openThread(queryThreadId);
  }, [openThread, queryThreadId]);

  const applyQueryThread = useCallback(
    (threadId: string | null) => {
      const nextParams = new URLSearchParams(searchParams);

      if (threadId) {
        nextParams.set("thread", threadId);
      } else {
        nextParams.delete("thread");
      }

      setSearchParams(nextParams, { replace: true });
    },
    [searchParams, setSearchParams]
  );

  const handleSelectThread = useCallback(
    (threadId: string | null) => {
      setSelectedThreadId(threadId);
      openThread(threadId);
      applyQueryThread(threadId);
    },
    [applyQueryThread, openThread]
  );

  const handleBackMobile = useCallback(() => {
    setSelectedThreadId(null);
    openThread(null);
    applyQueryThread(null);
  }, [applyQueryThread, openThread]);

  const sidebarVisibleClass = useMemo(
    () => (selectedThreadId ? "hidden md:flex" : "flex"),
    [selectedThreadId]
  );

  const chatVisibleClass = useMemo(
    () => (selectedThreadId ? "flex" : "hidden md:flex"),
    [selectedThreadId]
  );

  return (
    <>
      <PageMeta title="Inbox - CareerGraph HR" description="Quản lý hội thoại tuyển dụng" />

      <div className="messaging-page-enter flex h-full min-h-0 w-full overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <div className={`${sidebarVisibleClass} w-full md:w-65 xl:w-80`}>
          <InboxSidebar
            view={activeTab}
            onViewChange={(next: InboxTab) => {
              setActiveTab(next);
              handleSelectThread(null);
            }}
            archived={activeTab === "archived"}
            selectedThreadId={selectedThreadId}
            onSelectThread={handleSelectThread}
            totalUnread={totalUnread}
            className="w-full"
          />
        </div>

        <div className={`${chatVisibleClass} min-w-0 flex-1`}>
          {selectedThreadId ? (
            <ChatWindow threadId={selectedThreadId} onBackMobile={handleBackMobile} />
          ) : (
            <EmptyChat />
          )}
        </div>
      </div>
    </>
  );
}

export default MessagesPage;
