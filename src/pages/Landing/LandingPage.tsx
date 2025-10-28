import { Link } from "react-router";
import { useMemo } from "react";
import { useAuthStore } from "@/stores/authStore";
import {
  ClipboardList,
  Users2,
  Sparkles,
  ShieldCheck,
  Workflow,
} from "lucide-react";

const features = [
  {
    icon: <Users2 className="size-6 text-primary" />,
    title: "Kết nối nhân tài nhanh chóng",
    description:
      "Tiếp cận kho ứng viên chất lượng với bộ lọc thông minh giúp bạn tìm được nhân sự phù hợp trong vài phút.",
  },
  {
    icon: <Workflow className="size-6 text-primary" />,
    title: "Quy trình tuyển dụng tối ưu",
    description:
      "Quản lý toàn bộ quy trình trên một giao diện trực quan: đăng tin, sàng lọc, trao đổi và đánh giá ứng viên.",
  },
  {
    icon: <ShieldCheck className="size-6 text-primary" />,
    title: "Bảo mật & tuân thủ",
    description:
      "Dữ liệu doanh nghiệp được bảo vệ với chuẩn bảo mật cao, đáp ứng các quy định pháp lý hiện hành.",
  },
];

const stats = [
  { figure: "500+", label: "Doanh nghiệp tin dùng" },
  { figure: "15.000+", label: "Ứng viên được kết nối" },
  { figure: "3 ngày", label: "Thời gian tuyển dụng trung bình" },
];

