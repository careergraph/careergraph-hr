import type { ThreadJob } from "@/features/messaging/types/messaging.types";
import { cn } from "@/lib/utils";
import { getJobColorClass } from "@/features/messaging/utils/jobColor";

interface JobFilterBarProps {
  jobs: ThreadJob[];
  activeFilter: string | null;
  onFilter: (jobId: string | null) => void;
}

export function JobFilterBar({ jobs, activeFilter, onFilter }: JobFilterBarProps) {
  if (jobs.length < 2) {
    return null;
  }

  return (
    <div className="job-filter-bar border-b border-gray-200 px-3 py-2 dark:border-gray-800 sm:px-4">
      <button
        type="button"
        className={cn("filter-tab", activeFilter === null && "active")}
        onClick={() => onFilter(null)}
      >
        Tất cả
      </button>

      {jobs.map((job) => {
        const active = activeFilter === job.jobId;
        const colorClass = getJobColorClass(job.jobId);

        return (
          <button
            key={job.jobId}
            type="button"
            className={cn("filter-tab", active && "active", colorClass)}
            onClick={() => onFilter(job.jobId)}
          >
            <span className={cn("job-tag-dot", colorClass)} />
            <span className="truncate">{job.jobTitle}</span>
            {job.unreadCount > 0 ? (
              <span className="filter-badge">{job.unreadCount > 99 ? "99+" : job.unreadCount}</span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}

export default JobFilterBar;
