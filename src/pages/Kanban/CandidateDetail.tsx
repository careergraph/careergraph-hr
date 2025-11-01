import { useEffect, useMemo } from "react";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Candidate } from "@/types/candidate";
import {
  Briefcase,
  CalendarClock,
  MapPin,
  Sparkles,
  Users,
} from "lucide-react";
import { OverviewTab } from "./CandidateTab/OverviewTab";
import { ExperienceTab } from "./CandidateTab/ExperienceTab";
import { CvTab } from "./CandidateTab/CvTab";
import { MessagesTab } from "./CandidateTab/MessagesTab";
import { EmailTab } from "./CandidateTab/EmailTab";

// CandidateDetail hiển thị panel chi tiết của ứng viên trong Kanban.

type CandidateDetailProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  candidate: Candidate | null;
  setHeaderBlur: (blur: boolean) => void;
};

export function CandidateDetail({
  open,
  onOpenChange,
  candidate,
  setHeaderBlur,
}: CandidateDetailProps) {
  useEffect(() => {
    // Làm mờ header khi panel mở để tạo trọng tâm.
    setHeaderBlur(open);
  }, [open, setHeaderBlur]);

  const getInitials = (name: string) =>
    // Lấy ký tự đầu mỗi từ để hiển thị avatar fallback.
    name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);

  const highlightCards = useMemo(
    // Chuẩn bị dữ liệu highlight phía trên tabs khi có ứng viên.
    () =>
      candidate
        ? [
            {
              label: "Kinh nghiệm",
              value: candidate.experience,
              icon: <Sparkles className="h-4 w-4" />,
              accent: "bg-amber-100 text-amber-600",
            },
            {
              label: "Hoạt động gần nhất",
              value: candidate.lastActive,
              icon: <CalendarClock className="h-4 w-4" />,
              accent: "bg-sky-100 text-sky-600",
            },
            {
              label: "Người phụ trách",
              value: candidate.assignee?.name ?? "Chưa phân công",
              icon: <Users className="h-4 w-4" />,
              accent: "bg-emerald-100 text-emerald-600",
            },
          ]
        : [],
    [candidate]
  );

  // const skillPalette = [
  //   "bg-blue-100 text-blue-700",
  //   "bg-rose-100 text-rose-700",
  //   "bg-emerald-100 text-emerald-700",
  //   "bg-amber-100 text-amber-700",
  //   "bg-purple-100 text-purple-700",
  //   "bg-sky-100 text-sky-700",
  // ];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      {candidate ? (
        <SheetContent
          side="right"
          className="w-full border-l border-slate-200/50 bg-white p-0 sm:max-w-[90vw] lg:max-w-[70vw] xl:max-w-[65rem]"
        >
          <div className="flex h-full flex-col overflow-hidden">
            {/* Phần đầu hiển thị thông tin tổng quan ứng viên. */}
            <div className="border-b border-slate-100 bg-white px-6 py-6 sm:px-8">
              <div className="flex flex-wrap items-start justify-between gap-5">
                <div className="flex items-start gap-3">
                  <Avatar className="h-16 w-16 border border-slate-200 bg-slate-50">
                    {candidate.avatar ? (
                      <AvatarImage
                        src={candidate.avatar}
                        alt={candidate.name}
                      />
                    ) : null}
                    <AvatarFallback className="bg-primary/10 text-sm font-semibold uppercase text-primary">
                      {getInitials(candidate.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-xl font-semibold leading-tight text-slate-900">
                        {candidate.name}
                      </h2>
                      <Badge className="bg-slate-900/5 text-[11px] font-semibold uppercase tracking-wide text-slate-700">
                        {candidate.ticketId}
                      </Badge>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-sm text-slate-500">
                      <span className="inline-flex items-center gap-2">
              {/* Tabs cung cấp các chế độ xem chi tiết. */}
                        <Briefcase className="h-4 w-4 text-slate-400" />
                        {candidate.position}
                      </span>
                      <span className="inline-flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-slate-400" />
                        {candidate.location.city}, {candidate.location.province}
                      </span>
                    </div>
                    {candidate.description ? (
                      <p className="max-w-2xl text-xs leading-relaxed text-slate-500 sm:text-sm">
                        {candidate.description}
                      </p>
                    ) : null}
                  </div>
                </div>

                <div className="bg-gradient-to-r from-[#4f46e5]/15 via-[#7c3aed]/15 to-[#ec4899]/20 px-3 py-1 text-sm font-medium text-primary rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                  <p className="text-lg font-semibold capitalize text-slate-800">
                    {candidate.status}
                  </p>

                  <p className="mt-2 text-xs text-slate-500">
                    Ứng tuyển{" "}
                    <span className="font-semibold">{candidate.appliedDate}</span>
                  </p>
                </div>
              </div>

              {/* <div className="mt-4 flex flex-wrap gap-2">
                {candidate.labels.slice(0, 6).map((label, index) => (
                  <Badge
                    key={label}
                    className={`${
                      skillPalette[index % skillPalette.length]
                    } border-0 px-3 py-1 text-[11px] font-medium`}
                  >
                    {label}
                  </Badge>
                ))}
                {candidate.labels.length > 6 ? (
                  <Badge
                    variant="outline"
                    className="border-dashed border-slate-200 px-3 py-1 text-[11px] text-slate-500"
                  >
                    +{candidate.labels.length - 6}
                  </Badge>
                ) : null}
              </div> */}

              <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {highlightCards.map((item) => (
                  <div
                    key={item.label}
                    className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3"
                  >
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-xl ${item.accent}`}
                    >
                      {item.icon}
                    </div>
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                        {item.label}
                      </p>
                      <p className="text-sm font-semibold text-slate-700">
                        {item.value}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex-1 overflow-hidden bg-white">
              <Tabs defaultValue="overview" className="flex h-full flex-col">
                <TabsList className="sticky top-0 z-10 flex w-full flex-wrap justify-start gap-2 rounded-none border-b border-slate-100 bg-white/95 px-5 py-3 sm:px-8">
                  <TabsTrigger value="overview">Thông tin chi tiết</TabsTrigger>
                  <TabsTrigger value="experience">Kinh nghiệm</TabsTrigger>
                  <TabsTrigger value="cv">CV</TabsTrigger>
                  <TabsTrigger value="messages">Tin nhắn</TabsTrigger>
                  <TabsTrigger value="email">Email</TabsTrigger>
                </TabsList>

                <TabsContent
                  value="overview"
                  className="flex-1 overflow-hidden"
                >
                  <OverviewTab candidate={candidate} />
                </TabsContent>

                <TabsContent
                  value="experience"
                  className="flex-1 overflow-hidden"
                >
                  <ExperienceTab candidate={candidate} />
                </TabsContent>

                <TabsContent value="cv" className="flex-1 overflow-hidden">
                  <CvTab />
                </TabsContent>

                <TabsContent
                  value="messages"
                  className="flex-1 overflow-hidden"
                >
                  <MessagesTab />
                </TabsContent>

                <TabsContent value="email" className="flex-1 overflow-hidden">
                  <EmailTab candidate={candidate} />
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </SheetContent>
      ) : null}
    </Sheet>
  );
}
