// LandingFooter hiển thị thông tin thương hiệu và liên kết nhanh cuối trang.
export function LandingFooter() {
  // Lấy năm hiện tại để cập nhật bản quyền.
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-slate-200 bg-white/80">
      {/* Bố cục gồm khối giới thiệu và các cột liên kết. */}
      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-6 py-10 text-sm text-slate-500 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <img src="/images/logo/logo.svg" alt="CareerGraph" className="h-8 w-8" loading="lazy" />
            <span className="text-lg font-semibold text-slate-800">CareerGraph</span>
          </div>
          <p className="max-w-sm text-sm leading-relaxed text-slate-500">
            Nền tảng tuyển dụng toàn diện giúp đội ngũ HR tạo trải nghiệm đáng nhớ và xây dựng đội ngũ tương lai.
          </p>
          <p className="text-xs text-slate-400">© {currentYear} CareerGraph. All rights reserved.</p>
        </div>
        <div className="grid flex-1 gap-8 sm:grid-cols-3">
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-slate-800">Sản phẩm</h4>
            <ul className="space-y-2">
              <li><a href="#features" className="transition hover:text-slate-900">Tính năng</a></li>
              <li><a href="#solutions" className="transition hover:text-slate-900">Giải pháp</a></li>
              <li><a href="#pricing" className="transition hover:text-slate-900">Bảng giá</a></li>
            </ul>
          </div>
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-slate-800">Tài nguyên</h4>
            <ul className="space-y-2">
              <li><a href="#testimonials" className="transition hover:text-slate-900">Khách hàng</a></li>
              <li><a href="#workflow" className="transition hover:text-slate-900">Quy trình</a></li>
              <li><a href="mailto:support@careergraph.vn" className="transition hover:text-slate-900">Hỗ trợ</a></li>
            </ul>
          </div>
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-slate-800">Pháp lý</h4>
            <ul className="space-y-2">
              <li><a href="#" className="transition hover:text-slate-900">Chính sách bảo mật</a></li>
              <li><a href="#" className="transition hover:text-slate-900">Điều khoản sử dụng</a></li>
              <li><a href="#" className="transition hover:text-slate-900">Cookie</a></li>
            </ul>
          </div>
        </div>
      </div>
    </footer>
  );
}
