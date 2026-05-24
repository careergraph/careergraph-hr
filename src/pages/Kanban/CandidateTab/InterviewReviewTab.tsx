import type { Interview, InterviewFeedback, InterviewRecording } from "@/types/interview";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CalendarPlus, CalendarDays, Star, Video, MapPin, UserCheck, CircleAlert, Link as LinkIcon, PlayCircle } from "lucide-react";
import { formatDateTimeYMDHM } from "@/lib/dateUtils";
import { getFeedbackRecommendationLabel } from "@/pages/Interview/feedbackRecommendationOptions";
import type { Candidate } from "@/types/candidate";

interface InterviewReviewTabProps {
  candidate: Candidate;
  interviews: Interview[];
  loading?: boolean;
  error?: string | null;
  onScheduleInterview?: (candidate: Candidate) => void;
}

const getLatestFeedback = (feedback: InterviewFeedback[] | undefined) => {
  if (!Array.isArray(feedback) || feedback.length === 0) return null;
  return [...feedback].sort(
    (a, b) => new Date(b.createdDate).getTime() - new Date(a.createdDate).getTime()
  )[0];
};

const STATUS_META: Record<string, { label: string; cls: string }> = {
  SCHEDULED: { label: "Đã lên lịch", cls: "bg-blue-50 text-blue-700 border-blue-200" },
  CONFIRMED: { label: "Đã xác nhận", cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  IN_PROGRESS: { label: "Đang diễn ra", cls: "bg-amber-50 text-amber-700 border-amber-200" },
  COMPLETED: { label: "Hoàn thành", cls: "bg-slate-100 text-slate-700 border-slate-300" },
  CANCELLED: { label: "Đã hủy", cls: "bg-rose-50 text-rose-700 border-rose-200" },
  NO_SHOW: { label: "Vắng mặt", cls: "bg-orange-50 text-orange-700 border-orange-200" },
  PENDING_RESCHEDULE: { label: "Chờ đổi lịch", cls: "bg-purple-50 text-purple-700 border-purple-200" },
};

const RECORDING_STATUS_LABELS: Record<string, string> = {
  PENDING: "Đang chờ",
  AVAILABLE: "Sẵn sàng",
  PROCESSING: "Đang xử lý",
  DELETED: "Đã xóa",
};

const getRecordingUrl = (value?: string) => {
  if (!value) return "";
  const match = value.match(/https?:\/\/[^\s)]+/i);
  return match?.[0] || "";
};

const isPreviewableVideo = (url?: string, mimeType?: string) => {
  if (!url) return false;
  if (mimeType?.startsWith("video/")) return true;
  return /\.(mp4|webm|ogg|mov)(\?.*)?$/i.test(url);
};

const getInterviewRecordings = (interview: Interview): InterviewRecording[] => {
  if (Array.isArray(interview.recordings) && interview.recordings.length > 0) {
    return interview.recordings.filter((item) => item?.fileKey);
  }

  // Backward compatibility for old records that stored a URL in notes.
  const fallbackUrl = getRecordingUrl(interview.notes);
  return fallbackUrl
    ? [{ id: `fallback-${interview.id}`, interviewId: interview.id, fileKey: fallbackUrl }]
    : [];
};

