import { Button } from "@/components/ui/button";
import { FileText } from "lucide-react";
import type { CandidateResumeResponse } from "@/types/candidateTab";

// CvTab hiển thị hành động liên quan đến hồ sơ CV của ứng viên.

type CvTabProps = {
  resumeData?: CandidateResumeResponse | null;
  loading?: boolean;
  error?: string | null;
};

export function CvTab({ resumeData, loading, error }: CvTabProps) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-5 bg-slate-50 px-6 text-center sm:px-8">
      {loading ? (
        <div className="text-sm text-slate-500">Đang tải CV...</div>
      ) : error ? (
        <div className="text-sm text-indigo-500">Thông báo: Tính năng đang trong quá trình hoàn thiện!</div>
      ) : resumeData ? (
        <div className="max-w-full text-left">
          {resumeData.parsed?.summary ? (
            <div className="mb-3 text-sm text-slate-700">{resumeData.parsed.summary}</div>
          ) : null}
          {resumeData.parsed?.skills?.length ? (
            <div className="mb-2 flex flex-wrap gap-2">
              {resumeData.parsed.skills.map((s) => (
                <span key={s} className="rounded-full bg-white px-3 py-1 text-xs font-medium text-slate-700 border border-slate-100">
                  {s}
                </span>
              ))}
            </div>
          ) : null}
          {resumeData.resumeUrl ? (
            <div className="mt-2">
              <a href={resumeData.resumeUrl} target="_blank" rel="noreferrer" className="text-sm text-primary underline">
                Xem/Tải CV
              </a>
            </div>
          ) : null}
        </div>
      ) : null}
      {/* Biểu tượng và mô tả trạng thái CV. */}
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
        <FileText className="h-8 w-8" />
      </div>
      <div className="space-y-2">
        <h3 className="text-lg font-semibold text-slate-700">Hồ sơ ứng viên</h3>
        <p className="text-sm text-slate-500">
          CV hiện chưa được liên kết. Bạn có thể yêu cầu ứng viên cập nhật hoặc tải lên thủ công.
        </p>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-3">
        {/* Hành động yêu cầu hoặc tải lên CV. */}
        <Button variant="default">Yêu cầu cập nhật CV</Button>
        <Button variant="outline">Tải CV từ thiết bị</Button>
      </div>
    </div>
  );
}
