import Chart from "react-apexcharts";
import type { ApexOptions } from "apexcharts";
import ChartTab from "../common/ChartTab";

const MONTH_LABELS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

const SERIES = [
  {
    name: "Phỏng vấn hoàn tất",
    data: [42, 45, 51, 48, 55, 53, 59, 62, 68, 70, 74, 78],
  },
  {
    name: "Offer gửi đi",
    data: [18, 20, 24, 22, 25, 26, 30, 31, 35, 37, 39, 41],
  },
];

/**
 * FunnelConversionChart theo dõi tỷ lệ chuyển đổi giữa giai đoạn phỏng vấn và offer.
 */
export default function FunnelConversionChart() {
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
      categories: MONTH_LABELS,
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

  return (
    <div className="rounded-2xl border border-gray-200 bg-white px-5 pb-6 pt-5 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6 sm:pt-6">
      <div className="mb-6 flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            Chuyển đổi pipeline tuyển dụng
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            So sánh số buổi phỏng vấn hoàn tất và offer gửi đi theo từng tháng
          </p>
        </div>
        <div className="flex w-full items-start justify-start gap-3 sm:w-auto sm:justify-end">
          {/* ChartTab giúp chuyển đổi nhanh phạm vi thời gian */}
          <ChartTab />
        </div>
      </div>

      <div className="custom-scrollbar -ml-5 overflow-x-auto xl:ml-0">
        <div className="min-w-[1000px] xl:min-w-full">
          <Chart options={options} series={SERIES} type="area" height={320} />
        </div>
      </div>
    </div>
  );
}
