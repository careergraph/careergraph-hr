import { Job } from "@/types/job";
import { EmploymentType } from "@/enums/workEnum";
import { Status } from "@/enums/commonEnum";

export const jobsData: Job[] = [
  {
    id: "1",
    title: "Kỹ Sư Frontend (React)",
    department: "Kỹ thuật",
    city: "Hà Nội",
    type: EmploymentType.FULL_TIME,
    postedDate: new Date("2025-10-01"),
    status: Status.ACTIVE,
    description:
      "Phát triển giao diện web bằng React, tối ưu trải nghiệm người dùng và đảm bảo hiệu năng ổn định.",
    responsibilities: [
      "Thiết kế và phát triển các tính năng giao diện",
      "Tối ưu hiệu suất và trải nghiệm người dùng",
      "Phối hợp chặt chẽ với backend và designer",
    ],
    qualifications: [
      "Thành thạo React, TypeScript",
      "Hiểu về kiến trúc component hiện đại",
      "Có kinh nghiệm với hệ thống thiết kế UI",
    ],
    applicants: 12,
    views: 134,
    saved: 18,
    likes: 24,
    shares: 6,
    salaryRange: "25 - 35 triệu VNĐ",
    contactEmail: "hr@careergraph.vn",
    contactPhone: "024 7777 8686",
  },
  {
    id: "2",
    title: "Kỹ Sư Backend (Node.js)",
    department: "Kỹ thuật",
    city: "TP. Hồ Chí Minh",
    type: EmploymentType.CONTRACT,
    postedDate: new Date("2025-09-28"),
    status: Status.ACTIVE,
    description:
      "Thiết kế, xây dựng API và quản lý cơ sở dữ liệu phục vụ sản phẩm tuyển dụng CareerGraph.",
    responsibilities: [
      "Phân tích yêu cầu và xây dựng API",
      "Tối ưu truy vấn cơ sở dữ liệu",
      "Đảm bảo bảo mật và độ tin cậy hệ thống",
    ],
    qualifications: [
      "Có kinh nghiệm với Node.js, NestJS",
      "Thành thạo PostgreSQL hoặc MongoDB",
      "Hiểu về kiến trúc microservices",
    ],
    applicants: 9,
    views: 98,
    saved: 11,
    likes: 20,
    shares: 4,
    salaryRange: "28 - 40 triệu VNĐ",
    contactEmail: "hr@careergraph.vn",
    contactPhone: "028 8888 6868",
  },
  {
    id: "3",
    title: "Chuyên Viên Thiết Kế Sản Phẩm",
    department: "Thiết kế",
    city: "Đà Nẵng",
    type: EmploymentType.FREELANCE,
    postedDate: new Date("2025-09-15"),
    status: Status.DRAFT,
    description:
      "Thiết kế giao diện và trải nghiệm người dùng cho các tính năng mới của hệ thống tuyển dụng.",
    responsibilities: [
      "Nghiên cứu nhu cầu người dùng",
      "Thiết kế wireframe, prototype",
      "Làm việc với nhóm phát triển để triển khai UI",
    ],
    qualifications: [
      "Thành thạo Figma, Adobe XD",
      "Có tư duy UX/UI hiện đại",
      "Ưu tiên kinh nghiệm trong lĩnh vực HRTech",
    ],
    applicants: 4,
    views: 76,
    saved: 7,
    likes: 11,
    shares: 2,
    salaryRange: "20 - 30 triệu VNĐ",
    contactEmail: "hr@careergraph.vn",
    contactPhone: "0236 688 8686",
  },
];
