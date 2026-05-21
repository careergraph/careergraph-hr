import { useEffect, useMemo, useRef, useState } from "react";
import { Briefcase, Check, ChevronsUpDown, Search, X } from "lucide-react";

export type JobFilterOption = {
  id: string;
  title: string;
};

interface JobMultiSelectFilterProps {
  jobs: JobFilterOption[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
}

export default function JobMultiSelectFilter({
  jobs,
  selectedIds,
  onChange,
}: JobMultiSelectFilterProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const rootRef = useRef<HTMLDivElement | null>(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);

  const selectedJobs = useMemo(
    () => jobs.filter((job) => selectedIds.includes(job.id)),
    [jobs, selectedIds]
  );

  const visibleJobs = useMemo(() => {
    const normalized = search.trim().toLowerCase();
    if (!normalized) return jobs;
    return jobs.filter((job) => job.title.toLowerCase().includes(normalized));
  }, [jobs, search]);

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  useEffect(() => {
    if (open) {
      window.setTimeout(() => searchInputRef.current?.focus(), 0);
    }
  }, [open]);

  const toggleJob = (jobId: string) => {
    onChange(
      selectedIds.includes(jobId)
        ? selectedIds.filter((id) => id !== jobId)
        : [...selectedIds, jobId]
    );
  };

  const clearJobs = () => {
    onChange([]);
    setSearch("");
  };

  const triggerButton = open ? (
    <button
      type="button"
      onClick={() => setOpen((value) => !value)}
      className="flex h-10 w-full items-center justify-between rounded-lg border border-gray-200 bg-white px-3 text-left text-sm text-gray-700 shadow-sm transition hover:bg-gray-50 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-gray-800"
      aria-expanded="true"
    >
      <span className="flex min-w-0 items-center gap-2">
        <Briefcase className="h-4 w-4 shrink-0 text-gray-400" />
        <span className="truncate">
          {selectedJobs.length === 0
            ? "Tất cả công việc"
            : selectedJobs.length === 1
              ? selectedJobs[0].title
              : `${selectedJobs.length} công việc đã chọn`}
        </span>
      </span>
      <ChevronsUpDown className="h-4 w-4 shrink-0 text-gray-400" />
    </button>
  ) : (
    <button
      type="button"
      onClick={() => setOpen((value) => !value)}
      className="flex h-10 w-full items-center justify-between rounded-lg border border-gray-200 bg-white px-3 text-left text-sm text-gray-700 shadow-sm transition hover:bg-gray-50 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-gray-800"
      aria-expanded="false"
    >
      <span className="flex min-w-0 items-center gap-2">
        <Briefcase className="h-4 w-4 shrink-0 text-gray-400" />
        <span className="truncate">
          {selectedJobs.length === 0
            ? "Tất cả công việc"
            : selectedJobs.length === 1
              ? selectedJobs[0].title
              : `${selectedJobs.length} công việc đã chọn`}
        </span>
      </span>
      <ChevronsUpDown className="h-4 w-4 shrink-0 text-gray-400" />
    </button>
  );

  return (
    <div ref={rootRef} className="relative">
      {triggerButton}

      {open && (
        <div className="absolute left-0 top-[calc(100%+0.5rem)] z-80 w-[min(520px,calc(100vw-2rem))] overflow-hidden rounded-xl border border-gray-200 bg-white text-gray-900 shadow-2xl dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100">
          <div className="border-b border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-gray-950">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                ref={searchInputRef}
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Tìm công việc..."
                className="h-9 w-full rounded-lg border border-gray-200 bg-white pl-9 pr-3 text-sm text-gray-700 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
              />
            </div>
          </div>

          <div className="max-h-72 overflow-y-auto bg-white p-2 dark:bg-gray-950">
            {visibleJobs.length === 0 ? (
              <div className="px-3 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
                Khong tim thay cong viec phu hop
              </div>
            ) : (
              visibleJobs.map((job) => {
                const checked = selectedIds.includes(job.id);
                return (
                  <button
                    key={job.id}
                    type="button"
                    onClick={() => toggleJob(job.id)}
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm text-gray-700 transition hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-gray-800"
                  >
                    <span
                      aria-hidden="true"
                      className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
                        checked
                          ? "border-brand-600 bg-brand-600 text-white"
                          : "border-gray-300 bg-white dark:border-gray-600 dark:bg-gray-900"
                      }`}
                    >
                      {checked && <Check className="h-3 w-3" />}
                    </span>
                    <span className="min-w-0 flex-1 truncate">{job.title}</span>
                  </button>
                );
              })
            )}
          </div>

          {selectedIds.length > 0 && (
            <div className="flex items-center justify-between border-t border-gray-200 bg-white px-3 py-2 dark:border-gray-700 dark:bg-gray-950">
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {selectedIds.length} cong viec dang duoc loc
              </span>
              <button
                type="button"
                onClick={clearJobs}
                className="inline-flex h-8 items-center gap-1 rounded-lg px-2 text-xs font-medium text-gray-600 transition hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-800"
              >
                <X className="h-3.5 w-3.5" />
                Xoa loc job
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
