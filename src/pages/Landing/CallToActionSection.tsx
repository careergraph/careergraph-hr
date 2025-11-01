import { Link } from "react-router";
import { ScrollReveal } from "./ScrollReveal";

// CallToActionSection khuyến khích người dùng đăng ký hoặc liên hệ.

export function CallToActionSection() {
  return (
    <ScrollReveal direction="up" className="rounded-3xl border border-primary/20 bg-gradient-to-r from-[#4f46e5] via-[#7c3aed] to-[#ec4899] px-8 py-12 text-white shadow-2xl">
      {/* Nội dung CTA với tiêu đề thuyết phục và hai lựa chọn hành động. */}
      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="max-w-2xl space-y-3">
          <h2 className="text-3xl font-semibold">Sẵn sàng nâng tầm trải nghiệm tuyển dụng?</h2>
          <p className="text-base leading-relaxed text-white/80">
            Đăng ký miễn phí, truy cập bảng điều khiển demo và nhận lộ trình triển khai phù hợp trong vòng 24h từ chuyên gia của CareerGraph.
          </p>
        </div>
        <div className="flex flex-col items-stretch gap-3 sm:flex-row">
          <Link
            to="/signup"
            className="inline-flex items-center justify-center rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-slate-900 shadow-md transition-colors hover:bg-white/90"
          >
            Bắt đầu ngay
          </Link>
          <Link
            to="/signin"
            className="inline-flex items-center justify-center rounded-xl border border-white/50 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-white/10"
          >
            Đặt lịch cá nhân hóa
          </Link>
        </div>
      </div>
    </ScrollReveal>
  );
}
