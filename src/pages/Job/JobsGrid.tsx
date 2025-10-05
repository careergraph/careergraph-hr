import { Briefcase, Plus } from "lucide-react";
import { Job } from "../../types/job";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";

const sampleJobs: Job[] = [
  {
    id: 1,
    title: "Senior Frontend Developer",
    type: "Full-time",
    department: "Engineering",
    location: "Hà Nội, Việt Nam",
    postedDate: "15/03/2024",
    description: `Chúng tôi đang tìm kiếm một Senior Frontend Developer có kinh nghiệm để tham gia vào đội ngũ phát triển sản phẩm của chúng tôi.

Trách nhiệm chính:
• Phát triển và duy trì các ứng dụng web hiện đại sử dụng React, Next.js
• Làm việc chặt chẽ với đội ngũ thiết kế và backend
• Tối ưu hóa hiệu suất và trải nghiệm người dùng
• Code review và mentoring các thành viên junior

Yêu cầu:
• 5+ năm kinh nghiệm với React/Next.js
• Thành thạo TypeScript, HTML5, CSS3
• Kinh nghiệm với state management (Redux, Zustand)
• Hiểu biết về responsive design và accessibility`,
    timeline: [
      {
        action: "Công việc được tạo",
        date: "15/03/2024",
        description: "Vị trí mới được mở để mở rộng đội ngũ frontend",
        user: "Nguyễn Văn A - HR Manager",
      },
      {
        action: "Phỏng vấn vòng 1",
        date: "20/03/2024",
        description: "Đã phỏng vấn 5 ứng viên tiềm năng",
        user: "Trần Thị B - Tech Lead",
      },
      {
        action: "Phỏng vấn vòng 2",
        date: "25/03/2024",
        description: "2 ứng viên xuất sắc đã vượt qua vòng technical",
        user: "Lê Văn C - CTO",
      },
      {
        action: "Đang chờ quyết định",
        date: "28/03/2024",
        description: "Đang thảo luận offer package với ứng viên được chọn",
        user: "Nguyễn Văn A - HR Manager",
      },
    ],
  },
  {
    id: 2,
    title: "Product Designer",
    type: "Part-time",
    department: "Design",
    location: "Remote",
    postedDate: "10/03/2024",
    description: `Tìm kiếm Product Designer sáng tạo để thiết kế trải nghiệm người dùng cho các sản phẩm digital của chúng tôi.

Trách nhiệm:
• Thiết kế UI/UX cho web và mobile apps
• Tạo wireframes, prototypes và mockups
• Nghiên cứu người dùng và phân tích feedback
• Làm việc với developers để implement designs

Yêu cầu:
• 3+ năm kinh nghiệm product design
• Thành thạo Figma, Adobe Creative Suite
• Portfolio ấn tượng
• Kỹ năng giao tiếp tốt`,
    timeline: [
      {
        action: "Đăng tin tuyển dụng",
        date: "10/03/2024",
        description: "Vị trí part-time cho dự án mới",
        user: "Phạm Thị D - Design Lead",
      },
      {
        action: "Nhận hồ sơ",
        date: "18/03/2024",
        description: "Đã nhận 12 hồ sơ ứng tuyển",
        user: "Nguyễn Văn A - HR Manager",
      },
    ],
  },
  {
    id: 3,
    title: "DevOps Engineer",
    type: "Contract",
    department: "Infrastructure",
    location: "Hồ Chí Minh, Việt Nam",
    postedDate: "05/03/2024",
    description: `Cần DevOps Engineer có kinh nghiệm để hỗ trợ dự án migration lên cloud infrastructure.

Trách nhiệm:
• Thiết lập và quản lý CI/CD pipelines
• Quản lý cloud infrastructure (AWS/GCP)
• Monitoring và troubleshooting
• Automation và scripting

Yêu cầu:
• 4+ năm kinh nghiệm DevOps
• Thành thạo Docker, Kubernetes
• Kinh nghiệm với AWS hoặc GCP
• Biết Terraform, Ansible`,
    timeline: [
      {
        action: "Khởi tạo dự án",
        date: "05/03/2024",
        description: "Dự án migration 6 tháng",
        user: "Hoàng Văn E - Infrastructure Lead",
      },
    ],
  },
];

export default function JobsGrid() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background">
      <PageMeta title="HR - CareerGraph" description="HR - CareerGraph" />
      <PageBreadcrumb pageTitle="Jobs" />
      <div className="container mx-auto px-4">
        <div className="max-w-5xl mx-auto space-y-8">
          {/* Job Cards */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {sampleJobs.map((job) => (
              <button
                key={job.id}
                className="group text-left p-6 rounded-2xl border border-border bg-card dark:bg-slate-900 hover:bg-accent/50 dark:hover:bg-slate-800/70 transition-all duration-300 hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]"
              >
                <div className="space-y-4">
                  <div className="flex items-start justify-between gap-2">
                    <div
                      className={`p-2.5 rounded-xl ${
                        job.type === "Full-time"
                          ? "bg-emerald-100 dark:bg-emerald-950/30"
                          : job.type === "Part-time"
                          ? "bg-blue-100 dark:bg-blue-950/30"
                          : "bg-amber-100 dark:bg-amber-950/30"
                      }`}
                    >
                      <Briefcase
                        className={`w-5 h-5 ${
                          job.type === "Full-time"
                            ? "text-emerald-600 dark:text-emerald-400"
                            : job.type === "Part-time"
                            ? "text-blue-600 dark:text-blue-400"
                            : "text-amber-600 dark:text-amber-400"
                        }`}
                      />
                    </div>
                    <span
                      className={`text-xs font-semibold px-3 py-1 rounded-full ${
                        job.type === "Full-time"
                          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300"
                          : job.type === "Part-time"
                          ? "bg-blue-100 text-blue-700 dark:bg-blue-950/30 dark:text-blue-300"
                          : "bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-300"
                      }`}
                    >
                      {job.type === "Full-time"
                        ? "Full-time"
                        : job.type === "Part-time"
                        ? "Part-time"
                        : "Contract"}
                    </span>
                  </div>

                  <div>
                    <h3 className="font-bold text-lg text-foreground dark:text-slate-100 mb-2 group-hover:text-primary transition-colors text-balance">
                      {job.title}
                    </h3>
                    <p className="text-sm text-muted-foreground dark:text-slate-300">
                      {job.department}
                    </p>
                  </div>

                  <div className="pt-4 border-t border-border/50 flex items-center justify-between text-xs text-muted-foreground dark:text-slate-400">
                    <span>{job.location}</span>
                    <span>{job.postedDate}</span>
                  </div>
                </div>
              </button>
            ))}

            {/* Add New Job Card */}
            <button className="group p-6 rounded-2xl border-2 border-dashed border-border dark:border-slate-600 hover:border-primary/50 bg-muted/20 dark:bg-slate-800/50 hover:bg-primary/5 dark:hover:bg-primary/10 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] flex flex-col items-center justify-center gap-4 min-h-[240px]">
              <div className="p-4 rounded-full bg-primary/10 dark:bg-primary/20 group-hover:bg-primary/20 dark:group-hover:bg-primary/30 transition-colors shadow-sm">
                <Plus className="w-8 h-8 text-primary dark:text-primary/80" />
              </div>
              <div className="text-center">
                <p className="font-semibold text-foreground dark:text-slate-100 mb-1">
                  Thêm công việc mới
                </p>
                <p className="text-sm text-muted-foreground dark:text-slate-300">
                  Tạo vị trí tuyển dụng mới
                </p>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
