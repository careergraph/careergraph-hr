import Chart from "react-apexcharts";
import type { ApexOptions } from "apexcharts";
import type { DashboardFunnelConversion } from "@/features/dashboard/types/dashboard.types";

type FunnelConversionChartProps = {
  data?: DashboardFunnelConversion | null;
  loading?: boolean;
  error?: string | null;
};

const isFunnelEmpty = (data?: DashboardFunnelConversion | null): boolean => {
  if (!data || data.monthly.length === 0) return true;

  return data.monthly.every(
    (item) => item.interviewsCompleted === 0 && item.offersSent === 0
  );
};

/**
 * FunnelConversionChart theo dõi tỷ lệ chuyển đổi giữa giai đoạn phỏng vấn và offer.
 */
export default function FunnelConversionChart({
  data,
  loading = false,
  error = null,
}: FunnelConversionChartProps) {
  const categories = data?.monthly.map((item) => item.monthLabel) ?? [];
  const series = [
    {
      name: "Phỏng vấn hoàn tất",
      data: data?.monthly.map((item) => item.interviewsCompleted) ?? [],
    },
    {
      name: "Offer gửi đi",
      data: data?.monthly.map((item) => item.offersSent) ?? [],
    },
  ];

  const options: ApexOptions = {
    legend: {
      show: true,
      position: "top",
      horizontalAlign: "left",
      fontSize: "13px",
    },
    colors: ["#465FFF", "#9CB9FF"],
    chart: {
      fontFamily: "Outfit, sans-serif",
      height: 320,
      type: "area",
      toolbar: { show: false },
    },
    stroke: {
      curve: "smooth",
      width: [3, 3],
    },
    fill: {
      type: "gradient",
      gradient: {
        opacityFrom: 0.55,
        opacityTo: 0,
      },
    },
    markers: {
      size: 0,
      strokeColors: "#fff",
      strokeWidth: 2,
      hover: { size: 6 },
    },
    grid: {
      xaxis: { lines: { show: false } },
      yaxis: { lines: { show: true } },
    },
    dataLabels: { enabled: false },
    tooltip: {
      enabled: true,
      y: {
        formatter: (value: number, opts) =>
          `${value} ${opts.seriesIndex === 0 ? "buổi phỏng vấn" : "offer"}`,
      },
    },
    xaxis: {
      categories,
      axisBorder: { show: false },
      axisTicks: { show: false },
    },
    yaxis: {
      labels: {
        style: {
          fontSize: "12px",
          colors: ["#6B7280"],
        },
      },
      title: {
        text: "Số lượng ứng viên",
        style: { fontSize: "12px", fontWeight: 500 },
      },
    },
  };

  if (loading) {
    return (
      <div className="h-104.5 animate-pulse rounded-2xl border border-gray-200 bg-gray-100 dark:border-gray-800 dark:bg-white/3" />
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-dashed border-rose-200 bg-rose-50/70 p-5 text-sm text-rose-600 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200">
        Không thể tải biểu đồ chuyển đổi funnel. {error}
      </div>
    );
  }

  if (isFunnelEmpty(data)) {
    return (
      <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-5 text-sm text-gray-600 dark:border-gray-700 dark:bg-white/2 dark:text-gray-300">
        Chưa có dữ liệu chuyển đổi phỏng vấn và offer trong khoảng thời gian đã chọn.
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-white px-4 pb-5 pt-4 dark:border-gray-800 dark:bg-white/3 md:px-5 md:pb-6 md:pt-5 lg:px-6 lg:pt-6">
      <div className="mb-6 flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="text-base font-semibold text-gray-800 dark:text-white/90 md:text-lg">
            Chuyển đổi pipeline tuyển dụng
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            So sánh số buổi phỏng vấn hoàn tất và offer gửi đi theo từng tháng
          </p>
        </div>
      </div>

      <div className="custom-scrollbar -ml-3 overflow-x-auto md:-ml-5 xl:ml-0">
        <div className="min-w-[400px] md:min-w-[500px] xl:min-w-full">
          <Chart options={options} series={series} type="area" height={320} />
        </div>
      </div>
    </div>
  );
}
