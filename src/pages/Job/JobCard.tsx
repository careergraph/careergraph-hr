import {
  Briefcase,
  CalendarClock,
  Eye,
  MapPin,
  RefreshCw,
  Users,
  Bookmark,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Job } from "@/types/job";
import { Status } from "@/enums/commonEnum";
import { EmploymentType, JOB_CATEGORY_OPTIONS, JobCategory } from "@/enums/workEnum";
import { KeyboardEvent } from "react";
import { formatDateYMD } from "@/lib/dateUtils";
import { getJobDisplayStatus, isJobExpired } from "@/lib/jobStatus";

// JobCard hiển thị thông tin tóm tắt của một job kèm các chỉ số tương tác.

interface JobCardProps {
  job: Job;
  onSelectJob?: () => void;
  onManageExpiry?: () => void;
}

export const JobCard = ({ job, onSelectJob, onManageExpiry }: JobCardProps) => {
  // Màu cho từng loại công việc giúp người xem nhận diện nhanh.
  const typeColors = {
    [EmploymentType.FULL_TIME]: {
      badge: "text-cyan-700 bg-cyan-100 dark:text-cyan-300 dark:bg-cyan-950/30",
      icon: "text-cyan-600 dark:text-cyan-400",
      bg: "bg-cyan-100 dark:bg-cyan-950/30",
      gradient: "from-cyan-500/20 via-transparent to-transparent dark:from-cyan-400/15 dark:via-transparent dark:to-transparent",
    },
    [EmploymentType.PART_TIME]: {
      badge: "text-blue-700 bg-blue-100 dark:text-blue-300 dark:bg-blue-950/30",
      icon: "text-blue-600 dark:text-blue-400",
      bg: "bg-blue-100 dark:bg-blue-950/30",
      gradient: "from-sky-500/20 via-transparent to-transparent dark:from-sky-400/15 dark:via-transparent dark:to-transparent",
    },
    [EmploymentType.CONTRACT]: {
      badge:
        "text-violet-700 bg-violet-100 dark:text-violet-300 dark:bg-violet-950/30",
      icon: "text-violet-600 dark:text-violet-400",
      bg: "bg-violet-100 dark:bg-violet-950/30",
      gradient: "from-violet-500/20 via-transparent to-transparent dark:from-violet-500/15 dark:via-transparent dark:to-transparent",
    },
    [EmploymentType.INTERNSHIP]: {
      badge:
        "text-green-700 bg-green-100 dark:text-green-300 dark:bg-green-950/30",
      icon: "text-green-600 dark:text-green-400",
      bg: "bg-green-100 dark:bg-green-950/30",
      gradient: "from-emerald-500/20 via-transparent to-transparent dark:from-emerald-400/15 dark:via-transparent dark:to-transparent",
    },
    [EmploymentType.FREELANCE]: {
      badge:
        "text-orange-700 bg-orange-100 dark:text-orange-300 dark:bg-orange-950/30",
      icon: "text-orange-600 dark:text-orange-400",
      bg: "bg-orange-100 dark:bg-orange-950/30",
      gradient: "from-amber-500/20 via-transparent to-transparent dark:from-amber-400/15 dark:via-transparent dark:to-transparent",
    },
    [EmploymentType.TEMPORARY]: {
      badge: "text-pink-700 bg-pink-100 dark:text-pink-300 dark:bg-pink-950/30",
      icon: "text-pink-600 dark:text-pink-400",
      bg: "bg-pink-100 dark:bg-pink-950/30",
      gradient: "from-pink-500/20 via-transparent to-transparent dark:from-pink-400/15 dark:via-transparent dark:to-transparent",
    },
  } as const;

  const color =
    typeColors[job.type as keyof typeof typeColors] ||
    typeColors[EmploymentType.FULL_TIME];

  // Nếu job không có trạng thái thì mặc định ACTIVE để hiển thị badge.
  const currentStatus = job.status ?? Status.ACTIVE;
  const displayStatus = getJobDisplayStatus(currentStatus, job.expiryDate);
  const isExpiredByDeadline = isJobExpired(job.expiryDate);

  const typeLabelMap: Partial<Record<EmploymentType, string>> = {
    [EmploymentType.FULL_TIME]: "To\u00e0n th\u1eddi gian",
    [EmploymentType.PART_TIME]: "B\u00e1n th\u1eddi gian",
    [EmploymentType.CONTRACT]: "H\u1ee3p \u0111\u1ed3ng",
    [EmploymentType.INTERNSHIP]: "Th\u1ef1c t\u1eadp",
    [EmploymentType.FREELANCE]: "T\u1ef1 do",
    [EmploymentType.TEMPORARY]: "T\u1ea1m th\u1eddi",
  };

  // Bảng ánh xạ trạng thái sang nhãn tiếng Việt.
  const statusLabelMap: Record<Status, string> = {
    [Status.ACTIVE]: "\u0110ang tuy\u1ec3n",
    [Status.INACTIVE]: "T\u1ea1m d\u1eebng",
    [Status.DRAFT]: "B\u1ea3n nh\u00e1p",
    [Status.CLOSED]: "\u0110\u00e3 \u0111\u00f3ng",
  };

  const jobCategoryLabel =
    JOB_CATEGORY_OPTIONS.find((option) => option.value === job.jobCategory)?.label ??
    (job.jobCategory as JobCategory | undefined) ??
    "";
  const departmentLabel = job.department?.trim() ?? "";
  const summaryLabel = jobCategoryLabel || departmentLabel;
  const statusLabel = isExpiredByDeadline
    ? "H\u1ebft h\u1ea1n"
    : statusLabelMap[displayStatus.status];

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    // Cho phép mở job bằng phím Enter hoặc Space để đảm bảo accessibility.
    if (!onSelectJob) return;
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onSelectJob();
    }
  };

  // Màu cho trạng thái hiển thị badge tương ứng.
  const statusColor =
    isExpiredByDeadline
      ? "bg-rose-100 text-rose-700 dark:bg-rose-950/30 dark:text-rose-300"
      : displayStatus.status === Status.ACTIVE
      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300"
      : displayStatus.status === Status.DRAFT
      ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-950/30 dark:text-yellow-300"
      : displayStatus.status === Status.INACTIVE
      ? "bg-slate-200 text-slate-700 dark:bg-slate-800/60 dark:text-slate-200"
      : "bg-red-100 text-red-700 dark:bg-red-950/30 dark:text-red-300";

  const manageLabel = displayStatus.requiresReopen ? "M\u1edf l\u1ea1i" : "Gia h\u1ea1n";

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onSelectJob}
      onKeyDown={handleKeyDown}
      className="group relative overflow-hidden p-6 rounded-2xl border border-border bg-card dark:bg-slate-900 hover:bg-accent/50 dark:hover:bg-slate-800/70 transition-all duration-300 hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] flex flex-col justify-between cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/40 focus:ring-offset-2 focus:ring-offset-background"
    >
      <div
        className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${color.gradient} opacity-60 transition-opacity duration-300 group-hover:opacity-80`}
      />
      <div className="relative z-10 flex items-center justify-between mb-4">
        <div className={`p-2.5 rounded-xl ${color.bg}`}>
          <Briefcase className={`w-5 h-5 ${color.icon}`} />
        </div>
        <div className="flex items-center gap-2">
          {onManageExpiry && currentStatus !== Status.DRAFT && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="rounded-full border-border/70 bg-background/80 px-3 text-xs font-semibold shadow-sm backdrop-blur transition hover:border-primary/40 hover:text-primary"
              onClick={(event) => {
                event.stopPropagation();
                onManageExpiry();
              }}
            >
              {displayStatus.requiresReopen ? (
                <RefreshCw className="h-4 w-4" />
              ) : (
                <CalendarClock className="h-4 w-4" />
              )}
              {manageLabel}
            </Button>
          )}
          <Badge className={`rounded-full px-2.5 py-1 text-xs font-semibold ${color.badge}`}>
            {typeLabelMap[job.type as EmploymentType] ?? job.type}
          </Badge>
        </div>
      </div>

      <div className="relative z-10 flex items-start justify-between gap-3 mb-3 cursor-pointer">
        <div className="flex-1 min-w-0">
          <h3
            className="font-bold text-lg text-foreground dark:text-slate-100 group-hover:text-primary transition-colors line-clamp-1"
            title={job.title}
          >
            {job.title}
          </h3>
          {summaryLabel && (
            <p className="text-sm text-muted-foreground dark:text-slate-300 mt-1 line-clamp-1">
              {summaryLabel}
            </p>
          )}
        </div>
        <Badge className={`ml-3 rounded-full px-2 py-1 text-xs font-semibold ${statusColor}`}>
          {statusLabel}
        </Badge>
      </div>

      <div className="relative z-10 grid gap-2 text-xs text-muted-foreground dark:text-slate-400 mb-4">
        {job.city && (
          <span className="flex items-center gap-1">
            <MapPin className="w-3 h-3 shrink-0" />
            <span className="truncate">{job.city}</span>
          </span>
        )}
        <span className="flex items-center gap-1">
          <CalendarClock className="w-3 h-3 shrink-0" />
          <span>{isExpiredByDeadline ? "H\u1ebft h\u1ea1n:" : "K\u1ebft th\u00fac:"} {formatDateYMD(job.expiryDate)}</span>
        </span>
      </div>

      <div className="relative z-10 mt-auto grid grid-cols-3 gap-2 text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4" />
          <span>{job.applicants ?? 0}</span>
        </div>
        <div className="flex items-center gap-2">
          <Eye className="w-4 h-4" />
          <span>{job.views ?? 0}</span>
        </div>
        <div className="flex items-center gap-2">
          <Bookmark className="w-4 h-4" />
          <span>{job.saved ?? 0}</span>
        </div>
      </div>
    </div>
  );
};
