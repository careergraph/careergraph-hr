import api from "@/config/axiosConfig";
import type { CompanyRecruitmentStage, ApplicationStageCode } from "@/lib/recruitmentPipeline";

const unwrap = <T>(payload: unknown): T => {
  if (payload && typeof payload === "object") {
    const maybe = payload as { data?: T };
    if (typeof maybe.data !== "undefined") {
      return maybe.data;
    }
  }

  return payload as T;
};

const toStage = (raw: Record<string, unknown>): CompanyRecruitmentStage | null => {
  const stage = raw.stage as ApplicationStageCode | undefined;
  if (!stage) return null;

  return {
    stage,
    label: typeof raw.label === "string" ? raw.label : undefined,
    displayOrder:
      typeof raw.displayOrder === "number" ? raw.displayOrder : Number(raw.displayOrder) || 0,
    active: typeof raw.active === "boolean" ? raw.active : Boolean(raw.active),
    required: typeof raw.required === "boolean" ? raw.required : undefined,
  };
};

const fetchMyRecruitmentStages = async (): Promise<CompanyRecruitmentStage[]> => {
  const response = await api.get("/companies/me/recruitment-stages");
  const payload = unwrap<unknown>(response.data);
  const data = unwrap<unknown>(payload);

  if (!Array.isArray(data)) {
    return [];
  }

  return data
    .map((item) => (item && typeof item === "object" ? toStage(item as Record<string, unknown>) : null))
    .filter((item): item is CompanyRecruitmentStage => item !== null);
};

const updateMyRecruitmentStages = async (
  stages: Array<{ stage: ApplicationStageCode; active: boolean; displayOrder: number }>
) => {
  const response = await api.put("/companies/me/recruitment-stages", { stages });
  return response;
};

export const companyPipelineService = {
  fetchMyRecruitmentStages,
  updateMyRecruitmentStages,
};

export default companyPipelineService;
