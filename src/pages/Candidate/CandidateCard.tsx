import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import { Card } from "../../components/ui/card";
import { Avatar, AvatarFallback } from "../../components/ui/avatar";
import { Badge } from "../../components/ui/badge";
import { Candidate } from "../../types/candidate";

export interface CandidateCardProps {
  candidate: Candidate;
  onViewDetails?: (candidate: Candidate) => void;
  compact?: boolean;
}

export function CandidateCard({
  candidate,
  onViewDetails,
  compact = false,
}: CandidateCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: candidate.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getPriorityConfig = () => {
    switch (candidate.priority) {
      case "high":
        return { color: "bg-red-500 text-white", label: "Cao" };
      case "medium":
        return { color: "bg-orange-500 text-white", label: "Trung bình" };
      case "low":
        return { color: "bg-blue-500 text-white", label: "Thấp" };
    }
  };

  const priorityConfig = getPriorityConfig();

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`transition-all ${isDragging ? "opacity-50 cursor-grabbing" : ""}`}
    >
      <Card
        className={`mb-2 border-0 shadow hover:shadow-lg cursor-pointer rounded-xl bg-white/90 hover:bg-white ${compact ? "p-3" : "p-4"}`}
        onClick={() => onViewDetails?.(candidate)}
        tabIndex={0}
        role="button"
        aria-label={`Xem chi tiết ứng viên ${candidate.name}`}
      >
        <div className="flex items-center gap-3">
          <div
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing text-gray-300 hover:text-primary transition-colors"
            onClick={(e) => e.stopPropagation()}
          >
            <GripVertical className="h-5 w-5" />
          </div>
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-primary text-primary-foreground font-semibold text-sm">
              {getInitials(candidate.name)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-800 truncate text-sm">
              {candidate.name}
            </h3>
            <p className="text-xs text-gray-500 truncate">
              {candidate.position}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 mt-2">
          <Badge className={`${priorityConfig.color} px-2 py-0 text-xs`}>{priorityConfig.label}</Badge>
          <span className="text-xs text-gray-400 font-mono">{candidate.appliedDate}</span>
          {candidate.labels.length > 0 && (
            <span className="inline-flex gap-1 ml-auto">
              {candidate.labels.slice(0, 1).map((label, index) => (
                <Badge
                  key={index}
                  variant="outline"
                  className="text-xs px-1.5 py-0 border-gray-300"
                >
                  {label}
                </Badge>
              ))}
              {candidate.labels.length > 1 && (
                <Badge variant="outline" className="text-xs px-1.5 py-0 border-gray-300">
                  +{candidate.labels.length - 1}
                </Badge>
              )}
            </span>
          )}
        </div>
      </Card>
    </div>
  );
}
