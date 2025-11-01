import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { CalendarClock, GripVertical, MapPin } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Candidate } from "@/types/candidate";

// CandidateCard hiển thị ứng viên trong Kanban và hỗ trợ kéo thả.

export interface CandidateCardProps {
  candidate: Candidate;
  onViewDetails?: (candidate: Candidate) => void;
  compact?: boolean;
  className?: string;
}

export function CandidateCard({
  candidate,
  onViewDetails,
  compact = false,
  className,
}: CandidateCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: candidate.id });

  // Ánh xạ transform/thời gian chuyển động khi kéo thả.
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const getInitials = (name: string) =>
    // Lấy ký tự đầu để làm avatar fallback.
    name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);

  const priorityMeta: Record<
    Candidate["priority"],
    { label: string; badge: string; indicator: string }
  > = {
    high: {
      label: "Ưu tiên cao",
      badge: "bg-rose-500/10 text-rose-600 ring-1 ring-rose-500/30",
      indicator: "from-rose-500/20 via-transparent to-transparent",
    },
    medium: {
      label: "Ưu tiên",
      badge: "bg-amber-500/10 text-amber-600 ring-1 ring-amber-500/30",
      indicator: "from-amber-500/20 via-transparent to-transparent",
    },
    low: {
      label: "Theo dõi",
      badge: "bg-sky-500/10 text-sky-600 ring-1 ring-sky-500/30",
      indicator: "from-sky-500/20 via-transparent to-transparent",
    },
  };

  const priority = priorityMeta[candidate.priority];

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`w-full transition ${isDragging ? "opacity-50 cursor-grabbing" : ""} ${className ?? ""}`}
    >
      {/* Thẻ chính hiển thị thông tin ứng viên. */}
      <Card
        className={`relative mb-3 flex w-full cursor-pointer items-start gap-4 overflow-hidden rounded-2xl border border-slate-200 bg-card shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 ${
          compact ? "p-4" : "p-5"
        }`}
        onClick={() => onViewDetails?.(candidate)}
        tabIndex={0}
        role="button"
        aria-label={`Xem chi tiết ứng viên ${candidate.name}`}
      >
        <div className={`absolute inset-0 bg-gradient-to-br ${priority.indicator} opacity-10`} />
        <div className="relative flex w-full items-start gap-4">
          <div className="flex flex-col items-center gap-3">
            <button
              {...attributes}
              {...listeners}
              className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-background text-slate-400"
              onClick={(event) => event.stopPropagation()}
              type="button"
              aria-label="Kéo thả ứng viên"
            >
              <GripVertical className="h-4 w-4" />
            </button>
            <Avatar className="h-16 w-16 border border-slate-200 bg-muted">
              {candidate.avatar ? (
                <AvatarImage src={candidate.avatar} alt={candidate.name} />
              ) : null}
              <AvatarFallback className="bg-gradient-to-br from-primary/80 to-primary text-base font-semibold uppercase text-primary-foreground">
                {getInitials(candidate.name)}
              </AvatarFallback>
            </Avatar>
          </div>

          <div className="min-w-0 flex-1 space-y-2">
              <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="min-w-0 space-y-0.5">
                <h3 className="truncate text-sm font-semibold text-foreground">
                  {candidate.name}
                </h3>
                <span className="block truncate text-xs text-muted-foreground">
                  {candidate.position}
                </span>
              </div>
              <Badge
                className={`${priority.badge} px-2 py-0 text-[10px] font-semibold uppercase`}
              >
                {priority.label}
              </Badge>
            </div>

            <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1">
                <CalendarClock className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500" />
                {candidate.appliedDate}
              </span>
              {candidate.location?.city ? (
                <span className="inline-flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500" />
                  {candidate.location.city}
                </span>
              ) : null}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
