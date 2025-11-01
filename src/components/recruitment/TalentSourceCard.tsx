import { useState } from "react";
import { Dropdown } from "../custom/dropdown/Dropdown";
import { DropdownItem } from "../custom/dropdown/DropdownItem";
import { DownloadIcon, FolderIcon, MoreDotIcon } from "@/icons";

type SourceMetric = {
  id: string;
  label: string;
  value: string;
  percentage: number;
  description: string;
  accentClass: string;
};

const SOURCES: SourceMetric[] = [
  {
    id: "referral",
    label: "Giới thiệu nội bộ",
    value: "124 ứng viên",
    percentage: 46,
    description: "Tăng 12 hồ sơ so với tuần trước",
    accentClass: "bg-brand-500",
  },
  {
    id: "linkedin",
    label: "LinkedIn Recruiter",
    value: "88 ứng viên",
    percentage: 33,
    description: "Giảm nhẹ do tạm dừng gói quảng cáo",
    accentClass: "bg-info-500",
  },
  {
    id: "career-site",
    label: "Website tuyển dụng",
    value: "52 ứng viên",
    percentage: 21,
    description: "Cần tối ưu landing page job",
    accentClass: "bg-success-500",
  },
];

/**
 * TalentSourceCard tóm lược các kênh tuyển dụng hiệu quả nhất trong tuần hiện tại.
 * Kết hợp dropdown để HR tải về data hoặc xem chi tiết chiến dịch.
 */
export default function TalentSourceCard() {
  const [isOpen, setIsOpen] = useState(false);

  const toggleDropdown = () => setIsOpen((prev) => !prev);
  const closeDropdown = () => setIsOpen(false);

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            Top nguồn ứng viên
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Theo dõi hiệu suất từng kênh để phân bổ ngân sách hợp lý
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
              className="flex w-full items-center gap-2 rounded-lg text-left text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-300"
            >
              <FolderIcon className="size-4" />
              Phân tích chiến dịch
            </DropdownItem>
            <DropdownItem
              onItemClick={closeDropdown}
              className="flex w-full items-center gap-2 rounded-lg text-left text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-300"
            >
              <DownloadIcon className="size-4" />
              Xuất dữ liệu nguồn
            </DropdownItem>
          </Dropdown>
        </div>
      </div>

      <div className="mt-6 space-y-5">
        {SOURCES.map((source) => (
          <div key={source.id} className="space-y-3">
            {/* Header mỗi nguồn thể hiện nhanh số lượng và xu hướng */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {source.label}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {source.value}
                </p>
              </div>
              <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600 dark:bg-white/10 dark:text-gray-300">
                {source.percentage}%
              </span>
            </div>

            {/* Thanh tỷ lệ mô tả đóng góp của từng nguồn */}
            <div className="relative h-2 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-white/10">
              <div
                className={`absolute left-0 top-0 h-full ${source.accentClass}`}
                style={{ width: `${source.percentage}%` }}
              />
            </div>

            <p className="text-xs text-gray-500 dark:text-gray-400">
              {source.description}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
