import { useEffect, useMemo, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../custom/table";
import Badge from "../custom/badge/Badge";
import { CalenderIcon, UserCircleIcon } from "@/icons";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import type { DashboardRecentActivity } from "@/features/dashboard/types/dashboard.types";
import { formatDateTimeYMDHM } from "@/lib/dateUtils";

type RecentCandidateActivityProps = {
  data?: DashboardRecentActivity[] | null;
  loading?: boolean;
  error?: string | null;
  dateRangeLabel?: string;
  itemsPerPage?: number;
};

const statusLabelMap: Record<string, string> = {
  INTERVIEW: "Phỏng vấn",
  OFFERED: "Đã mời nhận việc",
  REJECTED: "Từ chối",
  HIRED: "Đã tuyển",
};

const badgeColorMap: Record<string, "success" | "info" | "warning" | "error"> = {
  HIRED: "success",
  INTERVIEW: "info",
  OFFERED: "warning",
  REJECTED: "error",
};

const formatUpdatedAt = (value: string): string => {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return "Không xác định";
  }

  return formatDateTimeYMDHM(parsed);
};

/**
 * RecentCandidateActivity liệt kê các cập nhật pipeline gần nhất để HR theo dõi.
 * Mỗi dòng kết hợp badge trạng thái giúp ưu tiên chăm sóc ứng viên kịp thời.
 */
export default function RecentCandidateActivity({
  data,
  loading = false,
  error = null,
  dateRangeLabel = "30 ngày gần nhất",
  itemsPerPage = 5,
}: RecentCandidateActivityProps) {
  if (loading) {
    return (
      <div className="h-105 animate-pulse rounded-2xl border border-gray-200 bg-gray-100 dark:border-gray-800 dark:bg-white/3" />
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-dashed border-rose-200 bg-rose-50/70 p-5 text-sm text-rose-600 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200">
        Không thể tải bảng hoạt động ứng viên. {error}
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-5 text-sm text-gray-600 dark:border-gray-700 dark:bg-white/2 dark:text-gray-300">
        Chưa có hoạt động tuyển dụng nào trong khoảng thời gian đã chọn.
      </div>
    );
  }

  return (
    <RecentCandidateActivityInner
      data={data}
      dateRangeLabel={dateRangeLabel}
      itemsPerPage={itemsPerPage}
    />
  );
}

