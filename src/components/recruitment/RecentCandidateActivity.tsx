import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../custom/table";
import Badge from "../custom/badge/Badge";
import { CalenderIcon, MailIcon, UserCircleIcon } from "@/icons";

type CandidateStatus = "Interview" | "Offered" | "Rejected" | "Hired";

type CandidateRecord = {
  id: string;
  name: string;
  role: string;
  stage: string;
  source: string;
  status: CandidateStatus;
  avatar?: string;
};

const CANDIDATES: CandidateRecord[] = [
  {
    id: "1",
    name: "Nguyễn Hoàng Anh",
    role: "Senior Backend Engineer",
    stage: "Phỏng vấn vòng 3",
    source: "LinkedIn",
    status: "Interview",
    avatar: "/images/user/user-01.png",
  },
  {
    id: "2",
    name: "Trần Quỳnh Nhi",
    role: "Product Manager",
    stage: "Đã gửi offer",
    source: "Refer",
    status: "Offered",
    avatar: "/images/user/user-02.png",
  },
  {
    id: "3",
    name: "Phạm Minh Khoa",
    role: "UI/UX Designer",
    stage: "Đang chờ phản hồi",
    source: "Career site",
    status: "Interview",
    avatar: "/images/user/user-03.png",
  },
  {
    id: "4",
    name: "Phùng Hải Hà",
    role: "Talent Acquisition Lead",
    stage: "Nhận việc",
    source: "Headhunt",
    status: "Hired",
    avatar: "/images/user/user-04.png",
  },
  {
    id: "5",
    name: "Lưu Đức Minh",
    role: "QA Automation",
    stage: "Loại ở vòng test",
    source: "TopCV",
    status: "Rejected",
    avatar: "/images/user/user-05.png",
  },
];

/**
 * RecentCandidateActivity liệt kê các cập nhật pipeline gần nhất để HR theo dõi.
 * Mỗi dòng kết hợp badge trạng thái giúp ưu tiên chăm sóc ứng viên kịp thời.
 */
export default function RecentCandidateActivity() {
  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white px-4 pb-4 pt-5 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            Cập nhật pipeline mới nhất
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Tổng hợp thay đổi trong 24 giờ qua giữa các giai đoạn tuyển dụng
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-xs font-medium text-gray-600 shadow-theme-xs hover:bg-gray-50 hover:text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200">
            <CalenderIcon className="size-4" />
            7 ngày gần nhất
          </button>
          <button className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-xs font-medium text-gray-600 shadow-theme-xs hover:bg-gray-50 hover:text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200">
            <MailIcon className="size-4" />
            Gửi báo cáo
          </button>
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
                Nguồn
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
            {CANDIDATES.map((candidate) => (
              <TableRow key={candidate.id}>
                <TableCell className="py-3">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 overflow-hidden rounded-full bg-gray-100 dark:bg-white/10">
                      {candidate.avatar ? (
                        <img
                          src={candidate.avatar}
                          className="h-full w-full object-cover"
                          alt={candidate.name}
                        />
                      ) : (
                        <UserCircleIcon className="size-12 text-gray-300 dark:text-gray-600" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-800 dark:text-white/90">
                        {candidate.name}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Cập nhật {candidate.stage.toLowerCase()}
                      </p>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="py-3 text-sm text-gray-600 dark:text-gray-300">
                  {candidate.role}
                </TableCell>
                <TableCell className="py-3 text-sm text-gray-600 dark:text-gray-300">
                  {candidate.stage}
                </TableCell>
                <TableCell className="py-3 text-sm text-gray-600 dark:text-gray-300">
                  {candidate.source}
                </TableCell>
                <TableCell className="py-3 text-sm text-gray-600 dark:text-gray-300">
                  <Badge
                    size="sm"
                    color={
                      candidate.status === "Hired"
                        ? "success"
                        : candidate.status === "Interview"
                        ? "info"
                        : candidate.status === "Offered"
                        ? "warning"
                        : "error"
                    }
                  >
                    {candidate.status}
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
