import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Candidate } from "@/types/candidate";
import { CalendarClock } from "lucide-react";
import type { CandidateExperienceResponse, CExperienceResponse, OverviewExperience, TimelineEvent } from "@/types/candidateTab";
import { useEffect, useState } from "react";
import candidateService from "@/services/candidateService";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

// ExperienceTab liệt kê timeline tương tác và mô tả kinh nghiệm ứng viên.

type ExperienceTabProps = {
  candidate: Candidate;
  experienceData?: CandidateExperienceResponse | null;
  loading?: boolean;
  error?: string | null;
};



export function ExperienceTab({ candidate, experienceData, loading, error }: ExperienceTabProps) {
  // Provide a full mock so the experience tab is visually complete when server data is absent.
  const mockExperience: CandidateExperienceResponse = {
    id: candidate.id,
    summary: "Ứng viên có nền tảng phát triển backend & frontend, đã làm lead 1 nhóm nhỏ, có kinh nghiệm tích hợp hệ thống lớn.",
    totalYears: 6,
    previousRoles: [
      { company: "ABC Tech", title: "Senior Software Engineer", from: "2021-06", to: "2024-09" },
      { company: "XYZ Solutions", title: "Software Engineer", from: "2018-01", to: "2021-05" },
    ],
    timeline: [
      { id: "t1", title: "Gia nhập công ty ABC", description: "Bắt đầu role Senior", date: "2021-06-01", actor: "HR" },
      { id: "t2", title: "Được thăng chức leader", description: "Quản lý team 3 người", date: "2022-11-15", actor: "Manager" },
      { id: "t3", title: "Chuyển dự án lớn", description: "Tích hợp hệ thống thanh toán", date: "2023-05-10", actor: "PM" },
    ],
  };


  const formatMonthYear = (dateStr?: string): string => {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return dateStr;
  return `${d.getMonth() + 1}/${d.getFullYear()}`;
};

const formatExpPeriod = (exp: CExperienceResponse): string => {
  const from = formatMonthYear(exp.startDate);
  const to = exp.isCurrent
    ? "Hiện tại"
    : exp.endDate
    ? formatMonthYear(exp.endDate)
    : "";

  if (!from && !to) return "Chưa cập nhật";
  return `${from} - ${to}`;
};


  const shownExperience = experienceData ?? mockExperience;
  const [isLoading, setIsLoading] = useState(false)
  const [overviewExperiences, setOverviewExperiences] = useState<OverviewExperience | null>(null);
    
    useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      try {
        const data = await candidateService.fetchExperience(candidate.candidateId);
        setOverviewExperiences(data);
      } catch (e) {
        console.error("Fetch overview error", e);
      }
      setIsLoading(false)
    };
  
    fetchData();
  }, [candidate.candidateId]);

  return (
    <ScrollArea className="h-full px-5 pb-10 pt-5 sm:px-8">
      {isLoading ? (
        <LoadingSpinner message="Đang tải lịch sử kinh nghiệm..." variant="overlay" size="sm" />
      ) : error ? (
        <div className="text-sm text-indigo-500">Thông báo: Tính năng đang trong quá trình hoàn thiện!</div>
      ) : (
        <div className="mb-4 space-y-3">
          <div className="rounded-2xl border border-slate-100 bg-slate-50/80 px-4 py-3">
            <h4 className="text-sm font-semibold text-slate-700">Tổng quan kinh nghiệm</h4>
            {/* Dự tính phát triển AI để làm tổng quan */}
            {/* <p className="mt-2 text-sm text-slate-600">{shownExperience.summary ?? candidate.experience}</p> */}
            {overviewExperiences?.totalYear ? (
              <p className="mt-1 text-xs text-slate-500">Tổng số năm kinh nghiệm: {overviewExperiences?.totalYear}</p>
            ) : null}
          </div>

          {shownExperience.timeline?.length ? (
            <div className="rounded-2xl border border-slate-100 bg-white px-4 py-3">
              <h4 className="text-sm font-semibold text-slate-700">Mốc lịch sử</h4>
              <div className="mt-3 space-y-4">
                {shownExperience.timeline.map((ev: TimelineEvent) => (
                  <div key={ev.id} className="relative pl-10">
                    <div className="absolute left-0 top-1.5 flex h-8 w-8 items-center justify-center rounded-full bg-slate-900 text-white shadow-md">
                      <CalendarClock className="h-4 w-4" />
                    </div>
                    <div className="rounded-2xl border border-slate-100 bg-slate-50/80 px-4 py-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <h5 className="text-sm font-semibold text-slate-700">{ev.title}</h5>
                          <p className="text-xs text-slate-400">{ev.date}</p>
                        </div>
                        <span className="text-xs text-slate-500">{ev.actor}</span>
                      </div>
                      {ev.description ? <p className="mt-2 text-sm text-slate-600">{ev.description}</p> : null}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      )}
      {/* Bảng timeline các hoạt động tuyển dụng. */}
      <div className="rounded-2xl border border-slate-100 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-5 py-5 sm:px-6">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-600">
            Lộ trình tuyển dụng
          </h3>
          <p className="mt-1 text-sm text-slate-500">
            Theo dõi nhanh các hoạt động đã diễn ra với ứng viên này.
          </p>
        </div>
        <div className="space-y-5 px-5 py-5 sm:px-6 sm:py-6">
          {candidate.timeline.map((event) => (
            <div key={event.id} className="relative pl-10">
              <div className="absolute left-0 top-1.5 flex h-8 w-8 items-center justify-center rounded-full bg-slate-900 text-white shadow-md">
                <CalendarClock className="h-4 w-4" />
              </div>
              <div className="rounded-2xl border border-slate-100 bg-slate-50/80 px-4 py-3">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h4 className="text-sm font-semibold text-slate-700">
                      {event.action}
                    </h4>
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                      {event.date}
                    </p>
                  </div>
                  <span className="text-xs text-slate-500">
                    Người thực hiện: {event.user}
                  </span>
                </div>
                <p className="mt-2 text-sm text-slate-600">{event.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <Separator className="my-6" />

      {/* Tóm tắt kinh nghiệm tổng quan. */}
      <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-6">
  <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-600">
    Kinh nghiệm tổng hợp
  </h3>

      <div className="mt-4 space-y-4">
        {overviewExperiences?.experiences && overviewExperiences?.experiences.length > 0 ? (
          overviewExperiences?.experiences.map((exp) => (
            <div
              key={exp.id}
              className="rounded-xl bg-white border border-slate-200 p-4 shadow-sm"
            >
              {/* Chức danh */}
              <p className="text-base font-semibold text-slate-800">
                {exp.jobTitle || "Chưa cập nhật"}
              </p>

              {/* Công ty */}
              <p className="text-sm text-slate-600 mt-1">
                <span className="font-medium">Công ty: </span>
                {exp.companyName || "Chưa cập nhật"}
              </p>

              {/* Thời gian làm việc */}
              <p className="text-sm text-slate-600 mt-1">
                <span className="font-medium">Thời gian: </span>
                {formatExpPeriod(exp)}
              </p>

              {/* Mức lương nếu có */}
              {exp.salary !== null && exp.salary > 0 && (
                <p className="text-sm text-slate-600 mt-1">
                  <span className="font-medium">Mức lương: </span>
                  {exp.salary.toLocaleString("vi-VN")} VND
                </p>
              )}

              {/* Mô tả kinh nghiệm */}
              {exp.description && (
                <p className="text-sm text-slate-600 mt-2">
                  <span className="font-medium">Mô tả: </span>
                  {exp.description}
                </p>
              )}

              {/* Tag Đang làm việc */}
              {exp.isCurrent && (
                <span className="mt-3 inline-block rounded-full bg-emerald-100 px-2 py-1 text-xs font-medium text-emerald-700">
                  Đang làm việc
                </span>
              )}
            </div>
          ))
        ) : (
          <p className="text-sm text-slate-500">Chưa có kinh nghiệm</p>
        )}
      </div>
    </div>

    </ScrollArea>
  );
}
