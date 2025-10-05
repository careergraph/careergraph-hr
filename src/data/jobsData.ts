import { Job } from "../types/job";

export const jobsData: Job[] = [
  {
    id: 1,
    title: "Lập trình Frontend",
    department: "Kỹ thuật",
    location: "Hà Nội",
    type: "Full-time",
    postedDate: "01/10/2025",
    description: "Phát triển giao diện web bằng React, tối ưu trải nghiệm người dùng.",
    requirements: ["Thành thạo React", "Kinh nghiệm với TypeScript", "Có tư duy UI/UX tốt"],
    responsibilities: ["Xây dựng UI", "Tối ưu hiệu năng", "Phối hợp với backend"],
    salaryRange: "25-35 triệu VNĐ",
    contactEmail: "hr@company.com",
    timeline: [
      { date: "01/10/2025", action: "Đăng tuyển", description: "Mở JD trên website", user: "HR" },
    ],
  },
  {
    id: 2,
    title: "Lập trình Backend",
    department: "Kỹ thuật",
    location: "HCM",
    type: "Full-time",
    postedDate: "28/09/2025",
    description: "Thiết kế và phát triển API, quản lý database.",
    requirements: ["Node.js", "Kinh nghiệm với MongoDB/Postgres"],
    responsibilities: ["Xây dựng API", "Tối ưu truy vấn", "Bảo mật hệ thống"],
    salaryRange: "28-38 triệu VNĐ",
    contactEmail: "hr@company.com",
    timeline: [
      { date: "28/09/2025", action: "Đăng tuyển", description: "Mở JD trên website", user: "HR" },
    ],
  },
  // ...Thêm các job khác tương tự
];
