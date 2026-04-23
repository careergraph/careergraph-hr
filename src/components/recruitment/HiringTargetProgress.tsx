import { useState } from "react";
import Chart from "react-apexcharts";
import type { ApexOptions } from "apexcharts";
import { Dropdown } from "../custom/dropdown/Dropdown";
import { DropdownItem } from "../custom/dropdown/DropdownItem";
import { CheckCircleIcon, MoreDotIcon } from "@/icons";
import type { DashboardHiringTargetProgress } from "@/features/dashboard/types/dashboard.types";
import { Modal } from "@/components/custom/modal";
import Button from "@/components/custom/button/Button";
import { exportHiringTargetPdf } from "@/features/dashboard/utils/reportExport";
import { toast } from "sonner";
import { useMediaQuery } from "@/hooks/useMediaQuery";

type HiringTargetProgressProps = {
  data?: DashboardHiringTargetProgress | null;
  loading?: boolean;
  error?: string | null;
};

const isHiringTargetEmpty = (data?: DashboardHiringTargetProgress | null): boolean => {
  if (!data) return true;

  return (
    data.quarterTargetPositions === 0 &&
    data.hiredThisWeek === 0 &&
    data.pendingOffers === 0
  );
};

/**
 * HiringTargetProgress hiển thị mức độ hoàn thành mục tiêu tuyển dụng theo tháng.
 * Biểu đồ radial giúp lãnh đạo nhanh chóng nắm tỷ lệ vị trí đã được lấp đầy.
 */