export function InterviewReviewTab({ candidate, interviews, loading, error, onScheduleInterview }: InterviewReviewTabProps) {
  const hasValidActiveInterview = interviews.some((interview) => {
    const endTimeMs = interview.endAt ? new Date(interview.endAt).getTime() : new Date(interview.scheduledAt).getTime();
    return (
      ["SCHEDULED", "CONFIRMED", "PENDING_RESCHEDULE", "IN_PROGRESS"].includes(interview.interviewStatus) &&
      (!Number.isFinite(endTimeMs) || Date.now() <= endTimeMs)
    );
  });

  const scheduleAction = (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-slate-900">Lịch phỏng vấn</p>
          <p className="text-xs text-slate-500">
            Có thể lên lịch lại khi lịch hiện tại đã quá giờ, bị hủy, vắng mặt hoặc đã hoàn thành.
          </p>
        </div>
        <Button
          size="sm"
          className="h-9 bg-blue-600 hover:bg-blue-700"
          disabled={hasValidActiveInterview || !candidate.jobId}
          onClick={() => onScheduleInterview?.(candidate)}
          title={hasValidActiveInterview ? "Ứng viên đang có một lịch phỏng vấn hợp lệ" : undefined}
        >
          <CalendarPlus className="h-4 w-4" />
          Lên lịch phỏng vấn
        </Button>
      </div>

      {hasValidActiveInterview ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
          Ứng viên đang có lịch phỏng vấn hợp lệ ở hiện tại hoặc tương lai. Hãy hoàn tất, hủy hoặc chờ lịch quá hạn trước khi tạo lịch mới.
        </div>
      ) : null}

    </>
  );

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-sm text-red-500">{error}</div>
    );
  }

  if (!interviews.length) {
    return (
      <div className="h-full overflow-y-auto p-6 space-y-4">
        {scheduleAction}
        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-sm text-slate-500">
          Chưa có dữ liệu phỏng vấn.
        </div>
      </div>
    );
  }

  const sorted = [...interviews].sort((a, b) => {
    const aFb = getLatestFeedback(a.feedback || undefined);
    const bFb = getLatestFeedback(b.feedback || undefined);
    if (aFb && bFb) return bFb.overallRating - aFb.overallRating;
    if (aFb) return -1;
    if (bFb) return 1;
    return new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime();
  });

  return (
    <div className="h-full overflow-y-auto p-6 space-y-4">
      {scheduleAction}
      {sorted.map((interview) => {
        const latestFeedback = getLatestFeedback(interview.feedback || undefined);
        const recordings = getInterviewRecordings(interview);
        const statusMeta = STATUS_META[interview.interviewStatus] ?? {
          label: interview.interviewStatus,
          cls: "bg-slate-100 text-slate-700 border-slate-300",
        };
        const endTimeMs = interview.endAt ? new Date(interview.endAt).getTime() : new Date(interview.scheduledAt).getTime();
        const isPastByTime = Number.isFinite(endTimeMs) && Date.now() > endTimeMs;
        const canOpenRoom =
          interview.type === "ONLINE" &&
          !!interview.meetingLink &&
          !["COMPLETED", "CANCELLED", "NO_SHOW"].includes(interview.interviewStatus) &&
          !isPastByTime;
        const showRoomButton =
          interview.type === "ONLINE" &&
          !!interview.meetingLink &&
          !["COMPLETED", "CANCELLED", "NO_SHOW"].includes(interview.interviewStatus);
        const scoreItems = [
          { label: "Kỹ thuật", value: latestFeedback?.technicalScore },
          { label: "Giao tiếp", value: latestFeedback?.communicationScore },
          { label: "Văn hóa", value: latestFeedback?.cultureFitScore },
          { label: "Giải quyết vấn đề", value: latestFeedback?.problemSolvingScore },
        ].filter((item) => typeof item.value === "number");

        return (
          <div
            key={interview.id}
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-semibold text-slate-900">{interview.jobTitle}</p>
              <Badge className={`border ${statusMeta.cls}`}>
                {statusMeta.label}
              </Badge>
            </div>

            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              <p className="inline-flex items-center gap-1 text-xs text-slate-500">
                <CalendarDays className="h-3.5 w-3.5" />
                {formatDateTimeYMDHM(interview.scheduledAt)}
              </p>

              <p className="inline-flex items-center gap-1 text-xs text-slate-500">
                {interview.type === "ONLINE" ? (
                  <>
                    <Video className="h-3.5 w-3.5" />
                    Online
                  </>
                ) : (
                  <>
                    <MapPin className="h-3.5 w-3.5" />
                    {interview.location || "Offline"}
                  </>
                )}
              </p>
            </div>

            {showRoomButton ? (
              <div className="mt-3">
                <Button
                  size="sm"
                  className="h-8 bg-blue-600 hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={!canOpenRoom}
                  onClick={() => {
                    if (!canOpenRoom) return;
                    window.location.href = `/interview/room/${interview.meetingLink}`;
                  }}
                >
                  {canOpenRoom ? "Vào phòng phỏng vấn" : "Đã quá giờ phỏng vấn"}
                </Button>
              </div>
            ) : null}

            {latestFeedback ? (
              <div className="mt-4 space-y-3 rounded-xl border border-amber-100 bg-amber-50/40 p-4">
                <p className="inline-flex items-center gap-1 text-sm font-semibold text-amber-700">
                  <Star className="h-4 w-4" />
                  Điểm tổng quan: {latestFeedback.overallRating}/5
                </p>

                {scoreItems.length > 0 && (
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                    {scoreItems.map((item) => (
                      <div key={item.label} className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-center">
                        <p className="text-[10px] uppercase tracking-wide text-slate-500">{item.label}</p>
                        <p className="text-sm font-semibold text-slate-800">{item.value}/10</p>
                      </div>
                    ))}
                  </div>
                )}

                {latestFeedback.strengths ? (
                  <p className="text-xs text-slate-700">
                    <span className="font-semibold text-emerald-700">Điểm mạnh:</span> {latestFeedback.strengths}
                  </p>
                ) : null}
                {latestFeedback.weaknesses ? (
                  <p className="text-xs text-slate-700">
                    <span className="font-semibold text-rose-700">Cần cải thiện:</span> {latestFeedback.weaknesses}
                  </p>
                ) : null}
                {latestFeedback.notes ? (
                  <p className="text-xs text-slate-700">
                    <span className="font-semibold">Ghi chú:</span> {latestFeedback.notes}
                  </p>
                ) : null}

                {latestFeedback.recommendation && (
                  <p className="inline-flex items-center gap-1 text-xs font-medium text-slate-600">
                    <UserCheck className="h-3.5 w-3.5" />
                    Khuyến nghị: {getFeedbackRecommendationLabel(latestFeedback.recommendation)}
                  </p>
                )}
              </div>
            ) : (
              <p className="mt-4 inline-flex items-center gap-1 text-xs text-amber-700">
                <CircleAlert className="h-3.5 w-3.5" /> Chưa có đánh giá.
              </p>
            )}

            {recordings.length > 0 ? (
              <div className="mt-4 rounded-xl border border-blue-100 bg-blue-50/40 p-4">
                <p className="inline-flex items-center gap-1 text-sm font-semibold text-blue-700">
                  <PlayCircle className="h-4 w-4" />
                  Bản ghi phỏng vấn ({recordings.length})
                </p>

                <div className="mt-3 space-y-3">
                  {recordings.map((recording) => {
                    const recordingUrl = recording.fileKey || "";
                    const canPreview = isPreviewableVideo(recordingUrl, recording.mimeType);

                    return (
                      <div key={recording.id} className="rounded-lg border border-slate-200 bg-white p-3">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p className="text-xs font-medium text-slate-700">
                            {recording.createdDate
                              ? `Ghi lúc: ${new Date(recording.createdDate).toLocaleString("vi-VN")}`
                              : "Đoạn ghi"}
                          </p>
                          {recording.recordingStatus ? (
                            <Badge className="border border-slate-200 bg-slate-100 text-[10px] font-semibold uppercase tracking-wide text-slate-600">
                              {RECORDING_STATUS_LABELS[recording.recordingStatus] ?? recording.recordingStatus}
                            </Badge>
                          ) : null}
                        </div>

                        {canPreview ? (
                          <video
                            className="mx-auto mt-2 w-full max-w-2xl aspect-video rounded-md border border-slate-200 bg-black object-contain"
                            controls
                            preload="metadata"
                            src={recordingUrl}
                          >
                            Trinh duyet khong ho tro xem truc tiep video.
                          </video>
                        ) : (
                          <p className="mt-2 text-xs text-slate-500">
                            Không thể xem trực tiếp. Hãy mở liên kết để xem.
                          </p>
                        )}

                        <a
                          href={recordingUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:underline"
                        >
                          <LinkIcon className="h-3.5 w-3.5" />
                          Mở liên kết bản ghi
                        </a>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
