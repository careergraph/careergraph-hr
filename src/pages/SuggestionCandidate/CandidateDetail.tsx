import { useEffect, useState } from "react";
import {
  SuggestionCandidateListItem,
  CandidateEducationResponse,
  CandidateExperienceResponse,
} from "@/types/suggestionCandidate";
import { suggestionCandidateService } from "@/services/suggestionCandidateService";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import {
  Mail,
  Phone,
  DollarSign,
  Briefcase,
  User,
  Clock,
  Heart,
  Share2,
  MapPin,
  CheckCircle,
  XCircle,
  GraduationCap,
  Building2,
  Calendar,
  Loader2,
} from "lucide-react";

type CandidateDetailProps = {
  candidate: SuggestionCandidateListItem | null;
};

// CandidateDetail hiển thị hồ sơ chi tiết của ứng viên được chọn.
export function CandidateDetail({ candidate }: CandidateDetailProps) {
  const [educations, setEducations] = useState<CandidateEducationResponse[]>(
    []
  );
  const [experiences, setExperiences] = useState<CandidateExperienceResponse[]>(
    []
  );
  const [totalYears, setTotalYears] = useState<number>(0);
  const [loading, setLoading] = useState(false);

  // Fetch education and experience when candidate changes
  useEffect(() => {
    if (!candidate?.id) {
      setEducations([]);
      setExperiences([]);
      setTotalYears(0);
      return;
    }

    const controller = new AbortController();

    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch both in parallel
        const [overviewResp, experienceResp] = await Promise.all([
          suggestionCandidateService.getCandidateOverview(
            candidate.id,
            controller.signal
          ),
          suggestionCandidateService.getCandidateExperience(
            candidate.id,
            controller.signal
          ),
        ]);

        if (overviewResp?.educations) {
          setEducations(overviewResp.educations);
        }

        if (experienceResp) {
          setExperiences(experienceResp.experiences || []);
          setTotalYears(experienceResp.totalYear || 0);
        }
      } catch (error) {
        console.error("Error fetching candidate details:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    return () => controller.abort();
  }, [candidate?.id]);

  if (!candidate) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <User className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">Chọn ứng viên để xem chi tiết</p>
        </div>
      </div>
    );
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  // Format date from YYYY-MM to readable format
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "";
    try {
      const [year, month] = dateStr.split("-");
      return `${month}/${year}`;
    } catch {
      return dateStr;
    }
  };

  // Format date range
  const formatDateRange = (
    startDate?: string,
    endDate?: string,
    isCurrent?: boolean
  ) => {
    const start = formatDate(startDate);
    const end = isCurrent ? "Hiện tại" : formatDate(endDate);
    if (!start && !end) return "";
    return `${start} - ${end}`;
  };

  return (
    <div className="flex h-full overflow-hidden rounded-xl border border-slate-200 bg-card shadow-sm">
      {/* Thanh bên trái chứa avatar và thông tin liên hệ nhanh. */}
      <div className="flex w-80 flex-col border-r border-slate-100 bg-slate-50/70 dark:border-slate-800 dark:bg-slate-900/40">
        {/* Phần đầu hiển thị avatar và chức danh. */}
        <div className="flex-shrink-0 border-b border-slate-100 bg-white p-6 text-center dark:border-slate-800 dark:bg-slate-900">
          <Avatar className="mx-auto mb-4 h-20 w-20 border border-slate-200">
            <AvatarImage src={candidate.avatar} alt={candidate.name} />
            <AvatarFallback className="bg-slate-200 text-lg font-semibold uppercase text-slate-600">
              {getInitials(candidate.name)}
            </AvatarFallback>
          </Avatar>
          <h2 className="mb-1 text-lg font-semibold text-slate-900 dark:text-white">
            {candidate.name}
          </h2>
          <p className="flex items-center justify-center gap-1.5 text-sm text-slate-500 dark:text-slate-300">
            <Briefcase className="h-4 w-4" />
            {candidate.position}
          </p>

          {/* Open to work status */}
          <div className="mt-3 flex items-center justify-center gap-1.5">
            {candidate.isOpenToWork ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700 dark:bg-green-500/20 dark:text-green-300">
                <CheckCircle className="h-3.5 w-3.5" />
                Sẵn sàng làm việc
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600 dark:bg-gray-500/20 dark:text-gray-300">
                <XCircle className="h-3.5 w-3.5" />
                Chưa sẵn sàng
              </span>
            )}
          </div>
        </div>

        {/* Các mục thông tin chi tiết. */}
        <div className="flex-1 overflow-y-auto">
          {/* Thông tin email */}
          <div className="border-b border-slate-100 dark:border-slate-800">
            <div className="flex w-full items-center gap-3 px-6 py-4">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 dark:border-slate-700 dark:bg-slate-900/60">
                <Mail className="h-5 w-5" />
              </div>
              <div className="flex-1 text-left">
                <div className="mb-0.5 text-xs font-medium uppercase tracking-wide text-slate-400">
                  Email
                </div>
                <div className="truncate text-sm font-medium text-slate-700 dark:text-slate-200">
                  {candidate.email}
                </div>
              </div>
            </div>
          </div>

          {/* Thông tin số điện thoại */}
          {candidate.phone && (
            <div className="border-b border-slate-100 dark:border-slate-800">
              <div className="flex w-full items-center gap-3 px-6 py-4">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 dark:border-slate-700 dark:bg-slate-900/60">
                  <Phone className="h-5 w-5" />
                </div>
                <div className="flex-1 text-left">
                  <div className="mb-0.5 text-xs font-medium uppercase tracking-wide text-slate-400">
                    Điện thoại
                  </div>
                  <div className="text-sm font-medium text-slate-700 dark:text-slate-200">
                    {candidate.phone}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Kinh nghiệm */}
          <div className="border-b border-slate-100 dark:border-slate-800">
            <div className="flex w-full items-center gap-3 px-6 py-4">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 dark:border-slate-700 dark:bg-slate-900/60">
                <Briefcase className="h-5 w-5" />
              </div>
              <div className="flex-1 text-left">
                <div className="mb-0.5 text-xs font-medium uppercase tracking-wide text-slate-400">
                  Kinh nghiệm
                </div>
                <div className="text-sm font-medium text-slate-700 dark:text-slate-200">
                  {totalYears > 0 ? `${totalYears} năm` : candidate.experience}
                </div>
              </div>
            </div>
          </div>

          {/* Mức lương mong muốn */}
          {candidate.salary && (
            <div className="border-b border-slate-100 dark:border-slate-800">
              <div className="flex w-full items-center gap-3 px-6 py-4">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 dark:border-slate-700 dark:bg-slate-900/60">
                  <DollarSign className="h-5 w-5" />
                </div>
                <div className="flex-1 text-left">
                  <div className="mb-0.5 text-xs font-medium uppercase tracking-wide text-slate-400">
                    Mức lương mong muốn
                  </div>
                  <div className="text-sm font-medium text-slate-700 dark:text-slate-200">
                    {candidate.salary}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Địa điểm */}
          {candidate.location && (
            <div className="border-b border-slate-100 dark:border-slate-800">
              <div className="flex w-full items-center gap-3 px-6 py-4">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 dark:border-slate-700 dark:bg-slate-900/60">
                  <MapPin className="h-5 w-5" />
                </div>
                <div className="flex-1 text-left">
                  <div className="mb-0.5 text-xs font-medium uppercase tracking-wide text-slate-400">
                    Địa điểm
                  </div>
                  <div className="text-sm font-medium text-slate-700 dark:text-slate-200">
                    {candidate.location}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Last Active */}
          <div className="border-b border-slate-100 dark:border-slate-800">
            <div className="flex w-full items-center gap-3 px-6 py-4">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 dark:border-slate-700 dark:bg-slate-900/60">
                <Clock className="h-5 w-5" />
              </div>
              <div className="flex-1 text-left">
                <div className="mb-0.5 text-xs font-medium uppercase tracking-wide text-slate-400">
                  Hoạt động gần đây
                </div>
                <div className="text-sm font-medium text-slate-700 dark:text-slate-200">
                  {candidate.lastActive}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Nội dung chi tiết bên phải. */}
      <div className="flex min-h-0 flex-1 flex-col bg-gradient-to-br from-primary/10 via-white/95 to-white dark:from-primary/15 dark:via-slate-900 dark:to-slate-950">
        <div className="flex items-center justify-between gap-4 border-b border-white/60 bg-white/80 p-6 backdrop-blur-sm dark:border-slate-800/70 dark:bg-slate-900/60">
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">
            Thông tin chi tiết
          </h1>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="icon"
              className="border-slate-200 text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              <Heart className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="border-slate-200 text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              <Share2 className="h-4 w-4" />
            </Button>
            <Button className="px-5">Mua thông tin liên hệ</Button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto space-y-6 bg-transparent p-6">
          {/* Loading indicator */}
          {loading && (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <span className="ml-2 text-sm text-muted-foreground">
                Đang tải thông tin...
              </span>
            </div>
          )}

          {/* Score indicator nếu có */}
          {candidate.score !== undefined && candidate.score > 0 && (
            <>
              <div>
                <h3 className="mb-3 text-xs font-medium uppercase tracking-wide text-slate-400">
                  ĐỘ PHÙ HỢP
                </h3>
                <div className="flex items-center gap-4 rounded-lg border border-slate-100 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900/60">
                  <div className="relative h-20 w-20">
                    <svg className="h-20 w-20 -rotate-90 transform">
                      <circle
                        cx="40"
                        cy="40"
                        r="36"
                        stroke="currentColor"
                        strokeWidth="8"
                        fill="none"
                        className="text-slate-200 dark:text-slate-700"
                      />
                      <circle
                        cx="40"
                        cy="40"
                        r="36"
                        stroke="currentColor"
                        strokeWidth="8"
                        fill="none"
                        strokeDasharray={`${Math.min(Math.max(candidate.score * 10, 20), 100) * 2.26} 226`}
                        className="text-blue-500"
                        strokeLinecap="round"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-lg font-bold text-slate-700 dark:text-slate-200">
                        {Math.min(Math.max(candidate.score * 10, 20), 100).toFixed(0)}%
                      </span>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
                      Điểm phù hợp
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Dựa trên vị trí công việc và kỹ năng
                    </p>
                  </div>
                </div>
              </div>
              <Separator />
            </>
          )}

          {/* Kỹ năng nổi bật của ứng viên */}
          {candidate.skills && candidate.skills.length > 0 && (
            <>
              <div>
                <h3 className="mb-3 text-xs font-medium uppercase tracking-wide text-slate-400">
                  KỸ NĂNG ({candidate.skills.length})
                </h3>
                <div className="flex flex-wrap gap-2">
                  {candidate.skills.map((skill, idx) => {
                    const palette = [
                      "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-700 dark:bg-blue-800/30 dark:text-blue-200",
                      "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-700 dark:bg-emerald-800/30 dark:text-emerald-200",
                      "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-700 dark:bg-amber-800/30 dark:text-amber-200",
                      "border-purple-200 bg-purple-50 text-purple-700 dark:border-purple-700 dark:bg-purple-800/30 dark:text-purple-200",
                      "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-700 dark:bg-rose-800/30 dark:text-rose-200",
                    ];
                    return (
                      <Badge
                        key={idx}
                        variant="outline"
                        className={`px-3 py-1.5 text-xs font-medium ${palette[idx % palette.length]}`}
                      >
                        {skill}
                      </Badge>
                    );
                  })}
                </div>
              </div>
              <Separator />
            </>
          )}

          {/* Kinh nghiệm làm việc */}
          {!loading && experiences.length > 0 && (
            <>
              <div>
                <h3 className="mb-4 flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-slate-400">
                  <Briefcase className="h-4 w-4" />
                  KINH NGHIỆM LÀM VIỆC ({experiences.length})
                  {totalYears > 0 && (
                    <span className="ml-2 rounded-full bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-700 dark:bg-blue-800/30 dark:text-blue-300">
                      {totalYears} năm
                    </span>
                  )}
                </h3>
                <div className="space-y-4">
                  {experiences.map((exp, idx) => (
                    <div
                      key={exp.id || idx}
                      className="relative rounded-lg border border-slate-100 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900/60"
                    >
                    
                      <div className="flex items-start gap-3">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-slate-900 dark:text-white">
                            {exp.jobTitle || "Chưa cập nhật"}
                          </h4>
                          <p className="text-sm text-slate-600 dark:text-slate-300">
                            {exp.companyName || "Công ty chưa cập nhật"}
                          </p>
                          <div className="mt-1 flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                            <Calendar className="h-3.5 w-3.5" />
                            <span>
                              {formatDateRange(
                                exp.startDate,
                                exp.endDate,
                                exp.isCurrent
                              )}
                            </span>
                            {exp.isCurrent && (
                              <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700 dark:bg-green-500/20 dark:text-green-300">
                                Đang làm
                              </span>
                            )}
                          </div>
                          {exp.description && (
                            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 line-clamp-3">
                              {exp.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <Separator />
            </>
          )}

          {/* Học vấn */}
          {!loading && educations.length > 0 && (
            <>
              <div>
                <h3 className="mb-4 flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-slate-400">
                  <GraduationCap className="h-4 w-4" />
                  HỌC VẤN ({educations.length})
                </h3>
                <div className="space-y-4">
                  {educations.map((edu, idx) => (
                    <div
                      key={edu.id || idx}
                      className="relative rounded-lg border border-slate-100 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900/60"
                    >

                      <div className="flex items-start gap-3">
  
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-slate-900 dark:text-white">
                            {edu.degreeTitle || "Bằng cấp chưa cập nhật"}
                          </h4>
                          <p className="text-sm text-slate-600 dark:text-slate-300">
                            {edu.officialName || "Trường chưa cập nhật"}
                          </p>
                          {edu.major && (
                            <p className="text-sm text-slate-500 dark:text-slate-400">
                              Chuyên ngành: {edu.major}
                            </p>
                          )}
                          <div className="mt-1 flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                            <Calendar className="h-3.5 w-3.5" />
                            <span>
                              {formatDateRange(
                                edu.startDate,
                                edu.endDate,
                                edu.isCurrent
                              )}
                            </span>
                            {edu.isCurrent && (
                              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-500/20 dark:text-amber-300">
                                Đang học
                              </span>
                            )}
                          </div>
                          {edu.description && (
                            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 line-clamp-2">
                              {edu.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <Separator />
            </>
          )}

          {/* Thông tin tóm tắt */}
          <div>
            <h3 className="mb-3 text-xs font-medium uppercase tracking-wide text-slate-400">
              THÔNG TIN TỔNG QUAN
            </h3>
            <div className="grid grid-cols-2 gap-4 rounded-lg border border-slate-100 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900/60">
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Vị trí mong muốn
                </p>
                <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
                  {candidate.position}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Kinh nghiệm
                </p>
                <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
                  {totalYears > 0 ? `${totalYears} năm` : candidate.experience}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Mức lương
                </p>
                <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
                  {candidate.salary}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Địa điểm
                </p>
                <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
                  {candidate.location}
                </p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Hướng dẫn liên hệ */}
          <div className="rounded-lg border border-blue-100 bg-blue-50/50 p-4 dark:border-blue-800/50 dark:bg-blue-900/20">
            <h4 className="mb-2 text-sm font-medium text-blue-800 dark:text-blue-300">
              💡 Gợi ý liên hệ
            </h4>
            <p className="text-xs text-blue-700 dark:text-blue-400">
              Để xem đầy đủ thông tin liên hệ của ứng viên, vui lòng sử dụng nút
              "Mua thông tin liên hệ" phía trên. Thông tin bao gồm email, số điện
              thoại và CV chi tiết của ứng viên.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
