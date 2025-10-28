import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { Plus } from "lucide-react";
import { isAxiosError } from "axios";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import PageMeta from "@/components/common/PageMeta";
import { JobCard } from "./JobCard";
import { Job } from "@/types/job";
import { EmploymentType, JobCategory } from "@/enums/workEnum";
import { Status } from "@/enums/commonEnum";
import { jobService } from "@/services/jobService";
import { useAuthStore } from "@/stores/authStore";
import { jobsData as fallbackJobs } from "@/data/jobsData";

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

const toEmploymentType = (value?: string | null): EmploymentType | undefined => {
  if (!value) return undefined;
  const key = value.replace(/[-\s]/g, "_").toUpperCase();
  return employmentTypeMap[key] ?? undefined;
};

const toStatus = (value?: string | null): Status => {
  if (!value) return Status.ACTIVE;
  const key = value.replace(/[-\s]/g, "_").toUpperCase();
  return statusMap[key] ?? Status.ACTIVE;
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
  const employmentType = toEmploymentType((raw.employmentType ?? raw.type ?? "") as string | undefined);

  const idValue = (raw.id ?? raw.jobId ?? raw.uuid) as string | number | undefined;
  const id = idValue ? String(idValue) : generateId();

  return {
    id,
    title: (raw.title as string) ?? "Tin tuyển dụng",
    description: (raw.description as string) ?? "",
    department: (raw.department as string) ?? (raw.jobCategory as string) ?? "",
    responsibilities: (raw.responsibilities as string[]) ?? [],
    qualifications: (raw.qualifications as string[]) ?? [],
    minimumQualifications: (raw.minimumQualifications as string[]) ?? [],
    minExperience: typeof raw.minExperience === "number" ? raw.minExperience : undefined,
    maxExperience: typeof raw.maxExperience === "number" ? raw.maxExperience : undefined,
    experienceLevel: (raw.experienceLevel as Job["experienceLevel"]) ?? undefined,
    jobCategory: (raw.jobCategory as JobCategory) ?? undefined,
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
      typeof raw.numberOfPositions === "number" ? raw.numberOfPositions : undefined,
    expiryDate: (raw.expiryDate as string) ?? undefined,
    skills: normalizeSkillIds(raw.skills ?? raw.skillIds),
    applicationRequirements: (raw.applicationRequirements as Job["applicationRequirements"]) ?? undefined,
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

const extractJobsFromResponse = (response: unknown): Record<string, unknown>[] => {
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

export default function JobsGrid() {
  const navigate = useNavigate();
  const { accessToken, company, user } = useAuthStore();

  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const companyId = company?.id ?? user?.companyId ?? null;

  useEffect(() => {
    if (!accessToken) {
      setJobs([]);
      setError("Bạn cần đăng nhập để xem danh sách công việc.");
      return;
    }

    if (!companyId) {
      setJobs([]);
      setError("Không tìm thấy mã công ty. Vui lòng kiểm tra lại thông tin tài khoản.");
      return;
    }

    let mounted = true;
    const fetchJobs = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await jobService.getJobForCompany(companyId);
        const rawJobs = extractJobsFromResponse(response);

        if (!rawJobs.length && Array.isArray(response)) {
          rawJobs.push(...(response as Record<string, unknown>[]));
        }

        const normalizedJobs = rawJobs.map(normalizeJob);

        if (mounted) {
          setJobs(normalizedJobs);
        }
      } catch (err) {
        const message = isAxiosError(err)
          ? err.response?.data?.message ?? err.message
          : err instanceof Error
          ? err.message
          : "Không thể tải danh sách công việc";

        if (mounted) {
          setError(message);
          setJobs(fallbackJobs);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    fetchJobs();

    return () => {
      mounted = false;
    };
  }, [accessToken, companyId]);

  const hasJobs = jobs.length > 0;

  const handleAddJob = () => {
    navigate("/jobs/new");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background">
      <PageMeta title="HR - CareerGraph" description="HR - CareerGraph" />
      <PageBreadcrumb pageTitle="Công việc" />
      <div className="container mx-auto px-4">
        <div className="max-w-5xl mx-auto space-y-8">
          {error && (
            <div className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
              {error}
            </div>
          )}
          {loading && (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {[...Array(3)].map((_, index) => (
                <div
                  key={index}
                  className="h-56 rounded-2xl border border-border bg-card animate-pulse"
                />
              ))}
            </div>
          )}
          {!loading && !hasJobs && !error && (
            <div className="rounded-2xl border border-dashed border-border bg-muted/20 dark:bg-slate-800/50 p-10 text-center">
              <h3 className="text-lg font-semibold text-foreground dark:text-slate-100 mb-2">
                Chưa có công việc nào được đăng
              </h3>
              <p className="text-sm text-muted-foreground dark:text-slate-300 mb-6">
                Hãy tạo công việc đầu tiên để thu hút ứng viên.
              </p>
              <button
                onClick={handleAddJob}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                <Plus className="w-4 h-4" /> Tạo công việc mới
              </button>
            </div>
          )}
          {hasJobs && (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {jobs.map((job) => (
                <JobCard
                  key={job.id}
                  job={job}
                  onSelectJob={() => navigate(`/kanbans/${job.id}`)}
                />
              ))}

              <button
                onClick={handleAddJob}
                className="group p-4 rounded-2xl border-2 border-dashed border-border dark:border-slate-600 hover:border-primary/50 bg-muted/20 dark:bg-slate-800/50 hover:bg-primary/5 dark:hover:bg-primary/10 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] flex flex-col items-center justify-center gap-4 min-h-[240px]"
              >
                <div className="p-4 rounded-full bg-primary/10 dark:bg-primary/20 group-hover:bg-primary/20 dark:group-hover:bg-primary/30 transition-colors shadow-sm">
                  <Plus className="w-8 h-8 text-primary dark:text-primary/80" />
                </div>
                <div className="text-center">
                  <p className="font-semibold text-foreground dark:text-slate-100 mb-1">
                    Thêm công việc mới
                  </p>
                  <p className="text-sm text-muted-foreground dark:text-slate-300">
                    Tạo vị trí tuyển dụng mới
                  </p>
                </div>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
