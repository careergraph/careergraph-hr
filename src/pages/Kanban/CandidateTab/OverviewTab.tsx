import { useMemo } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Candidate } from "@/types/candidate";
import { GraduationCap, Languages } from "lucide-react";

type OverviewTabProps = {
  candidate: Candidate;
};

export function OverviewTab({ candidate }: OverviewTabProps) {
  const overviewSections = useMemo(() => {
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
