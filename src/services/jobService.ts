import api from "@/config/axiosConfig";
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

const toUpperSnake = (value?: string | null) => {
  if (!value) return undefined;

  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[’'`]/g, "")
    .replace(/[-\s]+/g, "_")
    .toUpperCase();
};

const sanitizeArray = (values?: string[]) =>
  values?.map((item) => item?.trim()).filter((item): item is string => Boolean(item && item.length > 0));

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
    status: toUpperSnake(job.status as string | undefined),
    numberOfPositions: job.numberOfPositions,
    expiryDate: job.expiryDate,
    benefits: sanitizeArray(job.benefits),
  };

  return Object.fromEntries(
    Object.entries(payload).filter(([, value]) => value !== undefined && value !== null)
  ) as JobPayload;
};

const unwrapResponse = <T>(data: T): T extends { data: infer U } ? U : T => {
  if (data && typeof data === "object" && data !== null && "data" in (data as Record<string, unknown>)) {
    return ((data as unknown) as { data: unknown }).data as T extends { data: infer U } ? U : T;
  }

  return data as T extends { data: infer U } ? U : T;
};

const jobService = {
  createDraft: async (job: Partial<Job>) => {
    const payload = mapJobToPayload(job);
    payload.status = "DRAFT";
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
    payload.status = "ACTIVE";
    if (!payload.promotionType) {
      payload.promotionType = "STANDARD";
    }
    const response = await api.put(`/jobs/${jobId}`, payload);
    return unwrapResponse(response.data);
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
  }
};

export { jobService, mapJobToPayload };
