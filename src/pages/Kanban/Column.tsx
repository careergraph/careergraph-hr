import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { Briefcase, Users, CheckCircle, Star, UserCheck } from "lucide-react";
import { CandidateCard } from "./CandidateCard";
import { Candidate, Status as CandidateStatus } from "@/types/candidate";

// Column đại diện cho một trạng thái trong Kanban và là vùng thả.

interface ColumnProps {
  id: CandidateStatus;
  title: string;
  candidates: Candidate[];
  onViewDetails?: (candidate: Candidate) => void;
}

// Column màu sắc riêng, icon riêng cho từng trạng thái
const COLUMN_STYLES: Record<
  CandidateStatus,
  {
    accent: string;
    border: string;
    badge: string;
    icon: React.ReactNode;
  }
> = {
  apply: {
    accent: "from-blue-400/60 via-blue-500/30 to-transparent",
    border: "border-blue-100/70",
    badge: "bg-blue-500/10 text-blue-600",
    icon: <Briefcase className="h-5 w-5 text-blue-500" />,
  },
  meeting: {
    accent: "from-amber-400/60 via-amber-400/20 to-transparent",
    border: "border-amber-100/70",
    badge: "bg-amber-500/10 text-amber-600",
    icon: <Users className="h-5 w-5 text-amber-500" />,
  },
  interview: {
    accent: "from-purple-500/60 via-purple-400/20 to-transparent",
    border: "border-purple-100/70",
    badge: "bg-purple-500/10 text-purple-600",
    icon: <UserCheck className="h-5 w-5 text-purple-500" />,
  },
  trial: {
    accent: "from-orange-500/60 via-orange-400/25 to-transparent",
    border: "border-orange-100/70",
    badge: "bg-orange-500/10 text-orange-600",
    icon: <Star className="h-5 w-5 text-orange-500" />,
  },
  hired: {
    accent: "from-emerald-500/60 via-emerald-400/20 to-transparent",
    border: "border-emerald-100/70",
    badge: "bg-emerald-500/10 text-emerald-600",
    icon: <CheckCircle className="h-5 w-5 text-emerald-500" />,
  },
};

export const Column = ({
  id,
  title,
  candidates,
  onViewDetails,
}: ColumnProps) => {
  const { setNodeRef, isOver } = useDroppable({
    id: id,
  });
  const style = COLUMN_STYLES[id] ?? COLUMN_STYLES.apply;

  return (
    <div className="relative flex w-[300px] flex-none flex-col">
      {/* Hiệu ứng gradient đầu cột. */}
      <div
        className={`absolute inset-x-6 top-0 z-10 h-1 rounded-full bg-gradient-to-r ${style.accent} opacity-40`}
      />
      <div
        className={`relative flex h-full flex-col rounded-3xl border ${style.border} bg-card shadow-md ring-1 ring-black/5 dark:bg-slate-900/60`}
        style={{ width: "100%" }}
      >
        <div className={`pointer-events-none absolute inset-x-0 top-0 h-24 rounded-t-3xl bg-gradient-to-br ${style.accent} opacity-20`} />
        <div className="relative flex items-center justify-between rounded-t-3xl px-5 pb-4 pt-5">
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
          className={`custom-scrollbar relative space-y-3 rounded-b-3xl px-3 pb-4 pt-2 transition ${
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
