import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Candidate } from "@/types/candidate";
import { Mail } from "lucide-react";
import type { CandidateEmailsResponse } from "@/types/candidateTab";

// EmailTab hỗ trợ gửi email nhanh cho ứng viên theo mẫu.

type EmailTabProps = {
  candidate: Candidate;
  emailsData?: CandidateEmailsResponse | null;
  loading?: boolean;
  error?: string | null;
};

export function EmailTab({ candidate, emailsData, loading, error }: EmailTabProps) {
  // Show a small status/preview area if server data is provided.
  return (
    <div className="flex h-full flex-col bg-white">
      <ScrollArea className="h-full px-6 pt-5 sm:px-8">
        <div className="space-y-4">
          {/* Optional server data / loading / error preview for emails */}
          {loading ? (
            <div className="mb-3 px-3 py-2 text-sm text-slate-500">Đang tải email...</div>
          ) : error ? (
            <div className="text-sm text-indigo-500">Thông báo: Tính năng đang trong quá trình hoàn thiện!</div>
          ) : emailsData ? (
            <div className="mb-3 max-h-28 overflow-auto rounded-md border border-slate-100 bg-slate-50 px-3 py-2 text-xs text-slate-600">{JSON.stringify(emailsData)}</div>
          ) : null}
          <div className="rounded-2xl border border-slate-100 bg-slate-50/80 px-5 py-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-600">
              <Mail className="h-4 w-4 text-primary" />
              {candidate.email}
            </div>
            <p className="mt-2 text-sm text-slate-500">
              Gửi email trực tiếp tới ứng viên hoặc sử dụng mẫu dưới đây để tiết kiệm thời gian.
            </p>
          </div>

          {/* Danh sách mẫu email có thể chèn nhanh. */}
          <div className="rounded-2xl border border-slate-100 bg-white px-5 py-4 shadow-sm">
            <h4 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
              Mẫu email đề xuất
            </h4>
            <div className="mt-4 space-y-3">
              {[
                "Mời phỏng vấn sơ bộ",
                "Xác nhận lịch phỏng vấn",
                "Cảm ơn sau phỏng vấn",
              ].map((template) => (
                <button
                  key={template}
                  className="flex w-full items-center justify-between rounded-xl border border-slate-200/80 bg-slate-50 px-4 py-3 text-left text-sm text-slate-600 transition hover:border-primary/30 hover:bg-primary/5"
                >
                  <span>{template}</span>
                  <span className="text-xs uppercase text-primary">Chèn</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </ScrollArea>

      <div className="border-t border-slate-100 bg-slate-50/90 px-6 py-5 sm:px-8">
        {/* Thông tin người phụ trách và hành động gửi email. */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-1">
            <p className="text-xs uppercase tracking-wide text-slate-500">
              Người phụ trách
            </p>
            <p className="text-sm font-semibold text-slate-600">
              {candidate.assignee?.name ?? "Chưa phân công"}
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button variant="outline" className="gap-2">
              <Mail className="h-4 w-4" />
              Gửi email nháp
            </Button>
            <Button className="gap-2">
              <Mail className="h-4 w-4" />
              Gửi ngay
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
