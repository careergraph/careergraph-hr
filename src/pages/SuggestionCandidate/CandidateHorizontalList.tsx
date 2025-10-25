import { useEffect, useMemo, useState } from "react";
import { Candidate } from "@/types/candidate";
import { Dispatch, SetStateAction } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface CandidateHorizontalListProps {
  candidates: Candidate[];
  selectedCandidate: Candidate | null;
  setSelectedCandidate: Dispatch<SetStateAction<Candidate | null>>;
}

const CandidateHorizontalList = ({
  candidates,
  selectedCandidate,
  setSelectedCandidate,
}: CandidateHorizontalListProps) => {
  const limitedCandidates = useMemo(() => candidates.slice(0, 10), [candidates]);
  const [page, setPage] = useState(0);

  const PAGE_SIZE = 3;
  const totalPages = Math.max(Math.ceil(limitedCandidates.length / PAGE_SIZE), 1);

  useEffect(() => {
    setPage((prev) => Math.min(prev, totalPages - 1));
  }, [totalPages]);

  const visibleCandidates = useMemo(() => {
    const start = page * PAGE_SIZE;
    return limitedCandidates.slice(start, start + PAGE_SIZE);
  }, [limitedCandidates, page]);

  const handlePrevious = () => {
    setPage((prev) => Math.max(prev - 1, 0));
  };

  const handleNext = () => {
    setPage((prev) => Math.min(prev + 1, totalPages - 1));
  };

  return (
    <div className="mb-6">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={handlePrevious}
          disabled={page === 0}
          className="flex h-10 w-10 items-center justify-center rounded-full border border-blue-200 bg-white text-blue-600 shadow-sm transition hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-blue-900/60 dark:bg-slate-900 dark:text-blue-300 dark:hover:bg-slate-900/80"
          aria-label="Xem ứng viên trước"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <div className="flex flex-1 items-stretch gap-3 mt-3">
          {visibleCandidates.map((candidate) => (
          <div
            key={candidate.id}
            className={`flex min-w-[200px] flex-1 flex-col justify-between rounded-xl border bg-white/90 p-3 shadow-sm transition-all backdrop-blur-sm dark:bg-slate-900/60 ${
              selectedCandidate?.id === candidate.id
                ? "border-blue-500 ring-2 ring-blue-200 dark:border-blue-500 dark:ring-blue-500/30"
                : "border-blue-100 hover:border-blue-300 dark:border-blue-900/40 dark:hover:border-blue-600"
            }`}
            onClick={() => setSelectedCandidate(candidate)}
          >
            <div className="mb-3 flex items-center gap-3">
              {/* Avatar */}
              {candidate.avatar ? (
                <img
                  src={candidate.avatar}
                  alt={candidate.name}
                  className="w-10 h-10 rounded-full object-cover"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center text-white font-bold">
                  {candidate.name.charAt(0)}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="font-semibold truncate">{candidate.name}</p>
                <p className="text-xs text-muted-foreground truncate">
                  {candidate.position}
                </p>
              </div>
            </div>

            {/* Labels */}
            <div className="flex flex-wrap gap-1 mt-1">
              {candidate.labels?.slice(0, 4).map((label, idx) => {
                const palette = [
                  "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-200",
                  "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-200",
                  "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-200",
                  "bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-200",
                ];
                return (
                  <span
                    key={idx}
                    className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      palette[idx % palette.length]
                    }`}
                  >
                  {label}
                  </span>
                );
              })}
            </div>
          </div>
          ))}

          {visibleCandidates.length < PAGE_SIZE &&
            Array.from({ length: PAGE_SIZE - visibleCandidates.length }).map((_, idx) => (
              <div
                key={`placeholder-${idx}`}
                className="flex min-w-[200px] flex-1 flex-col justify-between rounded-xl border border-dashed border-blue-100 bg-slate-50/60 p-3 text-sm text-slate-400 dark:border-blue-900/40 dark:bg-slate-900/40"
              >
                Đang cập nhật...
              </div>
            ))}
        </div>
        <button
          type="button"
          onClick={handleNext}
          disabled={page >= totalPages - 1}
          className="flex h-10 w-10 items-center justify-center rounded-full border border-blue-200 bg-white text-blue-600 shadow-sm transition hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-blue-900/60 dark:bg-slate-900 dark:text-blue-300 dark:hover:bg-slate-900/80"
          aria-label="Xem ứng viên tiếp theo"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

export default CandidateHorizontalList;
