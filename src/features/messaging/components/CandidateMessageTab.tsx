import { useEffect, useState } from "react";
import { AlertTriangle } from "lucide-react";
import ChatWindow from "@/features/messaging/components/ChatWindow";
import useThreads from "@/features/messaging/hooks/useThreads";
import "@/features/messaging/styles/messaging.css";

interface CandidateMessageTabProps {
  candidateId: string;
  applicationId?: string;
  onThreadReady?: (threadId: string) => void;
}

export function CandidateMessageTab({
  candidateId,
  applicationId,
  onThreadReady,
}: CandidateMessageTabProps) {
  const [threadId, setThreadId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { ensureThread, openThread } = useThreads({ autoLoad: false });

  useEffect(() => {
    if (!candidateId) {
      setError("Không xác định được ứng viên để tạo cuộc trò chuyện.");
      setLoading(false);
      return;
    }

    let mounted = true;

    setLoading(true);
    setError(null);

    ensureThread({
      candidateId,
      applicationId,
    })
      .then((thread) => {
        if (!mounted) {
          return;
        }

        setThreadId(thread.threadId);
        openThread(thread.threadId);
        onThreadReady?.(thread.threadId);
      })
      .catch((reason: unknown) => {
        if (!mounted) {
          return;
        }

        const message =
          reason instanceof Error && reason.message
            ? reason.message
            : "Không thể tạo cuộc trò chuyện.";

        setError(message);
      })
      .finally(() => {
        if (mounted) {
          setLoading(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, [applicationId, candidateId, ensureThread, onThreadReady, openThread]);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <div className="w-full max-w-xl space-y-4">
          <div className="messaging-pulse h-10 w-1/2 rounded-xl bg-gray-100 dark:bg-gray-800" />
          <div className="messaging-pulse h-28 w-full rounded-2xl bg-gray-100 dark:bg-gray-800" />
          <div className="messaging-pulse h-28 w-4/5 rounded-2xl bg-gray-100 dark:bg-gray-800" />
        </div>
      </div>
    );
  }

  if (error || !threadId) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-300">
          <AlertTriangle className="h-5 w-5" />
        </div>
        <p className="text-sm font-semibold text-gray-900 dark:text-white/90">
          Không thể mở cuộc trò chuyện
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {error ?? "Vui lòng thử lại sau."}
        </p>
      </div>
    );
  }

  return (
    <div className="messaging-page-enter flex h-full min-h-0 flex-col">
      <div className="min-h-0 flex-1">
        <ChatWindow threadId={threadId} compact />
      </div>
    </div>
  );
}

export default CandidateMessageTab;
