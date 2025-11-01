import { useEffect, useMemo } from "react";
import { useAuthStore } from "@/stores/authStore";
import { Compass, ShieldCheck, Sparkles, Users2, Workflow } from "lucide-react";
import { LandingHeader } from "./LandingHeader";
import { HeroSection } from "./HeroSection";
import { FeaturesSection } from "./FeaturesSection";
import { WorkflowSection } from "./WorkflowSection";
import { SolutionsSection } from "./SolutionsSection";
import { TestimonialsSection } from "./TestimonialsSection";
import { PricingSection } from "./PricingSection";
import { IntegrationsSection } from "./IntegrationsSection";
import { CallToActionSection } from "./CallToActionSection";
import { LandingFooter } from "./LandingFooter";

// LandingPage kết hợp các section giới thiệu sản phẩm và điều hướng theo trạng thái đăng nhập.

// Thống kê nhanh cho section hero.
const heroStats = [
  { figure: "500+", label: "Doanh nghiệp tin dùng" },
  { figure: "15.000+", label: "Ứng viên được kết nối" },
  { figure: "3 ngày", label: "Thời gian tuyển dụng trung bình" },
];

// Danh sách tính năng nổi bật trên trang.
const featureCards = [
  {
    icon: <Users2 className="size-6 text-primary" />,
    title: "Quản trị pipeline đầy đủ",
    description:
      "Theo dõi ứng viên theo từng trạng thái, phân quyền theo team và đồng bộ dữ liệu trong thời gian thực.",
    benefits: [
      "Pipeline kéo thả trực quan",
      "Báo cáo hiệu suất theo job",
      "Ghi chú và lịch phỏng vấn chung",
    ],
  },
  {
    icon: <Workflow className="size-6 text-primary" />,
    title: "Tự động hóa linh hoạt",
    description:
      "Thiết lập các quy tắc và mẫu giao tiếp để đảm bảo trải nghiệm chuyên nghiệp ở mọi điểm chạm.",
    benefits: [
      "Trigger email và tin nhắn",
      "Checklist onboarding tự động",
      "Đồng bộ lịch họp đa nền tảng",
    ],
  },
  {
    icon: <ShieldCheck className="size-6 text-primary" />,
    title: "Bảo mật & tuân thủ",
    description:
      "Được phát triển theo tiêu chuẩn bảo mật doanh nghiệp với cơ chế phân quyền rõ ràng và lưu vết chi tiết.",
    benefits: [
      "Mã hóa dữ liệu ứng viên",
      "Phân quyền theo vai trò",
      "Audit log đầy đủ",
    ],
  },
];

// Quy trình minh hoạ các bước tuyển dụng.
const workflowSteps = [
  {
    title: "Đăng tin & mở chiến dịch trong vài phút",
    description:
      "Sử dụng mẫu JD dựng sẵn, đồng bộ tới các kênh tuyển dụng và tracking hiệu suất từng nguồn ứng viên.",
    caption: "Khởi tạo",
    icon: <Sparkles className="size-5" />,
  },
  {
    title: "Sàng lọc thông minh theo tiêu chí của bạn",
    description:
      "AI scoring đề xuất ứng viên nổi bật, phát hiện trùng lặp và chấm điểm dựa trên kỹ năng, kinh nghiệm.",
    caption: "Đánh giá",
    icon: <Compass className="size-5" />,
  },
];

// Các module giải pháp chuyên sâu hiển thị trong phần giải pháp.
const solutionModules = [
  {
    title: "Talent CRM",
    description:
      "Xây dựng hồ sơ 360° cho từng ứng viên, lưu lại lịch sử tương tác và chiến dịch tự động.",
    accent: "bg-violet-100 text-violet-700",
    metrics: [
      { label: "Phản hồi", value: "+42%" },
      { label: "Ứng viên", value: "10K+" },
    ],
  },
  {
    title: "Hiring Collaboration",
    description:
      "Kết nối HR, Hiring Manager và ban lãnh đạo với bảng điều khiển chung và phân quyền chi tiết.",
    accent: "bg-emerald-100 text-emerald-700",
    metrics: [
      { label: "Thời gian", value: "-55%" },
      { label: "Phản hồi", value: "Realtime" },
    ],
  },
  {
    title: "Insights & Analytics",
    description:
      "Theo dõi KPI, chi phí trên mỗi kênh, dự báo nhu cầu nhân sự và tối ưu chiến lược tuyển dụng.",
    accent: "bg-amber-100 text-amber-700",
    metrics: [
      { label: "ROI hiring", value: "+68%" },
      { label: "Báo cáo", value: "Tùy biến" },
    ],
  },
];

