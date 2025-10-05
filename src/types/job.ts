export interface Job {
  id: number;
  title: string;           // Tên công việc
  department: string;      // Phòng ban
  location: string;        // Địa điểm
  type: "Full-time" | "Part-time" | "Contract"; // Loại hình
  postedDate: string;      // Ngày đăng tuyển

  description?: string;    // Mô tả chi tiết công việc
  requirements?: string[]; // Yêu cầu/kỹ năng cần có
  responsibilities?: string[]; // Trách nhiệm chính
  salaryRange?: string;    // Mức lương
  contactEmail?: string;   // Email liên hệ
  contactPhone?: string;   // Số điện thoại liên hệ
  timeline?: JobTimelineEvent[]; // Lịch sử tuyển dụng / trạng thái
}

export interface JobTimelineEvent {
  date: string;           // Ngày cập nhật
  action: string;         // Hành động / trạng thái (VD: Đăng tuyển, Phỏng vấn, Chốt ứng viên)
  description?: string;   // Mô tả chi tiết
  user?: string;          // Ai thực hiện
}
