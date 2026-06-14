import {
  Bookmark,
  Briefcase,
  CalendarClock,
  Eye,
  MapPin,
  MoreVertical,
  RefreshCw,
  Users,
} from "lucide-react";
import { KeyboardEvent, MouseEvent } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Status } from "@/enums/commonEnum";
import {
  EmploymentType,
  JOB_CATEGORY_OPTIONS,
  JobCategory,
} from "@/enums/workEnum";
import { formatDateYMD } from "@/lib/dateUtils";
import { getJobDisplayStatus, isJobExpired } from "@/lib/jobStatus";
import { Job } from "@/types/job";

interface JobCardProps {
  job: Job;
  onSelectJob?: () => void;
  onManageExpiry?: () => void;
  onCloseJob?: (jobId: string) => void;
  isActionLoading?: boolean;
}

export const JobCard = ({
  job,
  onSelectJob,
  onManageExpiry,
  onCloseJob,
  isActionLoading = false,
}: JobCardProps) => {
  const typeColors = {
    [EmploymentType.FULL_TIME]: {
      badge: "text-cyan-700 bg-cyan-100 dark:text-cyan-300 dark:bg-cyan-950/30",
      icon: "text-cyan-600 dark:text-cyan-400",
      bg: "bg-cyan-100 dark:bg-cyan-950/30",
      gradient:
        "from-cyan-500/20 via-transparent to-transparent dark:from-cyan-400/15 dark:via-transparent dark:to-transparent",
    },
    [EmploymentType.PART_TIME]: {
      badge: "text-blue-700 bg-blue-100 dark:text-blue-300 dark:bg-blue-950/30",
      icon: "text-blue-600 dark:text-blue-400",
      bg: "bg-blue-100 dark:bg-blue-950/30",
      gradient:
        "from-sky-500/20 via-transparent to-transparent dark:from-sky-400/15 dark:via-transparent dark:to-transparent",
    },
    [EmploymentType.CONTRACT]: {
      badge:
        "text-violet-700 bg-violet-100 dark:text-violet-300 dark:bg-violet-950/30",
      icon: "text-violet-600 dark:text-violet-400",
      bg: "bg-violet-100 dark:bg-violet-950/30",
      gradient:
        "from-violet-500/20 via-transparent to-transparent dark:from-violet-500/15 dark:via-transparent dark:to-transparent",
    },
    [EmploymentType.INTERNSHIP]: {
      badge:
        "text-green-700 bg-green-100 dark:text-green-300 dark:bg-green-950/30",
      icon: "text-green-600 dark:text-green-400",
      bg: "bg-green-100 dark:bg-green-950/30",
      gradient:
        "from-emerald-500/20 via-transparent to-transparent dark:from-emerald-400/15 dark:via-transparent dark:to-transparent",
    },
    [EmploymentType.FREELANCE]: {
      badge:
        "text-orange-700 bg-orange-100 dark:text-orange-300 dark:bg-orange-950/30",
      icon: "text-orange-600 dark:text-orange-400",
      bg: "bg-orange-100 dark:bg-orange-950/30",
      gradient:
        "from-amber-500/20 via-transparent to-transparent dark:from-amber-400/15 dark:via-transparent dark:to-transparent",
    },
    [EmploymentType.TEMPORARY]: {
      badge: "text-pink-700 bg-pink-100 dark:text-pink-300 dark:bg-pink-950/30",
      icon: "text-pink-600 dark:text-pink-400",
      bg: "bg-pink-100 dark:bg-pink-950/30",
      gradient:
        "from-pink-500/20 via-transparent to-transparent dark:from-pink-400/15 dark:via-transparent dark:to-transparent",
    },
  } as const;

  const color =
    typeColors[job.type as keyof typeof typeColors] ||
    typeColors[EmploymentType.FULL_TIME];

  const currentStatus = job.status ?? Status.ACTIVE;
  const displayStatus = getJobDisplayStatus(currentStatus, job.expiryDate);
  const isExpiredByDeadline = isJobExpired(job.expiryDate);
  const isClosed = displayStatus.status === Status.CLOSED;

  const typeLabelMap: Partial<Record<EmploymentType, string>> = {
    [EmploymentType.FULL_TIME]: "Toàn thời gian",
    [EmploymentType.PART_TIME]: "Bán thời gian",
    [EmploymentType.CONTRACT]: "Hợp đồng",
    [EmploymentType.INTERNSHIP]: "Thực tập",
    [EmploymentType.FREELANCE]: "Tự do",
    [EmploymentType.TEMPORARY]: "Tạm thời",
  };

  const statusLabelMap: Record<Status, string> = {
    [Status.ACTIVE]: "Đang tuyển",
    [Status.INACTIVE]: "Tạm dừng",
    [Status.DRAFT]: "Bản nháp",
    [Status.CLOSED]: "Đã đóng",
  };

  const jobCategoryLabel =
    JOB_CATEGORY_OPTIONS.find((option) => option.value === job.jobCategory)
      ?.label ??
    (job.jobCategory as JobCategory | undefined) ??
    "";
  const departmentLabel = job.department?.trim() ?? "";
  const summaryLabel = jobCategoryLabel || departmentLabel;
  const statusLabel = isExpiredByDeadline
    ? "Hết hạn"
    : statusLabelMap[displayStatus.status];

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (!onSelectJob) return;
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onSelectJob();
    }
  };

  const stopCardNavigation = (event: MouseEvent) => {
    event.stopPropagation();
  };

  const statusColor = isExpiredByDeadline
    ? "bg-rose-100 text-rose-700 dark:bg-rose-950/30 dark:text-rose-300"
    : displayStatus.status === Status.ACTIVE
      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300"
      : displayStatus.status === Status.DRAFT
        ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-950/30 dark:text-yellow-300"
        : displayStatus.status === Status.INACTIVE
          ? "bg-slate-200 text-slate-700 dark:bg-slate-800/60 dark:text-slate-200"
          : "bg-red-100 text-red-700 dark:bg-red-950/30 dark:text-red-300";

  const manageLabel = displayStatus.requiresReopen ? "Mở lại" : "Gia hạn";

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onSelectJob}
      onKeyDown={handleKeyDown}
      className="group relative flex cursor-pointer flex-col justify-between overflow-hidden rounded-2xl border border-border bg-card p-6 transition-all duration-300 hover:scale-[1.02] hover:bg-accent/50 hover:shadow-lg active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-primary/40 focus:ring-offset-2 focus:ring-offset-background dark:bg-slate-900 dark:hover:bg-slate-800/70"
    >
      <div
        className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${color.gradient} opacity-60 transition-opacity duration-300 group-hover:opacity-80`}
      />

      {onCloseJob && currentStatus !== Status.DRAFT && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              aria-label="Tùy chọn công việc"
              disabled={isActionLoading}
              onClick={stopCardNavigation}
              className="absolute right-3 top-3 z-10 inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border/60 bg-background/90 text-muted-foreground shadow-sm transition hover:bg-accent hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
            >
              <MoreVertical className="h-4 w-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="w-48 border border-border bg-popover shadow-md"
            onClick={stopCardNavigation}
          >
            <DropdownMenuItem
              disabled={isClosed || isActionLoading}
              onClick={() => onCloseJob(job.id)}
              className="text-red-600 focus:text-red-600 dark:text-red-400"
            >
              Đóng công việc
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}

      <div className="relative z-10 mb-3 flex items-center justify-between gap-2 pr-8">
        <div className={`rounded-xl p-2.5 ${color.bg}`}>
          <Briefcase className={`h-5 w-5 ${color.icon}`} />
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
          <Badge
            className={`rounded-full px-2.5 py-1 text-xs font-semibold ${color.badge}`}
          >
            {typeLabelMap[job.type as EmploymentType] ?? job.type}
          </Badge>
        </div>
      </div>

      <div className="relative z-10 mb-3 flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h3
            className="line-clamp-1 text-lg font-bold text-foreground transition-colors group-hover:text-primary dark:text-slate-100"
            title={job.title}
          >
            {job.title}
          </h3>
          {summaryLabel && (
            <p className="mt-1 line-clamp-1 text-sm text-muted-foreground dark:text-slate-300">
              {summaryLabel}
            </p>
          )}
        </div>
        <Badge
          className={`ml-3 rounded-full px-2 py-1 text-xs font-semibold ${statusColor}`}
        >
          {statusLabel}
        </Badge>
      </div>

      <div className="relative z-10 mb-4 grid gap-2 text-xs text-muted-foreground dark:text-slate-400">
        {job.city && (
          <span className="flex items-center gap-1">
            <MapPin className="h-3 w-3 shrink-0" />
            <span className="truncate">{job.city}</span>
          </span>
        )}
        <span className="flex items-center gap-1">
          <CalendarClock className="h-3 w-3 shrink-0" />
          <span>
            {isExpiredByDeadline ? "Hết hạn:" : "Kết thúc:"}{" "}
            {formatDateYMD(job.expiryDate)}
          </span>
        </span>
      </div>

      <div className="relative z-10 mt-auto grid grid-cols-3 gap-2 text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4" />
          <span>{job.applicants ?? 0}</span>
        </div>
        <div className="flex items-center gap-2">
          <Eye className="h-4 w-4" />
          <span>{job.views ?? 0}</span>
        </div>
        <div className="flex items-center gap-2">
          <Bookmark className="h-4 w-4" />
          <span>{job.saved ?? 0}</span>
        </div>
      </div>
    </div>
  );
};