export default function HiringTargetProgress({
  data,
  loading = false,
  error = null,
}: HiringTargetProgressProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const isMobile = useMediaQuery("(max-width: 767px)");

  const chartHeight = isMobile ? 260 : 330;

  const completionPercent = data?.completionPercent ?? 0;
  const changePercent = data?.changePercent ?? 0;
  const series = [completionPercent];

  const options: ApexOptions = {
    colors: ["#465FFF"],
    chart: {
      fontFamily: "Outfit, sans-serif",
      type: "radialBar",
      height: chartHeight,
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

  const openPlanDetails = () => {
    setIsPlanModalOpen(true);
    closeDropdown();
  };

  const handleExportPdf = () => {
    const ok = exportHiringTargetPdf(data);
    if (!ok) {
      toast.error("Không có dữ liệu để xuất PDF");
      return;
    }
    toast.success("Đã xuất báo cáo PDF");
    closeDropdown();
  };

  if (loading) {
    return (
      <div className="h-120 animate-pulse rounded-2xl border border-gray-200 bg-gray-100 dark:border-gray-800 dark:bg-white/3" />
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-dashed border-rose-200 bg-rose-50/70 p-5 text-sm text-rose-600 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200">
        Không thể tải tiến độ tuyển dụng. {error}
      </div>
    );
  }

  if (isHiringTargetEmpty(data)) {
    return (
      <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-5 text-sm text-gray-600 dark:border-gray-700 dark:bg-white/2 dark:text-gray-300">
        Chưa có dữ liệu mục tiêu tuyển dụng trong kỳ hiện tại.
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-gray-100 dark:border-gray-800 dark:bg-white/3">
      <div className="rounded-2xl bg-white px-4 pb-5 pt-4 shadow-default dark:bg-gray-900 md:px-5 md:pb-10 md:pt-5 lg:px-6 lg:pt-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h3 className="text-base font-semibold text-gray-800 dark:text-white/90 md:text-lg">
              Tiến độ tuyển dụng theo tháng
            </h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Theo dõi số vị trí đã được tuyển so với mục tiêu đã đặt
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
            <Dropdown
              isOpen={isOpen}
              onClose={closeDropdown}
              className="w-44 p-2"
            >
              <DropdownItem
                onItemClick={openPlanDetails}
                className="flex w-full rounded-lg text-left text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-300"
              >
                Xem chi tiết kế hoạch
              </DropdownItem>
              <DropdownItem
                onItemClick={handleExportPdf}
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
            className="mx-auto max-h-82.5 max-w-[320px]"
            id="hiringTargetChart"
          >
            <Chart
              options={options}
              series={series}
              type="radialBar"
              height={chartHeight}
            />
          </div>

          {/* Trend badge */}
          <div className="-mt-12.5 flex items-center gap-1 rounded-full border border-success-200 bg-success-50 px-3 py-1.5 text-sm font-semibold text-success-600 shadow-sm dark:border-success-500/20 dark:bg-success-500/10 dark:text-success-300">
            <CheckCircleIcon className="size-4" />
            {`${changePercent >= 0 ? "+" : ""}${changePercent.toFixed(1)}% so với kỳ trước`}
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
            {`${(data?.quarterTargetPositions ?? 0).toLocaleString("vi-VN")} vị trí`}
          </p>
        </div>
        <div className="h-px w-full bg-gray-200 dark:bg-gray-800 sm:h-8 sm:w-px" />
        <div className="text-center">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Đã tuyển mới
          </p>
          <p className="mt-1 text-base font-semibold text-gray-800 dark:text-white/90">
            {(data?.hiredThisWeek ?? 0).toLocaleString("vi-VN")} tuần này
          </p>
        </div>
        <div className="h-px w-full bg-gray-200 dark:bg-gray-800 sm:h-8 sm:w-px" />
        <div className="text-center">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Đề xuất sắp tới
          </p>
          <p className="mt-1 text-base font-semibold text-gray-800 dark:text-white/90">
            {(data?.pendingOffers ?? 0).toLocaleString("vi-VN")} offer chờ ký
          </p>
        </div>
      </div>

      <Modal isOpen={isPlanModalOpen} onClose={() => setIsPlanModalOpen(false)} className="m-4 max-w-[680px]">
        <div className="no-scrollbar relative w-full max-w-[680px] overflow-y-auto rounded-3xl bg-white p-6 dark:bg-gray-900 lg:p-8">
          <h4 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Chi tiết kế hoạch tuyển dụng</h4>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            Tập trung theo dõi KPI chính để điều chỉnh tốc độ pipeline và tỷ lệ chốt offer.
          </p>

          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <MetricCard title="Mục tiêu quý" value={`${(data?.quarterTargetPositions ?? 0).toLocaleString("vi-VN")} vị trí`} />
            <MetricCard title="Tỷ lệ hoàn thành" value={`${(data?.completionPercent ?? 0).toFixed(1)}%`} />
            <MetricCard title="Đã tuyển tuần này" value={`${(data?.hiredThisWeek ?? 0).toLocaleString("vi-VN")} ứng viên`} />
            <MetricCard title="Offer chờ ký" value={`${(data?.pendingOffers ?? 0).toLocaleString("vi-VN")} offer`} />
          </div>

          <div className="mt-6 rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/40">
            <h5 className="text-sm font-semibold text-gray-800 dark:text-gray-200">Gợi ý hành động</h5>
            <ul className="mt-2 space-y-2 text-sm text-gray-600 dark:text-gray-300">
              <li>- Đẩy nhanh lịch phỏng vấn với các vị trí đang chậm hơn kế hoạch.</li>
              <li>- Ưu tiên xử lý offer tồn để giảm tỷ lệ rớt cuối pipeline.</li>
              <li>- Soát lại JD ở nhóm vị trí có chuyển đổi thấp trong 2 tuần gần nhất.</li>
            </ul>
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <Button size="sm" variant="outline" onClick={() => setIsPlanModalOpen(false)}>
              Đóng
            </Button>
            <Button size="sm" onClick={handleExportPdf}>
              Xuất PDF
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function MetricCard({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800/50">
      <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">{title}</p>
      <p className="mt-2 text-base font-semibold text-gray-900 dark:text-gray-100">{value}</p>
    </div>
  );
}
