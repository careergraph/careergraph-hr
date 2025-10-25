import { useMemo } from "react";
import { useNavigate, useParams } from "react-router";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import PageMeta from "@/components/common/PageMeta";
import { KanbanBoard } from "./KanbanBoard";
import { jobsData } from "@/data/jobsData";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function Candidates() {
  const { jobId } = useParams<{ jobId?: string }>();
  const navigate = useNavigate();

  const selectedJob = useMemo(
    () => jobsData.find((job) => job.id === jobId),
    [jobId]
  );

  const breadcrumbTitle = "Ứng viên"

  return (
    <>
      <PageMeta title="HR - CareerGraph" description="HR - CareerGraph" />
      <PageBreadcrumb pageTitle={breadcrumbTitle} />
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-slate-800 dark:text-slate-100">
            {selectedJob ? selectedJob.title : "Quản lý ứng viên"}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-300">
            {selectedJob
              ? `${selectedJob.department ?? ""}${selectedJob.department && selectedJob.city ? " · " : ""}${selectedJob.city ?? ""}`
              : "Chọn một công việc trong danh sách để xem các ứng viên đã ứng tuyển."}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate("/jobs")}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Trở về danh sách công việc
        </Button>
      </div>
      <div className="w-full overflow-x-auto">
        <div className="min-w-fit">
          <KanbanBoard jobId={jobId} />
        </div>
      </div>
    </>
  );
}
