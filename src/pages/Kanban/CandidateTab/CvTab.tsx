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
  if (loading) {
    return (
      <div className="flex h-full items-center justify-center bg-slate-50">
        <div className="text-sm text-slate-500">Đang tải CV...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-full items-center justify-center bg-slate-50">
        <div className="text-sm text-red-500">{error}</div>
      </div>
    );
  }

  if (resumeData?.resumeUrl) {
    return (
      <div className="flex h-full flex-col bg-slate-50">
        <div className="flex-1 p-4">
          <iframe
            src={resumeData.resumeUrl}
            className="h-full w-full rounded-lg border border-slate-200 bg-white shadow-sm"
            title="Candidate Resume"
          />
        </div>
        <div className="flex justify-end gap-3 border-t border-slate-200 bg-white px-6 py-3">
          <Button variant="outline" asChild>
            <a href={resumeData.resumeUrl} target="_blank" rel="noreferrer">
              Mở trong tab mới
            </a>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col items-center justify-center gap-5 bg-slate-50 px-6 text-center sm:px-8">
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
