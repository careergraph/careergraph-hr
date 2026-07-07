import { useState } from "react";
import TermsModal from "@/components/legal/TermsModal";

// LandingFooter hiển thị thông tin thương hiệu và liên kết nhanh cuối trang.
export function LandingFooter() {
  // Lấy năm hiện tại để cập nhật bản quyền.
  const currentYear = new Date().getFullYear();
  const [openTerms, setOpenTerms] = useState(false);

  return (
    <>
      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl px-6 py-9 lg:py-10">
          <div className="grid gap-8 lg:grid-cols-[1.2fr_1fr]">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <img src="/images/logo/logo.svg" alt="CareerGraph" className="h-9 w-9" loading="lazy" />
                <span className="text-lg font-semibold text-slate-900">CareerGraph</span>
              </div>

              <p className="max-w-md text-sm leading-6 text-slate-600">
                Nền tảng tuyển dụng toàn diện giúp đội ngũ HR tạo trải nghiệm đáng nhớ và xây dựng đội ngũ tương lai.
              </p>

              <a
                href="mailto:quangthinh06112004@gmail.com"
                className="inline-flex text-sm text-slate-600 transition hover:text-slate-900"
              >
                Liên hệ phản hồi: quangthinh06112004@gmail.com
              </a>
            </div>

            <div className="grid gap-6 sm:grid-cols-3">
              <div className="space-y-2.5">
                <h4 className="text-sm font-semibold text-slate-900">Sản phẩm</h4>
                <ul className="space-y-2 text-sm text-slate-600">
                  <li><a href="#features" className="transition hover:text-slate-900">Tính năng</a></li>
                  <li><a href="#solutions" className="transition hover:text-slate-900">Giải pháp</a></li>
                  <li><a href="#pricing" className="transition hover:text-slate-900">Bảng giá</a></li>
                </ul>
              </div>

              <div className="space-y-2.5">
                <h4 className="text-sm font-semibold text-slate-900">Tài nguyên</h4>
                <ul className="space-y-2 text-sm text-slate-600">
                  <li><a href="#testimonials" className="transition hover:text-slate-900">Khách hàng</a></li>
                  <li><a href="#workflow" className="transition hover:text-slate-900">Quy trình</a></li>
                  <li><a href="mailto:quangthinh06112004@gmail.com" className="transition hover:text-slate-900">Hỗ trợ</a></li>
                </ul>
              </div>

              <div className="space-y-2.5">
                <h4 className="text-sm font-semibold text-slate-900">Pháp lý</h4>
                <ul className="space-y-2 text-sm text-slate-600">
                  <li><a href="#" className="transition hover:text-slate-900">Chính sách bảo mật</a></li>
                  <li>
                    <button
                      type="button"
                      onClick={() => setOpenTerms(true)}
                      className="transition hover:text-slate-900"
                    >
                      Điều khoản sử dụng
                    </button>
                  </li>
                  <li><a href="#" className="transition hover:text-slate-900">Cookie</a></li>
                </ul>
              </div>
            </div>
          </div>

          <div className="mt-8 border-t border-slate-200 pt-4 text-xs leading-6 text-slate-400">
            <div className="flex flex-col gap-1 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:gap-3">
              <p>© {currentYear} CareerGraph. All rights reserved.</p>
              <p>Graduation Project • HCMUTE</p>
              <p>Developed by Luong Quang Thinh &amp; Nguyen Cong Quy</p>
            </div>
          </div>
        </div>
      </footer>
      <TermsModal open={openTerms} onClose={() => setOpenTerms(false)} />
    </>
  );
}
