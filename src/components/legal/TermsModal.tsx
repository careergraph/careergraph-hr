import { useEffect } from "react";
import { X } from "lucide-react";

type TermsModalProps = {
  open: boolean;
  onClose: () => void;
};

export default function TermsModal({ open, onClose }: TermsModalProps) {
  useEffect(() => {
    if (!open) return undefined;

    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = "auto";
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Đóng điều khoản sử dụng"
        className="absolute inset-0 bg-slate-900/55 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">Điều khoản sử dụng</h2>
            <p className="mt-1 text-sm text-slate-500">
              Áp dụng cho việc đăng ký và sử dụng nền tảng tuyển dụng CareerGraph HR.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
          >
            <X size={20} />
          </button>
        </div>

        <div className="space-y-4 overflow-y-auto px-6 py-6 text-sm leading-6 text-slate-600">
          <p className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
            Khi tạo tài khoản hoặc tiếp tục sử dụng CareerGraph HR, bạn xác nhận đã đọc, hiểu và
            đồng ý với các nguyên tắc sử dụng nền tảng được nêu dưới đây.
          </p>

          <div>
            <h3 className="text-base font-semibold text-slate-900">1. Chấp nhận điều khoản</h3>
            <p className="mt-1">
              Việc đăng ký tài khoản, truy cập hoặc sử dụng CareerGraph HR đồng nghĩa với việc bạn
              chấp nhận các điều khoản hiện hành tại thời điểm sử dụng.
            </p>
          </div>

          <div>
            <h3 className="text-base font-semibold text-slate-900">2. Thông tin tài khoản doanh nghiệp</h3>
            <p className="mt-1">
              Bạn cam kết cung cấp thông tin chính xác, hợp lệ và chịu trách nhiệm về tính xác thực
              của hồ sơ doanh nghiệp, tài khoản người dùng và nội dung đăng tải trên nền tảng.
            </p>
          </div>

          <div>
            <h3 className="text-base font-semibold text-slate-900">3. Quyền riêng tư và dữ liệu</h3>
            <p className="mt-1">
              CareerGraph xử lý dữ liệu nhằm phục vụ hoạt động tuyển dụng, quản trị tài khoản, hỗ trợ
              khách hàng và cải thiện chất lượng dịch vụ, đồng thời áp dụng các biện pháp bảo mật phù hợp.
            </p>
          </div>

          <div>
            <h3 className="text-base font-semibold text-slate-900">4. Trách nhiệm sử dụng dịch vụ</h3>
            <p className="mt-1">
              Bạn không được sử dụng nền tảng cho mục đích giả mạo, lừa đảo, thu thập dữ liệu trái phép,
              phát tán nội dung sai lệch hoặc thực hiện hành vi vi phạm pháp luật hay quyền lợi của bên thứ ba.
            </p>
          </div>

          <div>
            <h3 className="text-base font-semibold text-slate-900">5. Tính năng AI và nội dung tham khảo</h3>
            <p className="mt-1">
              Các tính năng AI, gợi ý tự động hoặc phân tích dữ liệu trên hệ thống chỉ mang tính hỗ trợ
              tham khảo và không thay thế cho đánh giá chuyên môn, quyết định tuyển dụng hoặc nghĩa vụ pháp lý.
            </p>
          </div>

          <div>
            <h3 className="text-base font-semibold text-slate-900">6. Cập nhật điều khoản</h3>
            <p className="mt-1">
              CareerGraph có thể cập nhật điều khoản để phù hợp với yêu cầu vận hành hoặc pháp lý. Phiên
              bản mới sẽ có hiệu lực kể từ thời điểm được công bố trên nền tảng.
            </p>
          </div>
        </div>

        <div className="flex justify-end border-t border-slate-200 bg-slate-50 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-brand-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-600"
          >
            Đã hiểu
          </button>
        </div>
      </div>
    </div>
  );
}
