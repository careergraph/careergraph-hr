import type { Interview, InterviewFeedback } from "@/types/interview";
import { Badge } from "@/components/ui/badge";
import { CalendarDays, Star } from "lucide-react";

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

const getRecordingUrl = (notes?: string) => {
  if (!notes) return "";
  const match = notes.match(/https?:\/\/[^\s)]+/i);
  return match?.[0] || "";
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
        const recordingUrl = getRecordingUrl(interview.notes);

        return (
          <div
            key={interview.id}
            className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-semibold text-slate-800">{interview.jobTitle}</p>
              <Badge className="bg-slate-200 text-slate-700">
                {interview.interviewStatus}
              </Badge>
            </div>

            <p className="mt-2 inline-flex items-center gap-1 text-xs text-slate-500">
              <CalendarDays className="h-3.5 w-3.5" />
              {new Date(interview.scheduledAt).toLocaleString("vi-VN")}
            </p>

            {latestFeedback ? (
              <div className="mt-3 space-y-2 rounded-xl bg-white p-3">
                <p className="inline-flex items-center gap-1 text-sm font-semibold text-amber-600">
                  <Star className="h-4 w-4" />
                  Diem tong quan: {latestFeedback.overallRating}/5
                </p>
                {latestFeedback.strengths ? (
                  <p className="text-xs text-slate-600">Diem manh: {latestFeedback.strengths}</p>
                ) : null}
                {latestFeedback.weaknesses ? (
                  <p className="text-xs text-slate-600">Can cai thien: {latestFeedback.weaknesses}</p>
                ) : null}
                {latestFeedback.notes ? (
                  <p className="text-xs text-slate-600">Ghi chu: {latestFeedback.notes}</p>
                ) : null}
              </div>
            ) : (
              <p className="mt-3 text-xs text-slate-500">Chua co danh gia.</p>
            )}

            {recordingUrl ? (
              <a
                href={recordingUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-3 inline-flex text-xs font-medium text-blue-600 hover:underline"
              >
                Xem ban ghi phong van
              </a>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
