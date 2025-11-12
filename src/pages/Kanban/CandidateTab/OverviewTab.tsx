import { useMemo } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Candidate } from "@/types/candidate";
import type { CandidateOverviewResponse } from "@/types/candidateTab";
import { GraduationCap, Languages } from "lucide-react";

// OverviewTab tổng hợp thông tin chung của ứng viên.

type OverviewTabProps = {
  candidate: Candidate;
  // Optional data fetched from server specific to overview tab
  overviewData?: CandidateOverviewResponse | null;
  loading?: boolean;
  error?: string | null;
};

export function OverviewTab({ candidate, overviewData, loading, error }: OverviewTabProps) {
  // If parent provided server-side overview data, show a small preview block.
  // This is intentionally minimal: main rendering still uses the `candidate` shape.
  // Provide a complete mock object so the UI remains populated when backend
  // hasn't returned data yet. Backend can implement the same shape.
  const mockOverview: CandidateOverviewResponse = {
    id: candidate.id,
    profileSummary:
      "Kỹ sư phần mềm có 5+ năm kinh nghiệm xây dựng ứng dụng web, chuyên về TypeScript và React. Tự giác, có kinh nghiệm lead small teams.",
    skills: ["TypeScript", "React", "Node.js", "GraphQL", "Testing"],
    certifications: ["AWS Certified Developer", "ISTQB Foundation"],
    education: {
      school: "Đại học Bách Khoa Hà Nội",
      degree: "Cử nhân",
      major: "Khoa học Máy tính",
      year: "2018",
    },
    links: [
      { label: "LinkedIn", url: "https://linkedin.com/in/example" },
      { label: "Github", url: "https://github.com/example" },
    ],
    social: { linkedin: "https://linkedin.com/in/example", github: "https://github.com/example" },
    preferredLocations: ["Hà Nội", "Đà Nẵng"],
    expectedSalary: "₫30,000,000 - ₫40,000,000",
    noticePeriod: "2 tuần",
  };

  const shownOverview = overviewData ?? mockOverview;
  const overviewSections = useMemo(() => {
    // Chuẩn hóa dữ liệu các khối thông tin để render động.
    const topSkills = (
      candidate.skills?.length ? candidate.skills : candidate.labels
    ).slice(0, 4);

    return [
      {
        id: "job",
        title: "Thông tin công việc",
        description:
          "Thông tin liên quan tới vị trí, lương và phạm vi công việc",
        items: [
          { label: "Vị trí", value: candidate.position },
          {
            label: "Mức lương mong muốn",
            value: candidate.salaryExpectation ?? "Không có",
          },
          { label: "Hình thức làm việc", value: candidate.workType },
          { label: "Ngành nghề", value: candidate.industry },
          { label: "Nơi làm việc", value: candidate.workLocation },
          { label: "Cấp bậc hiện tại", value: candidate.currentLevel },
          { label: "Cấp bậc mong muốn", value: candidate.desiredLevel },
        ],
      },
      {
        id: "personal",
        title: "Thông tin cá nhân",
        description: "Hồ sơ nhân khẩu học và thông tin liên hệ của ứng viên",
        items: [
          { label: "Tuổi", value: `${candidate.age}` },
          { label: "Giới tính", value: candidate.gender },
          { label: "Tình trạng hôn nhân", value: candidate.maritalStatus },
          { label: "Email", value: candidate.email },
          { label: "Điện thoại", value: candidate.phone ?? "Không có" },
          {
            label: "Địa điểm",
            value: `${candidate.location.city}, ${candidate.location.province}`,
          },
          { label: "Địa chỉ", value: candidate.address ?? "Không có" },
        ],
      },
      {
        id: "preference",
        title: "Nguyện vọng & năng lực",
        description: "Mục tiêu nghề nghiệp và tổng quan kinh nghiệm",
        items: [
          { label: "Học vấn", value: candidate.education },
          { label: "Số năm kinh nghiệm", value: candidate.yearsOfExperience },
          { label: "Kinh nghiệm", value: candidate.experience },
          { label: "Lương kỳ vọng", value: candidate.desiredSalary },
          {
            label: "Ngôn ngữ",
            value: candidate.languages?.join(", ") ?? "Chưa cập nhật",
          },
          {
            label: "Kỹ năng",
            value: topSkills.length ? topSkills.join(", ") : "Chưa cập nhật",
          },
          { label: "Hoạt động gần nhất", value: candidate.lastActive },
        ],
      },
    ];
  }, [candidate]);

  const skills = candidate.skills?.length ? candidate.skills : candidate.labels;
  return (
    <ScrollArea className="h-full px-5 pb-10 pt-5 sm:px-8">
      {/* Loading / error / server-preview for overview tab (optional) */}
      {loading ? (
        <div className="mb-4 px-3 py-2 text-sm text-slate-500">Đang tải dữ liệu tổng quan...</div>
      ) : error ? (
        <div className="text-sm text-indigo-500">Thông báo: Tính năng đang trong quá trình hoàn thiện!</div>
      ) : (
        <div className="mb-4 grid gap-3 rounded-md border border-slate-100 bg-slate-50 p-3 text-sm text-slate-700">
          {shownOverview.profileSummary ? (
            <div>
              <h4 className="text-xs font-semibold text-slate-600">Tóm tắt hồ sơ</h4>
              <p className="mt-1 text-sm text-slate-600">{shownOverview.profileSummary}</p>
            </div>
          ) : null}

          {shownOverview.skills?.length ? (
            <div>
              <h4 className="text-xs font-semibold text-slate-600">Kỹ năng</h4>
              <div className="mt-2 flex flex-wrap gap-2">
                {shownOverview.skills.map((s) => (
                  <span key={s} className="rounded-full bg-white px-3 py-1 text-xs font-medium text-slate-700 border border-slate-100">
                    {s}
                  </span>
                ))}
              </div>
            </div>
          ) : null}

          {shownOverview.certifications?.length ? (
            <div>
              <h4 className="text-xs font-semibold text-slate-600">Chứng chỉ</h4>
              <div className="mt-2 flex flex-wrap gap-2 text-xs text-slate-600">
                {shownOverview.certifications.join(", ")}
              </div>
            </div>
          ) : null}

          {shownOverview.education ? (
            <div>
              <h4 className="text-xs font-semibold text-slate-600">Học vấn (server)</h4>
              <p className="mt-1 text-sm text-slate-600">
                {shownOverview.education.degree ?? ""} {shownOverview.education.major ? `- ${shownOverview.education.major}` : ""}
                {shownOverview.education.school ? ` • ${shownOverview.education.school}` : ""}
              </p>
            </div>
          ) : null}
        </div>
      )}
      {/* Danh sách các nhóm thông tin tổng quan. */}
      <div className="space-y-6">
        {overviewSections.map((section) => (
          <div key={section.id} className="space-y-4">
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-600">
                {section.title}
              </h3>
              <p className="mt-1 text-xs text-slate-500 sm:text-sm">
                {section.description}
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {section.items.map((item) => (
                <div
                  key={item.label}
                  className="rounded-2xl border border-slate-100 bg-white px-4 py-3 shadow-sm"
                >
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                    {item.label}
                  </p>
                  <p className="mt-1 text-sm font-medium text-slate-600">
                    {item.value}
                  </p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <Separator className="my-6" />

      <div className="grid gap-5 lg:grid-cols-2">
        {/* Khối học vấn và ngôn ngữ. */}
        <div className="rounded-2xl border border-slate-100 bg-gradient-to-br from-slate-900/95 to-slate-800/90 p-6 text-white shadow-lg">
          <div className="flex items-center gap-3">
            <GraduationCap className="h-5 w-5 text-white/80" />
            <h4 className="text-sm font-semibold uppercase tracking-wider text-white/80">
              Học vấn & Ngôn ngữ
            </h4>
          </div>
          <div className="mt-4 space-y-3 text-sm text-white/80">
            <p>
              <span className="text-white/60">Học vấn: </span>
              {candidate.education}
            </p>
            <p>
              <span className="text-white/60">Trình độ học vấn: </span>
              {candidate.educationLevel ?? "Chưa cập nhật"}
            </p>
            <p>
              <span className="text-white/60">Ngôn ngữ: </span>
              {candidate.languages?.join(", ") ?? "Chưa cập nhật"}
            </p>
          </div>
        </div>

        {/* Khối kỹ năng nổi bật. */}
        <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-6 shadow-inner">
          <div className="flex items-center gap-3">
            <Languages className="h-5 w-5 text-slate-500" />
            <h4 className="text-sm font-semibold uppercase tracking-wider text-slate-600">
              Kỹ năng nổi bật
            </h4>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {skills.map((skill) => (
              <Badge
                key={skill}
                variant="outline"
                className="border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600"
              >
                {skill}
              </Badge>
            ))}
          </div>
        </div>
      </div>
    </ScrollArea>
  );
}
