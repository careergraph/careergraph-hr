import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CandidateCard } from "./CandidateCard";
import { Candidate, Status as CandidateStatus } from "@/types/candidate";
import { KANBAN_STAGE_META } from "@/lib/kanbanStageMeta";

// Column đại diện cho một trạng thái trong Kanban và là vùng thả.

interface ColumnProps {
  id: CandidateStatus;
  title: string;
  candidates: Candidate[];
  onViewDetails?: (candidate: Candidate) => void;
  isMobileView?: boolean;
  highlightedApplicationId?: string | null;
}


export const Column = ({
  id,
  title,
  candidates,
  onViewDetails,
  isMobileView = false,
  highlightedApplicationId,
}: ColumnProps) => {
  const { setNodeRef, isOver } = useDroppable({
    id: id,
  });
  const style = KANBAN_STAGE_META[id] ?? KANBAN_STAGE_META.apply;

  return (
    <div className={`relative flex flex-col ${
      isMobileView
        ? 'w-full'
        : 'min-w-[220px] flex-1 md:min-w-[250px] lg:min-w-[280px]'
    }`}>
      {/* Hiệu ứng gradient đầu cột. */}
      <div
        className={`absolute inset-x-6 top-0 z-10 h-1 rounded-full bg-gradient-to-r ${style.accent} opacity-40`}
      />
      <div
        className={`relative flex h-full flex-col rounded-2xl border md:rounded-3xl ${style.border} bg-card shadow-md ring-1 ring-black/5 dark:bg-slate-900/60`}
        style={{ width: "100%" }}
      >
        <div className={`pointer-events-none absolute inset-x-0 top-0 h-24 rounded-t-2xl md:rounded-t-3xl bg-gradient-to-br ${style.accent} opacity-20`} />
        <div className="relative flex items-center justify-between rounded-t-2xl md:rounded-t-3xl px-3 pb-3 pt-3.5 md:px-5 md:pb-4 md:pt-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/80 shadow-sm">
              {style.icon}
            </div>
            <div>
              <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-600">
                {title}
              </h2>
              <p className="text-xs text-slate-400">{candidates.length} ứng viên</p>
            </div>
          </div>
          <span
            className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide ${style.badge}`}
          >
            {candidates.length}
          </span>
        </div>

        <div
          ref={setNodeRef}
          className={`custom-scrollbar relative space-y-2 md:space-y-3 rounded-b-2xl md:rounded-b-3xl px-2 pb-3 pt-1.5 md:px-3 md:pb-4 md:pt-2 transition ${
            isOver ? "bg-primary/5 ring-2 ring-primary/30" : "bg-background dark:bg-slate-900/40"
          }`}
        >
          {/* Vùng chứa danh sách ứng viên có thể kéo thả. */}
          {candidates.length > 0 ? (
            <SortableContext
              items={candidates.map((c) => c.id)}
              strategy={verticalListSortingStrategy}
            >
              {candidates.map((candidate) => (
                <CandidateCard
                  key={candidate.id}
                  candidate={candidate}
                  onViewDetails={onViewDetails}
                  compact
                  className="w-full"
                  highlighted={candidate.id === highlightedApplicationId}
                />
              ))}
            </SortableContext>
          ) : (
            <div className="flex h-24 items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white/70 text-xs font-medium text-slate-400">
              Chưa có ứng viên nào
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
