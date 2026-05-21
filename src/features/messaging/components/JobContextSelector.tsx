import type { ThreadJob } from "@/features/messaging/types/messaging.types";
import { cn } from "@/lib/utils";
import { getJobColorClass } from "@/features/messaging/utils/jobColor";

interface JobContextSelectorProps {
  jobs: ThreadJob[];
  selectedJobId: string | null;
  onSelect: (jobId: string | null) => void;
}

export function JobContextSelector({ jobs, selectedJobId, onSelect }: JobContextSelectorProps) {
  return (
    <div className="job-ctx-selector border-t border-gray-200 bg-white/95 px-3 py-2 dark:border-gray-800 dark:bg-gray-900/90 sm:px-4">
      <button
        type="button"
        className={cn("ctx-chip", selectedJobId === null && "active active-general")}
        onClick={() => onSelect(null)}
      >
        Chung
      </button>

      {jobs.map((job) => {
        const active = selectedJobId === job.jobId;
        const colorClass = getJobColorClass(job.jobId);

        return (
          <button
            key={job.jobId}
            type="button"
            className={cn("ctx-chip", active && "active", colorClass)}
            onClick={() => onSelect(job.jobId)}
            title={job.jobTitle}
          >
            <span className={cn("job-tag-dot", colorClass)} />
            <span className="truncate">{job.jobTitle}</span>
            {job.unreadCount > 0 ? (
              <span className="ctx-unread">{job.unreadCount > 99 ? "99+" : job.unreadCount}</span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}

export default JobContextSelector;
