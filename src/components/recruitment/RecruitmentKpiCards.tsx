import type { ReactNode } from "react";
import {
  ArrowDownIcon,
  ArrowUpIcon,
  CalenderIcon,
  GroupIcon,
  TaskIcon,
} from "@/icons";
import Badge from "../custom/badge/Badge";

type MetricTrend = "up" | "down";

type Metric = {
  id: string;
  label: string;
  value: string;
  change: string;
  trend: MetricTrend;
  icon: ReactNode;
};

const METRICS: Metric[] = [
  {
    id: "active-candidates",
    label: "Ứng viên",
    value: "862",
    change: "+8.4%",
    trend: "up",
    icon: <GroupIcon className="size-6 text-brand-500" />,
  },
  {
    id: "new-applications",
    label: "Hồ sơ mới",
    value: "126",
    change: "-3.2%",
    trend: "down",
    icon: <TaskIcon className="size-6 text-warning-500" />,
  },
  {
    id: "interviews-scheduled",
    label: "Lịch phỏng vấn",
    value: "48",
    change: "+12.6%",
    trend: "up",
    icon: <CalenderIcon className="size-6 text-success-500" />,
  },
  // {
  //   id: "time-to-hire",
  //   label: "Thời gian tuyển",
  //   value: "28",
  //   change: "-5d",
  //   trend: "down",
  //   icon: <TimeIcon className="size-6 text-info-500" />,
  // },
];

/**
 * RecruitmentKpiCards trình bày các KPI chính giúp HR theo dõi sức khỏe pipeline.
 */
export default function RecruitmentKpiCards() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 xl:gap-5">
      {METRICS.map((metric) => {
        const badgeColor = metric.trend === "up" ? "success" : "warning";
        const TrendIcon = metric.trend === "up" ? ArrowUpIcon : ArrowDownIcon;

        return (
          <div
            key={metric.id}
            className="group flex flex-col justify-between rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-gray-800 dark:bg-white/[0.03]"
          >
            {/* Phần icon hiển thị loại KPI giúp nhận biết nhanh */}
            <div className="flex justify-between items-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50 dark:bg-brand-500/15">
                {metric.icon}
              </div>
              <Badge color={badgeColor} size="sm">
                <TrendIcon />
                {metric.change}
              </Badge>
            </div>

            <div className="mt-5 flex justify-between gap-3 items-center">
              <div className="space-y-1">
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {metric.label}
                </span>
              </div>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white/90">
                {metric.value}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
