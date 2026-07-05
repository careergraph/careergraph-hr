import { KeyboardEvent, MouseEvent, useEffect, useRef, useState } from "react";
import {
  Ban,
  Bookmark,
  Briefcase,
  CalendarDays,
  Check,
  Eye,
  MapPin,
  MoreVertical,
  Sparkles,
  Users,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatDateYMD } from "@/lib/dateUtils";
import { Job } from "@/types/job";
import { Status } from "@/enums/commonEnum";
import {
  EmploymentType,
  JOB_CATEGORY_OPTIONS,
  JobCategory,
} from "@/enums/workEnum";

interface JobCardProps {
  job: Job;
  onSelectJob?: () => void;
  onCloseJob?: (jobId: string) => void;
  onToggleAiScreening?: (jobId: string, enabled: boolean) => void;
  onOpenExpiryDialog?: (job: Job) => void;
  isActionLoading?: boolean;
}

export const JobCard = ({
  job,
  onSelectJob,
  onCloseJob,
  onToggleAiScreening,
  onOpenExpiryDialog,
  isActionLoading = false,
}: JobCardProps) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

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
    typeColors[job.type as keyof typeof typeColors] ??
    typeColors[EmploymentType.FULL_TIME];

  const currentStatus = job.status ?? Status.ACTIVE;
  const today = new Date().toISOString().slice(0, 10);
  const expiryDate = job.expiryDate?.slice(0, 10) ?? "";
  const formattedPostedDate = formatDateYMD(job.postedDate);
  const formattedExpiryDate = expiryDate ? formatDateYMD(expiryDate) : "Chưa đặt";
  const isClosed = currentStatus === Status.CLOSED;
  const isExpired = Boolean(expiryDate) && expiryDate < today && !isClosed;
  const displayStatusLabel = isExpired
    ? "Hết hạn"
    : currentStatus === Status.ACTIVE
    ? "Đang tuyển"
    : currentStatus === Status.INACTIVE
    ? "Tạm dừng"
    : currentStatus === Status.DRAFT
    ? "Bản nháp"
    : "Đã đóng";
  const extendActionLabel =
    isClosed || isExpired ? "Mở lại công việc" : "Gia hạn công việc";

  const typeLabelMap: Partial<Record<EmploymentType, string>> = {
    [EmploymentType.FULL_TIME]: "Toàn thời gian",
    [EmploymentType.PART_TIME]: "Bán thời gian",
    [EmploymentType.CONTRACT]: "Hợp đồng",
    [EmploymentType.INTERNSHIP]: "Thực tập",
    [EmploymentType.FREELANCE]: "Tự do",
    [EmploymentType.TEMPORARY]: "Tạm thời",
  };

  const jobCategoryLabel =
    JOB_CATEGORY_OPTIONS.find((option) => option.value === job.jobCategory)
      ?.label ??
    (job.jobCategory as JobCategory | undefined) ??
    "";

  useEffect(() => {
    if (!isMenuOpen) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };

    const handleEscape = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isMenuOpen]);

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

  const statusColor =
    isExpired
      ? "bg-red-100 text-red-700 dark:bg-red-950/30 dark:text-red-300"
      : currentStatus === Status.ACTIVE
      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300"
      : currentStatus === Status.DRAFT
      ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-950/30 dark:text-yellow-300"
      : currentStatus === Status.INACTIVE
      ? "bg-slate-200 text-slate-700 dark:bg-slate-800/60 dark:text-slate-200"
      : "bg-red-100 text-red-700 dark:bg-red-950/30 dark:text-red-300";

  const handleMenuAction = (action: () => void) => {
    setIsMenuOpen(false);
    action();
  };

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

      <div ref={menuRef} className="absolute right-3 top-3 z-20">
        <button
          type="button"
          aria-label="Tùy chọn công việc"
          aria-expanded={isMenuOpen}
          disabled={isActionLoading}
          onClick={(event) => {
            stopCardNavigation(event);
            setIsMenuOpen((prev) => !prev);
          }}
          className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border/60 bg-white text-muted-foreground shadow-sm transition hover:bg-slate-100 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-950 dark:hover:bg-slate-900"
        >
          <MoreVertical className="h-4 w-4" />
        </button>

        {isMenuOpen && (
          <div
            className="absolute right-0 mt-2 w-60 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_18px_50px_rgba(15,23,42,0.24)] dark:border-slate-700 dark:bg-slate-950"
            onClick={stopCardNavigation}
          >
            <button
              type="button"
              disabled={isClosed || isActionLoading}
              onClick={() =>
                handleMenuAction(() => {
                  onCloseJob?.(job.id);
                })
              }
              className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm text-red-600 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50 dark:text-red-400 dark:hover:bg-slate-900"
            >
              <Ban className="h-4 w-4" />
              <span>Đóng công việc</span>
            </button>

            <button
              type="button"
              disabled={isClosed || isActionLoading}
              onClick={() =>
                handleMenuAction(() => {
                  // eslint-disable-next-line no-extra-boolean-cast
                  onToggleAiScreening?.(job.id, !Boolean(job.aiScreeningEnabled));
                })
              }
              className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50 dark:text-slate-200 dark:hover:bg-slate-900"
            >
              <span className="inline-flex h-5 w-5 items-center justify-center rounded-md border border-slate-300 bg-white dark:border-slate-600 dark:bg-slate-900">
                {job.aiScreeningEnabled ? (
                  <Check className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                ) : (
                  <Sparkles className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500" />
                )}
              </span>
              <span>Cho phép AI sàng lọc</span>
            </button>

            <div className="h-px bg-slate-200 dark:bg-slate-800" />

            <button
              type="button"
              disabled={isActionLoading}
              onClick={() =>
                handleMenuAction(() => {
                  onOpenExpiryDialog?.(job);
                })
              }
              className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50 dark:text-slate-200 dark:hover:bg-slate-900"
            >
              <CalendarDays className="h-4 w-4" />
              <span>{extendActionLabel}</span>
            </button>
          </div>
        )}
      </div>

      <div className="mb-3 flex items-center justify-between pr-8">
        <div className={`rounded-xl p-2.5 ${color.bg}`}>
          <Briefcase className={`h-5 w-5 ${color.icon}`} />
        </div>
        <Badge className={`rounded-full px-2 py-1 text-sm ${color.badge}`}>
          {typeLabelMap[job.type as EmploymentType] ?? job.type}
        </Badge>
      </div>

      <div className="mb-3 flex items-start justify-between">
        <div className="min-w-0 flex-1">
          <h3
            className="line-clamp-1 text-lg font-bold text-foreground transition-colors group-hover:text-primary dark:text-slate-100"
            title={job.title}
          >
            {job.title}
          </h3>
          <p className="mt-1 text-sm text-muted-foreground dark:text-slate-300">
            {jobCategoryLabel}
          </p>
        </div>
        <Badge className={`ml-3 rounded-full px-2 py-1 text-sm ${statusColor}`}>
          {displayStatusLabel}
        </Badge>
      </div>

      <div className="mb-4 flex items-center gap-2 text-xs text-muted-foreground dark:text-slate-400">
        <span className="flex min-w-0 flex-1 items-center gap-1.5" title={job.city}>
          <MapPin className="h-3 w-3" />
          <span className="truncate">{job.city}</span>
        </span>
      </div>

      <div className="mb-4 grid grid-cols-2 gap-2 rounded-xl border border-border/60 bg-background/70 p-3 text-xs dark:border-slate-800 dark:bg-slate-950/40">
        <div className="min-w-0 rounded-lg bg-muted/60 px-3 py-2 dark:bg-slate-900/70">
          <span className="block text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            Ngày đăng
          </span>
          <span
            className="mt-1 block truncate text-sm font-semibold text-foreground dark:text-slate-100"
            title={formattedPostedDate}
          >
            {formattedPostedDate}
          </span>
        </div>
        <div className="min-w-0 rounded-lg bg-muted/60 px-3 py-2 dark:bg-slate-900/70">
          <span className="block text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            Hạn ứng tuyển
          </span>
          <span
            className={`mt-1 block truncate text-sm font-semibold ${
              isExpired
                ? "text-red-600 dark:text-red-400"
                : "text-foreground dark:text-slate-100"
            }`}
            title={formattedExpiryDate}
          >
            {formattedExpiryDate}
          </span>
        </div>
      </div>

      <div className="mt-auto flex items-center justify-between text-sm text-muted-foreground">
        <div className="flex items-center gap-2" title={`${job.saved ?? 0} lượt lưu`}>
          <Bookmark className="h-4 w-4" />
          <span>{job.saved ?? 0}</span>
        </div>
        <div className="flex items-center gap-2" title={`${job.views ?? 0} lượt xem`}>
          <Eye className="h-4 w-4" />
          <span>{job.views ?? 0}</span>
        </div>
        <div className="flex items-center gap-2" title={`${job.applicants ?? 0} lượt ứng tuyển`}>
          <Users className="h-4 w-4" />
          <span>{job.applicants ?? 0}</span>
        </div>
      </div>
    </div>
  );
};
