import {
  Briefcase,
  MapPin,
  Eye,
  Bookmark,
  ThumbsUp,
  Share2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Job } from "@/types/job";
import { Status } from "@/enums/commonEnum";
import { EmploymentType } from "@/enums/workEnum";

interface JobCardProps {
  job: Job;
}

export const JobCard = ({ job }: JobCardProps) => {
  // Màu cho từng loại công việc
  const typeColors = {
    [EmploymentType.FULL_TIME]: {
      badge: "text-cyan-700 bg-cyan-100 dark:text-cyan-300 dark:bg-cyan-950/30",
      icon: "text-cyan-600 dark:text-cyan-400",
      bg: "bg-cyan-100 dark:bg-cyan-950/30",
    },
    [EmploymentType.PART_TIME]: {
      badge: "text-blue-700 bg-blue-100 dark:text-blue-300 dark:bg-blue-950/30",
      icon: "text-blue-600 dark:text-blue-400",
      bg: "bg-blue-100 dark:bg-blue-950/30",
    },
    [EmploymentType.CONTRACT]: {
      badge:
        "text-violet-700 bg-violet-100 dark:text-violet-300 dark:bg-violet-950/30",
      icon: "text-violet-600 dark:text-violet-400",
      bg: "bg-violet-100 dark:bg-violet-950/30",
    },
    [EmploymentType.INTERNSHIP]: {
      badge:
        "text-green-700 bg-green-100 dark:text-green-300 dark:bg-green-950/30",
      icon: "text-green-600 dark:text-green-400",
      bg: "bg-green-100 dark:bg-green-950/30",
    },
    [EmploymentType.FREELANCE]: {
      badge:
        "text-orange-700 bg-orange-100 dark:text-orange-300 dark:bg-orange-950/30",
      icon: "text-orange-600 dark:text-orange-400",
      bg: "bg-orange-100 dark:bg-orange-950/30",
    },
    [EmploymentType.TEMPORARY]: {
      badge: "text-pink-700 bg-pink-100 dark:text-pink-300 dark:bg-pink-950/30",
      icon: "text-pink-600 dark:text-pink-400",
      bg: "bg-pink-100 dark:bg-pink-950/30",
    },
  } as const;

  const color = typeColors[job.type as keyof typeof typeColors];

  // Màu cho trạng thái
  const statusColor =
    job.status === Status.ACTIVE
      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300"
      : job.status === Status.DRAFT
      ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-950/30 dark:text-yellow-300"
      : "bg-red-100 text-red-700 dark:bg-red-950/30 dark:text-red-300";

  return (
    <div className="group p-6 rounded-2xl border border-border bg-card dark:bg-slate-900 hover:bg-accent/50 dark:hover:bg-slate-800/70 transition-all duration-300 hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] flex flex-col justify-between">
      {/* Header: type icon + type badge */}
      <div className="flex items-center justify-between mb-3">
        <div className={`p-2.5 rounded-xl ${color.bg}`}>
          <Briefcase className={`w-5 h-5 ${color.icon}`} />
        </div>
        <Badge className={`rounded-full px-2 py-1 text-sm ${color.badge}`}>
          {job.type}
        </Badge>
      </div>

      {/* Title + Department + Status */}
      <div className="flex items-start justify-between mb-3 cursor-pointer">
        <div className="flex-1 min-w-0">
          <h3
            className="font-bold text-lg text-foreground dark:text-slate-100 group-hover:text-primary transition-colors line-clamp-1"
            title={job.title}
          >
            {job.title}
          </h3>
          <p className="text-sm text-muted-foreground dark:text-slate-300 mt-1">
            {job.department}
          </p>
        </div>
        <Badge className={`ml-3 rounded-full px-2 py-1 text-sm ${statusColor}`}>
          {job.status === Status.ACTIVE
            ? Status.ACTIVE
            : job.status === Status.DRAFT
            ? Status.DRAFT
            : Status.CLOSED}
        </Badge>
      </div>

      {/* Location + Posted Date */}
      <div className="flex items-center justify-between text-xs text-muted-foreground dark:text-slate-400 mb-4">
        <span className="flex items-center gap-1">
          <MapPin className="w-3 h-3" />
          {job.city}
        </span>
        <span>{job.postedDate.toDateString()}</span>
      </div>

      {/* Action icons trải đều */}
      <div className="flex items-center text-sm text-muted-foreground mt-auto justify-between">
        <div className="flex items-center gap-2">
          <Bookmark className="w-4 h-4" />
          <span>{job.applicants}</span>
        </div>
        <div className="flex items-center gap-2">
          <Eye className="w-4 h-4" />
          <span>{job.views}</span>
        </div>
        <div className="flex items-center gap-2">
          <ThumbsUp className="w-4 h-4" />
          <span>{job.likes}</span>
        </div>
        <div className="flex items-center gap-2">
          <Share2 className="w-4 h-4" />
          <span>{job.shares}</span>
        </div>
      </div>
    </div>
  );
};
