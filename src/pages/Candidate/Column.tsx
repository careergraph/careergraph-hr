import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { Briefcase, Users, CheckCircle, Star, UserCheck } from "lucide-react";
import { CandidateCard } from "./CandidateCard";
import { Candidate, Status } from "../../types/candidate";

interface ColumnProps {
  id: Status;
  title: string;
  candidates: Candidate[];
  onViewDetails?: (candidate: Candidate) => void;
}

// Column màu sắc riêng, icon riêng cho từng trạng thái
const COLUMN_STYLES: Record<
  string,
  { bg: string; border: string; icon: React.ReactNode }
> = {
  apply: {
    bg: "bg-blue-50",
    border: "border-blue-200",
    icon: <Briefcase className="h-5 w-5 text-blue-400" />,
  },
  meeting: {
    bg: "bg-yellow-50",
    border: "border-yellow-200",
    icon: <Users className="h-5 w-5 text-yellow-400" />,
  },
  interview: {
    bg: "bg-purple-50",
    border: "border-purple-200",
    icon: <UserCheck className="h-5 w-5 text-purple-400" />,
  },
  trial: {
    bg: "bg-orange-50",
    border: "border-orange-200",
    icon: <Star className="h-5 w-5 text-orange-400" />,
  },
  hired: {
    bg: "bg-green-50",
    border: "border-green-200",
    icon: <CheckCircle className="h-5 w-5 text-green-400" />,
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
  const style = COLUMN_STYLES[id] || COLUMN_STYLES.apply;

  return (
    <div
      className={`flex flex-col min-w-[260px] md:w-[280px] ${style.bg} ${style.border} 
              border rounded-2xl shadow-sm transition-all duration-200`}
    >
      {/* Column header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-dashed">
        <div className="flex items-center gap-2">
          {style.icon}
          <h2 className="font-semibold text-base text-gray-700">{title}</h2>
        </div>
        <span className="text-xs font-semibold text-white bg-gray-400 px-2 py-0.5 rounded-full">
          {candidates.length}
        </span>
      </div>

      {/* Candidate list - droppable area */}
      <div
        ref={setNodeRef}
        className={`custom-scrollbar space-y-3 p-2 rounded-b-2xl min-h-[80px] max-h-[70vh] overflow-y-auto 
    transition-colors duration-200 focus:outline-none ${
      isOver ? `ring-2 ring-offset-2 ring-primary/40 bg-white/70` : ""
    }`}
      >
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
              />
            ))}
          </SortableContext>
        ) : (
          <div className="flex items-center justify-center h-23 text-gray-400 text-xs italic">
            Chưa có ứng viên nào
          </div>
        )}
      </div>
    </div>
  );
};