const testimonials = [
  {
    quote:
      "CareerGraph giúp đội ngũ HR chúng tôi rút ngắn 40% thời gian tuyển dụng cho các vị trí cấp trung. Quy trình phối hợp giữa HR và Hiring Manager trở nên mượt mà hơn hẳn.",
    author: "Lê Minh",
    role: "Head of Talent Acquisition tại VinaTech",
  },
  {
    quote:
      "Khả năng phân tích realtime và pipeline trực quan cho phép chúng tôi điều chỉnh chiến lược sourcing theo tuần, đảm bảo nguồn ứng viên luôn sẵn có.",
    author: "Nguyễn Phương",
    role: "HRBP tại FinGroup",
  },
];

const pricingPlans = [
  {
    name: "Essential",
    price: "3.9 triệu",
    description:
      "Dành cho đội ngũ HR đang xây nền tảng quy trình tuyển dụng chuẩn hóa.",
    features: [
      "Quản lý pipeline không giới hạn",
      "Mẫu email và automation cơ bản",
      "Báo cáo hiệu suất theo job",
    ],
  },
  {
    name: "Professional",
    price: "6.9 triệu",
    description:
      "Đáp ứng nhu cầu tự động hóa nâng cao và cộng tác đa phòng ban.",
    highlight: true,
    features: [
      "Tự động hóa nâng cao và workflow tùy chỉnh",
      "Đánh giá năng lực và bài test tích hợp",
      "Báo cáo động và dự báo nhu cầu",
    ],
  },
  {
    name: "Enterprise",
    price: "Liên hệ",
    description:
      "Tùy biến theo quy mô lớn với yêu cầu bảo mật, tuân thủ và tích hợp sâu.",
    features: [
      "SSO, SCIM và phân quyền đa lớp",
      "Tích hợp HRIS, payroll, BI",
      "Hỗ trợ triển khai chuyên sâu",
    ],
  },
];

const integrations = [
  {
    name: "HRIS & Payroll",
    description: "Workday, BambooHR, PeopleStrong, AMIS HRM",
  },
  {
    name: "Lịch & Hội họp",
    description: "Google Workspace, Microsoft 365, Zoom, Teams",
  },
  {
    name: "Communication",
    description: "Slack, Microsoft Teams, Zalo OA",
  },
  {
    name: "Assessment",
    description: "SHL, TestGorilla, HireVue, Pymetrics",
  },
];

export default function LandingPage() {
  const { accessToken, user } = useAuthStore();

  // Tạo tên hiển thị thân thiện dựa trên thông tin người dùng.
  const userDisplayName = useMemo(() => {
    const trimmedFirst = user?.firstName?.trim();
    const trimmedLast = user?.lastName?.trim();

    if (trimmedLast) {
      return trimmedFirst ? `${trimmedFirst} ${trimmedLast}` : trimmedLast;
    }

    return trimmedFirst ?? "HR";
  }, [user?.firstName, user?.lastName]);

  useEffect(() => {
    // Tạm thời bật hiệu ứng scroll mượt để khi bấm anchor sẽ mềm mại hơn.
    if (typeof document === "undefined") return;

    const root = document.documentElement;
    const previousBehavior = root.style.scrollBehavior;
    root.style.scrollBehavior = "smooth";

    return () => {
      root.style.scrollBehavior = previousBehavior;
    };
  }, []);

  const handleNavigate = (sectionId: string) => {
    // Cuộn tới section tương ứng khi người dùng chọn trên header.
    if (typeof document === "undefined") return;

    const target = document.getElementById(sectionId);
    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-100 text-slate-900">
      {/* Trang landing gồm header, các section nội dung và footer. */}
      <LandingHeader
        onNavigate={handleNavigate}
        authenticated={Boolean(accessToken)}
        userName={userDisplayName}
      />
      <main className="mx-auto flex max-w-6xl flex-col gap-24 px-6 pb-24">
        <HeroSection stats={heroStats} />
        <FeaturesSection features={featureCards} />
        <WorkflowSection
          steps={workflowSteps}
          illustration="/images/logo/lading.webp"
        />
        <SolutionsSection solutions={solutionModules} />
        <IntegrationsSection integrations={integrations} />
        <TestimonialsSection testimonials={testimonials} />
        <PricingSection plans={pricingPlans} />
        <CallToActionSection />
      </main>
      <LandingFooter />
    </div>
  );
}
