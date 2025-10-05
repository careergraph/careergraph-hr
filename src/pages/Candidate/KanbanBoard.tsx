import { useState } from "react";
import {
  DndContext,
  DragOverlay,
  closestCorners,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragOverEvent,
  DragEndEvent,
} from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import { Column } from "./Column";
import { CandidateCard } from "./CandidateCard";
import { Candidate, Status } from "../../types/candidate";

// Mock data - danh sách ứng viên mẫu
const initialCandidates: Candidate[] = [
  {
    id: "1",
    ticketId: "REC-001",
    name: "Nguyễn Văn An",
    position: "Senior Frontend Developer",
    email: "nguyenvanan@email.com",
    phone: "0901234567",
    priority: "high",
    status: "apply",
    appliedDate: "15/12/2024",
    experienceLevel: "senior",
    salaryExpectation: "30-35 triệu VNĐ",
    assignee: { id: "hr1", name: "Trần Thị Hương" },
    labels: ["React", "TypeScript", "Remote OK"],
    description:
      "5 năm kinh nghiệm phát triển frontend với React, Vue. Có kinh nghiệm lead team nhỏ. Từng làm việc tại các startup công nghệ.",
    timeline: [
      {
        id: "t1",
        action: "Nộp đơn ứng tuyển",
        description: "Ứng viên nộp đơn qua website careers",
        date: "15/12/2024 09:30",
        user: "Hệ thống",
      },
    ],
  },
  {
    id: "2",
    ticketId: "REC-002",
    name: "Lê Thị Bình",
    position: "UI/UX Designer",
    email: "lethibinh@email.com",
    phone: "0912345678",
    priority: "high",
    status: "apply",
    appliedDate: "14/12/2024",
    experienceLevel: "mid",
    salaryExpectation: "20-25 triệu VNĐ",
    assignee: { id: "hr1", name: "Trần Thị Hương" },
    labels: ["Figma", "Adobe XD", "UI Design"],
    description:
      "3 năm kinh nghiệm thiết kế giao diện cho mobile app và website. Portfolio ấn tượng.",
    timeline: [
      {
        id: "t1",
        action: "Nộp đơn ứng tuyển",
        description: "Ứng viên nộp đơn qua LinkedIn",
        date: "14/12/2024 14:20",
        user: "Hệ thống",
      },
    ],
  },
  {
    id: "3",
    ticketId: "REC-003",
    name: "Phạm Minh Châu",
    position: "Backend Developer",
    email: "phamminhchau@email.com",
    priority: "medium",
    status: "meeting",
    appliedDate: "12/12/2024",
    experienceLevel: "junior",
    salaryExpectation: "15-18 triệu VNĐ",
    assignee: { id: "hr2", name: "Nguyễn Văn Toàn" },
    labels: ["Node.js", "Python", "Database"],
    description:
      "2 năm kinh nghiệm với Node.js và Python. Tốt nghiệp loại giỏi ĐHBK.",
    timeline: [
      {
        id: "t1",
        action: "Nộp đơn ứng tuyển",
        description: "Ứng viên nộp đơn qua email",
        date: "12/12/2024 10:00",
        user: "Hệ thống",
      },
      {
        id: "t2",
        action: "Sắp xếp phỏng vấn sơ bộ",
        description: "Đã gửi lịch hẹn qua email",
        date: "13/12/2024 11:30",
        user: "Trần Thị Hương",
      },
    ],
  },
  {
    id: "4",
    ticketId: "REC-004",
    name: "Hoàng Đức Dũng",
    position: "DevOps Engineer",
    email: "hoangducdung@email.com",
    phone: "0923456789",
    priority: "high",
    status: "interview",
    appliedDate: "10/12/2024",
    experienceLevel: "senior",
    salaryExpectation: "35-40 triệu VNĐ",
    assignee: { id: "hr2", name: "Nguyễn Văn Toàn" },
    labels: ["AWS", "Docker", "Kubernetes", "CI/CD"],
    description:
      "6 năm kinh nghiệm DevOps, từng làm việc tại các công ty product lớn.",
    timeline: [
      {
        id: "t1",
        action: "Nộp đơn ứng tuyển",
        description: "Ứng viên được giới thiệu bởi nhân viên hiện tại",
        date: "10/12/2024 08:00",
        user: "Hệ thống",
      },
      {
        id: "t2",
        action: "Phỏng vấn sơ bộ thành công",
        description: "Đánh giá tốt từ HR",
        date: "11/12/2024 15:00",
        user: "Nguyễn Văn Toàn",
      },
      {
        id: "t3",
        action: "Sắp xếp phỏng vấn kỹ thuật",
        description: "Lịch hẹn với team kỹ thuật",
        date: "13/12/2024 09:00",
        user: "Nguyễn Văn Toàn",
      },
    ],
  },
  {
    id: "5",
    ticketId: "REC-005",
    name: "Vũ Thị Hoa",
    position: "Product Manager",
    email: "vuthihoa@email.com",
    phone: "0934567890",
    priority: "medium",
    status: "trial",
    appliedDate: "05/12/2024",
    experienceLevel: "mid",
    salaryExpectation: "28-32 triệu VNĐ",
    assignee: { id: "hr1", name: "Trần Thị Hương" },
    labels: ["Agile", "Product Strategy", "User Research"],
    description:
      "4 năm kinh nghiệm PM tại các công ty fintech. Tư duy sản phẩm tốt.",
    timeline: [
      {
        id: "t1",
        action: "Nộp đơn ứng tuyển",
        description: "Ứng viên nộp đơn qua website",
        date: "05/12/2024 14:30",
        user: "Hệ thống",
      },
      {
        id: "t2",
        action: "Phỏng vấn sơ bộ",
        description: "Pass vòng HR",
        date: "07/12/2024 10:00",
        user: "Trần Thị Hương",
      },
      {
        id: "t3",
        action: "Phỏng vấn chuyên môn",
        description: "Pass vòng kỹ thuật và leadership",
        date: "09/12/2024 14:00",
        user: "Trần Thị Hương",
      },
      {
        id: "t4",
        action: "Bắt đầu thử việc",
        description: "Đang trong giai đoạn thử việc 2 tháng",
        date: "12/12/2024 08:00",
        user: "Trần Thị Hương",
      },
    ],
  },
  {
    id: "6",
    ticketId: "REC-006",
    name: "Đỗ Văn Giang",
    position: "Data Analyst",
    email: "dovangiang@email.com",
    priority: "low",
    status: "hired",
    appliedDate: "01/12/2024",
    experienceLevel: "junior",
    salaryExpectation: "16-20 triệu VNĐ",
    assignee: { id: "hr2", name: "Nguyễn Văn Toàn" },
    labels: ["SQL", "Python", "Power BI", "Excel"],
    description:
      "1.5 năm kinh nghiệm phân tích dữ liệu. Tốt nghiệp Thạc sĩ Toán ứng dụng.",
    timeline: [
      {
        id: "t1",
        action: "Nộp đơn ứng tuyển",
        description: "Ứng viên nộp đơn qua job portal",
        date: "01/12/2024 09:00",
        user: "Hệ thống",
      },
      {
        id: "t2",
        action: "Phỏng vấn sơ bộ",
        description: "Ứng viên thể hiện tốt",
        date: "03/12/2024 11:00",
        user: "Nguyễn Văn Toàn",
      },
      {
        id: "t3",
        action: "Phỏng vấn chuyên môn",
        description: "Làm bài test xuất sắc",
        date: "05/12/2024 15:00",
        user: "Nguyễn Văn Toàn",
      },
      {
        id: "t4",
        action: "Thử việc 1 tháng",
        description: "Hoàn thành tốt nhiệm vụ thử việc",
        date: "10/12/2024 08:00",
        user: "Nguyễn Văn Toàn",
      },
      {
        id: "t5",
        action: "Nhận chính thức",
        description: "Ký hợp đồng chính thức",
        date: "14/12/2024 09:00",
        user: "Nguyễn Văn Toàn",
      },
    ],
  },
];

