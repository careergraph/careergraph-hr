export interface DashboardMetricValue {
  value: number;
  changePercent: number;
}

export interface DashboardKpiSummary {
  candidates: DashboardMetricValue;
  newApplications: DashboardMetricValue;
  scheduledInterviews: DashboardMetricValue;
}

export interface DashboardPipelineMonthlyValue {
  monthLabel: string;
  totalTransitions: number;
}

export interface DashboardPipelineVelocity {
  monthly: DashboardPipelineMonthlyValue[];
}

export interface DashboardHiringTargetProgress {
  completionPercent: number;
  changePercent: number;
  quarterTargetPositions: number;
  hiredThisWeek: number;
  pendingOffers: number;
}

export interface DashboardFunnelMonthlyValue {
  monthLabel: string;
  interviewsCompleted: number;
  offersSent: number;
}

export interface DashboardFunnelConversion {
  monthly: DashboardFunnelMonthlyValue[];
}

export type DashboardStatusTag = "INTERVIEW" | "OFFERED" | "REJECTED" | "HIRED";

export interface DashboardRecentActivity {
  applicationId: string;
  candidateId: string;
  candidateName: string;
  candidateAvatar?: string;
  jobTitle: string;
  stage: string;
  updatedBy: string;
  statusTag: DashboardStatusTag;
  updatedAt: string;
}

export interface DashboardSummaryDto {
  from: string;
  to: string;
  kpi: DashboardKpiSummary;
  pipelineVelocity: DashboardPipelineVelocity;
  hiringTargetProgress: DashboardHiringTargetProgress;
  funnelConversion: DashboardFunnelConversion;
  recentActivities: DashboardRecentActivity[];
}

export interface DashboardDateRange {
  from: string;
  to: string;
}

export interface RestEnvelope<T> {
  status?: string | number;
  message?: string;
  data?: T;
}
