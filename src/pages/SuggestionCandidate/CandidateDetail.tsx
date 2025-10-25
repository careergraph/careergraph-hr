import { Candidate } from "@/types/candidate";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import {
  Calendar,
  Mail,
  Phone,
  DollarSign,
  Briefcase,
  User,
  Clock,
  Heart,
  Share2,
  MapPin,
  GraduationCap,
  TrendingUp,
  Building2,
} from "lucide-react";

type CandidateDetailProps = {
  candidate: Candidate | null;
};

export function CandidateDetail({ candidate }: CandidateDetailProps) {
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

  return (
    <div className="flex h-full overflow-hidden rounded-xl border border-slate-200 bg-card shadow-sm">
      {/* Left Sidebar */}
      <div className="flex w-80 flex-col border-r border-slate-100 bg-slate-50/70 dark:border-slate-800 dark:bg-slate-900/40">
        {/* Header avatar */}
        <div className="flex-shrink-0 border-b border-slate-100 bg-white p-6 text-center dark:border-slate-800 dark:bg-slate-900">
          <Avatar className="mx-auto mb-4 h-20 w-20 border border-slate-200">
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
        </div>

        {/* Info Sections */}
        <div className="flex-1 overflow-y-auto">
          {/* Email */}
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

          {/* Phone */}
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

          {/* Applied Date */}
          <div className="border-b border-slate-100 dark:border-slate-800">
            <div className="flex w-full items-center gap-3 px-6 py-4">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 dark:border-slate-700 dark:bg-slate-900/60">
                <Calendar className="h-5 w-5" />
              </div>
              <div className="flex-1 text-left">
                <div className="mb-0.5 text-xs font-medium uppercase tracking-wide text-slate-400">
                  Ngày ứng tuyển
                </div>
                <div className="text-sm font-medium text-slate-700 dark:text-slate-200">
                  {candidate.appliedDate}
                </div>
              </div>
            </div>
          </div>

          {/* Salary */}
          {candidate.salaryExpectation && (
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
                    {candidate.salaryExpectation}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Location */}
          {candidate.location && (
            <div className="border-b border-slate-100 dark:border-slate-800">
              <div className="flex w-full items-center gap-3 px-6 py-4">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 dark:border-slate-700 dark:bg-slate-900/60">
                  <MapPin className="h-5 w-5" />
                </div>
                <div className="flex-1 text-left">
                  <div className="mb-0.5 text-xs font-medium uppercase tracking-wide text-slate-400">
                    Địa chỉ
                  </div>
                  <div className="text-sm font-medium text-slate-700 dark:text-slate-200">
                    {candidate.location.city}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Assignee */}
          {candidate.assignee && (
            <div className="border-b border-slate-100 dark:border-slate-800">
              <div className="flex w-full items-center gap-3 px-6 py-4">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 dark:border-slate-700 dark:bg-slate-900/60">
                  <User className="h-5 w-5" />
                </div>
                <div className="flex-1 text-left">
                  <div className="mb-0.5 text-xs font-medium uppercase tracking-wide text-slate-400">
                    Người phụ trách
                  </div>
                  <div className="text-sm font-medium text-slate-700 dark:text-slate-200">
                    {candidate.assignee.name}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right Content */}
      <div className="flex min-h-0 flex-1 flex-col bg-gradient-to-br from-primary/10 via-white/95 to-white dark:from-primary/15 dark:via-slate-900 dark:to-slate-950">
        <div className="flex items-center justify-between gap-4 border-b border-white/60 bg-white/80 p-6 backdrop-blur-sm dark:border-slate-800/70 dark:bg-slate-900/60">
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">
            Thông tin chi tiết
          </h1>
          <div className="flex gap-2">
            <Button variant="outline" size="icon" className="border-slate-200 text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800">
              <Heart className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" className="border-slate-200 text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800">
              <Share2 className="h-4 w-4" />
            </Button>
            <Button className="px-5">
              Mua thông tin liên hệ
            </Button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto space-y-6 bg-transparent p-6">
          {/* Additional Info Grid */}
          {(candidate.currentLevel ||
            candidate.desiredLevel ||
            candidate.workLocation ||
            candidate.workType ||
            candidate.industry) && (
            <>
              <div className="grid grid-cols-2 gap-4">
                {candidate.educationLevel && (
                  <div className="flex items-start gap-3">
                    <GraduationCap className="mt-0.5 h-5 w-5 text-slate-500" />
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                        Trình độ học vấn
                      </p>
                      <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
                        {candidate.educationLevel}
                      </p>
                    </div>
                  </div>
                )}
                {candidate.currentLevel && (
                  <div className="flex items-start gap-3">
                    <TrendingUp className="mt-0.5 h-5 w-5 text-slate-500" />
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                        Cấp bậc hiện tại
                      </p>
                      <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
                        {candidate.currentLevel}
                      </p>
                    </div>
                  </div>
                )}
                {candidate.desiredLevel && (
                  <div className="flex items-start gap-3">
                    <TrendingUp className="mt-0.5 h-5 w-5 text-slate-500" />
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                        Cấp bậc mong muốn
                      </p>
                      <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
                        {candidate.desiredLevel}
                      </p>
                    </div>
                  </div>
                )}
                {candidate.workLocation && (
                  <div className="flex items-start gap-3">
                    <MapPin className="mt-0.5 h-5 w-5 text-slate-500" />
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                        Địa điểm làm việc mong muốn
                      </p>
                      <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
                        {candidate.workLocation}
                      </p>
                    </div>
                  </div>
                )}
                {candidate.workType && (
                  <div className="flex items-start gap-3">
                    <Clock className="mt-0.5 h-5 w-5 text-slate-500" />
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                        Hình thức làm việc
                      </p>
                      <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
                        {candidate.workType}
                      </p>
                    </div>
                  </div>
                )}
                {candidate.industry && (
                  <div className="flex items-start gap-3">
                    <Building2 className="mt-0.5 h-5 w-5 text-slate-500" />
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                        Ngành nghề
                      </p>
                      <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
                        {candidate.industry}
                      </p>
                    </div>
                  </div>
                )}
              </div>
              <Separator />
            </>
          )}

          {/* Skills */}
          <div>
            <h3 className="mb-3 text-xs font-medium uppercase tracking-wide text-slate-400">
              KỸ NĂNG
            </h3>
            <div className="flex flex-wrap gap-2">
              {candidate.labels.map((label, idx) => (
                <Badge
                  key={idx}
                  variant="secondary"
                  className="border-slate-200 bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-700 dark:border-slate-700 dark:bg-slate-800/70 dark:text-slate-200"
                >
                  {label}
                </Badge>
              ))}
            </div>
          </div>

          <Separator />

          {/* Description */}
          {candidate.description && (
            <>
              <div>
                <h3 className="mb-3 text-xs font-medium uppercase tracking-wide text-slate-400">
                  MÔ TẢ ỨNG VIÊN
                </h3>
                <p className="whitespace-pre-line rounded-lg border border-slate-100 bg-slate-50 p-4 text-sm leading-relaxed text-slate-600 dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-300">
                  {candidate.description}
                </p>
              </div>
              <Separator />
            </>
          )}

          {/* Timeline */}
          <div>
            <h3 className="mb-4 text-xs font-medium uppercase tracking-wide text-slate-400">
              LỊCH SỬ TUYỂN DỤNG
            </h3>
            <div className="space-y-4">
              {candidate.timeline.map((event, idx) => (
                <div key={event.id} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full border border-primary/20 bg-primary/10 text-primary">
                      <Clock className="h-5 w-5" />
                    </div>
                    {idx < candidate.timeline.length - 1 && (
                      <div className="mt-2 min-h-[30px] w-0.5 flex-1 bg-slate-200 dark:bg-slate-700" />
                    )}
                  </div>

                  <div className="flex-1 pb-6">
                    <div className="rounded-lg border border-white/70 bg-white/90 p-4 shadow-sm backdrop-blur dark:border-slate-800/70 dark:bg-slate-900/60">
                      <div className="mb-2 flex items-start justify-between gap-2">
                        <h4 className="text-sm font-semibold text-slate-900 dark:text-white">
                          {event.action}
                        </h4>
                        <span className="whitespace-nowrap text-xs font-medium text-slate-500">
                          {event.date}
                        </span>
                      </div>
                      <p className="mb-2 text-sm text-slate-600 dark:text-slate-300">
                        {event.description}
                      </p>
                      <p className="text-xs text-slate-500">
                        <User className="mr-1 inline h-3 w-3" />
                        {event.user}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
