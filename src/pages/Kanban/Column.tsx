import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { Briefcase, Users, CheckCircle, Star, UserCheck, FileCheck, Gift, Search, Ban } from "lucide-react";
import { CandidateCard } from "./CandidateCard";
import { Candidate, Status as CandidateStatus } from "@/types/candidate";

// Column đại diện cho một trạng thái trong Kanban và là vùng thả.

interface ColumnProps {
  id: CandidateStatus;
  title: string;
  candidates: Candidate[];
  onViewDetails?: (candidate: Candidate) => void;
  isMobileView?: boolean;
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
  screening: {
    accent: "from-amber-400/60 via-amber-400/20 to-transparent",
    border: "border-amber-100/70",
    badge: "bg-amber-500/10 text-amber-600",
    icon: <Search className="h-5 w-5 text-amber-500" />,
  },
  contacted: {
    accent: "from-cyan-500/60 via-cyan-400/20 to-transparent",
    border: "border-cyan-100/70",
    badge: "bg-cyan-500/10 text-cyan-600",
    icon: <Users className="h-5 w-5 text-cyan-500" />,
  },
  interview: {
    accent: "from-purple-500/60 via-purple-400/20 to-transparent",
    border: "border-purple-100/70",
    badge: "bg-purple-500/10 text-purple-600",
    icon: <UserCheck className="h-5 w-5 text-purple-500" />,
  },
  interviewed: {
    accent: "from-indigo-500/60 via-indigo-400/20 to-transparent",
    border: "border-indigo-100/70",
    badge: "bg-indigo-500/10 text-indigo-600",
    icon: <FileCheck className="h-5 w-5 text-indigo-500" />,
  },
  trial: {
    accent: "from-orange-500/60 via-orange-400/25 to-transparent",
    border: "border-orange-100/70",
    badge: "bg-orange-500/10 text-orange-600",
    icon: <Star className="h-5 w-5 text-orange-500" />,
  },
  offer: {
    accent: "from-teal-500/60 via-teal-400/20 to-transparent",
    border: "border-teal-100/70",
    badge: "bg-teal-500/10 text-teal-600",
    icon: <Gift className="h-5 w-5 text-teal-500" />,
  },
  hired: {
    accent: "from-emerald-500/60 via-emerald-400/20 to-transparent",
    border: "border-emerald-100/70",
    badge: "bg-emerald-500/10 text-emerald-600",
    icon: <CheckCircle className="h-5 w-5 text-emerald-500" />,
  },
  offboarded: {
    accent: "from-slate-500/60 via-slate-400/20 to-transparent",
    border: "border-slate-100/70",
    badge: "bg-slate-500/10 text-slate-600",
    icon: <Ban className="h-5 w-5 text-slate-500" />,
  },
  rejected: {
    accent: "from-rose-500/60 via-rose-400/20 to-transparent",
    border: "border-rose-100/70",
    badge: "bg-rose-500/10 text-rose-600",
    icon: <Ban className="h-5 w-5 text-rose-500" />,
  },
};

export const Column = ({
  id,
  title,
  candidates,
  onViewDetails,
  isMobileView = false,
}: ColumnProps) => {
  const { setNodeRef, isOver } = useDroppable({
    id: id,
  });
  const style = COLUMN_STYLES[id] ?? COLUMN_STYLES.apply;

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
