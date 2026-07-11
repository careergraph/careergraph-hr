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
  | "REJECTED"
  | "CUSTOM_1"
  | "CUSTOM_2"
  | "CUSTOM_3"
  | "CUSTOM_4"
  | "CUSTOM_5";

export interface CompanyRecruitmentStage {
  stage: ApplicationStageCode;
  label?: string;
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
  CUSTOM_1: "custom_1" as CandidateStatus,
  CUSTOM_2: "custom_2" as CandidateStatus,
  CUSTOM_3: "custom_3" as CandidateStatus,
  CUSTOM_4: "custom_4" as CandidateStatus,
  CUSTOM_5: "custom_5" as CandidateStatus,
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
  custom_1: "CUSTOM_1",
  custom_2: "CUSTOM_2",
  custom_3: "CUSTOM_3",
  custom_4: "CUSTOM_4",
  custom_5: "CUSTOM_5",
} as Record<string, ApplicationStageCode>;

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
  CUSTOM_1: "Tùy chỉnh 1",
  CUSTOM_2: "Tùy chỉnh 2",
  CUSTOM_3: "Tùy chỉnh 3",
  CUSTOM_4: "Tùy chỉnh 4",
  CUSTOM_5: "Tùy chỉnh 5",
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
  "CUSTOM_1",
  "CUSTOM_2",
  "CUSTOM_3",
  "CUSTOM_4",
  "CUSTOM_5",
];

export const DEFAULT_COMPANY_STAGES: CompanyRecruitmentStage[] = DEFAULT_STAGE_ORDER.map(
  (stage, index) => ({
    stage,
    displayOrder: index + 1,
    active: stage !== "OFFBOARDED" && !stage.startsWith("CUSTOM_"),
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
      title: stage.label || STAGE_LABELS[stage.stage],
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

  if (stage === "INTERVIEW_COMPLETED" || stage === "INTERVIEW_SCHEDULED" || stage === "INTERVIEW") {
    return true;
  }

  const activeStages = normalizeStageConfig(
    stages && stages.length > 0 ? stages : DEFAULT_COMPANY_STAGES
  ).filter(s => s.active !== false);

  const interviewIndex = activeStages.findIndex(s => s.stage === "INTERVIEW");
  if (interviewIndex < 0) return false;

  if (interviewIndex > 0) {
    if (stage === activeStages[interviewIndex - 1].stage) {
      return true;
    }
  }

  return false;
};
