import { useState, useMemo } from "react";
import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CandidateCard } from "./CandidateCard";
import { Candidate, Status as CandidateStatus } from "@/types/candidate";
import { KANBAN_STAGE_META } from "@/lib/kanbanStageMeta";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";

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

  const [searchQuery, setSearchQuery] = useState("");

  const filteredCandidates = useMemo(() => {
    if (!searchQuery.trim()) return candidates;
    const query = searchQuery.toLowerCase().trim();
    return candidates.filter((c) =>
      c.name.toLowerCase().includes(query)
    );
  }, [candidates, searchQuery]);

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
              <p className="text-xs text-slate-400">
                {searchQuery ? `Tìm thấy ${filteredCandidates.length}/${candidates.length}` : `${candidates.length} ứng viên`}
              </p>
            </div>
          </div>
          <span
            className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide ${style.badge}`}
          >
            {filteredCandidates.length}
          </span>
        </div>

        {/* Ô tìm kiếm ứng viên trong cột */}
        <div className="relative z-20 px-3 pb-2.5 md:px-5 md:pb-3">
          <div className="relative flex items-center">
            <Search className="pointer-events-none absolute left-3 h-3.5 w-3.5 text-slate-400 dark:text-slate-500" />
            <Input
              type="text"
              placeholder="Tìm tên ứng viên..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-8 rounded-lg border-slate-200/80 bg-white/60 pl-8 pr-7 text-xs shadow-sm transition-all focus:border-primary/50 focus:bg-white focus:ring-1 focus:ring-primary/20 dark:border-slate-800 dark:bg-slate-950/40 dark:focus:bg-slate-950"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 rounded-full p-0.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-300"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
        </div>

        <div
          ref={setNodeRef}
          className={`custom-scrollbar relative space-y-2 md:space-y-3 rounded-b-2xl md:rounded-b-3xl px-2 pb-3 pt-1.5 md:px-3 md:pb-4 md:pt-2 transition ${
            isOver ? "bg-primary/5 ring-2 ring-primary/30" : "bg-background dark:bg-slate-900/40"
          }`}
        >
          {/* Vùng chứa danh sách ứng viên có thể kéo thả. */}
          {filteredCandidates.length > 0 ? (
            <SortableContext
              items={filteredCandidates.map((c) => c.id)}
              strategy={verticalListSortingStrategy}
            >
              {filteredCandidates.map((candidate) => (
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
          ) : candidates.length > 0 ? (
            <div className="flex h-24 items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white/70 text-xs font-medium text-slate-400">
              Không tìm thấy ứng viên phù hợp
            </div>
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

