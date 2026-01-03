import { useEffect, useMemo, useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Candidate } from "@/types/candidate";
import type { AddressResponse, CandidateEducationResponse, CandidateOverview, CandidateOverviewResponse, ContactResponse } from "@/types/candidateTab";
import { GraduationCap, Languages } from "lucide-react";
import candidateService from "@/services/candidateService";
import useLocation from "@/hooks/use-location";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
// OverviewTab tổng hợp thông tin chung của ứng viên.

type OverviewTabProps = {
  candidate: Candidate;
  // Optional data fetched from server specific to overview tab
  overviewData?: CandidateOverviewResponse | null;
  loading?: boolean;
  error?: string | null;
};



export function OverviewTab({ candidate, overviewData, error }: OverviewTabProps) {
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

  const [infoCandidateOverview, setInfoCandidateOverview] =
  useState<CandidateOverview | null>(null);
  const [isLoading, setIsLoading] = useState(false)
  useEffect(() => {
  const fetchData = async () => {
    setIsLoading(true)
    try {
      const data = await candidateService.fetchOverview(candidate.candidateId);
      if(data?.profile)
        setInfoCandidateOverview(data);
    } catch (e) {
      console.error("Fetch overview error", e);
    }
    setIsLoading(false)
  };

  fetchData();
}, [candidate.candidateId]);




const primaryAddress: AddressResponse | undefined =
    infoCandidateOverview?.profile.addresses?.find(
      (a) => a.addressType === "HOME_ADDRESS"
    ) ?? infoCandidateOverview?.profile.addresses?.[0];

  // 🔹 Gọi hook lấy danh sách tỉnh/huyện theo code
  const {
    provinces,
    districts,
    // wards, // nếu cần sau này
    loadingProvinces,
    loadingDistricts,
  } = useLocation(primaryAddress?.province, primaryAddress?.district);

  // 🔹 Convert code -> tên hiển thị
  const locationText = useMemo(() => {
    if (!primaryAddress) return "Chưa cập nhật";

    const provinceName =
      provinces.find(
        (p) => String(p.code) === String(primaryAddress.province)
      )?.name ?? "";

    const districtName =
      districts.find(
        (d) => String(d.code) === String(primaryAddress.district)
      )?.name ?? "";

    // Nếu đang loading hoặc chưa map ra tên thì fallback
    if (loadingProvinces || loadingDistricts) return "Đang tải địa chỉ...";

    return [districtName, provinceName].filter(Boolean).join(", ") || "Chưa cập nhật";
  }, [primaryAddress, provinces, districts, loadingProvinces, loadingDistricts]);


  const shownOverview = overviewData ?? mockOverview;
  const overviewSections = useMemo(() => {
    return [
      {
        id: "job",
        title: "Thông tin công việc mong muốn",
        description:
          "Thông tin liên quan tới vị trí, lương và phạm vi công việc mong muốn",
        items: [
          { label: "Vị trí", value: infoCandidateOverview?.jobCriteria.desiredPosition },
          {
            label: "Mức lương mong muốn",
            value: salaryExpectation(infoCandidateOverview?.jobCriteria.salaryExpectationMin,infoCandidateOverview?.jobCriteria.salaryExpectationMax ),
          },
          { label: "Hình thức làm việc", value: showListTag(infoCandidateOverview?.jobCriteria.workTypes) },
          { label: "Ngành nghề", value: showListTag(infoCandidateOverview?.jobCriteria.industries) },
          { label: "Nơi làm việc", value: showListTag(infoCandidateOverview?.jobCriteria.locations) },
        ],
      },
      {
        id: "personal",
        title: "Thông tin cá nhân",
        description: "Hồ sơ nhân khẩu học và thông tin liên hệ của ứng viên",
        items: [
          { label: "Ngày sinh", value: `${infoCandidateOverview?.profile.dateOfBirth}` },
          { label: "Giới tính", value: infoCandidateOverview?.profile.gender === "MALE" ? "Nam" : "Nữ" },
          { label: "Tình trạng hôn nhân", value: infoCandidateOverview?.profile.isMarried === false ? "Độc thân" : "Đã lập gia đình" },
          { label: "Email", value: infoCandidateOverview?.profile.email },
          { label: "Điện thoại", value: getPhone(infoCandidateOverview?.profile.contacts) ?? "Không có" },
          {
            label: "Địa chỉ",
             value: locationText,
          }
        ],
      },
    ];
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [candidate, infoCandidateOverview, locationText]);

  function getPhone(contacts?: ContactResponse[]): string | undefined {
    if (!contacts || contacts.length === 0) return undefined;

    const primary = contacts.find(
      (c) => c.contactType === "PHONE" && c.isPrimary === true
    );
    if (primary) return primary.value;

    const anyPhone = contacts.find((c) => c.contactType === "PHONE");
    return anyPhone?.value;
  }
  function salaryExpectation(a: number | undefined,b: number | undefined){
    return (a && b) ? a + " - " + b : "Không có";
  }
  function showListTag(tags?: string[]) {
    if (!tags || tags.length === 0) {
      return <span className="text-slate-400 text-sm">Không có</span>;
    }

    return (
      <div className="flex flex-wrap gap-2">
        {tags.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700"
          >
            {tag}
          </span>
        ))}
      </div>
    );
  }


