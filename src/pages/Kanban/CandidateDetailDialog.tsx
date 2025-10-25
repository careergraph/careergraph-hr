import { useEffect, useMemo } from "react";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Candidate } from "@/types/candidate";
import {
  Briefcase,
  CalendarClock,
  FileText,
  GraduationCap,
  Languages,
  Mail,
  MapPin,
  MessageSquare,
  Sparkles,
  Users,
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

  const getInitials = (name: string) =>
    name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);

  const highlightCards = useMemo(
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

  const overviewSections = useMemo(() => {
    if (!candidate) return [];

    const topSkills = (candidate.skills?.length ? candidate.skills : candidate.labels).slice(0, 4);

    return [
            {
              id: "job",
              title: "Thông tin công việc",
              description: "Thông tin liên quan tới vị trí, lương và phạm vi công việc",
              items: [
                { label: "Vị trí", value: candidate.position },
                { label: "Mức lương mong muốn", value: candidate.salaryExpectation ?? "Không có" },
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
                { label: "Ngôn ngữ", value: candidate.languages?.join(", ") ?? "Chưa cập nhật" },
                {
                  label: "Kỹ năng",
                  value: topSkills.length ? topSkills.join(", ") : "Chưa cập nhật",
                },
                { label: "Hoạt động gần nhất", value: candidate.lastActive },
              ],
            },
          ];
  }, [candidate]);

  const skillPalette = [
    "bg-blue-100 text-blue-700",
    "bg-rose-100 text-rose-700",
    "bg-emerald-100 text-emerald-700",
    "bg-amber-100 text-amber-700",
    "bg-purple-100 text-purple-700",
    "bg-sky-100 text-sky-700",
  ];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      {candidate ? (
        <SheetContent
          side="right"
          className="w-full border-l border-slate-200/50 bg-white p-0 sm:max-w-[90vw] lg:max-w-[70vw] xl:max-w-[65rem]"
        >
          <div className="flex h-full flex-col overflow-hidden">
            <div className="border-b border-slate-100 bg-white px-6 py-6 sm:px-8">
              <div className="flex flex-wrap items-start justify-between gap-5">
                <div className="flex items-start gap-3">
                  <Avatar className="h-16 w-16 border border-slate-200 bg-slate-50">
                    {candidate.avatar ? (
                      <AvatarImage src={candidate.avatar} alt={candidate.name} />
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

                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-right text-xs sm:text-sm">
                  <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">
                    Trạng thái
                  </p>
                  <p className="text-base font-semibold capitalize text-slate-700">
                    {candidate.status}
                  </p>
                  <p className="mt-2 text-xs text-slate-400">
                    Ứng tuyển {candidate.appliedDate}
                  </p>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {candidate.labels.slice(0, 6).map((label, index) => (
                  <Badge
                    key={label}
                    className={`${skillPalette[index % skillPalette.length]} border-0 px-3 py-1 text-[11px] font-medium`}
                  >
                    {label}
                  </Badge>
                ))}
                {candidate.labels.length > 6 ? (
                  <Badge variant="outline" className="border-dashed border-slate-200 px-3 py-1 text-[11px] text-slate-500">
                    +{candidate.labels.length - 6}
                  </Badge>
                ) : null}
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {highlightCards.map((item) => (
                  <div
                    key={item.label}
                    className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3"
                  >
                    <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${item.accent}`}>
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

                <TabsContent value="overview" className="flex-1 overflow-hidden">
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
                          {(candidate.skills?.length ? candidate.skills : candidate.labels).map((skill) => (
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
                </TabsContent>

                <TabsContent value="experience" className="flex-1 overflow-hidden">
                  <ScrollArea className="h-full px-5 pb-10 pt-5 sm:px-8">
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

                    <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-6">
                      <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-600">
                        Kinh nghiệm tổng hợp
                      </h3>
                      <p className="mt-3 text-sm text-slate-600">
                        {candidate.experience}
                      </p>
                    </div>
                  </ScrollArea>
                </TabsContent>

                <TabsContent value="cv" className="flex-1 overflow-hidden">
                  <div className="flex h-full flex-col items-center justify-center gap-5 bg-slate-50 px-6 text-center sm:px-8">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <FileText className="h-8 w-8" />
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-lg font-semibold text-slate-700">Hồ sơ ứng viên</h3>
                      <p className="text-sm text-slate-500">
                        CV hiện chưa được liên kết. Bạn có thể yêu cầu ứng viên cập nhật hoặc tải lên thủ công.
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center justify-center gap-3">
                      <Button variant="default">Yêu cầu cập nhật CV</Button>
                      <Button variant="outline">Tải CV từ thiết bị</Button>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="messages" className="flex-1 overflow-hidden">
                  <div className="flex h-full flex-col justify-between bg-white">
                    <ScrollArea className="h-full px-6 pt-5 sm:px-8">
                      <div className="space-y-4">
                        <div className="rounded-2xl border border-slate-100 bg-slate-50/80 px-4 py-3 text-sm text-slate-500">
                          Chưa có cuộc trò chuyện nào với ứng viên. Hãy sử dụng khung soạn thảo bên dưới để bắt đầu.
                        </div>
                      </div>
                    </ScrollArea>
                    <div className="border-t border-slate-100 bg-slate-50/80 px-6 py-5 sm:px-8">
                      <div className="flex flex-col gap-3">
                        <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Soạn tin nhắn nhanh
                        </label>
                        <textarea
                          className="h-24 w-full resize-none rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 text-sm text-slate-600 shadow-inner outline-none transition focus:border-primary/40 focus:ring-2 focus:ring-primary/20"
                          placeholder="Nhập nội dung trao đổi với ứng viên..."
                        />
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div className="flex gap-2">
                            <Badge variant="outline" className="border-slate-200 bg-white text-[11px] text-slate-500">
                              <MessageSquare className="mr-1 h-3.5 w-3.5" />
                              Mẫu trả lời gợi ý
                            </Badge>
                          </div>
                          <Button className="px-6">Gửi tin nhắn</Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="email" className="flex-1 overflow-hidden">
                  <div className="flex h-full flex-col bg-white">
                    <ScrollArea className="h-full px-6 pt-5 sm:px-8">
                      <div className="space-y-4">
                        <div className="rounded-2xl border border-slate-100 bg-slate-50/80 px-5 py-4">
                          <div className="flex items-center gap-2 text-sm font-semibold text-slate-600">
                            <Mail className="h-4 w-4 text-primary" />
                            {candidate.email}
                          </div>
                          <p className="mt-2 text-sm text-slate-500">
                            Gửi email trực tiếp tới ứng viên hoặc sử dụng mẫu dưới đây để tiết kiệm thời gian.
                          </p>
                        </div>

                        <div className="rounded-2xl border border-slate-100 bg-white px-5 py-4 shadow-sm">
                          <h4 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                            Mẫu email đề xuất
                          </h4>
                          <div className="mt-4 space-y-3">
                            {[
                              "Mời phỏng vấn sơ bộ",
                              "Xác nhận lịch phỏng vấn",
                              "Cảm ơn sau phỏng vấn",
                            ].map((template) => (
                              <button
                                key={template}
                                className="flex w-full items-center justify-between rounded-xl border border-slate-200/80 bg-slate-50 px-4 py-3 text-left text-sm text-slate-600 transition hover:border-primary/30 hover:bg-primary/5"
                              >
                                <span>{template}</span>
                                <span className="text-xs uppercase text-primary">Chèn</span>
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </ScrollArea>

                    <div className="border-t border-slate-100 bg-slate-50/90 px-6 py-5 sm:px-8">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="space-y-1">
                          <p className="text-xs uppercase tracking-wide text-slate-500">
                            Người phụ trách
                          </p>
                          <p className="text-sm font-semibold text-slate-600">
                            {candidate.assignee?.name ?? "Chưa phân công"}
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-3">
                          <Button variant="outline" className="gap-2">
                            <Mail className="h-4 w-4" />
                            Gửi email nháp
                          </Button>
                          <Button className="gap-2">
                            <Mail className="h-4 w-4" />
                            Gửi ngay
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </SheetContent>
      ) : null}
    </Sheet>
  );
}
