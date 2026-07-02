import { useState } from "react";
import Chart from "react-apexcharts";
import type { ApexOptions } from "apexcharts";
import { Dropdown } from "../custom/dropdown/Dropdown";
import { DropdownItem } from "../custom/dropdown/DropdownItem";
import { MoreDotIcon } from "@/icons";
import type { DashboardPipelineVelocity } from "@/features/dashboard/types/dashboard.types";
import { exportPipelineCsv, exportPipelinePdf } from "@/features/dashboard/utils/reportExport";
import { toast } from "sonner";

type PipelineVelocityChartProps = {
  data?: DashboardPipelineVelocity | null;
  loading?: boolean;
  error?: string | null;
};

const isPipelineEmpty = (data?: DashboardPipelineVelocity | null): boolean => {
  if (!data || data.monthly.length === 0) return true;
  return data.monthly.every((item) => item.totalTransitions === 0);
};

/**
 * PipelineVelocityChart hiển thị số lượng ứng viên chuyển bước mỗi tháng.
 */
export default function PipelineVelocityChart({
  data,
  loading = false,
  error = null,
}: PipelineVelocityChartProps) {
  const [isOpen, setIsOpen] = useState(false);

  const categories = data?.monthly.map((item) => item.monthLabel) ?? [];
  const values = data?.monthly.map((item) => item.totalTransitions) ?? [];

  const options: ApexOptions = {
    colors: ["#465FFF"],
    chart: {
      fontFamily: "Outfit, sans-serif",
      type: "bar",
      height: 220,
      toolbar: {
        show: false,
      },
    },
    plotOptions: {
      bar: {
        horizontal: false,
        columnWidth: "38%",
        borderRadius: 6,
        borderRadiusApplication: "end",
      },
    },
    dataLabels: {
      enabled: false,
    },
    stroke: {
      show: true,
      width: 3,
      colors: ["transparent"],
    },
    xaxis: {
      categories,
      axisBorder: { show: false },
      axisTicks: { show: false },
    },
    yaxis: {
      title: {
        // text: "Ứng viên tiến bước",
        style: {
          fontSize: "12px",
          fontWeight: 500,
        },
      },
      labels: {
        formatter: (val) => `${Math.round(val)} người`,
      },
    },
    grid: {
      yaxis: {
        lines: {
          show: true,
        },
      },
    },
    tooltip: {
      enabled: false,
    },
  };

  const series = [
    {
      name: "Ứng viên chuyển giai đoạn",
      data: values,
    },
  ];

  const toggleDropdown = () => setIsOpen((prev) => !prev);
  const closeDropdown = () => setIsOpen(false);

  const handleExportCsv = () => {
    const ok = exportPipelineCsv(data);
    if (!ok) {
      toast.error("Không có dữ liệu để xuất CSV");
      return;
    }
    toast.success("Đã xuất dữ liệu CSV");
    closeDropdown();
  };

  const handleExportPdf = () => {
    const ok = exportPipelinePdf(data);
    if (!ok) {
      toast.error("Không có dữ liệu để xuất PDF");
      return;
    }
    toast.success("Đã xuất báo cáo PDF");
    closeDropdown();
  };

  if (loading) {
    return (
      <div className="h-79.5 animate-pulse rounded-2xl border border-gray-200 bg-gray-100 dark:border-gray-800 dark:bg-white/3" />
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-dashed border-rose-200 bg-rose-50/70 p-5 text-sm text-rose-600 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200">
        Không thể tải biểu đồ tốc độ quy trình tuyển dụng. {error}
      </div>
    );
  }

  if (isPipelineEmpty(data)) {
    return (
      <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-5 text-sm text-gray-600 dark:border-gray-700 dark:bg-white/2 dark:text-gray-300">
        Chưa có dữ liệu chuyển bước ứng viên trong khoảng thời gian đã chọn.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white px-4 pt-4 dark:border-gray-800 dark:bg-white/3 md:px-5 md:pt-5 lg:px-6 lg:pt-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="text-base font-semibold text-gray-800 dark:text-white/90 md:text-lg">
            Tiến độ luân chuyển hồ sơ theo tháng
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Số lượng hồ sơ được cập nhật sang giai đoạn kế tiếp trong từng tháng
          </p>
        </div>
        <div className="relative inline-block self-end sm:self-auto">
          <button
            className="dropdown-toggle"
            onClick={toggleDropdown}
            title="Mở tùy chọn"
            aria-label="Mở tùy chọn"
          >
            <MoreDotIcon className="size-6 text-gray-400 hover:text-gray-700 dark:hover:text-gray-300" />
          </button>
          <Dropdown isOpen={isOpen} onClose={closeDropdown} className="w-44 p-2">
            <DropdownItem
              onItemClick={handleExportPdf}
              className="flex w-full rounded-lg text-left text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-300"
            >
              Xuất báo cáo PDF
            </DropdownItem>
            <DropdownItem
              onItemClick={handleExportCsv}
              className="flex w-full rounded-lg text-left text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-300"
            >
              Xuất dữ liệu CSV
            </DropdownItem>
          </Dropdown>
        </div>
      </div>

      {/* Biểu đồ cột hiển thị tốc độ pipeline theo tháng */}
      <div className="custom-scrollbar -ml-3 mt-4 overflow-x-auto overflow-y-hidden [scrollbar-gutter:stable] md:-ml-5 xl:ml-0">
        <div className="-ml-1 min-w-[350px] pl-2 md:min-w-[450px] xl:min-w-full">
          <Chart options={options} series={series} type="bar" height={220} />
        </div>
      </div>
    </div>
  );
}
