import { useEffect, useMemo, useState, useCallback } from "react";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Candidate } from "@/types/candidate";
import {
  Briefcase,
  CalendarClock,
  MapPin,
  Sparkles,
} from "lucide-react";
import { OverviewTab } from "./CandidateTab/OverviewTab";
import { ExperienceTab } from "./CandidateTab/ExperienceTab";
import { CvTab } from "./CandidateTab/CvTab";
import { MessagesTab } from "./CandidateTab/MessagesTab";
import { EmailTab } from "./CandidateTab/EmailTab";
import { InterviewReviewTab } from "./CandidateTab/InterviewReviewTab";
import { candidateService } from "@/services/candidateService";
import { interviewService } from "@/services/interviewService";
import type {
  CandidateOverviewResponse,
  CandidateExperienceResponse,
  CandidateResumeResponse,
  CandidateEmailsResponse,
  OverviewExperience,
} from "@/types/candidateTab";
import { formatDate } from "@/lib/candidateDataUtils";
import type { Interview } from "@/types/interview";
import { Button } from "@/components/ui/button";

// CandidateDetail hiển thị panel chi tiết của ứng viên trong Kanban.

type CandidateDetailProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  candidate: Candidate | null;
  setHeaderBlur: (blur: boolean) => void;
  onRejectCandidate?: (candidate: Candidate) => Promise<void> | void;
  onScheduleInterview?: (candidate: Candidate) => void;
};

