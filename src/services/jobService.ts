import api from "@/config/axiosConfig";
import { Status } from "@/enums/commonEnum";
import { EmploymentType, JobCategory } from "@/enums/workEnum";
import { Job, ApplicationRequirements } from "@/types/job";

type JobPayload = {
  title?: string;
  description?: string;
  department?: string;
  responsibilities?: string[];
  qualifications?: string[];
  minimumQualifications?: string[];
  minExperience?: number;
  maxExperience?: number;
  experienceLevel?: string;
  employmentType?: string;
  jobFunction?: string;
  jobCategory?: string;
  education?: string;
  state?: string;
  city?: string;
  district?: string;
  address?: string;
  remoteJob?: boolean;
  skillIds?: string[];
  salaryRange?: string;
  contactEmail?: string;
  contactPhone?: string;
  applicationRequirements?: Job["applicationRequirements"];
  promotionType?: string;
  status?: string;
  numberOfPositions?: number;
  expiryDate?: string;
  benefits?: string[];
};

type JobSearchPayload = {
  query?: string;
  statuses?: Status[];
  employmentTypes?: EmploymentType[];
  jobCategories?: JobCategory[];
  page?: number;
  size?: number;
};

type JobRecruitmentPayload = {
  jobId: string;
  coverLetter: boolean;
};

const DEFAULT_QUERY = "";
const DEFAULT_PAGE = 0;
const DEFAULT_SIZE = 9;

/**
 * Helpers: shared utilities for normalizing strings, arrays, and filtering
 * out empty values before sending requests.
 */
