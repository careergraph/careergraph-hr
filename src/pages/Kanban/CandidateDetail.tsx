/* eslint-disable @typescript-eslint/no-unused-vars */
import { useEffect, useMemo, useState, useCallback } from "react";
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
import { candidateService } from "@/services/candidateService";
import type {
  CandidateOverviewResponse,
  CandidateExperienceResponse,
  CandidateResumeResponse,
  CandidateMessagesResponse,
  CandidateEmailsResponse,
} from "@/types/candidateTab";
import { formatDate } from "@/lib/candidateDataUtils";

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

  // Local state to hold per-tab fetched data and loading states.
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [errors, setErrors] = useState<Record<string, string | null>>({});
  const [overviewData] = useState<CandidateOverviewResponse | null>(null);
  const [experienceData, setExperienceData] =
    useState<CandidateExperienceResponse | null>(null);
  const [resumeData, setResumeData] = useState<CandidateResumeResponse | null>(
    null
  );
  const [messagesData, setMessagesData] =
    useState<CandidateMessagesResponse | null>(null);
  const [emailsData, setEmailsData] = useState<CandidateEmailsResponse | null>(
    null
  );

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
          const data = await candidateService.fetchExperience(id, signal);
          setExperienceData(data);
        } else if (tab === "cv") {
          const data = await candidateService.fetchResume(candidate.candidateId, id, signal);
          setResumeData(data);
        } else if (tab === "messages") {
          const data = await candidateService.fetchMessages(id, signal);
          setMessagesData(data);
        } else if (tab === "email") {
          const data = await candidateService.fetchEmails(id, signal);
          setEmailsData(data);
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
                    <span className="font-semibold">
                      {formatDate(candidate.appliedDate)}
                    </span>
                  </p>
                </div>
              </div>

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
              <Tabs
                defaultValue="overview"
                className="flex h-full flex-col"
                onValueChange={(val) => {
                  // load data for the selected tab
                  loadTab(val);
                }}
              >
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
                  <OverviewTab
                    candidate={candidate}
                    overviewData={overviewData}
                    loading={loading?.overview}
                    error={errors?.overview}
                  />
                </TabsContent>

                <TabsContent
                  value="experience"
                  className="flex-1 overflow-hidden"
                >
                  <ExperienceTab
                    candidate={candidate}
                    experienceData={experienceData}
                    loading={loading?.experience}
                    error={errors?.experience}
                  />
                </TabsContent>

                <TabsContent value="cv" className="flex-1 overflow-hidden">
                  <CvTab
                    resumeData={resumeData}
                    loading={loading?.cv}
                    error={errors?.cv}
                  />
                </TabsContent>

                <TabsContent
                  value="messages"
                  className="flex-1 overflow-hidden"
                >
                  <MessagesTab
                    messagesData={messagesData}
                    loading={loading?.messages}
                    error={errors?.messages}
                  />
                </TabsContent>

                <TabsContent value="email" className="flex-1 overflow-hidden">
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