// Định nghĩa columns theo quy trình tuyển dụng
const columns = [
  { id: "apply" as Status, title: "Ứng tuyển" },
  { id: "meeting" as Status, title: "Phỏng vấn sơ bộ" },
  { id: "interview" as Status, title: "Phỏng vấn chính thức" },
  { id: "trial" as Status, title: "Thử việc" },
  { id: "hired" as Status, title: "Nhận chính thức" },
];

// Component quản lý toàn bộ Kanban board tuyển dụng
export const KanbanBoard = () => {
  const [candidates, setCandidates] = useState<Candidate[]>(initialCandidates);
  const [activeCandidate, setActiveCandidate] = useState<Candidate | null>(
    null
  );

  // Sensor config cho drag & drop
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Kéo tối thiểu 8px mới bắt đầu drag
      },
    })
  );

  // Khi bắt đầu kéo ứng viên
  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const candidate = candidates.find((c) => c.id === active.id);
    setActiveCandidate(candidate || null);
  };

  // Khi kéo ứng viên qua column khác
  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    if (activeId === overId) return;

    const activeCandidate = candidates.find((c) => c.id === activeId);
    const overCandidate = candidates.find((c) => c.id === overId);

    if (!activeCandidate) return;

    // Check if dragging over a column or a candidate
    const overColumn = columns.find((c) => c.id === overId);

    if (overColumn) {
      // Dragging over a column
      setCandidates((candidates) => {
        return candidates.map((c) =>
          c.id === activeId ? { ...c, status: overColumn.id } : c
        );
      });
    } else if (
      overCandidate &&
      activeCandidate.status !== overCandidate.status
    ) {
      // Dragging over a candidate in different column
      setCandidates((candidates) => {
        return candidates.map((c) =>
          c.id === activeId ? { ...c, status: overCandidate.status } : c
        );
      });
    }
  };

  // Khi kết thúc kéo ứng viên
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveCandidate(null);

    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    if (activeId === overId) return;

    const activeCandidate = candidates.find((c) => c.id === activeId);
    const overCandidate = candidates.find((c) => c.id === overId);

    if (!activeCandidate || !overCandidate) return;

    // Reorder candidates in the same column
    if (activeCandidate.status === overCandidate.status) {
      setCandidates((candidates) => {
        const activeIndex = candidates.findIndex((c) => c.id === activeId);
        const overIndex = candidates.findIndex((c) => c.id === overId);
        return arrayMove(candidates, activeIndex, overIndex);
      });
    }
  };

  // Filter candidates by status
  const getCandidatesByStatus = (status: Status) => {
    return candidates.filter((candidate) => candidate.status === status);
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-[1600px] mx-auto">
        <>
          <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
          >
            <div className="flex gap-4 items-start overflow-x-auto">
              {columns.map((column) => (
                <Column
                  key={column.id}
                  id={column.id}
                  title={column.title}
                  candidates={getCandidatesByStatus(column.id)}
                />
              ))}
            </div>
            <DragOverlay>
              {activeCandidate ? (
                <CandidateCard candidate={activeCandidate} />
              ) : null}
            </DragOverlay>
          </DndContext>
        </>
      </div>
    </div>
  );
};
