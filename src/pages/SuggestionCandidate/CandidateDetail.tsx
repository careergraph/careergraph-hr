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

  const skillColors = [
    "bg-blue-500/70 text-white/80",
    "bg-purple-500/70 text-white/80",
    "bg-pink-500/70 text-white/80",
    "bg-orange-500/70 text-white/80",
    "bg-teal-500/70 text-white/80",
    "bg-cyan-500/70 text-white/80",
  ];

  return (
    <div className="flex h-full overflow-hidden rounded-xl border bg-card">
      {/* Left Sidebar */}
      <div className="w-80 bg-slate-700 dark:bg-slate-800 flex flex-col">
        {/* Header avatar */}
        <div className="p-6 text-center border-b border-slate-600 flex-shrink-0">
          <Avatar className="h-24 w-24 mx-auto mb-4 border-4 border-white shadow-lg">
            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-2xl font-bold">
              {getInitials(candidate.name)}
            </AvatarFallback>
          </Avatar>
          <h2 className="text-xl font-bold text-white mb-1">
            {candidate.name}
          </h2>
          <p className="text-slate-300 text-sm flex items-center justify-center gap-1.5">
            <Briefcase className="w-4 h-4" />
            {candidate.position}
          </p>
        </div>

        {/* Info Sections */}
        <div className="flex-1 overflow-y-auto">
          {/* Email */}
          <div className="border-b border-slate-600">
            <button className="w-full px-6 py-4 flex items-center gap-3 text-white hover:bg-slate-600/50 transition-colors">
              <div className="w-10 h-10 rounded-lg bg-blue-500 flex items-center justify-center flex-shrink-0">
                <Mail className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 text-left">
                <div className="text-xs text-slate-400 mb-0.5">Email</div>
                <div className="text-sm font-medium truncate">
                  {candidate.email}
                </div>
              </div>
            </button>
          </div>

          {/* Phone */}
          {candidate.phone && (
            <div className="border-b border-slate-600">
              <button className="w-full px-6 py-4 flex items-center gap-3 text-white hover:bg-slate-600/50 transition-colors">
                <div className="w-10 h-10 rounded-lg bg-green-500 flex items-center justify-center flex-shrink-0">
                  <Phone className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 text-left">
                  <div className="text-xs text-slate-400 mb-0.5">
                    Điện thoại
                  </div>
                  <div className="text-sm font-medium">{candidate.phone}</div>
                </div>
              </button>
            </div>
          )}

          {/* Applied Date */}
          <div className="border-b border-slate-600">
            <button className="w-full px-6 py-4 flex items-center gap-3 text-white hover:bg-slate-600/50 transition-colors">
              <div className="w-10 h-10 rounded-lg bg-purple-500 flex items-center justify-center flex-shrink-0">
                <Calendar className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 text-left">
                <div className="text-xs text-slate-400 mb-0.5">
                  Ngày ứng tuyển
                </div>
                <div className="text-sm font-medium">
                  {candidate.appliedDate}
                </div>
              </div>
            </button>
          </div>

          {/* Salary */}
          {candidate.salaryExpectation && (
            <div className="border-b border-slate-600">
              <button className="w-full px-6 py-4 flex items-center gap-3 text-white hover:bg-slate-600/50 transition-colors">
                <div className="w-10 h-10 rounded-lg bg-amber-500 flex items-center justify-center flex-shrink-0">
                  <DollarSign className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 text-left">
                  <div className="text-xs text-slate-400 mb-0.5">
                    Mức lương mong muốn
                  </div>
                  <div className="text-sm font-medium">
                    {candidate.salaryExpectation}
                  </div>
                </div>
              </button>
            </div>
          )}

          {/* Location */}
          {candidate.location && (
            <div className="border-b border-slate-600">
              <button className="w-full px-6 py-4 flex items-center gap-3 text-white hover:bg-slate-600/50 transition-colors">
                <div className="w-10 h-10 rounded-lg bg-red-500 flex items-center justify-center flex-shrink-0">
                  <MapPin className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 text-left">
                  <div className="text-xs text-slate-400 mb-0.5">Địa chỉ</div>
                  <div className="text-sm font-medium">
                    {candidate.location.city}
                  </div>
                </div>
              </button>
            </div>
          )}

          {/* Assignee */}
          {candidate.assignee && (
            <div className="border-b border-slate-600">
              <button className="w-full px-6 py-4 flex items-center gap-3 text-white hover:bg-slate-600/50 transition-colors">
                <div className="w-10 h-10 rounded-lg bg-pink-500 flex items-center justify-center flex-shrink-0">
                  <User className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 text-left">
                  <div className="text-xs text-slate-400 mb-0.5">
                    Người phụ trách
                  </div>
                  <div className="text-sm font-medium">
                    {candidate.assignee.name}
                  </div>
                </div>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Right Content */}
      <div className="flex-1 flex flex-col min-h-0 bg-white dark:bg-slate-900">
        <div className="p-6 border-b flex items-center justify-between gap-4">
          <h1 className="text-2xl font-bold text-foreground">
            {candidate.name}
          </h1>
          <div className="flex gap-2">
            <Button variant="outline" size="icon">
              <Heart className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="icon">
              <Share2 className="w-4 h-4" />
            </Button>
            <Button className="bg-primary hover:bg-primary/90">
              Mua thông tin liên hệ
            </Button>
          </div>
        </div>

        <div className="p-6 space-y-6 overflow-y-auto flex-1">
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
                    <GraduationCap className="w-5 h-5 text-primary mt-0.5" />
                    <div>
                      <p className="text-xs text-muted-foreground">
                        Trình độ học vấn
                      </p>
                      <p className="font-medium">{candidate.educationLevel}</p>
                    </div>
                  </div>
                )}
                {candidate.currentLevel && (
                  <div className="flex items-start gap-3">
                    <TrendingUp className="w-5 h-5 text-primary mt-0.5" />
                    <div>
                      <p className="text-xs text-muted-foreground">
                        Cấp bậc hiện tại
                      </p>
                      <p className="font-medium">{candidate.currentLevel}</p>
                    </div>
                  </div>
                )}
                {candidate.desiredLevel && (
                  <div className="flex items-start gap-3">
                    <TrendingUp className="w-5 h-5 text-primary mt-0.5" />
                    <div>
                      <p className="text-xs text-muted-foreground">
                        Cấp bậc mong muốn
                      </p>
                      <p className="font-medium">{candidate.desiredLevel}</p>
                    </div>
                  </div>
                )}
                {candidate.workLocation && (
                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-primary mt-0.5" />
                    <div>
                      <p className="text-xs text-muted-foreground">
                        Địa điểm làm việc mong muốn
                      </p>
                      <p className="font-medium">{candidate.workLocation}</p>
                    </div>
                  </div>
                )}
                {candidate.workType && (
                  <div className="flex items-start gap-3">
                    <Clock className="w-5 h-5 text-primary mt-0.5" />
                    <div>
                      <p className="text-xs text-muted-foreground">
                        Hình thức làm việc
                      </p>
                      <p className="font-medium">{candidate.workType}</p>
                    </div>
                  </div>
                )}
                {candidate.industry && (
                  <div className="flex items-start gap-3">
                    <Building2 className="w-5 h-5 text-primary mt-0.5" />
                    <div>
                      <p className="text-xs text-muted-foreground">
                        Ngành nghề
                      </p>
                      <p className="font-medium">{candidate.industry}</p>
                    </div>
                  </div>
                )}
              </div>
              <Separator />
            </>
          )}

          {/* Skills */}
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wide mb-3">
              KỸ NĂNG
            </h3>
            <div className="flex flex-wrap gap-2">
              {candidate.labels.map((label, idx) => (
                <Badge
                  key={idx}
                  className={`${
                    skillColors[idx % skillColors.length]
                  } px-3 py-1.5 rounded-full font-medium shadow-sm`}
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
                <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wide mb-3">
                  MÔ TẢ ỨNG VIÊN
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line bg-slate-50 dark:bg-slate-800 p-4 rounded-lg">
                  {candidate.description}
                </p>
              </div>
              <Separator />
            </>
          )}

          {/* Timeline */}
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wide mb-4">
              LỊCH SỬ TUYỂN DỤNG
            </h3>
            <div className="space-y-4">
              {candidate.timeline.map((event, idx) => (
                <div key={event.id} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-sm">
                      <Clock className="w-5 h-5 text-white" />
                    </div>
                    {idx < candidate.timeline.length - 1 && (
                      <div className="w-0.5 flex-1 bg-slate-200 dark:bg-slate-700 mt-2 min-h-[30px]" />
                    )}
                  </div>

                  <div className="flex-1 pb-6">
                    <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h4 className="font-semibold text-slate-900 dark:text-white">
                          {event.action}
                        </h4>
                        <span className="text-xs text-slate-500 font-medium whitespace-nowrap">
                          {event.date}
                        </span>
                      </div>
                      <p className="text-sm text-slate-600 dark:text-slate-300 mb-2">
                        {event.description}
                      </p>
                      <p className="text-xs text-slate-500">
                        <User className="w-3 h-3 inline mr-1" />
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