const formatMonthYear = (dateStr?: string): string => {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return dateStr;
  return `${d.getMonth() + 1}/${d.getFullYear()}`;
};

const formatEducationPeriod = (edu: CandidateEducationResponse | null | undefined): string => {
  if (!edu) return "Chưa cập nhật";

  const start = formatMonthYear(edu.startDate);
  const end = edu.isCurrent
    ? "Hiện tại"
    : edu.endDate
    ? formatMonthYear(edu.endDate)
    : "";

  if (!start && !end) return "Chưa cập nhật";
  if (!end) return start;
  return `${start} - ${end}`;
};



  return (
    <ScrollArea className="h-full px-5 pb-10 pt-5 sm:px-8">
      {/* Loading / error / server-preview for overview tab (optional) */}
      {isLoading ? (
        <LoadingSpinner message="Đang tải dữ liệu tổng quan..." variant="overlay" size="sm" />
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
                  <div className="mt-1 text-sm font-medium text-slate-600">
                    {item.value}
                  </div>
                </div>
              ))}

            </div>
          </div>
        ))}
      </div>

      <Separator className="my-6" />

      <div className="grid gap-5 lg:grid-cols-1">
        {/* Khối học vấn và ngôn ngữ. */}
        <div className="rounded-2xl border border-slate-100 bg-gradient-to-br from-slate-900/95 to-slate-800/90 p-6 text-white shadow-lg">
          <div className="flex items-center gap-3">
            <GraduationCap className="h-5 w-5 text-white/80" />
            <h4 className="text-sm font-semibold uppercase tracking-wider text-white/80">
              Học vấn
            </h4>
          </div>

          <div className="mt-4 space-y-5 text-sm text-white/80">
            {infoCandidateOverview?.educations && infoCandidateOverview?.educations.length > 0 ? (
              infoCandidateOverview?.educations.map((edu) => (
                <div
                  key={edu.id}
                  className="rounded-xl border border-white/10 bg-white/5 p-4 shadow-sm"
                >
                  <p className="text-base font-semibold text-white">
                    {edu.officialName || "Tên trường chưa cập nhật"}
                  </p>

                  <p className="mt-1 text-white/80">
                    <span className="text-white/60">Ngành học: </span>
                    {edu.major || "Chưa cập nhật"}
                  </p>

                  <p className="mt-1 text-white/80">
                    <span className="text-white/60">Bằng cấp: </span>
                    {edu.degreeTitle || "Chưa cập nhật"}
                  </p>

                  <p className="mt-1 text-white/80">
                    <span className="text-white/60">Thời gian: </span>
                    {formatEducationPeriod(edu)}
                  </p>

                  {edu.description && (
                    <p className="mt-2 text-white/70">
                      <span className="text-white/60">Mô tả: </span>
                      {edu.description}
                    </p>
                  )}

                  {edu.isCurrent && (
                    <p className="mt-2 inline-block rounded-full bg-emerald-500/20 px-2 py-1 text-xs text-emerald-300">
                      Đang theo học
                    </p>
                  )}
                </div>
              ))
            ) : (
              <p className="text-white/60">Chưa có thông tin học vấn</p>
            )}
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
            {infoCandidateOverview?.skills?.map((skill) => (
              <Badge
                key={skill.skillId}
                variant="outline"
                className="border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600"
              >
                {skill.skillName}
              </Badge>
            ))}
          </div>
        </div>
      </div>
    </ScrollArea>
  );
}