function RecentCandidateActivityInner({
  data,
  dateRangeLabel,
  itemsPerPage,
}: {
  data: DashboardRecentActivity[];
  dateRangeLabel: string;
  itemsPerPage: number;
}) {
  const isMobile = useMediaQuery("(max-width: 767px)");
  const safeItemsPerPage = Math.max(1, Math.floor(itemsPerPage || 1));
  const [page, setPage] = useState(0);

  useEffect(() => {
    setPage(0);
  }, [data, safeItemsPerPage]);

  const totalPages = Math.max(1, Math.ceil(data.length / safeItemsPerPage));
  const currentPage = Math.min(page, totalPages - 1);
  const startIndex = currentPage * safeItemsPerPage;
  const visibleData = useMemo(
    () => data.slice(startIndex, startIndex + safeItemsPerPage),
    [data, safeItemsPerPage, startIndex]
  );
  const startItem = data.length === 0 ? 0 : startIndex + 1;
  const endItem = Math.min(startIndex + safeItemsPerPage, data.length);
  const canGoPrevious = currentPage > 0;
  const canGoNext = currentPage < totalPages - 1;

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white px-4 pb-4 pt-5 dark:border-gray-800 dark:bg-white/3 sm:px-6">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-base font-semibold text-gray-800 dark:text-white/90 md:text-lg">
            Hoạt động tuyển dụng mới nhất
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Tổng hợp các thay đổi trạng thái ứng viên theo khoảng thời gian đã chọn
          </p>
        </div>
        <div className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-xs font-medium text-gray-600 shadow-theme-xs dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300">
            <CalenderIcon className="size-4" />
            {dateRangeLabel}
        </div>
      </div>

      <div className="mb-4 flex flex-col gap-3 border-b border-gray-100 pb-4 text-sm text-gray-500 dark:border-gray-800 dark:text-gray-400 sm:flex-row sm:items-center sm:justify-between">
        <p>
          Hiển thị {startItem}-{endItem} trên {data.length} mục
        </p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setPage((current) => Math.max(0, current - 1))}
            disabled={!canGoPrevious}
            className="inline-flex items-center rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
          >
            Trước
          </button>
          <span className="min-w-20 text-center text-xs font-medium text-gray-600 dark:text-gray-400">
            Trang {currentPage + 1}/{totalPages}
          </span>
          <button
            type="button"
            onClick={() => setPage((current) => Math.min(totalPages - 1, current + 1))}
            disabled={!canGoNext}
            className="inline-flex items-center rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
          >
            Sau
          </button>
        </div>
      </div>

      {isMobile ? (
        <div className="space-y-3">
          {visibleData.map((activity) => (
            <div
              key={`${activity.applicationId}-${activity.updatedAt}`}
              className="rounded-xl border border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-gray-800"
            >
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full bg-gray-100 dark:bg-white/10">
                  {activity.candidateAvatar ? (
                    <img
                      src={activity.candidateAvatar}
                      className="h-full w-full object-cover"
                      alt={activity.candidateName}
                    />
                  ) : (
                    <UserCircleIcon className="size-10 text-gray-300 dark:text-gray-600" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <p className="truncate text-sm font-semibold text-gray-800 dark:text-white/90">
                      {activity.candidateName}
                    </p>
                    <Badge
                      size="sm"
                      color={badgeColorMap[activity.statusTag] ?? "info"}
                    >
                      {statusLabelMap[activity.statusTag] ?? "Phỏng vấn"}
                    </Badge>
                  </div>
                  <p className="mt-0.5 truncate text-xs text-gray-500 dark:text-gray-400">
                    {activity.jobTitle}
                  </p>
                  <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500 dark:text-gray-400">
                    <span>{activity.stage}</span>
                    <span>Bởi {activity.updatedBy}</span>
                  </div>
                  <p className="mt-1 text-[11px] text-gray-400 dark:text-gray-500">
                    {formatUpdatedAt(activity.updatedAt)}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="max-w-full overflow-x-auto">
        <Table>
          <TableHeader className="border-y border-gray-100 dark:border-gray-800">
            <TableRow>
              <TableCell
                isHeader
                className="py-3 text-start text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400"
              >
                Ứng viên
              </TableCell>
              <TableCell
                isHeader
                className="py-3 text-start text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400"
              >
                Vị trí
              </TableCell>
              <TableCell
                isHeader
                className="py-3 text-start text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400"
              >
                Giai đoạn
              </TableCell>
              <TableCell
                isHeader
                className="py-3 text-start text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400"
              >
                Người cập nhật
              </TableCell>
              <TableCell
                isHeader
                className="py-3 text-start text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400"
              >
                Trạng thái
              </TableCell>
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
            {visibleData.map((activity) => (
              <TableRow key={`${activity.applicationId}-${activity.updatedAt}`}>
                <TableCell className="py-3">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 overflow-hidden rounded-full bg-gray-100 dark:bg-white/10">
                      {activity.candidateAvatar ? (
                        <img
                          src={activity.candidateAvatar}
                          className="h-full w-full object-cover"
                          alt={activity.candidateName}
                        />
                      ) : (
                        <UserCircleIcon className="size-12 text-gray-300 dark:text-gray-600" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-800 dark:text-white/90">
                        {activity.candidateName}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Cập nhật {formatUpdatedAt(activity.updatedAt)}
                      </p>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="py-3 text-sm text-gray-600 dark:text-gray-300">
                  {activity.jobTitle}
                </TableCell>
                <TableCell className="py-3 text-sm text-gray-600 dark:text-gray-300">
                  {activity.stage}
                </TableCell>
                <TableCell className="py-3 text-sm text-gray-600 dark:text-gray-300">
                  {activity.updatedBy}
                </TableCell>
                <TableCell className="py-3 text-sm text-gray-600 dark:text-gray-300">
                  <Badge
                    size="sm"
                    color={badgeColorMap[activity.statusTag] ?? "info"}
                  >
                    {statusLabelMap[activity.statusTag] ?? "Phỏng vấn"}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        </div>
      )}
    </div>
  );
}
