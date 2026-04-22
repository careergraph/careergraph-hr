import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../custom/table";
import Badge from "../custom/badge/Badge";
import { CalenderIcon, UserCircleIcon } from "@/icons";
import type { DashboardRecentActivity } from "@/features/dashboard/types/dashboard.types";

type RecentCandidateActivityProps = {
  data?: DashboardRecentActivity[] | null;
  loading?: boolean;
  error?: string | null;
  dateRangeLabel?: string;
};

const statusLabelMap: Record<string, string> = {
  INTERVIEW: "Interview",
  OFFERED: "Offered",
  REJECTED: "Rejected",
  HIRED: "Hired",
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

  return parsed.toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
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
        Chưa có hoạt động pipeline nào trong khoảng thời gian đã chọn.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white px-4 pb-4 pt-5 dark:border-gray-800 dark:bg-white/3 sm:px-6">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            Cập nhật pipeline mới nhất
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Tổng hợp thay đổi theo khoảng thời gian đã chọn giữa các giai đoạn tuyển dụng
          </p>
        </div>
        <div className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-xs font-medium text-gray-600 shadow-theme-xs dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300">
            <CalenderIcon className="size-4" />
            {dateRangeLabel}
        </div>
      </div>

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
            {data.map((activity) => (
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
                    {statusLabelMap[activity.statusTag] ?? "Interview"}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
