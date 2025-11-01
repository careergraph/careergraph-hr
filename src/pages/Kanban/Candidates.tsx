import { useParams } from "react-router";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import PageMeta from "@/components/common/PageMeta";
import { KanbanBoard } from "./KanbanBoard";

// Candidates là trang bao bọc bảng Kanban theo job.

export default function Candidates() {
  const { jobId } = useParams<{ jobId?: string }>();
  const breadcrumbTitle = "Ứng viên";

  return (
    <>
      {/* Thiết lập metadata và breadcrumb của trang ứng viên. */}
      <PageMeta title="HR - CareerGraph" description="HR - CareerGraph" />
      <PageBreadcrumb pageTitle={breadcrumbTitle} />

      <div className="w-full overflow-x-auto">
        <div className="min-w-fit">
          {/* Bảng Kanban cho job hiện tại (nếu có). */}
          <KanbanBoard jobId={jobId} />
        </div>
      </div>
    </>
  );
}