export default function LandingPage() {
  const { accessToken, user } = useAuthStore();

  const userDisplayName = useMemo(() => {
    const trimmedFirst = user?.firstName?.trim();
    const trimmedLast = user?.lastName?.trim();

    if (trimmedLast) {
      return trimmedFirst ? `${trimmedFirst} ${trimmedLast}` : trimmedLast;
    }

    return trimmedFirst ?? "HR";
  }, [user?.firstName, user?.lastName]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-100 text-slate-900">
      {/* Header */}
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-8">
        <div className="flex items-center gap-3">
          <img
            src="/images/logo/logo.svg"
            alt="CareerGraph"
            className="h-10 w-10"
            loading="lazy"
          />
          <span className="text-2xl font-semibold bg-gradient-to-r from-[#4f46e5] via-[#7c3aed] to-[#ec4899] bg-clip-text text-transparent">
            CareerGraph HR
          </span>
        </div>
        <nav className="hidden items-center gap-6 text-md font-semibold text-slate-600 md:flex">
          <a href="#features" className="hover:text-slate-900">
            Tính năng
          </a>
          <a href="#workflow" className="hover:text-slate-900">
            Quy trình
          </a>
          <a href="#about" className="hover:text-slate-900">
            Vì sao chọn chúng tôi
          </a>
        </nav>
        {accessToken ? (
          <div className="flex items-center gap-4">
            <div className="hidden flex-col text-right text-sm leading-4 text-slate-500 sm:flex">
              <span className="font-medium text-slate-700">
                Xin chào, {userDisplayName}
              </span>
            </div>
            <Link
              to="/dashboard"
              className="rounded-xl bg-gradient-to-r from-[#4f46e5] via-[#7c3aed] to-[#ec4899] px-4 py-2 text-sm font-semibold text-white shadow-md transition hover:shadow-lg"
            >
              Vào Dashboard
            </Link>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <Link
              to="/signin"
              className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 transition hover:text-slate-900"
            >
              Đăng nhập
            </Link>
            <Link
              to="/signup"
              className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90"
            >
              Đăng ký miễn phí
            </Link>
          </div>
        )}
      </header>

      <main className="mx-auto flex max-w-6xl flex-col gap-24 px-6 pb-24">
        <section className="grid gap-12 md:grid-cols-[1.1fr_0.9fr] md:items-center">
          <div className="space-y-6">
            <span className="inline-flex items-center  gap-2 rounded-full bg-gradient-to-r from-[#4f46e5]/15 via-[#7c3aed]/15 to-[#ec4899]/20 px-3 py-1 text-sm font-medium text-primary">
              <Sparkles className="size-4" /> Nền tảng tuyển dụng cho HR hiện
              đại
            </span>
            <h1 className="text-3xl font-bold leading-tight text-slate-900 md:text-4xl">
              Đơn giản hóa tuyển dụng và mở rộng đội ngũ của bạn
            </h1>
            <p className="text-lg text-slate-600">
              CareerGraph mang đến trải nghiệm tuyển dụng toàn diện: từ đăng
              tin, quản lý quy trình đến phân tích hiệu suất. Tất cả trong một
              bảng điều khiển trực quan giúp HR làm việc hiệu quả hơn.
            </p>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <Link
                to="/signup"
                className="inline-flex items-center justify-center rounded-xl bg-primary px-6 py-3 text-base font-semibold text-primary-foreground shadow-lg shadow-primary/30 transition hover:bg-primary/90"
              >
                Bắt đầu ngay
              </Link>
              <Link
                to="/signin"
                className="inline-flex items-center justify-center rounded-xl border border-slate-200 px-6 py-3 text-base font-semibold text-slate-700 transition hover:border-primary/40 hover:text-primary"
              >
                Xem bảng điều khiển mẫu
              </Link>
            </div>
            <dl className="mt-6 grid gap-6 sm:grid-cols-3">
              {stats.map((item, index) => (
                <div
                  key={item.label}
                  className={`group relative overflow-hidden rounded-2xl border border-white/60 p-5 text-center shadow-sm backdrop-blur transition hover:-translate-y-1 hover:shadow-lg ${
                    index === 0
                      ? "bg-gradient-to-br from-white via-indigo-50 to-transparent"
                      : index === 1
                      ? "bg-gradient-to-br from-white via-rose-50 to-transparent"
                      : "bg-gradient-to-br from-white via-emerald-50 to-transparent"
                  }`}
                  style={{ minHeight: "140px" }}
                >
                  <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-white/60 to-transparent" />
                  <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    {item.label}
                  </dt>
                  <dd className="mt-3 text-2xl font-semibold text-slate-900">
                    {item.figure}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
          {/* Dashboard tổng quan */}
          <div className="relative">
            <div
              className="absolute -left-6 -top-6 h-24 w-24 rounded-full bg-primary/10 blur-2xl"
              aria-hidden="true"
            />
            <div
              className="absolute -right-12 bottom-0 h-32 w-32 rounded-full bg-amber-300/20 blur-3xl"
              aria-hidden="true"
            />
            <div className="relative flex h-full flex-col justify-between overflow-hidden rounded-3xl border border-white/60 bg-gradient-to-br from-[#eef2ff] via-[#e0e7ff] to-[#fdf2f8] p-6 shadow-2xl backdrop-blur">
              <div>
                <div className="mb-6 flex items-center gap-3">
                  <div>
                    <h3 className="text-xl font-semibold text-slate-900">
                      Dashboard HR
                    </h3>
                    <p className="text-sm text-slate-500">
                      Theo dõi mọi pipeline và hiệu suất tuyển dụng trên một màn
                      hình.
                    </p>
                  </div>
                </div>

                <div className="grid gap-4">
                  <div className="rounded-2xl bg-gradient-to-r from-white via-indigo-50 to-transparent p-5 shadow-sm">
                    <div className="mb-3 flex items-center justify-between">
                      <span className="text-xs font-semibold uppercase tracking-wide text-indigo-500">
                        Professional candidate care
                      </span>
                      <Users2 className="size-5 text-indigo-400" />
                    </div>
                    <p className="text-sm text-slate-600">
                      Chuẩn hóa mọi tương tác với ứng viên bằng thư mẫu, lịch
                      phỏng vấn, và phản hồi tự động ở từng bước.
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
                      Bảng điều khiển realtime giúp bạn dự đoán thời gian tuyển
                      dụng, nguồn ứng viên hiệu quả và chi phí cho từng kênh.
                    </p>
                  </div>

                  <div className="rounded-2xl bg-gradient-to-r from-white via-emerald-50 to-transparent p-5 shadow-sm">
                    <div className="mb-3 flex items-center justify-between">
                      <span className="text-xs font-semibold uppercase tracking-wide text-emerald-500">
                        Pipeline automation
                      </span>
                      <ClipboardList className="size-5 text-emerald-400" />
                    </div>
                    <p className="text-sm text-slate-600">
                      Kéo thả ứng viên giữa các giai đoạn, giao việc cho Hiring
                      Manager và đồng bộ mọi ghi chú trên cùng một timeline.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="features" className="space-y-10">
          <div className="text-center">
            <h2 className="text-3xl font-semibold text-slate-900">
              Tối ưu từng bước tuyển dụng
            </h2>
            <p className="mt-3 text-base text-slate-600">
              CareerGraph giúp đội ngũ HR tiết kiệm thời gian và nâng cao trải
              nghiệm ứng viên với các công cụ mạnh mẽ.
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {features.map((feature, index) => (
              <div
                key={feature.title}
                className={`h-full rounded-3xl border border-slate-200/80 bg-gradient-to-br ${
                  index === 0
                    ? "from-white via-indigo-50/70 to-white"
                    : index === 1
                    ? "from-white via-rose-50/70 to-white"
                    : "from-white via-emerald-50/70 to-white"
                } p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg`}
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10">
                  {feature.icon}
                </div>
                <h3 className="mt-5 text-lg font-semibold text-slate-900">
                  {feature.title}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-slate-600">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section
          id="workflow"
          className="grid gap-10 rounded-3xl border border-slate-200 bg-white/90 p-8 shadow-xl md:grid-cols-[1.1fr_0.9fr]"
        >
          <div className="space-y-6">
            <span className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-4 py-2 text-xs font-semibold text-emerald-700">
              Quy trình thông minh
            </span>
            <h2 className="text-3xl font-semibold text-slate-900">
              Tự động hóa giúp HR tập trung vào chiến lược
            </h2>
            <ul className="space-y-4 text-sm text-slate-600">
              <li className="rounded-2xl bg-gradient-to-r from-slate-50 via-indigo-50/80 to-slate-50 p-4">
                <p className="font-medium text-slate-800">
                  1. Đăng tin tuyển dụng chỉ trong 2 phút
                </p>
                <p className="mt-1">
                  Sử dụng mẫu sẵn có, đồng bộ đa kênh với một cú click, đảm bảo
                  thương hiệu tuyển dụng nhất quán.
                </p>
              </li>
              <li className="rounded-2xl bg-gradient-to-r from-slate-50 via-rose-50/80 to-slate-50 p-4">
                <p className="font-medium text-slate-800">
                  2. Sàng lọc thông minh theo tiêu chí của bạn
                </p>
                <p className="mt-1">
                  AI gợi ý ứng viên tiềm năng, loại trừ trùng lặp và phát hiện
                  điểm mạnh từ CV & bài test.
                </p>
              </li>
              <li className="rounded-2xl bg-gradient-to-r from-slate-50 via-emerald-50/80 to-slate-50 p-4">
                <p className="font-medium text-slate-800">
                  3. Theo dõi pipeline trực quan
                </p>
                <p className="mt-1">
                  Kéo-thả ứng viên giữa các giai đoạn, ghi chú và phân công
                  nhiệm vụ cho đội ngũ.
                </p>
              </li>
            </ul>
          </div>
          <div className="relative flex items-center justify-center rounded-3xl">
            <div className="h-full w-full rounded-3xl bg-white/95 p-6 text-slate-800">
              <img
                src="/public/images/logo/lading.webp"
                alt="Automation Illustration"
                className="object-contain"
              />
            </div>
          </div>
        </section>

        <section
          id="about"
          className="rounded-3xl border border-slate-200 bg-slate-900 px-8 py-12 text-slate-100 shadow-2xl"
        >
          <div className="grid gap-10 md:grid-cols-[1.1fr_0.9fr] md:items-center">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full bg-slate-800 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-300">
                Được xây dựng cho đội ngũ HR Việt Nam
              </span>
              <h2 className="mt-6 text-3xl font-semibold text-white">
                Tập trung vào con người, công nghệ để CareerGraph lo
              </h2>
              <p className="mt-4 text-base text-slate-300">
                Chúng tôi hiểu rằng tuyển dụng không chỉ là chọn người phù hợp
                mà còn là xây dựng trải nghiệm đáng nhớ. CareerGraph hỗ trợ
                doanh nghiệp Việt tối ưu ngân sách, cải thiện giao tiếp và mở
                rộng mạng lưới ứng viên một cách bền vững.
              </p>
            </div>
            <div className="space-y-6">
              <div className="rounded-3xl bg-white/5 p-5">
                <p className="text-sm text-slate-200">
                  "CareerGraph giúp đội ngũ HR chúng tôi rút ngắn 40% thời gian
                  tuyển dụng cho các vị trí cấp trung. Quy trình phối hợp giữa
                  HR và Hiring Manager cũng mượt mà hơn rất nhiều."
                </p>
                <p className="mt-4 text-sm font-semibold text-white">
                  Lê Minh - Trưởng bộ phận Tuyển dụng tại VinaTech
                </p>
              </div>
              <div className="rounded-3xl bg-white/5 p-5">
                <p className="text-sm text-slate-200">
                  "Khả năng phân tích realtime và pipeline trực quan giúp chúng
                  tôi điều chỉnh chiến lược tuyển dụng cực kỳ linh hoạt."
                </p>
                <p className="mt-4 text-sm font-semibold text-white">
                  Nguyễn Phương - HRBP tại FinGroup
                </p>
              </div>
            </div>
          </div>
          <div className="mt-10 flex flex-col items-center justify-between gap-4 rounded-3xl border border-white/10 bg-white/5 p-6 sm:flex-row">
            <div>
              <p className="text-lg font-semibold text-white">
                Sẵn sàng nâng tầm trải nghiệm tuyển dụng?
              </p>
              <p className="text-sm text-slate-300">
                Đăng ký miễn phí và khám phá bảng điều khiển demo ngay hôm nay.
              </p>
            </div>
            <div className="flex gap-4">
              <Link
                to="/signup"
                className="rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow transition hover:bg-primary/90"
              >
                Đăng ký ngay
              </Link>
              <Link
                to="/signin"
                className="rounded-xl border border-white/30 px-5 py-2.5 text-sm font-semibold text-white transition hover:border-primary/60 hover:text-primary-100"
              >
                Đăng nhập
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-200 bg-white/70">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-8 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <p>
            &copy; {new Date().getFullYear()} CareerGraph. Giải pháp tuyển dụng
            toàn diện cho HR.
          </p>
          <div className="flex gap-4">
            <a href="#" className="hover:text-slate-900">
              Chính sách bảo mật
            </a>
            <a href="#" className="hover:text-slate-900">
              Điều khoản sử dụng
            </a>
            <a href="#" className="hover:text-slate-900">
              Liên hệ hỗ trợ
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
