import { useState, useEffect, useCallback, useRef } from "react";
import { CandidateDetail } from "@/pages/SuggestionCandidate/CandidateDetail";
import PageMeta from "@/components/common/PageMeta";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import CandidateHorizontalList from "@/pages/SuggestionCandidate/CandidateHorizontalList";
import SearchCandidate from "./SearchCandidate";
import { suggestionCandidateService } from "@/services/suggestionCandidateService";
import {
  CandidateFilterRequest,
  SuggestionCandidateListItem,
  mapToListItem,
} from "@/types/suggestionCandidate";
import { Loader2 } from "lucide-react";

// SuggestionCandidate hiển thị danh sách gợi ý và chi tiết ứng viên.

const SuggestionCandidate = () => {
  const PAGE_SIZE = 8;
  // State cho candidate đã chọn
  const [selectedCandidate, setSelectedCandidate] =
    useState<SuggestionCandidateListItem | null>(null);

  // State cho search
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");

  // State cho filters
  const [filters, setFilters] = useState<CandidateFilterRequest>({});

  // State cho candidates list
  const [candidates, setCandidates] = useState<SuggestionCandidateListItem[]>(
    []
  );
  const [loading, setLoading] = useState(true); // Initial loading = true để hiển thị spinner ngay
  const [error, setError] = useState<string | null>(null);

  // Pagination state
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  // AbortController ref for cancellation
  const abortControllerRef = useRef<AbortController | null>(null);

  // Debounce search query - 500ms delay
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
      setPage(0); // Reset page when search changes
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch candidates when search query or filters change
  const fetchCandidates = useCallback(async () => {
    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new abort controller
    abortControllerRef.current = new AbortController();

    setLoading(true);
    setError(null);

    try {
      const response = await suggestionCandidateService.searchCandidates(
        debouncedQuery || undefined,
        filters,
        page,
        PAGE_SIZE, // Fetch PAGE_SIZE candidates per page
        abortControllerRef.current.signal
      );
      console.log(response)

      if (response) {
        const mappedCandidates = response.content.map(mapToListItem);
        setCandidates(mappedCandidates);
        setTotalPages(response.totalPages);
        setTotalElements(response.totalElements);
      } else {
        setCandidates([]);
        setTotalPages(0);
        setTotalElements(0);
      }
    } catch (err) {
      // Ignore abort errors
      if ((err as Error).name !== "AbortError") {
        setError("Có lỗi xảy ra khi tải danh sách ứng viên");
        console.error("Error fetching candidates:", err);
      }
    } finally {
      setLoading(false);
    }
  }, [debouncedQuery, filters, page]);

  // Trigger fetch when dependencies change
  useEffect(() => {
    fetchCandidates();

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [fetchCandidates]);

  useEffect(() => {
    if (candidates.length === 0) {
      setSelectedCandidate(null);
      return;
    }

    if (!selectedCandidate || !candidates.some((c) => c.id === selectedCandidate.id)) {
      setSelectedCandidate(candidates[0]);
    }
  }, [candidates, selectedCandidate]);

  // Handle search input change
  const handleSearchChange = useCallback((value: string) => {
    setSearchQuery(value);
  }, []);

  // Handle filter change
  const handleFilterChange = useCallback(
    (newFilters: Partial<CandidateFilterRequest>) => {
      setFilters((prev) => ({ ...prev, ...newFilters }));
      setPage(0); // Reset page when filters change
    },
    []
  );

  // Handle candidate selection
  const handleSelectCandidate = useCallback(
    (candidate: SuggestionCandidateListItem) => {
      setSelectedCandidate(candidate);
    },
    []
  );

  // Handle page change
  const handlePageChange = useCallback((newPage: number) => {
    setPage(newPage);
  }, []);

  return (
    <div className="min-h-screen bg-background px-4 py-4 md:px-6 md:py-6">
      {/* Thiết lập metadata và breadcrumb cho trang gợi ý ứng viên. */}
      <PageMeta title="HR - CareerGraph" description="HR - CareerGraph" />
      <PageBreadcrumb pageTitle="Tìm ứng viên" />

      {/* Khu vực tìm kiếm ứng viên. */}
      <SearchCandidate
        searchQuery={searchQuery}
        onSearchChange={handleSearchChange}
        filters={filters}
        onFilterChange={handleFilterChange}
      />

      {/* Loading state - hiển thị khi đang fetch */}
      {loading && candidates.length === 0 && (
        <div className="flex items-center justify-center py-12 bg-blue-50/50 dark:bg-blue-900/10 rounded-lg border border-blue-100 dark:border-blue-900/20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2 text-muted-foreground font-medium">
            Đang tìm kiếm ứng viên...
          </span>
        </div>
      )}
      
      {/* Loading overlay - khi có candidates cũ nhưng đang fetch page mới */}
      {loading && candidates.length > 0 && (
        <div className="flex items-center justify-center py-4 bg-blue-50/80 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-900/40 mb-4">
          <Loader2 className="h-5 w-5 animate-spin text-blue-600 dark:text-blue-400" />
          <span className="ml-2 text-sm text-blue-700 dark:text-blue-300 font-medium">
            Đang cập nhật...
          </span>
        </div>
      )}

      {/* Error state */}
      {error && !loading && (
        <div className="flex items-center justify-center py-8">
          <p className="text-destructive">{error}</p>
        </div>
      )}

      {/* Results info - hiển thị cả khi loading */}
      {!error && totalElements > 0 && (
        <div className="mb-4 flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Tìm thấy <span className="font-semibold text-blue-600 dark:text-blue-400">{totalElements}</span> ứng
            viên phù hợp
            {loading && <span className="ml-2 text-xs">(đang cập nhật...)</span>}
          </p>
          <p className="text-xs text-muted-foreground">
            Trang {page + 1} / {Math.max(totalPages, 1)}
          </p>
        </div>
      )}

      {/* Danh sách ứng viên gợi ý phía trên - hiển thị cả khi loading */}
      {!error && (
        <div className={loading ? "opacity-60 pointer-events-none" : ""}>
          <CandidateHorizontalList
            candidates={candidates}
            selectedCandidate={selectedCandidate}
            setSelectedCandidate={handleSelectCandidate}
            currentPage={page}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        </div>
      )}

      {/* Khu vực hiển thị chi tiết ứng viên đã chọn. */}
      <div className="w-full">
        <CandidateDetail candidate={selectedCandidate} />
      </div>
    </div>
  );
};

export default SuggestionCandidate;
