import { Card } from "@/components/ui/card";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { SuggestionCandidate } from "@/types/candidate";
import { cn } from "@/lib/utils";
import { Clock } from "lucide-react";

interface CandidateCardProps {
  candidate: SuggestionCandidate;
  isSelected: boolean;
  onClick: () => void;
}

export const CandidateCard = ({
  candidate,
  isSelected,
  onClick,
}: CandidateCardProps) => {
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getAvatarColor = (id: string) => {
    const colors = [
      "bg-gradient-to-tr from-blue-500 to-blue-400",
      "bg-gradient-to-tr from-purple-500 to-pink-400",
      "bg-gradient-to-tr from-green-500 to-emerald-400",
      "bg-gradient-to-tr from-pink-500 to-rose-400",
    ];
    return colors[parseInt(id) % colors.length];
  };

  return (
    <Card
      onClick={onClick}
      className={cn(
        "p-4 cursor-pointer transition-all rounded-2xl border bg-card shadow-sm hover:shadow-md hover:scale-[1.01]",
        isSelected
          ? "border border-primary/60 bg-primary/5"
          : "border border-transparent hover:border-primary/30"
      )}
    >
      <div className="flex gap-4 items-center">
        {/* Avatar */}
        <Avatar className="h-14 w-14 flex-shrink-0 ring-2 ring-offset-2 ring-primary/10">
          {candidate.avatar ? (
            <AvatarImage src={candidate.avatar} alt={candidate.name} />
          ) : (
            <AvatarFallback
              className={cn(
                "text-white font-bold text-base flex items-center justify-center",
                getAvatarColor(candidate.id)
              )}
            >
              {getInitials(candidate.name)}
            </AvatarFallback>
          )}
        </Avatar>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <h3 className="font-semibold text-base text-foreground truncate">
              {candidate.name}
            </h3>
            <span className="ml-2 text-muted-foreground text-xs">
              ({candidate.age} tuổi)
            </span>
          </div>

          <p className="text-sm text-muted-foreground line-clamp-1">
            {candidate.position}
          </p>

          <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
            <span>{candidate.experience}</span>
            <Badge
              variant="secondary"
              className="text-xs flex items-center gap-1 px-2 py-0.5 rounded-full"
            >
              <Clock className="w-3 h-3" />
              {candidate.lastActive}
            </Badge>
          </div>
        </div>
      </div>
    </Card>
  );
};
