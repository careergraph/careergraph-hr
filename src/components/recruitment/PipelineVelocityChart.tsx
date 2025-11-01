import { useState } from "react";
import Chart from "react-apexcharts";
import type { ApexOptions } from "apexcharts";
import { Dropdown } from "../custom/dropdown/Dropdown";
import { DropdownItem } from "../custom/dropdown/DropdownItem";
import { MoreDotIcon } from "@/icons";

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

const SERIES_DATA = [
  52,
  68,
  61,
  74,
  70,
  79,
  83,
  77,
  88,
  95,
  90,
  92,
];

/**
 * PipelineVelocityChart hiển thị số lượng ứng viên chuyển bước mỗi tháng.
 */
export default function PipelineVelocityChart() {
  const [isOpen, setIsOpen] = useState(false);

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
      categories: MONTH_LABELS,
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
      x: { show: false },
      y: {
        formatter: (val: number) => `${val} ứng viên`,
      },
    },
  };

  const series = [
    {
      name: "Ứng viên chuyển bước",
      data: SERIES_DATA,
    },
  ];

  const toggleDropdown = () => setIsOpen((prev) => !prev);
  const closeDropdown = () => setIsOpen(false);

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white px-5 pt-5 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6 sm:pt-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            Tốc độ pipeline theo tháng
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Số ứng viên được chuyển sang bước tiếp theo trong mỗi tháng
          </p>
        </div>
        <div className="relative inline-block self-end sm:self-auto">
          <button className="dropdown-toggle" onClick={toggleDropdown}>
            <MoreDotIcon className="size-6 text-gray-400 hover:text-gray-700 dark:hover:text-gray-300" />
          </button>
          <Dropdown isOpen={isOpen} onClose={closeDropdown} className="w-44 p-2">
            <DropdownItem
              onItemClick={closeDropdown}
              className="flex w-full rounded-lg text-left text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-300"
            >
              Xem báo cáo
            </DropdownItem>
            <DropdownItem
              onItemClick={closeDropdown}
              className="flex w-full rounded-lg text-left text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-300"
            >
              Xuất dữ liệu CSV
            </DropdownItem>
          </Dropdown>
        </div>
      </div>

      {/* Biểu đồ cột hiển thị tốc độ pipeline theo tháng */}
      <div className="custom-scrollbar -ml-5 mt-4 overflow-x-auto xl:ml-0">
        <div className="-ml-1 min-w-[650px] pl-2 xl:min-w-full">
          <Chart options={options} series={series} type="bar" height={220} />
        </div>
      </div>
    </div>
  );
}
