import type { ReactNode } from "react";
import {
  ArrowDownIcon,
  ArrowUpIcon,
  CalenderIcon,
  GroupIcon,
  TaskIcon,
} from "@/icons";
import Badge from "../custom/badge/Badge";
import type { DashboardKpiSummary } from "@/features/dashboard/types/dashboard.types";

type MetricTrend = "up" | "down";

type MetricTemplate = {
  id: string;
  label: string;
  valueKey: keyof DashboardKpiSummary;
  icon: ReactNode;
};

type RecruitmentKpiCardsProps = {
  data?: DashboardKpiSummary | null;
  loading?: boolean;
  error?: string | null;
};

const METRICS: MetricTemplate[] = [
  {
    id: "active-candidates",
    label: "Ứng viên",
    valueKey: "candidates",
    icon: <GroupIcon className="size-6 text-brand-500" />,
  },
  {
    id: "new-applications",
    label: "Hồ sơ mới",
    valueKey: "newApplications",
    icon: <TaskIcon className="size-6 text-warning-500" />,
  },
  {
    id: "interviews-scheduled",
    label: "Lịch phỏng vấn",
    valueKey: "scheduledInterviews",
    icon: <CalenderIcon className="size-6 text-success-500" />,
  },
];

const formatNumber = (value: number): string =>
  new Intl.NumberFormat("vi-VN").format(value);

const formatChange = (value: number): string => {
  const rounded = Math.abs(value).toFixed(1);
  if (value > 0) return `+${rounded}%`;
  if (value < 0) return `-${rounded}%`;
  return "0.0%";
};

const isKpiEmpty = (data?: DashboardKpiSummary | null): boolean => {
  if (!data) return true;

  return (
    data.candidates.value === 0 &&
    data.newApplications.value === 0 &&
    data.scheduledInterviews.value === 0
  );
};

const renderSkeleton = () => (
  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 md:gap-4 xl:gap-5">
    {Array.from({ length: 3 }).map((_, index) => (
      <div
        key={`kpi-skeleton-${index}`}
        className="h-31.5 animate-pulse rounded-2xl border border-gray-200 bg-gray-100 dark:border-gray-800 dark:bg-white/3"
      />
    ))}
  </div>
);

/**
 * RecruitmentKpiCards trình bày các KPI chính giúp HR theo dõi sức khỏe pipeline.
 */
export default function RecruitmentKpiCards({
  data,
  loading = false,
  error = null,
}: RecruitmentKpiCardsProps) {
  if (loading) {
    return renderSkeleton();
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-dashed border-rose-200 bg-rose-50/70 p-5 text-sm text-rose-600 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200">
        Không thể tải chỉ số tuyển dụng. {error}
      </div>
    );
  }

  if (isKpiEmpty(data)) {
    return (
      <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-5 text-sm text-gray-600 dark:border-gray-700 dark:bg-white/2 dark:text-gray-300">
        Chưa có chỉ số tuyển dụng trong khoảng thời gian đã chọn.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 md:gap-4 xl:gap-5">
      {METRICS.map((metric) => {
        const metricValue = data?.[metric.valueKey] ?? { value: 0, changePercent: 0 };
        const trend: MetricTrend = metricValue.changePercent >= 0 ? "up" : "down";
        const badgeColor = trend === "up" ? "success" : "warning";
        const TrendIcon = trend === "up" ? ArrowUpIcon : ArrowDownIcon;

        return (
          <div
            key={metric.id}
            className="group flex flex-col justify-between rounded-2xl border border-gray-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-gray-800 dark:bg-white/3 md:p-5"
          >
            {/* Phần icon hiển thị loại KPI giúp nhận biết nhanh */}
            <div className="flex justify-between items-center">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 dark:bg-brand-500/15 md:h-12 md:w-12">
                {metric.icon}
              </div>
              <Badge color={badgeColor} size="sm">
                <TrendIcon />
                {formatChange(metricValue.changePercent)}
              </Badge>
            </div>

            <div className="mt-5 flex justify-between gap-3 items-center">
              <div className="space-y-1">
                <span className="text-xs text-gray-500 dark:text-gray-400 md:text-sm">
                  {metric.label}
                </span>
              </div>
              <p className="text-xl font-semibold text-gray-900 dark:text-white/90 md:text-2xl">
                {formatNumber(metricValue.value)}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
