import type { Interview } from "@/types/interview";
import { useNavigate } from "react-router";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, MapPin, Monitor, MoreVertical, ExternalLink } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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
  const isActive = ["SCHEDULED", "CONFIRMED", "PENDING_RESCHEDULE"].includes(interview.interviewStatus);
  const isCompleted = interview.interviewStatus === "COMPLETED";
  const navigate = useNavigate();

  return (
    <div
      className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md dark:border-gray-700 dark:bg-gray-800 cursor-pointer"
      onClick={() => onClick?.(interview)}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white truncate">
              {interview.candidateName}
            </h3>
            <Badge className={STATUS_STYLES[interview.interviewStatus] ?? ""} variant="secondary">
              {STATUS_LABELS[interview.interviewStatus] ?? interview.interviewStatus}
            </Badge>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
            {interview.jobTitle}
          </p>
        </div>

        {(isActive || isCompleted) && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {isActive && (
                <>
                  <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onComplete?.(interview.id); }}>
                    Hoàn thành
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="text-red-600"
                    onClick={(e) => { e.stopPropagation(); onCancel?.(interview.id); }}
                  >
                    Hủy phỏng vấn
                  </DropdownMenuItem>
                </>
              )}
              {isCompleted && (
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onFeedback?.(interview); }}>
                  Đánh giá
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
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

      {interview.type === "ONLINE" && interview.meetingLink && isActive && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/interview/room/${interview.meetingLink}`);
          }}
          className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 transition-colors"
        >
          <ExternalLink className="h-3.5 w-3.5" /> Tham gia phỏng vấn
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
