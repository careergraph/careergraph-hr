import { Link } from "react-router";
import { ClipboardList, ShieldCheck, Sparkles, Users2, Workflow } from "lucide-react";
import { ScrollReveal } from "./ScrollReveal";

type HeroSectionProps = {
  stats: Array<{ figure: string; label: string }>;
};

const highlights = [
  {
    icon: <Sparkles className="size-4 text-primary" />,
    title: "AI insight",
    description: "Phân tích dữ liệu ứng viên theo thời gian thực giúp bạn ra quyết định nhanh chóng.",
  },
  {
    icon: <ShieldCheck className="size-4 text-primary" />,
    title: "Bảo mật cấp doanh nghiệp",
    description: "Mã hóa đầu cuối và phân quyền chi tiết cho từng vai trò trong quy trình tuyển dụng.",
  },
  {
    icon: <Workflow className="size-4 text-primary" />,
    title: "Tự động hóa quy trình",
    description: "Kích hoạt các mẫu hành động sẵn có để chuẩn hóa trải nghiệm ứng viên.",
  },
];

export function HeroSection({ stats }: HeroSectionProps) {
  return (
    <section id="hero" className="grid gap-12 md:grid-cols-[1.05fr_0.95fr] md:items-center">
      <ScrollReveal direction="left" className="space-y-8">
        <span className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#4f46e5]/15 via-[#7c3aed]/15 to-[#ec4899]/20 px-4 py-1.5 text-sm font-semibold text-primary">
          <Sparkles className="size-4" /> Nền tảng tuyển dụng cho HR hiện đại
        </span>
        <div className="space-y-4">
          <h1 className="text-3xl font-bold leading-tight text-slate-900 md:text-5xl">
            Xây đội ngũ tương lai với quy trình tuyển dụng thông minh
          </h1>
          <p className="text-lg leading-relaxed text-slate-600">
            CareerGraph kết nối doanh nghiệp với nguồn nhân tài chất lượng, cung cấp một bảng điều khiển duy nhất để quản lý chiến lược tuyển dụng, chăm sóc ứng viên và đo lường hiệu quả.
          </p>
        </div>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <Link
            to="/signup"
            className="inline-flex items-center justify-center rounded-xl bg-primary px-6 py-3 text-base font-semibold text-primary-foreground shadow-primary/20 transition-colors hover:bg-primary/90"
          >
            Bắt đầu miễn phí
          </Link>
          <Link
            to="/signin"
            className="inline-flex items-center justify-center rounded-xl border border-slate-200 px-6 py-3 text-base font-semibold text-slate-700 transition-colors hover:border-primary/40 hover:text-primary"
          >
            Trải nghiệm bản demo
          </Link>
        </div>
        <div className="grid gap-5 md:grid-cols-3">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="rounded-2xl border border-white/60 bg-white/70 p-5 text-center shadow-sm backdrop-blur"
            >
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                {stat.label}
              </p>
              <p className="mt-3 text-2xl font-semibold text-slate-900">
                {stat.figure}
              </p>
            </div>
          ))}
        </div>
        <div className="grid gap-4 rounded-3xl border border-slate-200/70 bg-white/80 p-6 shadow-md sm:grid-cols-3">
          {highlights.map((item) => (
            <div key={item.title} className="space-y-2">
              <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                {item.icon}
                {item.title}
              </div>
              <p className="text-sm leading-relaxed text-slate-600">
                {item.description}
              </p>
            </div>
          ))}
        </div>
      </ScrollReveal>
      <ScrollReveal direction="right" className="relative">
        <div
          className="absolute -left-12 -top-12 h-32 w-32 rounded-full bg-primary/10 blur-[100px]"
          aria-hidden="true"
        />
        <div
          className="absolute -right-16 bottom-0 h-40 w-40 rounded-full bg-amber-300/20 blur-[110px]"
          aria-hidden="true"
        />
        <div className="relative flex h-full flex-col gap-6 overflow-hidden rounded-3xl border border-white/60 bg-gradient-to-br from-[#eef2ff] via-[#e0e7ff] to-[#fdf2f8] p-6 shadow-2xl backdrop-blur">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-indigo-400">
                Pipeline tổng quan
              </p>
              <h3 className="mt-1 text-xl font-semibold text-slate-900">
                Dashboard HR realtime
              </h3>
            </div>
            <div className="flex size-12 items-center justify-center rounded-full bg-white/70 shadow-inner">
              <Users2 className="size-6 text-indigo-500" />
            </div>
          </div>
          <div className="grid gap-4">
            <div className="rounded-2xl bg-gradient-to-r from-white via-indigo-50 to-transparent p-5 shadow-sm">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wide text-indigo-500">
                  Candidate journey
                </span>
                <Workflow className="size-5 text-indigo-400" />
              </div>
              <p className="text-sm text-slate-600">
                Theo dõi trạng thái ứng viên, thời gian phản hồi và điểm đánh giá ở từng vòng phỏng vấn.
              </p>
            </div>
            <div className="rounded-2xl bg-gradient-to-r from-white via-rose-50 to-transparent p-5 shadow-sm">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wide text-rose-500">
                  Smart analytics
                </span>
                <Sparkles className="size-5 text-rose-400" />
              </div>
              <p className="text-sm text-slate-600">
                Dự báo nhu cầu tuyển dụng, xác định kênh sourcing hiệu quả và tối ưu ngân sách.
              </p>
            </div>
            <div className="rounded-2xl bg-gradient-to-r from-white via-emerald-50 to-transparent p-5 shadow-sm">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wide text-emerald-500">
                  Task automation
                </span>
                <ClipboardList className="size-5 text-emerald-400" />
              </div>
              <p className="text-sm text-slate-600">
                Giao việc tự động cho Hiring Manager, đồng bộ lịch phỏng vấn và nhắc nhở đúng thời điểm.
              </p>
            </div>
          </div>
        </div>
      </ScrollReveal>
    </section>
  );
}
