import {
  DEFAULT_COMPANY_STAGES,
  STAGE_LABELS,
  normalizeStageConfig,
  type CompanyRecruitmentStage,
} from "@/lib/recruitmentPipeline";
import type { FeedbackRecommendation } from "@/types/interview";

export interface FeedbackRecommendationOption {
  value: FeedbackRecommendation;
  label: string;
  description: string;
}

const NON_ADVANCE_TARGETS = new Set(["REJECTED", "OFFBOARDED"]);

const LEGACY_RECOMMENDATION_LABELS: Record<string, string> = {
  EXTEND_OFFER: "Gửi offer",
  HOLD: "Giữ nguyên giai đoạn hiện tại",
};

export const getNextActiveStageAfterInterview = (
  stages?: CompanyRecruitmentStage[]
) => {
  const normalized = normalizeStageConfig(
    stages && stages.length > 0 ? stages : DEFAULT_COMPANY_STAGES
  ).filter((stage) => stage.active && !NON_ADVANCE_TARGETS.has(stage.stage));

  const interviewIndex = normalized.findIndex((stage) => stage.stage === "INTERVIEW");
  if (interviewIndex < 0) return null;

  return normalized[interviewIndex + 1] ?? null;
};

export const buildFeedbackRecommendationOptions = (
  stages?: CompanyRecruitmentStage[]
): FeedbackRecommendationOption[] => {
  const nextStage = getNextActiveStageAfterInterview(stages);
  const options: FeedbackRecommendationOption[] = [
    {
      value: "NEXT_ROUND",
      label: "Giữ ở phỏng vấn / mời vòng tiếp theo",
      description:
        "Không tự động đổi stage; hồ sơ ở giai đoạn Phỏng vấn để HR có thể lên lịch vòng mới hoặc chờ phê duyệt.",
    },
  ];

  if (nextStage) {
    options.push({
      value: "ADVANCE_NEXT_STAGE",
      label: `Chuyển sang ${STAGE_LABELS[nextStage.stage]}`,
      description:
        "Đưa hồ sơ sang stage active kế tiếp theo pipeline hiện tại của công ty.",
    });
  }

  options.push({
    value: "REJECT",
    label: "Từ chối",
    description: "Chuyển hồ sơ sang giai đoạn Từ chối.",
  });

  return options;
};

export const getFeedbackRecommendationLabel = (
  recommendation?: string,
  stages?: CompanyRecruitmentStage[]
) => {
  if (!recommendation) return "";
  return (
    buildFeedbackRecommendationOptions(stages).find(
      (option) => option.value === recommendation
    )?.label ??
    LEGACY_RECOMMENDATION_LABELS[recommendation] ??
    recommendation
  );
};
