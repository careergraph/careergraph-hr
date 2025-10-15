import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import PageMeta from "@/components/common/PageMeta";
import { KanbanBoard } from "./KanbanBoard";

export default function Candidates() {
  return (
    <>
      <PageMeta title="HR - CareerGraph" description="HR - CareerGraph" />
      <PageBreadcrumb pageTitle="Candidates" />
      <div className="w-full overflow-x-auto">
        <div className="min-w-fit">
          <KanbanBoard />
        </div>
      </div>
    </>
  );
}
