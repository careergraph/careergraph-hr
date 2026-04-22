import { useMemo, useState } from "react";
import PageMeta from "@/components/common/PageMeta";
import RecruitmentKpiCards from "@/components/recruitment/RecruitmentKpiCards";
import PipelineVelocityChart from "@/components/recruitment/PipelineVelocityChart";
import HiringTargetProgress from "@/components/recruitment/HiringTargetProgress";
import FunnelConversionChart from "@/components/recruitment/FunnelConversionChart";
import RecentCandidateActivity from "@/components/recruitment/RecentCandidateActivity";
import { useDashboardData } from "@/features/dashboard/hooks/useDashboardData";
import DatePicker from "@/components/form/date-picker";
import { toast } from "sonner";

const toInputDate = (date: Date): string => {
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60 * 1000);
  return local.toISOString().slice(0, 10);
};

const createDefaultDateRange = () => {
  const to = new Date();
  const from = new Date();
  from.setDate(to.getDate() - 29);

  return {
    from: toInputDate(from),
    to: toInputDate(to),
  };
};

// Trang Home tổng hợp các widget thống kê và biểu đồ phục vụ quản trị tuyển dụng.

export default function Home() {
  const [dateRange, setDateRange] = useState(createDefaultDateRange);
  const [refreshTick, setRefreshTick] = useState(0);

  const { data, loading, error } = useDashboardData(dateRange, refreshTick);

  const rangeLabel = useMemo(() => {
    if (!dateRange.from || !dateRange.to) {
      return "Khoảng thời gian tùy chọn";
    }

    return `${dateRange.from} -> ${dateRange.to}`;
  }, [dateRange.from, dateRange.to]);

  const resetToLast30Days = () => {
    setDateRange(createDefaultDateRange());
  };

  const handleRefreshPipeline = () => {
    setRefreshTick((value) => value + 1);
    toast.success("Đã cập nhật pipeline mới nhất");
  };

  const handleSendDailyReport = async () => {
    if (!data) {
      toast.error("Chưa có dữ liệu để gửi báo cáo");
      return;
    }

    const now = new Date();
    const since = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const changes24h = (data.recentActivities ?? []).filter((item) => {
      const updatedAt = new Date(item.updatedAt);
      return !Number.isNaN(updatedAt.getTime()) && updatedAt >= since;
    });

    const report = [
      "Bao cao pipeline 24h",
      `Khoang du lieu dashboard: ${data.from} -> ${data.to}`,
      `Tong thay doi 24h: ${changes24h.length}`,
      `Ung vien: ${data.kpi.candidates.value}`,
      `Don ung tuyen moi: ${data.kpi.newApplications.value}`,
      `Lich phong van da len: ${data.kpi.scheduledInterviews.value}`,
    ].join("\n");

    try {
      await navigator.clipboard.writeText(report);
      toast.success("Đã sao chép báo cáo 24h, sẵn sàng gửi cho stakeholder");
    } catch {
      toast.error("Không thể sao chép báo cáo vào clipboard");
    }
  };

  return (
    <>
      {/* Bố cục dashboard kết hợp thẻ KPI và biểu đồ cung cấp thông tin nhanh. */}
      <PageMeta
        title="HR - CareerGraph"
        description="HR - CareerGraph"
      />

      <div className="mb-4 rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/3 sm:p-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-base font-semibold text-gray-800 dark:text-white/90">
              Bộ lọc thời gian dashboard
            </h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Dữ liệu tuyển dụng được tổng hợp theo applied_date trong khoảng đã chọn.
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <input
              type="date"
              value={dateRange.from}
              title="Ngày bắt đầu"
              aria-label="Ngày bắt đầu"
              onChange={(event) =>
                setDateRange((prev) => ({ ...prev, from: event.target.value }))
              }
              className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 outline-none focus:border-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
            />
            <span className="text-sm text-gray-400">đến</span>
            <input
              type="date"
              value={dateRange.to}
              title="Ngày kết thúc"
              aria-label="Ngày kết thúc"
              onChange={(event) =>
                setDateRange((prev) => ({ ...prev, to: event.target.value }))
              }
              className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 outline-none focus:border-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
            />
            <div className="w-full min-w-[220px] sm:w-auto">
              <DatePicker
                id="dashboard-date-range"
                mode="range"
                placeholder="Chọn nhanh khoảng ngày"
                defaultDate={[dateRange.from, dateRange.to]}
                onChange={(selectedDates) => {
                  if (selectedDates.length === 2) {
                    setDateRange({
                      from: toInputDate(selectedDates[0]),
                      to: toInputDate(selectedDates[1]),
                    });
                  }
                }}
              />
            </div>
            <button
              type="button"
              onClick={resetToLast30Days}
              className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-white/5"
            >
              30 ngày gần nhất
            </button>
            <button
              type="button"
              onClick={handleRefreshPipeline}
              className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-white/5"
            >
              Cập nhật pipeline mới nhất
            </button>
            <button
              type="button"
              onClick={handleSendDailyReport}
              className="rounded-lg bg-brand-500 px-3 py-2 text-sm font-medium text-white hover:bg-brand-600"
            >
              Gửi báo cáo 24h
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:gap-6 lg:grid-cols-12">
        <div className="col-span-12 space-y-6 lg:col-span-7">
          {/* KPI chính giúp đánh giá sức khỏe pipeline tuyển dụng */}
          <RecruitmentKpiCards
            data={data?.kpi}
            loading={loading}
            error={error}
          />

          {/* Biểu đồ cột theo dõi số ứng viên chuyển bước mỗi tháng */}
          <PipelineVelocityChart
            data={data?.pipelineVelocity}
            loading={loading}
            error={error}
          />
        </div>

        <div className="col-span-12 lg:col-span-5">
          {/* Tỷ lệ hoàn thành mục tiêu tuyển dụng hàng tháng */}
          <HiringTargetProgress
            data={data?.hiringTargetProgress}
            loading={loading}
            error={error}
          />
        </div>

        <div className="col-span-12">
          {/* So sánh chuyển đổi giữa phỏng vấn và offer */}
          <FunnelConversionChart
            data={data?.funnelConversion}
            loading={loading}
            error={error}
          />
        </div>

        <div className="col-span-12">
          {/* Bảng hoạt động ứng viên gần nhất để ưu tiên xử lý */}
          <RecentCandidateActivity
            data={data?.recentActivities}
            loading={loading}
            error={error}
            dateRangeLabel={rangeLabel}
          />
        </div>
      </div>
    </>
  );
}
