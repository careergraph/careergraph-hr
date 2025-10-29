import api from "@/config/axiosConfig";
import { Status } from "@/enums/commonEnum";
import { EmploymentType, JobCategory } from "@/enums/workEnum";
import { Job } from "@/types/job";

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

/**
 * Payload builders: map internal job structures into API-friendly bodies while
 * pruning undefined entries.
 */
const mapJobToPayload = (job: Partial<Job>): JobPayload => {
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
    applicationRequirements: job.applicationRequirements,
    promotionType:
      job.promotionType === "paid"
        ? "PREMIUM"
        : job.promotionType === "free"
        ? "STANDARD"
        : (job.promotionType as string | undefined),
    status: toUpperSnake(Status.DRAFT),
    numberOfPositions: job.numberOfPositions,
    expiryDate: job.expiryDate,
    benefits: sanitizeArray(job.benefits),
  };

  return compactObject(payload) as JobPayload;
};

const mapSearchPayload = (payload: JobSearchPayload) => {
  const body = {
    query: payload.query?.trim() || undefined,
    statuses: normalizeEnumArray(payload.statuses),
    employmentTypes: normalizeEnumArray(payload.employmentTypes),
    jobCategories: normalizeEnumArray(payload.jobCategories),
    page: payload.page,
    size: payload.size,
  } as Record<string, unknown>;

  return compactObject(body, (key, value) => {
    if (Array.isArray(value)) {
      return value.length > 0;
    }

    if (key === "page" || key === "size") {
      return typeof value === "number" && !Number.isNaN(value);
    }

    return value !== undefined && value !== null && value !== "";
  });
};

/**
 * Response helpers: unwrap Axios-style payloads into plain objects.
 */
const unwrapResponse = <T>(data: T): T extends { data: infer U } ? U : T => {
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
    const response = await api.post("/jobs", payload);
    return unwrapResponse(response.data);
  },

  updateJob: async (jobId: string, job: Partial<Job>) => {
    const payload = mapJobToPayload(job);
    const response = await api.put(`/jobs/${jobId}`, payload);
    return unwrapResponse(response.data);
  },

  publishJob: async (jobId: string, job: Partial<Job>) => {
    const payload = mapJobToPayload(job);
    const promotionType = payload.promotionType ?? "STANDARD";
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

    const requestBody = {
      companyId,
      ...mapSearchPayload(payload),
    };

    const response = await api.post("/jobs/search", requestBody, {
      signal,
    });
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
