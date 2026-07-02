import { useCallback, useMemo, useState } from "react";
import { Circle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import CandidateMessageTab from "@/features/messaging/components/CandidateMessageTab";
import { useMessagingStore } from "@/features/messaging/store/messagingStore";
import type { Candidate } from "@/types/candidate";

type MessagesTabProps = {
  candidate: Candidate;
  onMessageSent?: () => void | Promise<void>;
};

export function MessagesTab({ candidate, onMessageSent }: MessagesTabProps) {
  const [threadId, setThreadId] = useState<string | null>(null);

  const thread = useMessagingStore(
    useCallback(
      (state) =>
        threadId
          ? state.threads.find((item) => item.threadId === threadId) ?? null
          : null,
      [threadId]
    )
  );

  const statusLabel = useMemo(() => {
    if (!candidate.status) {
      return "Chưa cập nhật";
    }

    const normalized = candidate.status.toLowerCase();
    if (normalized === "screening") return "Đang sàng lọc";
    if (normalized === "contacted") return "Đã liên hệ";
    if (normalized === "interview") return "Phỏng vấn";
    if (normalized === "offer") return "Đã gửi offer";
    if (normalized === "hired") return "Đã tuyển";
    if (normalized === "rejected") return "Đã từ chối";

    return candidate.status;
  }, [candidate.status]);

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden bg-white">
      <div className="flex items-center justify-between gap-3 border-b border-gray-200 px-4 py-3 dark:border-gray-800">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-gray-900 dark:text-white">
            {candidate.name}
          </p>
          <p className="truncate text-xs text-gray-500 dark:text-gray-400">
            {candidate.position}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge
            className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-200"
            variant="secondary"
          >
            {statusLabel}
          </Badge>
          <span className="inline-flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
            <Circle
              className={`h-2.5 w-2.5 fill-current ${thread?.isOnline ? "text-emerald-500" : "text-gray-300"}`}
            />
            {thread?.isOnline ? "Đang hoạt động" : "Ngoại tuyến"}
          </span>
        </div>
      </div>

      <CandidateMessageTab
        candidateId={candidate.candidateId}
        applicationId={candidate.id}
        onThreadReady={setThreadId}
        onMessageSent={onMessageSent}
      />
    </div>
  );
}
