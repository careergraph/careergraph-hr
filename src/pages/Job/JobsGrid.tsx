import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { ListFilter } from "lucide-react";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import PageMeta from "@/components/common/PageMeta";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { JobCard } from "./JobCard";
import { JobExpiryDialog } from "./JobExpiryDialog";
import JobFilters, {
  JobFilterState,
  initialJobFilterState,
} from "./JobFilters";
import { Job } from "@/types/job";
import { Status } from "@/enums/commonEnum";
import { EmploymentType, JobCategory } from "@/enums/workEnum";
import { jobService, type JobSettingsPayload } from "@/services/jobService";
import { useAuthStore } from "@/stores/authStore";
import { jobsData as fallbackJobs } from "@/data/jobsData";

const normalizeKey = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[â€™'`]/g, "")
    .replace(/[\s&/-]+/g, "_")
    .toUpperCase();

const employmentTypeMap: Record<string, EmploymentType> = {
  FULL_TIME: EmploymentType.FULL_TIME,
  FULLTIME: EmploymentType.FULL_TIME,
  PART_TIME: EmploymentType.PART_TIME,
  PARTTIME: EmploymentType.PART_TIME,
  CONTRACT: EmploymentType.CONTRACT,
  FREELANCE: EmploymentType.FREELANCE,
  TEMPORARY: EmploymentType.TEMPORARY,
  INTERNSHIP: EmploymentType.INTERNSHIP,
};

const statusMap: Record<string, Status> = {
  ACTIVE: Status.ACTIVE,
  DRAFT: Status.DRAFT,
  INACTIVE: Status.INACTIVE,
  CLOSED: Status.CLOSED,
};

const jobCategoryMap: Record<string, JobCategory> = {
  ENGINEER: JobCategory.ENGINEER,
  ENGINEERING: JobCategory.ENGINEER,
  TECHNOLOGY: JobCategory.TECHNOLOGY,
  SOFTWARE_ENGINEERING: JobCategory.TECHNOLOGY,
  SOFTWARE: JobCategory.TECHNOLOGY,
  BUSINESS: JobCategory.BUSINESS,
  BUSINESS_OPERATIONS: JobCategory.BUSINESS,
  ART_MUSIC: JobCategory.ART_MUSIC,
  ART_AND_MUSIC: JobCategory.ART_MUSIC,
  DESIGN: JobCategory.DESIGN,
  ADMINISTRATION: JobCategory.ADMINISTRATION,
  ADMIN: JobCategory.ADMINISTRATION,
  SALES: JobCategory.SALES,
  EDUCATION: JobCategory.EDUCATION,
  TRAINING: JobCategory.EDUCATION,
  CUSTOMER_SERVICE: JobCategory.CUSTOMER_SERVICE,
  CUSTOMER_SUCCESS: JobCategory.CUSTOMER_SERVICE,
  SUPPORT: JobCategory.CUSTOMER_SERVICE,
  MANUFACTURING: JobCategory.MANUFACTURING,
  PRODUCTION: JobCategory.MANUFACTURING,
};

const toEmploymentType = (
  value?: string | null
): EmploymentType | undefined => {
  if (!value) return undefined;
  return employmentTypeMap[normalizeKey(value)] ?? undefined;
};

const toStatus = (value?: string | null): Status => {
  if (!value) return Status.ACTIVE;
  return statusMap[normalizeKey(value)] ?? Status.ACTIVE;
};

const toJobCategory = (value?: string | null): JobCategory | undefined => {
  if (!value) return undefined;
  return jobCategoryMap[normalizeKey(value)] ?? undefined;
};

const normalizeSkillIds = (skills: unknown): Job["skills"] => {
  if (!skills) return [];

  if (Array.isArray(skills)) {
    return skills
      .map((skill) => {
        if (typeof skill === "string") {
          return { id: skill, name: skill };
        }

        if (skill && typeof skill === "object") {
          const skillObj = skill as { id?: string; name?: string };
          const id = skillObj.id ?? skillObj.name;
          if (!id) return undefined;
          return { id, name: skillObj.name ?? id };
        }

        return undefined;
      })
      .filter((item): item is { id: string; name: string } => Boolean(item));
  }

  return [];
};

const generateId = () => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

const normalizeJob = (raw: Record<string, unknown>): Job => {
  const employmentType = toEmploymentType(
    (raw.employmentType ?? raw.type ?? "") as string | undefined
  );
  const jobCategory = toJobCategory(
    (raw.jobCategory ?? raw.category ?? raw.departmentCategory ?? "") as
      | string
      | undefined
  );

  const idValue = (raw.id ?? raw.jobId ?? raw.uuid) as
    | string
    | number
    | undefined;
  const id = idValue ? String(idValue) : generateId();

  return {
    id,
    title: (raw.title as string) ?? "Tin tuyển dụng",
    description: (raw.description as string) ?? "",
    department:
      (raw.department as string) ??
      (raw.departmentName as string) ??
      jobCategory ??
      "",
    responsibilities: (raw.responsibilities as string[]) ?? [],
    qualifications: (raw.qualifications as string[]) ?? [],
    minimumQualifications: (raw.minimumQualifications as string[]) ?? [],
    minExperience:
      typeof raw.minExperience === "number" ? raw.minExperience : undefined,
    maxExperience:
      typeof raw.maxExperience === "number" ? raw.maxExperience : undefined,
    experienceLevel:
      (raw.experienceLevel as Job["experienceLevel"]) ?? undefined,
    jobCategory,
    employmentType,
    type: employmentType,
    education: (raw.education as Job["education"]) ?? undefined,
    state: (raw.state as string) ?? undefined,
    city: (raw.city as string) ?? (raw.cityName as string) ?? "",
    district: (raw.district as string) ?? undefined,
    specific: (raw.address as string) ?? (raw.specific as string) ?? undefined,
    remoteJob: Boolean(raw.remoteJob),
    salaryRange: (raw.salaryRange as string) ?? undefined,
    contactEmail: (raw.contactEmail as string) ?? undefined,
    contactPhone: (raw.contactPhone as string) ?? undefined,
    benefits: (raw.benefits as string[]) ?? undefined,
    numberOfPositions:
      typeof raw.numberOfPositions === "number"
        ? raw.numberOfPositions
        : undefined,
    expiryDate: (raw.expiryDate as string) ?? undefined,
    skills: normalizeSkillIds(raw.skills ?? raw.skillIds),
    applicationRequirements:
      (raw.applicationRequirements as Job["applicationRequirements"]) ??
      undefined,
    promotionType: (raw.promotionType as Job["promotionType"]) ?? undefined,
    status: toStatus((raw.status as string) ?? undefined),
    aiScreeningEnabled: Boolean(raw.aiScreeningEnabled),
    postedDate: raw.postedDate
      ? new Date(raw.postedDate as string)
      : raw.createdAt
      ? new Date(raw.createdAt as string)
      : new Date(),
    applicants: typeof raw.applicants === "number" ? raw.applicants : 0,
    views: typeof raw.views === "number" ? raw.views : 0,
    saved: typeof raw.saved === "number" ? raw.saved : 0,
    likes: typeof raw.likes === "number" ? raw.likes : 0,
    shares: typeof raw.shares === "number" ? raw.shares : 0,
    timeline: [],
  };
};

const extractJobsFromResponse = (
  response: unknown
): Record<string, unknown>[] => {
  if (!response) return [];

  if (Array.isArray(response)) {
    return response as Record<string, unknown>[];
  }

  if (typeof response === "object") {
    const dataObject = response as Record<string, unknown>;

    if (Array.isArray(dataObject.content)) {
      return dataObject.content as Record<string, unknown>[];
    }

    if (Array.isArray(dataObject.items)) {
      return dataObject.items as Record<string, unknown>[];
    }

    if (Array.isArray(dataObject.results)) {
      return dataObject.results as Record<string, unknown>[];
    }
  }

  return [];
};

const SKELETON_COUNT = 6;
const PAGE_SIZE = 9;

export default function JobsGrid() {
  const navigate = useNavigate();
  const { accessToken, company, user } = useAuthStore();
  const companyId = company?.id ?? user?.companyId ?? null;

  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState<JobFilterState>({
    ...initialJobFilterState,
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [totalResults, setTotalResults] = useState<number | null>(null);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [actionJobId, setActionJobId] = useState<string | null>(null);
  const [expiryDialogJob, setExpiryDialogJob] = useState<Job | null>(null);

  useEffect(() => {
    const handler = window.setTimeout(() => {
      setDebouncedSearch(searchTerm.trim());
    }, 300);

    return () => {
      window.clearTimeout(handler);
    };
  }, [searchTerm]);

  useEffect(() => {
    if (!accessToken || !companyId) {
      setJobs([]);
      setTotalResults(0);
      setLoading(false);
      return;
    }

    let active = true;
    const controller = new AbortController();

    const fetchJobs = async () => {
      setLoading(true);

      try {
        const response = await jobService.searchJobs(
          companyId,
          {
            query: debouncedSearch || undefined,
            statuses: filters.statuses,
            employmentTypes: filters.employmentTypes,
            jobCategories: filters.categories,
            page,
            size: PAGE_SIZE,
          },
          controller.signal
        );

        const rawJobs = extractJobsFromResponse(response);
        const normalizedJobs = rawJobs.map(normalizeJob);
        const total =
          typeof (response as { totalElements?: number }).totalElements ===
          "number"
            ? (response as { totalElements: number }).totalElements
            : typeof (response as { total?: number }).total === "number"
            ? (response as { total: number }).total
            : normalizedJobs.length;

        if (active) {
          setJobs(normalizedJobs);
          setTotalResults(total);
          setTotalPages(total > 0 ? Math.ceil(total / PAGE_SIZE) : 0);
        }
      } catch (error) {
        if (controller.signal.aborted) {
          console.log(`Fetch jobs request was aborted: ${error}`);
          return;
        }

        if (active) {
          const fallbackSlice = fallbackJobs.slice(
            page * PAGE_SIZE,
            page * PAGE_SIZE + PAGE_SIZE
          );
          setJobs(fallbackSlice);
          setTotalResults(fallbackJobs.length);
          setTotalPages(
            fallbackJobs.length > 0
              ? Math.ceil(fallbackJobs.length / PAGE_SIZE)
              : 0
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    fetchJobs();

    return () => {
      active = false;
      controller.abort();
    };
  }, [accessToken, companyId, debouncedSearch, filters, page]);

  useEffect(() => {
    if (totalPages === 0) {
      if (page !== 0) {
        setPage(0);
      }
      return;
    }

    if (page >= totalPages) {
      setPage(totalPages - 1);
    }
  }, [page, totalPages]);

  const hasJobs = jobs.length > 0;

  const upsertJob = useCallback((updatedJob: unknown) => {
    const normalized = normalizeJob(updatedJob as Record<string, unknown>);
    setJobs((prev) =>
      prev.map((job) => (job.id === normalized.id ? { ...job, ...normalized } : job))
    );
    setExpiryDialogJob((prev) =>
      prev?.id === normalized.id ? { ...prev, ...normalized } : prev
    );
  }, []);

  const handleSelectJob = useCallback(
    (jobId: string) => {
      navigate(`/kanbans/${jobId}`);
    },
    [navigate]
  );

  const handleEditDraft = useCallback(
    (jobId: string) => {
      navigate(`/jobs/new?draftId=${encodeURIComponent(jobId)}`);
    },
    [navigate]
  );

  const handleFilterChange = useCallback((nextFilters: JobFilterState) => {
    setFilters(nextFilters);
    setPage(0);
  }, []);

  const handleResetFilters = useCallback(() => {
    setFilters({ ...initialJobFilterState });
    setSearchTerm("");
    setPage(0);
  }, []);

  const handleSearchChange = useCallback((value: string) => {
    setSearchTerm(value);
    setPage(0);
  }, []);

  const handlePageChange = useCallback(
    (nextPage: number) => {
      if (nextPage === page) return;
      if (nextPage < 0) return;
      if (totalPages > 0 && nextPage >= totalPages) return;
      setPage(nextPage);
    },
    [page, totalPages]
  );

  const handleOpenExpiryDialog = useCallback((job: Job) => {
    setExpiryDialogJob(job);
  }, []);

  const handleCloseExpiryDialog = useCallback(() => {
    if (actionJobId) return;
    setExpiryDialogJob(null);
  }, [actionJobId]);

  const handleCloseJob = useCallback(
    async (jobId: string) => {
      setActionJobId(jobId);
      try {
        const updatedJob = await jobService.closeJob(jobId);
        upsertJob(updatedJob);
        toast.success("Đã đóng công việc. Ứng viên không thể ứng tuyển thêm.");
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Không thể đóng công việc.";
        toast.error(message);
      } finally {
        setActionJobId(null);
      }
    },
    [upsertJob]
  );

  const handleToggleAiScreening = useCallback(
    async (jobId: string, enabled: boolean) => {
      setActionJobId(jobId);
      try {
        const updatedJob = await jobService.updateAiScreening(jobId, enabled);
        upsertJob(updatedJob);
        toast.success(
          enabled
            ? "Đã bật sàng lọc AI cho công việc này."
            : "Đã tắt sàng lọc AI cho công việc này."
        );
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "Không thể cập nhật sàng lọc AI.";
        toast.error(message);
      } finally {
        setActionJobId(null);
      }
    },
    [upsertJob]
  );

  const handleSaveExpiry = useCallback(
    async (jobId: string, payload: JobSettingsPayload) => {
      setActionJobId(jobId);
      try {
        const updatedJob = await jobService.updateJobSettings(jobId, payload);
        upsertJob(updatedJob);
        setExpiryDialogJob(null);

        if (payload.status === Status.ACTIVE) {
          toast.success("Đã mở lại công việc và cập nhật hạn tuyển dụng.");
        } else {
          toast.success("Đã gia hạn công việc.");
        }
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "Không thể cập nhật ngày kết thúc.";
        toast.error(message);
      } finally {
        setActionJobId(null);
      }
    },
    [upsertJob]
  );

  const pageNumbers = useMemo(() => {
    if (totalPages <= 0) return [] as number[];

    const visiblePages = 5;
    const halfRange = Math.floor(visiblePages / 2);
    let start = Math.max(0, page - halfRange);
    let end = start + visiblePages - 1;

    if (end >= totalPages) {
      end = totalPages - 1;
      start = Math.max(0, end - visiblePages + 1);
    }

    return Array.from({ length: end - start + 1 }, (_, index) => start + index);
  }, [page, totalPages]);

  const canGoPrevious = page > 0;
  const canGoNext = totalPages > 0 && page < totalPages - 1;
  const hasPagination =
    typeof totalResults === "number" && totalResults > 0 && totalPages > 0;
  const startItem = hasPagination ? page * PAGE_SIZE + 1 : 0;
  const endItem = hasPagination
    ? Math.min(totalResults as number, startItem + jobs.length - 1)
    : 0;

  const renderSkeleton = () => (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {[...Array(SKELETON_COUNT)].map((_, index) => (
        <div
          key={index}
          className="h-56 animate-pulse rounded-2xl border border-border bg-card/80"
        />
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-linear-to-br from-background via-muted/20 to-background">
      <PageMeta title="HR - CareerGraph" description="HR - CareerGraph" />
      <PageBreadcrumb pageTitle="Công việc" />

      <div className="container mx-auto px-4 pb-12">
        <div className="mx-auto max-w-6xl space-y-8 lg:max-w-7xl">
          <JobFilters
            value={filters}
            onChange={handleFilterChange}
            onReset={handleResetFilters}
            totalResults={totalResults ?? jobs.length}
            isLoading={loading}
            searchTerm={searchTerm}
            onSearchChange={handleSearchChange}
          />

          <section className="space-y-6">
            {loading && !hasJobs ? (
              renderSkeleton()
            ) : hasJobs ? (
              <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                {jobs.map((job) => (
                  <div key={job.id} className="space-y-2">
                    <JobCard
                      job={job}
                      onSelectJob={() => handleSelectJob(job.id)}
                      onCloseJob={handleCloseJob}
                      onToggleAiScreening={handleToggleAiScreening}
                      onOpenExpiryDialog={handleOpenExpiryDialog}
                      isActionLoading={actionJobId === job.id}
                    />
                    {job.status === Status.DRAFT && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full"
                        onClick={() => handleEditDraft(job.id)}
                      >
                        Chỉnh sửa bản nháp
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-3xl border border-dashed border-border bg-muted/20 p-10 text-center dark:bg-slate-800/50">
                <h3 className="text-lg font-semibold text-foreground dark:text-slate-100">
                  Không tìm thấy công việc phù hợp
                </h3>
                <p className="mt-2 text-sm text-muted-foreground dark:text-slate-300">
                  Thử thay đổi từ khóa hoặc đặt lại bộ lọc để xem thêm kết quả.
                </p>
                <Button
                  variant="outline"
                  className="mt-6 gap-2"
                  onClick={handleResetFilters}
                >
                  <ListFilter className="h-4 w-4" />
                  Xóa bộ lọc
                </Button>
              </div>
            )}

            {loading && hasJobs && (
              <div className="rounded-3xl border border-dashed border-border bg-muted/10 px-4 py-3 text-sm text-muted-foreground dark:bg-slate-800/40">
                Đang cập nhật danh sách công việc...
              </div>
            )}

            {hasPagination && (
              <div className="flex flex-col gap-4 rounded-3xl border border-border bg-card/40 p-4 backdrop-blur-xl dark:bg-slate-900/40 sm:flex-row sm:items-center sm:justify-between">
                <span className="text-sm font-medium text-muted-foreground">
                  Hiển thị {startItem.toLocaleString("vi-VN")} -{" "}
                  {endItem.toLocaleString("vi-VN")} trong{" "}
                  {(totalResults as number).toLocaleString("vi-VN")} công việc
                </span>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={!canGoPrevious}
                    onClick={() => handlePageChange(page - 1)}
                  >
                    Trước
                  </Button>
                  {pageNumbers.map((pageNumber) => (
                    <Button
                      key={pageNumber}
                      variant={pageNumber === page ? "default" : "outline"}
                      size="sm"
                      onClick={() => handlePageChange(pageNumber)}
                      aria-current={pageNumber === page ? "page" : undefined}
                    >
                      {pageNumber + 1}
                    </Button>
                  ))}
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={!canGoNext}
                    onClick={() => handlePageChange(page + 1)}
                  >
                    Sau
                  </Button>
                </div>
              </div>
            )}
          </section>
        </div>
      </div>

      <JobExpiryDialog
        open={Boolean(expiryDialogJob)}
        job={expiryDialogJob}
        isSubmitting={Boolean(actionJobId)}
        onClose={handleCloseExpiryDialog}
        onSave={handleSaveExpiry}
      />
    </div>
  );
}
