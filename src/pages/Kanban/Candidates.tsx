import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router";
import PageMeta from "@/components/common/PageMeta";
import { KanbanBoard } from "./KanbanBoard";
import { jobService } from "@/services/jobService";
import { ArrowLeft } from "lucide-react";

// Candidates là trang bao bọc bảng Kanban theo job.

export default function Candidates() {
  const { jobId } = useParams<{ jobId?: string }>();
  const navigate = useNavigate();
  const [jobTitle, setJobTitle] = useState("");

  useEffect(() => {
    if (!jobId) return;
    jobService
      .getJobById(jobId)
      .then((data: unknown) => {
        const job = data as Record<string, unknown> | null;
        setJobTitle(String(job?.title ?? ""));
      })
      .catch(() => setJobTitle(""));
  }, [jobId]);

  return (
    <>
      <PageMeta title="HR - CareerGraph" description="HR - CareerGraph" />

      <div className="mb-6 flex items-center gap-3">
        {jobId && (
          <button
            onClick={() => navigate(-1)}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-600 shadow-sm transition hover:bg-gray-50 hover:text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
        )}
        <div>
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white/90">
            {jobId && jobTitle ? `Ứng viên — ${jobTitle}` : "Ứng viên"}
          </h2>
          {jobId && jobTitle && (
            <p className="text-sm text-muted-foreground">
              Quản lý ứng viên theo từng giai đoạn tuyển dụng
            </p>
          )}
        </div>
      </div>

      <KanbanBoard jobId={jobId} />
    </>
  );
}
  );
}
