import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { ListFilter } from "lucide-react";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import PageMeta from "@/components/common/PageMeta";
import { JobCard } from "./JobCard";
import JobFilters, {
  JobFilterState,
  initialJobFilterState,
} from "./JobFilters";
import { Job } from "@/types/job";
import { EmploymentType, JobCategory } from "@/enums/workEnum";
import { Status } from "@/enums/commonEnum";
import { jobService } from "@/services/jobService";
import { useAuthStore } from "@/stores/authStore";
import { jobsData as fallbackJobs } from "@/data/jobsData";
import { Button } from "@/components/ui/button";

// JobsGrid chịu trách nhiệm lấy dữ liệu và hiển thị danh sách việc làm có bộ lọc.

const normalizeKey = (value: string) =>
  // Chuẩn hóa chuỗi về dạng UPPER_SNAKE để so sánh với enum đã định nghĩa.
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[’'`]/g, "")
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
  TECHNOLOGY: JobCategory.ENGINEER,
  SOFTWARE_ENGINEERING: JobCategory.ENGINEER,
  SOFTWARE: JobCategory.ENGINEER,
  BUSINESS: JobCategory.BUSINESS,
  BUSINESS_OPERATIONS: JobCategory.BUSINESS,
  ART_MUSIC: JobCategory.ART_MUSIC,
  ART_AND_MUSIC: JobCategory.ART_MUSIC,
  DESIGN: JobCategory.ART_MUSIC,
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
  const key = normalizeKey(value);
  return employmentTypeMap[key] ?? undefined;
};

const toStatus = (value?: string | null): Status => {
  if (!value) return Status.ACTIVE;
  const key = normalizeKey(value);
  return statusMap[key] ?? Status.ACTIVE;
};

const toJobCategory = (value?: string | null): JobCategory | undefined => {
  if (!value) return undefined;
  const key = normalizeKey(value);
  return jobCategoryMap[key] ?? undefined;
};

const normalizeSkillIds = (skills: unknown): Job["skills"] => {
  if (!skills) return [];

  if (Array.isArray(skills)) {
    return skills
      .map((skill) => {
        if (typeof skill === "string") {
          // Backend có thể trả về mảng string, map sang đối tượng { id, name }.
          return { id: skill, name: skill };
        }

        if (skill && typeof skill === "object") {
          const skillObj = skill as { id?: string; name?: string };
          const id = skillObj.id ?? skillObj.name;
          if (!id) return undefined;
          // Khi cả id và name có thể thiếu, dùng id làm fallback cho name.
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

// Chuẩn hóa dữ liệu job từ API về model chuẩn dùng trong UI.
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
    employmentType: employmentType,
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

export default function JobsGrid() {
  const navigate = useNavigate();
  const { accessToken, company, user } = useAuthStore();

  // Trạng thái cục bộ theo dõi danh sách job, bộ lọc và tiến trình tải.
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState<JobFilterState>({
    ...initialJobFilterState,
  });
  // searchTerm: giá trị người dùng nhập; debouncedSearch: giá trị delay dùng gọi API.
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [totalResults, setTotalResults] = useState<number | null>(null);

  const companyId = company?.id ?? user?.companyId ?? null;

  useEffect(() => {
    // Debounce 300ms giúp gom chuỗi gõ liên tiếp trước khi gọi API.
    const handler = window.setTimeout(() => {
      setDebouncedSearch(searchTerm.trim());
    }, 300);

    return () => {
      window.clearTimeout(handler);
    };
  }, [searchTerm]);

  useEffect(() => {
    // Khi có đủ thông tin xác thực thì gọi dịch vụ tìm kiếm job.
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
        // Gọi API với query trên params và các bộ lọc trong body.
        const response = await jobService.searchJobs(
          companyId,
          {
            query: debouncedSearch || undefined,
            statuses: filters.statuses,
            employmentTypes: filters.employmentTypes,
            jobCategories: filters.categories,
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
          // Chỉ update state khi effect chưa bị hủy.
          setJobs(normalizedJobs);
          setTotalResults(total);
        }
      } catch (err) {
        if (controller.signal.aborted) {
          console.log(`Fetch jobs request was aborted: ${err}`);
          return;
        }

        if (active) {
          // Nếu lỗi thì dùng dữ liệu mặc định để tránh giao diện trống.
          setJobs(fallbackJobs);
          setTotalResults(fallbackJobs.length);
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
  }, [accessToken, companyId, filters, debouncedSearch]);

  const hasJobs = jobs.length > 0;

  const handleSelectJob = useCallback(
    (jobId: string) => {
      // Khi chọn job thì điều hướng sang trang kanban tương ứng.
      navigate(`/kanbans/${jobId}`);
    },
    [navigate]
  );

  const handleFilterChange = useCallback((nextFilters: JobFilterState) => {
    // Cập nhật bộ lọc khi người dùng thay đổi các checkbox.
    setFilters(nextFilters);
  }, []);

  const handleResetFilters = useCallback(() => {
    // Đặt lại tất cả điều kiện lọc và từ khóa tìm kiếm.
    setFilters({ ...initialJobFilterState });
    setSearchTerm("");
  }, []);

  const handleSearchChange = useCallback((value: string) => {
    // Đồng bộ ô tìm kiếm với state để kích hoạt debounce.
    setSearchTerm(value);
  }, []);

  const renderSkeleton = () => (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {[...Array(SKELETON_COUNT)].map((_, index) => (
        <div
          key={index}
          className="h-56 rounded-2xl border border-border bg-card/80 animate-pulse"
        />
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background">
      {/* Bố cục trang việc làm gồm breadcrumb, bộ lọc và danh sách kết quả. */}
      {/* Page metadata */}
      <PageMeta title="HR - CareerGraph" description="HR - CareerGraph" />
      {/* Breadcrumb */}
      <PageBreadcrumb pageTitle="Công việc" />
      <div className="container mx-auto px-4 pb-12">
        <div className="mx-auto max-w-6xl lg:max-w-7xl space-y-8">
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
                  <JobCard
                    key={job.id}
                    job={job}
                    onSelectJob={() => handleSelectJob(job.id)}
                  />
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
          </section>
        </div>
      </div>
    </div>
  );
}
