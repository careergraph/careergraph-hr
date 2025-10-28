import { useParams } from "react-router";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import PageMeta from "@/components/common/PageMeta";
import { KanbanBoard } from "./KanbanBoard";

export default function Candidates() {
  const { jobId } = useParams<{ jobId?: string }>();
  const breadcrumbTitle = "Ứng viên";

  return (
    <>
      <PageMeta title="HR - CareerGraph" description="HR - CareerGraph" />
      <PageBreadcrumb pageTitle={breadcrumbTitle} />

      <div className="w-full overflow-x-auto">
        <div className="min-w-fit">
          <KanbanBoard jobId={jobId} />
        </div>
      </div>
    </>
  );
}