export function CandidateDetail({
  open,
  onOpenChange,
  candidate,
  setHeaderBlur,
  onRejectCandidate,
  onScheduleInterview,
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
              value: candidate.experience
                ? `${candidate.experience} years`
                : "Chưa có",
              icon: <Sparkles className="h-4 w-4" />,
              accent: "bg-amber-100 text-amber-600",
            },
            {
              label: "Hoạt động gần nhất",
              value: formatDate(candidate.lastActive),
              icon: <CalendarClock className="h-4 w-4" />,
              accent: "bg-sky-100 text-sky-600",
            },
            // {
            //   label: "Người phụ trách",
            //   value: candidate.assignee?.name ?? "Chưa phân công",
            //   icon: <Users className="h-4 w-4" />,
            //   accent: "bg-emerald-100 text-emerald-600",
            // },
          ]
        : [],
    [candidate]
  );

  // Local state to hold per-tab fetched data and loading states.
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [errors, setErrors] = useState<Record<string, string | null>>({});
  const [overviewData] = useState<CandidateOverviewResponse | null>(null);
  const [experienceData, setExperienceData] =
    useState<CandidateExperienceResponse | OverviewExperience | null>(null);
  const [resumeData, setResumeData] = useState<CandidateResumeResponse | null>(
    null
  );
  const [emailsData, setEmailsData] = useState<CandidateEmailsResponse | null>(
    null
  );
  const [interviewReviews, setInterviewReviews] = useState<Interview[]>([]);
  const [rejecting, setRejecting] = useState(false);

  const handleRejectCandidate = useCallback(async () => {
    if (!candidate || !onRejectCandidate || rejecting) return;

    setRejecting(true);
    try {
      await onRejectCandidate(candidate);
      onOpenChange(false);
    } finally {
      setRejecting(false);
    }
  }, [candidate, onRejectCandidate, onOpenChange, rejecting]);

  const loadTab = useCallback(
    async (tab: string) => {
      if (!candidate) return;
      const id = candidate.id;
      const controller = new AbortController();
      const signal = controller.signal;

      // record of active tab is not needed locally; server data/state handled separately
      setLoading((s) => ({ ...s, [tab]: true }));
      setErrors((s) => ({ ...s, [tab]: null }));

      try {
        if (tab === "overview") {
          // const data = await candidateService.fetchOverview(id, signal);
          // setOverviewData(data);
        } else if (tab === "experience") {
          const data = await candidateService.fetchExperience(candidate.candidateId, signal);
          setExperienceData(data);
        } else if (tab === "cv") {
          const data = await candidateService.fetchResume(candidate.candidateId, id, signal);
          setResumeData(data);
        } else if (tab === "email") {
          const data = await candidateService.fetchEmails(id, signal);
          setEmailsData(data);
        } else if (tab === "interview-review") {
          const data = await interviewService.fetchInterviewsByApplication(id);
          const interviews = Array.isArray(data?.data)
            ? data.data
            : Array.isArray(data)
              ? data
              : [];
          setInterviewReviews(interviews);
        }
      } catch (err: unknown) {
        // Ignore abort errors; use a lightweight type guard to extract name/message
        const e = err as { name?: string; message?: string };
        if (e?.name !== "CanceledError" && e?.name !== "AbortError") {
          setErrors((s) => ({ ...s, [tab]: e?.message ?? "Error" }));
        }
      } finally {
        setLoading((s) => ({ ...s, [tab]: false }));
      }

      return () => controller.abort();
    },
    [candidate]
  );

  // When panel opens, fetch overview automatically.
  useEffect(() => {
    if (open && candidate) {
      loadTab("overview");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, candidate]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      {candidate ? (
        <SheetContent
          side="right"
          className="h-[100dvh] w-full border-l border-slate-200/50 bg-white p-0 sm:h-full sm:max-w-[90vw] lg:max-w-[70vw] xl:max-w-[65rem]"
        >
          <SheetHeader className="sr-only">
            <SheetTitle>Chi tiết ứng viên {candidate.name}</SheetTitle>
            <SheetDescription>
              Bảng thông tin chi tiết và các tab liên quan của ứng viên trong kanban.
            </SheetDescription>
          </SheetHeader>
          <div className="flex h-full min-h-0 flex-col overflow-hidden">
            {/* Phần đầu hiển thị thông tin tổng quan ứng viên. */}
            <div className="border-b border-slate-100 bg-white px-4 py-4 sm:px-8 sm:py-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between sm:gap-5">
                <div className="flex items-start gap-3">
                  <Avatar className="h-12 w-12 border border-slate-200 bg-slate-50 sm:h-16 sm:w-16">
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
                      <h2 className="text-lg font-semibold leading-tight text-slate-900 sm:text-xl">
                        {candidate.name}
                      </h2>
                      <Badge className="bg-slate-900/5 text-[11px] font-semibold uppercase tracking-wide text-slate-700">
                        {candidate.ticketId}
                      </Badge>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 sm:gap-3 sm:text-sm">
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
                  </div>
                </div>

                <div className="w-full rounded-xl border border-slate-200 bg-white bg-gradient-to-r from-[#4f46e5]/15 via-[#7c3aed]/15 to-[#ec4899]/20 p-4 text-sm font-medium text-primary shadow-sm sm:w-auto">
                  <p className="text-lg font-semibold capitalize text-slate-800">
                    {candidate.status}
                  </p>

                  <p className="mt-2 text-xs text-slate-500">
                    Ứng tuyển{" "}
                    <span className="font-semibold">
                      {formatDate(candidate.appliedDate)}
                    </span>
                  </p>

                  {onRejectCandidate ? (
                    <Button
                      size="sm"
                      variant="destructive"
                      className="mt-3 w-full bg-red-600 text-white hover:bg-red-700"
                      onClick={handleRejectCandidate}
                      disabled={rejecting || candidate.status === "rejected"}
                    >
                      {rejecting
                        ? "Đang xử lý..."
                        : candidate.status === "rejected"
                          ? "Đã từ chối"
                          : "Từ chối ứng viên"}
                    </Button>
                  ) : null}
                </div>
              </div>

              <div className="mt-4 flex gap-3 overflow-x-auto pb-1 sm:mt-5 sm:grid sm:grid-cols-2 sm:overflow-visible lg:grid-cols-2">
                {highlightCards.map((item) => (
                  <div
                    key={item.label}
                    className="flex min-w-[220px] items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 sm:min-w-0"
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

            <div className="flex-1 min-h-0 overflow-hidden bg-white">
              <Tabs
                defaultValue="overview"
                className="flex h-full min-h-0 flex-col"
                onValueChange={(val) => {
                  // load data for the selected tab
                  loadTab(val);
                }}
              >
                <TabsList className="sticky top-0 z-10 flex w-full flex-nowrap justify-start gap-2 overflow-x-auto rounded-none border-b border-slate-100 bg-white/95 px-4 py-3 sm:px-8">
                  <TabsTrigger value="overview">Thông tin chi tiết</TabsTrigger>
                  <TabsTrigger value="experience">Kinh nghiệm - Lịch sử</TabsTrigger>
                  <TabsTrigger value="cv">CV</TabsTrigger>
                  <TabsTrigger value="interview-review">Đánh giá phỏng vấn</TabsTrigger>
                  <TabsTrigger value="messages">Tin nhắn</TabsTrigger>
                  {/* <TabsTrigger value="email">Email</TabsTrigger> */}
                </TabsList>

                <TabsContent
                  value="overview"
                  className="flex-1 min-h-0 overflow-hidden"
                >
                  <OverviewTab
                    candidate={candidate}
                    overviewData={overviewData}
                    loading={loading?.overview}
                    error={errors?.overview}
                  />
                </TabsContent>

                <TabsContent
                  value="experience"
                  className="flex-1 min-h-0 overflow-hidden"
                >
                  <ExperienceTab
                    candidate={candidate}
                    experienceData={experienceData}
                    loading={loading?.experience}
                    error={errors?.experience}
                  />
                </TabsContent>

                <TabsContent value="cv" className="flex-1 min-h-0 overflow-hidden">
                  <CvTab
                    resumeData={resumeData}
                    loading={loading?.cv}
                    error={errors?.cv}
                  />
                </TabsContent>

                <TabsContent
                  value="interview-review"
                  className="flex-1 min-h-0 overflow-hidden"
                >
                  <InterviewReviewTab
                    candidate={candidate}
                    interviews={interviewReviews}
                    loading={loading?.["interview-review"]}
                    error={errors?.["interview-review"]}
                    onScheduleInterview={onScheduleInterview}
                    onRefreshInterviews={async () => {
                      await loadTab("interview-review");
                    }}
                  />
                </TabsContent>

                <TabsContent
                  value="messages"
                  className="flex-1 min-h-0 overflow-hidden"
                >
                  <MessagesTab candidate={candidate} />
                </TabsContent>

                <TabsContent value="email" className="flex-1 min-h-0 overflow-hidden">
                  <EmailTab
                    candidate={candidate}
                    emailsData={emailsData}
                    loading={loading?.email}
                    error={errors?.email}
                  />
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </SheetContent>
      ) : null}
    </Sheet>
  );
}
