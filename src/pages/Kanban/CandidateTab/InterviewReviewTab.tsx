import type { Interview, InterviewFeedback, InterviewRecording } from "@/types/interview";
import { Badge } from "@/components/ui/badge";
import { CalendarDays, Star, Video, MapPin, UserCheck, CircleAlert, Link as LinkIcon, PlayCircle } from "lucide-react";

interface InterviewReviewTabProps {
  interviews: Interview[];
  loading?: boolean;
  error?: string | null;
}

const getLatestFeedback = (feedback: InterviewFeedback[] | undefined) => {
  if (!Array.isArray(feedback) || feedback.length === 0) return null;
  return [...feedback].sort(
    (a, b) => new Date(b.createdDate).getTime() - new Date(a.createdDate).getTime()
  )[0];
};

const STATUS_META: Record<string, { label: string; cls: string }> = {
  SCHEDULED: { label: "Da len lich", cls: "bg-blue-50 text-blue-700 border-blue-200" },
  CONFIRMED: { label: "Da xac nhan", cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  IN_PROGRESS: { label: "Dang dien ra", cls: "bg-amber-50 text-amber-700 border-amber-200" },
  COMPLETED: { label: "Hoan thanh", cls: "bg-slate-100 text-slate-700 border-slate-300" },
  CANCELLED: { label: "Da huy", cls: "bg-rose-50 text-rose-700 border-rose-200" },
  NO_SHOW: { label: "Vang mat", cls: "bg-orange-50 text-orange-700 border-orange-200" },
  PENDING_RESCHEDULE: { label: "Cho doi lich", cls: "bg-purple-50 text-purple-700 border-purple-200" },
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

export function InterviewReviewTab({ interviews, loading, error }: InterviewReviewTabProps) {
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
      <div className="p-6 text-sm text-slate-500">Chua co du lieu phong van.</div>
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
      {sorted.map((interview) => {
        const latestFeedback = getLatestFeedback(interview.feedback || undefined);
        const recordings = getInterviewRecordings(interview);
        const statusMeta = STATUS_META[interview.interviewStatus] ?? {
          label: interview.interviewStatus,
          cls: "bg-slate-100 text-slate-700 border-slate-300",
        };
        const scoreItems = [
          { label: "Ky thuat", value: latestFeedback?.technicalScore },
          { label: "Giao tiep", value: latestFeedback?.communicationScore },
          { label: "Van hoa", value: latestFeedback?.cultureFitScore },
          { label: "Giai quyet van de", value: latestFeedback?.problemSolvingScore },
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
                {new Date(interview.scheduledAt).toLocaleString("vi-VN")}
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

            {latestFeedback ? (
              <div className="mt-4 space-y-3 rounded-xl border border-amber-100 bg-amber-50/40 p-4">
                <p className="inline-flex items-center gap-1 text-sm font-semibold text-amber-700">
                  <Star className="h-4 w-4" />
                  Diem tong quan: {latestFeedback.overallRating}/5
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
                    <span className="font-semibold text-emerald-700">Diem manh:</span> {latestFeedback.strengths}
                  </p>
                ) : null}
                {latestFeedback.weaknesses ? (
                  <p className="text-xs text-slate-700">
                    <span className="font-semibold text-rose-700">Can cai thien:</span> {latestFeedback.weaknesses}
                  </p>
                ) : null}
                {latestFeedback.notes ? (
                  <p className="text-xs text-slate-700">
                    <span className="font-semibold">Ghi chu:</span> {latestFeedback.notes}
                  </p>
                ) : null}

                {latestFeedback.recommendation && (
                  <p className="inline-flex items-center gap-1 text-xs font-medium text-slate-600">
                    <UserCheck className="h-3.5 w-3.5" />
                    Khuyen nghi: {latestFeedback.recommendation}
                  </p>
                )}
              </div>
            ) : (
              <p className="mt-4 inline-flex items-center gap-1 text-xs text-amber-700">
                <CircleAlert className="h-3.5 w-3.5" /> Chua co danh gia.
              </p>
            )}

            {recordings.length > 0 ? (
              <div className="mt-4 rounded-xl border border-blue-100 bg-blue-50/40 p-4">
                <p className="inline-flex items-center gap-1 text-sm font-semibold text-blue-700">
                  <PlayCircle className="h-4 w-4" />
                  Ban ghi phong van ({recordings.length})
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
                              ? `Recorded: ${new Date(recording.createdDate).toLocaleString("vi-VN")}`
                              : "Recorded clip"}
                          </p>
                          {recording.recordingStatus ? (
                            <Badge className="border border-slate-200 bg-slate-100 text-[10px] font-semibold uppercase tracking-wide text-slate-600">
                              {recording.recordingStatus}
                            </Badge>
                          ) : null}
                        </div>

                        {canPreview ? (
                          <video
                            className="mt-2 w-full rounded-md border border-slate-200 bg-black"
                            controls
                            preload="metadata"
                            src={recordingUrl}
                          >
                            Trinh duyet khong ho tro xem truc tiep video.
                          </video>
                        ) : (
                          <p className="mt-2 text-xs text-slate-500">
                            Khong the preview truc tiep. Hay mo link de xem.
                          </p>
                        )}

                        <a
                          href={recordingUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:underline"
                        >
                          <LinkIcon className="h-3.5 w-3.5" />
                          Mo link recording
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
