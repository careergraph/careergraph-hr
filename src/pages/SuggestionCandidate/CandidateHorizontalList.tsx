import { useMemo } from "react";
import { SuggestionCandidateListItem } from "@/types/suggestionCandidate";
import { ChevronLeft, ChevronRight, CheckCircle } from "lucide-react";

// CandidateHorizontalList hiển thị danh sách ứng viên dạng thẻ lướt ngang.

interface CandidateHorizontalListProps {
  candidates: SuggestionCandidateListItem[];
  selectedCandidate: SuggestionCandidateListItem | null;
  setSelectedCandidate: (candidate: SuggestionCandidateListItem) => void;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

const CandidateHorizontalList = ({
  candidates,
  selectedCandidate,
  setSelectedCandidate,
  currentPage,
  totalPages,
  onPageChange,
}: CandidateHorizontalListProps) => {
  // Hiển thị tối đa 3 ứng viên trên một trang
  const PAGE_SIZE = 3;

  // Tính toán những ứng viên nằm trong view hiện tại
  const visibleCandidates = useMemo(() => {
    return candidates.slice(0, PAGE_SIZE);
  }, [candidates]);

  const handlePrevious = () => {
    if (currentPage > 0) {
      onPageChange(currentPage - 1);
    }
  };

  const handleNext = () => {
    if (currentPage < totalPages - 1) {
      onPageChange(currentPage + 1);
    }
  };

  return (
    <div className="mb-6">
      {/* Thanh điều hướng và các thẻ ứng viên gợi ý. */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={handlePrevious}
          disabled={currentPage === 0}
          className="flex h-10 w-10 items-center justify-center rounded-full border border-blue-200 bg-white text-blue-600 shadow-sm transition hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-blue-900/60 dark:bg-slate-900 dark:text-blue-300 dark:hover:bg-slate-900/80"
          aria-label="Xem ứng viên trước"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <div className="flex flex-1 items-stretch gap-3 mt-3">
          {visibleCandidates.map((candidate) => (
            <div
              key={candidate.id}
              className={`flex min-w-[200px] flex-1 flex-col justify-between rounded-xl border bg-white/90 p-3 shadow-sm transition-all backdrop-blur-sm dark:bg-slate-900/60 cursor-pointer ${
                selectedCandidate?.id === candidate.id
                  ? "border-blue-500 ring-2 ring-blue-200 dark:border-blue-500 dark:ring-blue-500/30"
                  : "border-blue-100 hover:border-blue-300 dark:border-blue-900/40 dark:hover:border-blue-600"
              }`}
              onClick={() => setSelectedCandidate(candidate)}
            >
              <div className="mb-3 flex items-center gap-3">
                {/* Ảnh đại diện hoặc ký tự viết tắt của ứng viên. */}
                {candidate.avatar ? (
                  <img
                    src={candidate.avatar}
                    alt={candidate.name}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold">
                    {candidate.name.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1">
                    <p className="font-semibold truncate">{candidate.name}</p>
                    {candidate.isOpenToWork && (
                      <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground truncate">
                    {candidate.position}
                  </p>
                </div>
              </div>

              {/* Thông tin bổ sung */}
              <div className="text-xs text-muted-foreground mb-2">
                <p className="truncate">{candidate.experience}</p>
                <p className="truncate">{candidate.location}</p>
              </div>

              {/* Nhãn kỹ năng của ứng viên. */}
              <div className="flex flex-wrap gap-1 mt-1">
                {candidate.skills && candidate.skills.length > 0 && (
                  <>
                    {candidate.skills.slice(0, 3).map((skill, idx) => {
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
                          {skill}
                        </span>
                      );
                    })}

                    {candidate.skills.length > 3 && (
                      <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-gray-200 text-gray-700 dark:bg-slate-700 dark:text-gray-300">
                        +{candidate.skills.length - 3}
                      </span>
                    )}
                  </>
                )}
              </div>

              {/* Score indicator nếu có */}
              {candidate.score !== undefined && candidate.score > 0 && (
                <div className="mt-2 flex items-center gap-1">
                  <div className="h-1 flex-1 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-blue-400 to-blue-600 rounded-full"
                      style={{ width: `${Math.min((candidate.score * 10 >= 100 ? 100 : (candidate.score*10 <= 20 ? 20 : candidate.score*10)), 100)}%` }}
                    />
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {(candidate.score * 10 >= 100 ? 100 : (candidate.score*10 <= 20 ? 20 : candidate.score*10)).toFixed(0)}%
                  </span>
                </div>
              )}
            </div>
          ))}

          {/* Placeholder nếu không đủ ứng viên */}
          {visibleCandidates.length < PAGE_SIZE &&
            Array.from({ length: PAGE_SIZE - visibleCandidates.length }).map(
              (_, idx) => (
                <div
                  key={`placeholder-${idx}`}
                  className="flex min-w-[200px] flex-1 flex-col justify-center items-center rounded-xl border border-dashed border-blue-100 bg-slate-50/60 p-3 text-sm text-slate-400 dark:border-blue-900/40 dark:bg-slate-900/40"
                >
                  {candidates.length === 0
                    ? "Không tìm thấy ứng viên"
                    : "Đang cập nhật..."}
                </div>
              )
            )}
        </div>
        <button
          type="button"
          onClick={handleNext}
          disabled={currentPage >= totalPages - 1}
          className="flex h-10 w-10 items-center justify-center rounded-full border border-blue-200 bg-white text-blue-600 shadow-sm transition hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-blue-900/60 dark:bg-slate-900 dark:text-blue-300 dark:hover:bg-slate-900/80"
          aria-label="Xem ứng viên tiếp theo"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* Pagination info */}
      {totalPages > 0 && (
        <div className="mt-2 text-center text-xs text-muted-foreground">
          Trang {currentPage + 1} / {totalPages}
        </div>
      )}
    </div>
  );
};

export default CandidateHorizontalList;
