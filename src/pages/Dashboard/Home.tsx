import PageMeta from "@/components/common/PageMeta";
import RecruitmentKpiCards from "@/components/recruitment/RecruitmentKpiCards";
import PipelineVelocityChart from "@/components/recruitment/PipelineVelocityChart";
import HiringTargetProgress from "@/components/recruitment/HiringTargetProgress";
import FunnelConversionChart from "@/components/recruitment/FunnelConversionChart";
import TalentSourceCard from "@/components/recruitment/TalentSourceCard";
import RecentCandidateActivity from "@/components/recruitment/RecentCandidateActivity";

// Trang Home tổng hợp các widget thống kê và biểu đồ phục vụ quản trị tuyển dụng.

export default function Home() {
  return (
    <>
      {/* Bố cục dashboard kết hợp thẻ KPI và biểu đồ cung cấp thông tin nhanh. */}
      <PageMeta
        title="HR - CareerGraph"
        description="HR - CareerGraph"
      />
      <div className="grid grid-cols-1 gap-4 md:gap-6 lg:grid-cols-12">
        <div className="col-span-12 space-y-6 lg:col-span-7">
          {/* KPI chính giúp đánh giá sức khỏe pipeline tuyển dụng */}
          <RecruitmentKpiCards />

          {/* Biểu đồ cột theo dõi số ứng viên chuyển bước mỗi tháng */}
          <PipelineVelocityChart />
        </div>

        <div className="col-span-12 lg:col-span-5">
          {/* Tỷ lệ hoàn thành mục tiêu tuyển dụng hàng tháng */}
          <HiringTargetProgress />
        </div>

        <div className="col-span-12">
          {/* So sánh chuyển đổi giữa phỏng vấn và offer */}
          <FunnelConversionChart />
        </div>

        <div className="col-span-12 lg:col-span-5">
          {/* Nguồn ứng viên mang lại hiệu quả cao nhất */}
          <TalentSourceCard />
        </div>

        <div className="col-span-12 lg:col-span-7">
          {/* Bảng hoạt động ứng viên gần nhất để ưu tiên xử lý */}
          <RecentCandidateActivity />
        </div>
      </div>
    </>
  );
}
