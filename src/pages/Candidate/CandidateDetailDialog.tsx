import { useEffect } from "react";
import { Dialog, DialogContent } from "../../components/ui/dialog";
import { Badge } from "../../components/ui/badge";
import { Avatar, AvatarFallback } from "../../components/ui/avatar";
import { Separator } from "../../components/ui/separator";
import { Candidate } from "../../types/candidate";
import {
  Calendar,
  Mail,
  Phone,
  DollarSign,
  Briefcase,
  User,
  Clock,
} from "lucide-react";

type CandidateDetailDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  candidate: Candidate | null;
  setHeaderBlur: (blur: boolean) => void;
};

export function CandidateDetailDialog({
  open,
  onOpenChange,
  candidate,
  setHeaderBlur,
}: CandidateDetailDialogProps) {
  useEffect(() => {
    setHeaderBlur(open);
  }, [open, setHeaderBlur]);

  if (!candidate) return null;

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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl p-0 h-[85vh] flex flex-col border-none">
        <div className="flex flex-1 overflow-hidden">
          {/* Left Sidebar */}
          <div className="w-72 bg-slate-700 dark:bg-slate-800 flex flex-col">
            {/* Header avatar cố định */}
            <div className="p-6 text-center border-b border-slate-600 flex-shrink-0">
              <Avatar className="h-24 w-24 mx-auto mb-4 border-4 border-white shadow-lg">
                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-2xl font-bold">
                  {getInitials(candidate.name)}
                </AvatarFallback>
              </Avatar>
              <h2 className="text-xl font-bold text-white mb-1">{candidate.name}</h2>
              <p className="text-slate-300 text-sm flex items-center justify-center gap-1.5">
                <Briefcase className="w-4 h-4" />
                {candidate.position}
              </p>
            </div>

            {/* Info Sections scrollable */}
            <div className="flex-1 overflow-y-auto">
              {/* Email */}
              <div className="border-b border-slate-600">
                <button className="w-full px-6 py-4 flex items-center gap-3 text-white hover:bg-slate-600/50 transition-colors">
                  <div className="w-10 h-10 rounded-lg bg-blue-500 flex items-center justify-center flex-shrink-0">
                    <Mail className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1 text-left">
                    <div className="text-xs text-slate-400 mb-0.5">Email</div>
                    <div className="text-sm font-medium truncate">{candidate.email}</div>
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
                      <div className="text-xs text-slate-400 mb-0.5">Điện thoại</div>
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
                    <div className="text-xs text-slate-400 mb-0.5">Ngày ứng tuyển</div>
                    <div className="text-sm font-medium">{candidate.appliedDate}</div>
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
                      <div className="text-xs text-slate-400 mb-0.5">Mức lương mong muốn</div>
                      <div className="text-sm font-medium">{candidate.salaryExpectation}</div>
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
                      <div className="text-xs text-slate-400 mb-0.5">Người phụ trách</div>
                      <div className="text-sm font-medium">{candidate.assignee.name}</div>
                    </div>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Right Content */}
          <div className="flex-1 flex flex-col min-h-0 bg-white dark:bg-slate-900">
            <div className="p-6 space-y-6 overflow-y-auto flex-1">
              {/* Skills */}
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wide mb-3 flex items-center justify-between">
                  KỸ NĂNG
                </h3>
                <div className="flex flex-wrap gap-2">
                  {candidate.labels.map((label, idx) => (
                    <Badge
                      key={idx}
                      className={`${skillColors[idx % skillColors.length]} px-3 py-1.5 rounded-full font-medium shadow-sm`}
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
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wide mb-3 flex items-center justify-between">
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
                <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wide mb-4 flex items-center justify-between">
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
                          <p className="text-sm text-slate-600 dark:text-slate-300 mb-2">{event.description}</p>
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
      </DialogContent>
    </Dialog>
  );
}