const toUpperSnake = (value?: string | null) => {
  if (!value) return undefined;

  const trimmed = value.trim();
  if (!trimmed) return undefined;

  return trimmed
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[’'`]/g, "")
    .replace(/[-\s]+/g, "_")
    .toUpperCase();
};

const sanitizeArray = (values?: string[]) =>
  values
    ?.map((item) => item?.trim())
    .filter((item): item is string => Boolean(item && item.length > 0));

const normalizeEnumArray = <T extends string>(values?: T[]) =>
  values
    ?.map((item) => toUpperSnake(item))
    .filter((item): item is string => Boolean(item && item.length > 0));

const compactObject = <T extends Record<string, unknown>>(
  source: T,
  predicate: (key: string, value: unknown) => boolean = (
    _key,
    value
  ) => value !== undefined && value !== null
) =>
  Object.fromEntries(
    Object.entries(source).filter(([key, value]) => predicate(key, value))
  ) as Partial<T>;

const sanitizeApplicationRequirements = (
  requirements?: ApplicationRequirements
) => {
  if (!requirements) return undefined;

  const coverLetter = Boolean(requirements.coverLetter);

  return {
    resume: true,
    coverLetter,
  } satisfies Pick<ApplicationRequirements, "resume" | "coverLetter">;
};

/**
 * Payload builders: map internal job structures into API-friendly bodies while
 * pruning undefined entries.
 */
const mapJobToPayload = (job: Partial<Job>): JobPayload => {
  // Ánh xạ đối tượng Job nội bộ sang payload API, đồng thời loại bỏ giá trị trống.
  const payload: JobPayload = {
    title: job.title,
    description: job.description,
    department: job.department,
    responsibilities: sanitizeArray(job.responsibilities),
    qualifications: sanitizeArray(job.qualifications),
    minimumQualifications: sanitizeArray(job.minimumQualifications),
    minExperience: job.minExperience,
    maxExperience: job.maxExperience,
    experienceLevel: toUpperSnake(job.experienceLevel as string | undefined),
    employmentType: toUpperSnake(job.employmentType as string | undefined),
    jobCategory: toUpperSnake(job.jobCategory as string | undefined),
    education: toUpperSnake(job.education as string | undefined),
    state: job.state,
    city: job.city,
    district: job.district,
    address: job.specific,
    remoteJob: job.remoteJob,
    skillIds: job.skills?.map((skill) => skill.id),
    salaryRange: job.salaryRange,
    contactEmail: job.contactEmail,
    contactPhone: job.contactPhone,
    applicationRequirements: sanitizeApplicationRequirements(
      job.applicationRequirements
    ),
    promotionType:
      job.promotionType === "paid"
        ? "PREMIUM"
        : job.promotionType === "free"
        ? "STANDARD"
        : (job.promotionType as string | undefined),
    // Khi tạo hoặc lưu nháp phải gắn trạng thái DRAFT theo định dạng backend.
    status: toUpperSnake(Status.DRAFT),
    numberOfPositions: job.numberOfPositions,
    expiryDate: job.expiryDate,
    benefits: sanitizeArray(job.benefits),
  };

  // compactObject sẽ loại bỏ toàn bộ trường undefined/null trước khi gửi.
  return compactObject(payload) as JobPayload;
};

const mapSearchPayload = (payload: JobSearchPayload = {}) => {
  // Tách query để đưa lên query string và giữ các bộ lọc trong body.
  const trimmedQuery = payload.query?.trim();
  const query = typeof trimmedQuery === "string" ? trimmedQuery : DEFAULT_QUERY;

  const page =
    typeof payload.page === "number" && payload.page >= 0
      ? payload.page
      : DEFAULT_PAGE;

  const size =
    typeof payload.size === "number" && payload.size > 0
      ? payload.size
      : DEFAULT_SIZE;

  const body = {
    statuses: normalizeEnumArray(payload.statuses) ?? [],
    employmentTypes: normalizeEnumArray(payload.employmentTypes) ?? [],
    jobCategories: normalizeEnumArray(payload.jobCategories) ?? [],
  } satisfies Record<string, unknown>;

  return {
    query,
    page,
    size,
    body,
  };
};

/**
 * Response helpers: unwrap Axios-style payloads into plain objects.
 */
const unwrapResponse = <T>(data: T): T extends { data: infer U } ? U : T => {
  // Một số HTTP client/ backend bọc kết quả trong { data: ... }; hàm này trả về phần lõi.
  if (
    data &&
    typeof data === "object" &&
    data !== null &&
    "data" in (data as Record<string, unknown>)
  ) {
    return (data as unknown as { data: unknown }).data as T extends {
      data: infer U;
    }
      ? U
      : T;
  }

  return data as T extends { data: infer U } ? U : T;
};

/**
 * Job service API: exposed operations for persisting and retrieving jobs.
 */
const jobService = {
  createDraft: async (job: Partial<Job>) => {
    const payload = mapJobToPayload(job);
    // API yêu cầu mọi thuộc tính trong body đã được chuẩn hóa theo snake case.
    const response = await api.post("/jobs", payload);
    return unwrapResponse(response.data);
  },

  updateJob: async (jobId: string, job: Partial<Job>) => {
    const payload = mapJobToPayload(job);
    const response = await api.put(`/jobs/${jobId}`, payload);
    return unwrapResponse(response.data);
  },

  updateRecruitment: async ({
    jobId,
    coverLetter,
  }: JobRecruitmentPayload) => {
    if (!jobId) {
      throw new Error(
        "Thiếu mã công việc để cập nhật yêu cầu ứng tuyển."
      );
    }

    const response = await api.put(`/jobs/${jobId}/recruitment`, {
      resume: true,
      coverLetter: Boolean(coverLetter),
    });
    return unwrapResponse(response.data);
  },

  publishJob: async (jobId: string, job: Partial<Job>) => {
    const payload = mapJobToPayload(job);
    const promotionType = payload.promotionType ?? "STANDARD";
    // Endpoint publish chỉ chấp nhận promotionType, những field khác đã lưu ở draft.
    const response = await api.put(`/jobs/${jobId}/publish`, {
      promotionType,
    });
    return unwrapResponse(response.data);
  },

  searchJobs: async (
    companyId: string,
    payload: JobSearchPayload = {},
    signal?: AbortSignal
  ) => {
    if (!companyId) {
      throw new Error("Thiếu mã công ty để tìm kiếm công việc.");
    }

    const { query, page, size, body } = mapSearchPayload(payload);

    const requestBody = {
      companyId,
      ...body,
    };

    // Query được đẩy lên params để backend đọc từ query string.
    const response = await api.post(
      "/jobs/search",
      requestBody,
      {
        signal,
        params: {
          query,
          page,
          size,
        },
      }
    );
    // Lúc này response có thể nằm trong các thuộc tính data/ result nên cần unwrap.
    return unwrapResponse(response.data);
  },

  lookupJobs: async (query: string, signal?: AbortSignal): Promise<string[]> => {
    const trimmed = query?.trim();
    if (!trimmed) {
      return [];
    }

    const response = await api.get("/jobs/lookup", {
      params: { query: trimmed },
      signal,
    });
    const data = unwrapResponse(response.data);

    const normalizeSuggestions = (input: unknown): string[] => {
      if (!input) return [];

      if (Array.isArray(input)) {
        return input
          .map((item) => {
            if (typeof item === "string") return item;
            if (item && typeof item === "object") {
              const source = item as Record<string, unknown>;
              // Một số backend trả về label/title/name, nên ưu tiên lần lượt.
              const label =
                (source.label as string | undefined) ??
                (source.title as string | undefined) ??
                (source.name as string | undefined) ??
                (source.value as string | undefined);
              return label;
            }
            return undefined;
          })
          .filter((item): item is string => Boolean(item?.length));
      }

      if (typeof input === "object") {
        const container = input as Record<string, unknown>;
        const candidates =
          container.suggestions ??
          container.items ??
          container.results ??
          container.data;

        if (Array.isArray(candidates)) {
          return normalizeSuggestions(candidates);
        }
      }

      return [];
    };

    return normalizeSuggestions(data).slice(0, 10);
  },

  getAllJobs: async () => {
    const response = await api.get("/jobs");
    return unwrapResponse(response.data);
  },

  getJobForCompany: async (companyId: string) => {
    if (!companyId) {
      throw new Error("Thiếu mã công ty để tải danh sách công việc.");
    }

    const response = await api.get(`/jobs/company/${companyId}`);
    return unwrapResponse(response.data);
  },
};

export { jobService, mapJobToPayload };
export type { JobRecruitmentPayload };
