import { useEffect, useRef, useState } from "react";
import type { Interview } from "@/types/interview";
import { useNavigate } from "react-router";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, MapPin, Monitor, MoreVertical, ExternalLink } from "lucide-react";
import { canAddInterviewFeedback, canCompleteByStatus } from "./interviewCompletionRules";
import {
  buildInterviewRoomPath,
  canAccessInterviewRoomFromInterview,
  getInterviewRoomAccessLabel,
} from "@/lib/interviewRoomAccess";

interface InterviewCardProps {
  interview: Interview;
  onCancel?: (id: string) => void;
  onComplete?: (id: string) => void;
  onFeedback?: (interview: Interview) => void;
  onAcceptReschedule?: (id: string) => void;
  onRejectReschedule?: (id: string) => void;
  onClick?: (interview: Interview) => void;
}

const STATUS_STYLES: Record<string, string> = {
  SCHEDULED: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  CONFIRMED: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  PENDING_RESCHEDULE: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  IN_PROGRESS: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  COMPLETED: "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300",
  CANCELLED: "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400",
  NO_SHOW: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
};

const STATUS_LABELS: Record<string, string> = {
  SCHEDULED: "Đã lên lịch",
  CONFIRMED: "Đã xác nhận",
  PENDING_RESCHEDULE: "Chờ xác nhận lại",
  IN_PROGRESS: "Đang diễn ra",
  COMPLETED: "Hoàn thành",
  CANCELLED: "Đã hủy",
  NO_SHOW: "Vắng mặt",
};

export default function InterviewCard({
  interview,
  onCancel,
  onComplete,
  onFeedback,
  onAcceptReschedule,
  onRejectReschedule,
  onClick,
}: InterviewCardProps) {
  const scheduledDate = new Date(interview.scheduledAt);
  const endDate = new Date(interview.endAt);
  const canCancel = ["SCHEDULED", "CONFIRMED", "PENDING_RESCHEDULE", "IN_PROGRESS"].includes(interview.interviewStatus);
  const canComplete = canCompleteByStatus(interview.interviewStatus);
  const canAddFeedback = canAddInterviewFeedback(interview);
  const canJoinRoom = canAccessInterviewRoomFromInterview(interview);
  const showJoinRoomButton = interview.type === "ONLINE" && Boolean(interview.meetingLink);
  const navigate = useNavigate();
  const [isActionMenuOpen, setIsActionMenuOpen] = useState(false);
  const actionMenuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isActionMenuOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (!actionMenuRef.current) return;
      const target = event.target as Node;
      if (!actionMenuRef.current.contains(target)) {
        setIsActionMenuOpen(false);
      }
    };

    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsActionMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEsc);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEsc);
    };
  }, [isActionMenuOpen]);

  return (
    <div
      className="rounded-xl border border-gray-200 bg-white p-3 shadow-sm transition-shadow hover:shadow-md md:p-4 dark:border-gray-700 dark:bg-gray-800 cursor-pointer"
      onClick={() => onClick?.(interview)}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="truncate text-sm font-semibold text-gray-900 dark:text-white md:text-base">
              {interview.candidateName}
            </h3>
            <Badge className={STATUS_STYLES[interview.interviewStatus] ?? ""} variant="secondary">
              {STATUS_LABELS[interview.interviewStatus] ?? interview.interviewStatus}
            </Badge>
          </div>
          <p className="truncate text-xs text-gray-500 dark:text-gray-400 md:text-sm">
            {interview.jobTitle}
          </p>
        </div>

        {(canCancel || canComplete || canAddFeedback) && (
          <div
            ref={actionMenuRef}
            className="relative"
            onClick={(e) => e.stopPropagation()}
          >
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              aria-haspopup="menu"
              aria-expanded={isActionMenuOpen ? "true" : "false"}
              aria-label="Mở menu thao tác phỏng vấn"
              onClick={() => setIsActionMenuOpen((value) => !value)}
            >
              <MoreVertical className="h-4 w-4" />
            </Button>

            {isActionMenuOpen && (
              <div
                role="menu"
                className="absolute right-0 top-9 z-30 min-w-[170px] overflow-hidden rounded-lg border border-gray-200 bg-white py-1 shadow-lg dark:border-gray-700 dark:bg-gray-900"
              >
                {(canComplete || canCancel) && (
                  <>
                    {canComplete && (
                      <button
                        type="button"
                        role="menuitem"
                        className="block w-full px-3 py-2 text-left text-sm text-gray-700 transition-colors hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800"
                        onClick={() => {
                          setIsActionMenuOpen(false);
                          onComplete?.(interview.id);
                        }}
                      >
                        Hoàn thành
                      </button>
                    )}
                    {canCancel && (
                      <button
                        type="button"
                        role="menuitem"
                        className="block w-full px-3 py-2 text-left text-sm text-red-600 transition-colors hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/40"
                        onClick={() => {
                          setIsActionMenuOpen(false);
                          onCancel?.(interview.id);
                        }}
                      >
                        Hủy phỏng vấn
                      </button>
                    )}
                  </>
                )}

                {canAddFeedback && (
                  <button
                    type="button"
                    role="menuitem"
                    className="block w-full px-3 py-2 text-left text-sm text-gray-700 transition-colors hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800"
                    onClick={() => {
                      setIsActionMenuOpen(false);
                      onFeedback?.(interview);
                    }}
                  >
                    Đánh giá
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="mt-2.5 flex flex-wrap items-center gap-3 text-xs text-gray-500 dark:text-gray-400 md:mt-3 md:text-sm">
        <span className="flex items-center gap-1">
          <Calendar className="h-3.5 w-3.5" />
          {scheduledDate.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" })}
        </span>
        <span className="flex items-center gap-1">
          <Clock className="h-3.5 w-3.5" />
          {scheduledDate.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}
          {" - "}
          {endDate.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}
        </span>
        <span className="flex items-center gap-1">
          {interview.type === "ONLINE" ? (
            <>
              <Monitor className="h-3.5 w-3.5" />
              Online
            </>
          ) : (
            <>
              <MapPin className="h-3.5 w-3.5" />
              {interview.location ?? "Offline"}
            </>
          )}
        </span>
      </div>

      {interview.interviewers && interview.interviewers.length > 0 && (
        <div className="mt-2 text-xs text-gray-400 dark:text-gray-500">
          Phỏng vấn viên: {interview.interviewers.map((i) => i.name).join(", ")}
        </div>
      )}

      {interview.type === "ONLINE" && interview.meetingLink && showJoinRoomButton && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            if (!canJoinRoom) return;
            navigate(buildInterviewRoomPath(interview.meetingLink));
          }}
          disabled={!canJoinRoom}
          className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 transition-colors disabled:cursor-not-allowed disabled:opacity-50"
        >
          <ExternalLink className="h-3.5 w-3.5" />
          {canJoinRoom
            ? getInterviewRoomAccessLabel(interview)
            : "Đã quá giờ phỏng vấn"}
        </button>
      )}

      {interview.interviewStatus === "PENDING_RESCHEDULE" && (
        <div className="mt-3 flex items-center gap-2">
          <Button
            type="button"
            size="sm"
            className="h-8 bg-emerald-600 text-white hover:bg-emerald-700"
            onClick={(e) => {
              e.stopPropagation();
              onAcceptReschedule?.(interview.id);
            }}
          >
            Chấp nhận lịch mới
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="h-8 border-red-300 text-red-600 hover:bg-red-50"
            onClick={(e) => {
              e.stopPropagation();
              onRejectReschedule?.(interview.id);
            }}
          >
            Từ chối
          </Button>
        </div>
      )}
    </div>
  );
}
