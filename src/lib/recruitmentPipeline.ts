import type { Status as CandidateStatus } from "@/types/candidate";

export type ApplicationStageCode =
  | "APPLIED"
  | "SCREENING"
  | "HR_CONTACTED"
  | "INTERVIEW"
  | "INTERVIEW_COMPLETED"
  | "TRIAL"
  | "OFFER_EXTENDED"
  | "HIRED"
  | "OFFBOARDED"
  | "REJECTED";

export interface CompanyRecruitmentStage {
  stage: ApplicationStageCode;
  displayOrder: number;
  active: boolean;
  required?: boolean;
}

export const STAGE_TO_STATUS: Record<ApplicationStageCode, CandidateStatus> = {
  APPLIED: "apply",
  SCREENING: "screening",
  HR_CONTACTED: "contacted",
  INTERVIEW: "interview",
  INTERVIEW_COMPLETED: "interviewed",
  TRIAL: "trial",
  OFFER_EXTENDED: "offer",
  HIRED: "hired",
  OFFBOARDED: "offboarded",
  REJECTED: "rejected",
};

export const STATUS_TO_STAGE: Record<CandidateStatus, ApplicationStageCode> = {
  apply: "APPLIED",
  screening: "SCREENING",
  contacted: "HR_CONTACTED",
  interview: "INTERVIEW",
  interviewed: "INTERVIEW_COMPLETED",
  trial: "TRIAL",
  offer: "OFFER_EXTENDED",
  hired: "HIRED",
  offboarded: "OFFBOARDED",
  rejected: "REJECTED",
};

export const STAGE_LABELS: Record<ApplicationStageCode, string> = {
  APPLIED: "Ứng tuyển",
  SCREENING: "Sàng lọc",
  HR_CONTACTED: "Liên hệ",
  INTERVIEW: "Phỏng vấn",
  INTERVIEW_COMPLETED: "Phỏng vấn hoàn thành",
  TRIAL: "Thử việc",
  OFFER_EXTENDED: "Mời nhận việc",
  HIRED: "Nhận chính thức",
  OFFBOARDED: "Nghỉ việc",
  REJECTED: "Từ chối",
};

export const REQUIRED_STAGES: ApplicationStageCode[] = ["APPLIED", "REJECTED"];

export const DEFAULT_STAGE_ORDER: ApplicationStageCode[] = [
  "APPLIED",
  "SCREENING",
  "HR_CONTACTED",
  "INTERVIEW",
  "INTERVIEW_COMPLETED",
  "TRIAL",
  "OFFER_EXTENDED",
  "HIRED",
  "OFFBOARDED",
  "REJECTED",
];

export const DEFAULT_COMPANY_STAGES: CompanyRecruitmentStage[] = DEFAULT_STAGE_ORDER.map(
  (stage, index) => ({
    stage,
    displayOrder: index + 1,
    active: stage !== "OFFBOARDED",
    required: REQUIRED_STAGES.includes(stage),
  })
);

export const buildColumnsFromStages = (
  stages?: CompanyRecruitmentStage[]
): Array<{ id: CandidateStatus; title: string; stage: ApplicationStageCode }> => {
  const source = (stages && stages.length ? stages : DEFAULT_COMPANY_STAGES)
    .slice()
    .sort((a, b) => a.displayOrder - b.displayOrder);

  return source
    .filter((stage) => stage.active)
    .map((stage) => ({
      id: STAGE_TO_STATUS[stage.stage],
      title: STAGE_LABELS[stage.stage],
      stage: stage.stage,
    }));
};

export const normalizeStageConfig = (
  stages?: CompanyRecruitmentStage[]
): CompanyRecruitmentStage[] => {
  if (!stages || stages.length === 0) {
    return DEFAULT_COMPANY_STAGES.map((stage) => ({ ...stage }));
  }

  return stages
    .slice()
    .sort((a, b) => a.displayOrder - b.displayOrder)
    .map((stage, index) => ({
      ...stage,
      displayOrder: stage.displayOrder ?? index + 1,
      required:
        typeof stage.required === "boolean"
          ? stage.required
          : REQUIRED_STAGES.includes(stage.stage),
    }));
};

export const canScheduleInterviewAtStage = (
  stage?: ApplicationStageCode | string,
  stages?: CompanyRecruitmentStage[]
): boolean => {
  if (!stage) {
    return false;
  }

  if (stage === "INTERVIEW_COMPLETED") {
    return true;
  }

  const normalized = normalizeStageConfig(
    stages && stages.length > 0 ? stages : DEFAULT_COMPANY_STAGES
  );
  const stageOrderMap = new Map<ApplicationStageCode, number>();

  normalized.forEach((item, index) => {
    stageOrderMap.set(item.stage, item.displayOrder ?? index + 1);
  });

  const interviewFallbackIndex = DEFAULT_STAGE_ORDER.indexOf("INTERVIEW");
  const interviewStageOrder =
    stageOrderMap.get("INTERVIEW") ??
    (interviewFallbackIndex >= 0 ? interviewFallbackIndex + 1 : 0);
  const order = stageOrderMap.get(stage as ApplicationStageCode);

  if (typeof order !== "number") {
    return false;
  }

  if (interviewStageOrder <= 0) {
    return order === interviewStageOrder;
  }

  return order === interviewStageOrder || order === interviewStageOrder - 1;
};
