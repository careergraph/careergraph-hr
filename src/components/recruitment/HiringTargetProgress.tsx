import { useState } from "react";
import Chart from "react-apexcharts";
import type { ApexOptions } from "apexcharts";
import { Dropdown } from "../custom/dropdown/Dropdown";
import { DropdownItem } from "../custom/dropdown/DropdownItem";
import { CheckCircleIcon, MoreDotIcon } from "@/icons";

/**
 * HiringTargetProgress hiển thị mức độ hoàn thành mục tiêu tuyển dụng theo tháng.
 * Biểu đồ radial giúp lãnh đạo nhanh chóng nắm tỷ lệ vị trí đã được lấp đầy.
 */
export default function HiringTargetProgress() {
  const [isOpen, setIsOpen] = useState(false);

  const series = [68];

  const options: ApexOptions = {
    colors: ["#465FFF"],
    chart: {
      fontFamily: "Outfit, sans-serif",
      type: "radialBar",
      height: 330,
      toolbar: { show: false },
    },
    plotOptions: {
      radialBar: {
        startAngle: -110,
        endAngle: 110,
        hollow: { size: "78%" },
        track: {
          background: "#E4E7EC",
          strokeWidth: "100%",
          margin: 6,
        },
        dataLabels: {
          name: { show: false },
          value: {
            fontSize: "34px",
            fontWeight: 600,
            offsetY: -20,
            color: "#1D2939",
            formatter: (val) => `${Math.round(val)}%`,
          },
        },
      },
    },
    fill: { type: "solid", colors: ["#465FFF"] },
    stroke: { lineCap: "round" },
    labels: ["Mức độ hoàn thành"],
  };

  const toggleDropdown = () => setIsOpen((prev) => !prev);
  const closeDropdown = () => setIsOpen(false);

  return (
    <div className="rounded-2xl border border-gray-200 bg-gray-100 dark:border-gray-800 dark:bg-white/[0.03]">
      <div className="rounded-2xl bg-white px-5 pb-10 pt-5 shadow-default dark:bg-gray-900 sm:px-6 sm:pt-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
              Tiến độ tuyển dụng theo tháng
            </h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Theo dõi số vị trí đã được tuyển so với mục tiêu đã đặt
            </p>
          </div>
          <div className="relative inline-block self-end sm:self-auto">
            <button className="dropdown-toggle" onClick={toggleDropdown}>
              <MoreDotIcon className="size-6 text-gray-400 hover:text-gray-700 dark:hover:text-gray-300" />
            </button>
            <Dropdown
              isOpen={isOpen}
              onClose={closeDropdown}
              className="w-44 p-2"
            >
              <DropdownItem
                onItemClick={closeDropdown}
                className="flex w-full rounded-lg text-left text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-300"
              >
                Xem chi tiết kế hoạch
              </DropdownItem>
              <DropdownItem
                onItemClick={closeDropdown}
                className="flex w-full rounded-lg text-left text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-300"
              >
                Xuất báo cáo PDF
              </DropdownItem>
            </Dropdown>
          </div>
        </div>

        {/* Biểu đồ radial thể hiện % vị trí đã tuyển */}
        <div className="relative flex flex-col items-center">
          <div
            className="mx-auto max-h-[330px] max-w-[320px]"
            id="hiringTargetChart"
          >
            <Chart
              options={options}
              series={series}
              type="radialBar"
              height={330}
            />
          </div>

          {/* Trend badge */}
          <div className="mt-[-50px] flex items-center gap-1 rounded-full border border-success-200 bg-success-50 px-3 py-1.5 text-sm font-semibold text-success-600 shadow-sm dark:border-success-500/20 dark:bg-success-500/10 dark:text-success-300">
            <CheckCircleIcon className="size-4" />
            +6% so với tháng trước
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-4 px-6 py-4 sm:flex-row sm:items-center sm:justify-center sm:gap-6">
        {/* Các chỉ số phụ gợi ý hành động cho HR */}
        <div className="text-center">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Mục tiêu quý
          </p>
          <p className="mt-1 text-base font-semibold text-gray-800 dark:text-white/90">
            72 vị trí
          </p>
        </div>
        <div className="h-px w-full bg-gray-200 dark:bg-gray-800 sm:h-8 sm:w-px" />
        <div className="text-center">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Đã tuyển mới
          </p>
          <p className="mt-1 text-base font-semibold text-gray-800 dark:text-white/90">
            18 tuần này
          </p>
        </div>
        <div className="h-px w-full bg-gray-200 dark:bg-gray-800 sm:h-8 sm:w-px" />
        <div className="text-center">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Đề xuất sắp tới
          </p>
          <p className="mt-1 text-base font-semibold text-gray-800 dark:text-white/90">
            5 offer chờ ký
          </p>
        </div>
      </div>
    </div>
  );
}
