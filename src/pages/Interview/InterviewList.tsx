import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { useNavigate } from "react-router";
import PageMeta from "@/components/common/PageMeta";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import { useInterviewStore } from "@/stores/interviewStore";
import InterviewCard from "./InterviewCard";
import FeedbackModal from "./FeedbackModal";
import type { Interview, InterviewStatus } from "@/types/interview";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { interviewService } from "@/services/interviewService";
import { jobService } from "@/services/jobService";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Briefcase, Calendar, Clock, ExternalLink, RotateCcw, Users, X } from "lucide-react";
import { formatDateYMD, formatTimeHM } from "@/lib/dateUtils";
import { canAddInterviewFeedback, canCompleteByStatus } from "./interviewCompletionRules";
import JobMultiSelectFilter, { type JobFilterOption } from "./JobMultiSelectFilter";
import {
  buildInterviewRoomPath,
  canAccessInterviewRoomFromInterview,
  getInterviewRoomCode,
} from "@/lib/interviewRoomAccess";
import {
  compareRepresentativePriority,
  groupInterviewsByChain,
  resolveDisplayInterviews,
} from "@/lib/interviewDisplay";

const STATUS_TABS: { value: string; label: string }[] = [
  { value: "", label: "Tất cả" },
  { value: "SCHEDULED", label: "Đã lên lịch" },
  { value: "CONFIRMED", label: "Đã xác nhận" },
  { value: "PENDING_RESCHEDULE", label: "Chờ xác nhận lại" },
  { value: "COMPLETED", label: "Hoàn thành" },
  { value: "CANCELLED", label: "Đã hủy" },
];

const STATUS_PRIORITY: Record<InterviewStatus, number> = {
  IN_PROGRESS: 1,
  CONFIRMED: 2,
  SCHEDULED: 3,
  PENDING_RESCHEDULE: 4,
  COMPLETED: 5,
  CANCELLED: 6,
  NO_SHOW: 7,
};

const INTERVIEW_PAGE_SIZE = 100;

const getLocalDateInputValue = (value = new Date()) => {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export default function InterviewList() {
  const {
    interviews,
    isLoading,
    fetchInterviews,
    cancelInterview,
    completeInterview,
  } = useInterviewStore();

  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState("");
  const [feedbackInterview, setFeedbackInterview] = useState<{
    interviewId: string;
    candidateName?: string;
    candidateOptions?: Array<{ interviewId: string; candidateName: string }>;
  } | null>(null);
  const [roomParticipantsByCode, setRoomParticipantsByCode] = useState<Record<string, Array<{ applicationId?: string; joinedAt?: string }>>>({});
  const [feedbackStatusByInterviewId, setFeedbackStatusByInterviewId] = useState<Record<string, boolean>>({});
  const [expandedCancelledByRoom, setExpandedCancelledByRoom] = useState<Record<string, boolean>>({});
  const [dateFilter, setDateFilter] = useState("");
  const [selectedJobIds, setSelectedJobIds] = useState<string[]>([]);
  const [jobOptions, setJobOptions] = useState<JobFilterOption[]>([]);
  const dateFilterInputRef = useRef<HTMLInputElement | null>(null);

  const displayInterviews = useMemo(() => resolveDisplayInterviews(interviews), [interviews]);

  useEffect(() => {
    fetchInterviews({
      status: statusFilter || undefined,
      jobIds: selectedJobIds,
      date: dateFilter || undefined,
      size: INTERVIEW_PAGE_SIZE,
    });
  }, [dateFilter, fetchInterviews, selectedJobIds, statusFilter]);

  useEffect(() => {
    let cancelled = false;

    jobService
      .getMyCompanyJobs()
      .then((data: unknown) => {
        if (cancelled) return;
        const list = Array.isArray(data)
          ? data
          : Array.isArray((data as { content?: unknown[] })?.content)
            ? (data as { content: unknown[] }).content
            : [];

        const options = list
          .map((item) => {
            const source = item as Record<string, unknown>;
            const id = typeof source.id === "string" ? source.id : "";
            const title = typeof source.title === "string" ? source.title : "";
            return { id, title };
          })
          .filter((item) => item.id && item.title);

        setJobOptions(options);
      })
      .catch(() => setJobOptions([]));

    return () => {
      cancelled = true;
    };
  }, []);

  const handleCancel = useCallback(
    async (id: string) => {
      try {
        await cancelInterview(id, "Hủy bởi HR");
        toast.success("Đã hủy phỏng vấn");
      } catch {
        toast.error("Không thể hủy phỏng vấn");
      }
    },
    [cancelInterview]
  );

  const handleComplete = useCallback(
    async (id: string) => {
      const target = interviews.find((interview) => interview.id === id);
      if (target && !canCompleteByStatus(target.interviewStatus)) {
        toast.warning("Chỉ có thể hoàn thành phỏng vấn đã lên lịch, đã xác nhận hoặc đang diễn ra");
        return;
      }

      try {
        await completeInterview(id);
        toast.success("Đã hoàn thành phỏng vấn");
      } catch {
        toast.error("Không thể hoàn thành phỏng vấn");
      }
    },
    [completeInterview, interviews]
  );

  const handleAcceptProposal = useCallback(
    async (interviewId: string) => {
      try {
        const proposalsResp = await interviewService.fetchProposals(interviewId);
        const proposals = Array.isArray(proposalsResp?.data)
          ? proposalsResp.data
          : Array.isArray(proposalsResp)
            ? proposalsResp
            : [];

        const pendingProposal = proposals.find((p: { proposalStatus?: string }) => p?.proposalStatus === "PENDING");
        if (!pendingProposal?.id) {
          toast.warning("Không còn đề xuất lịch chờ duyệt");
          return;
        }

        await interviewService.acceptProposal(interviewId, pendingProposal.id);
        toast.success("Đã chấp nhận đề xuất lịch mới");
        await fetchInterviews({
          status: statusFilter || undefined,
          jobIds: selectedJobIds,
          date: dateFilter || undefined,
          size: INTERVIEW_PAGE_SIZE,
        });
      } catch {
        toast.error("Không thể chấp nhận đề xuất");
      }
    },
    [dateFilter, fetchInterviews, selectedJobIds, statusFilter]
  );

  const handleRejectProposal = useCallback(
    async (interviewId: string) => {
      try {
        const proposalsResp = await interviewService.fetchProposals(interviewId);
        const proposals = Array.isArray(proposalsResp?.data)
          ? proposalsResp.data
          : Array.isArray(proposalsResp)
            ? proposalsResp
            : [];

        const pendingProposal = proposals.find((p: { proposalStatus?: string }) => p?.proposalStatus === "PENDING");
        if (!pendingProposal?.id) {
          toast.warning("Không còn đề xuất lịch chờ duyệt");
          return;
        }

        await interviewService.rejectProposal(interviewId, pendingProposal.id);
        toast.success("Đã từ chối đề xuất lịch mới");
        await fetchInterviews({
          status: statusFilter || undefined,
          jobIds: selectedJobIds,
          date: dateFilter || undefined,
          size: INTERVIEW_PAGE_SIZE,
        });
      } catch {
        toast.error("Không thể từ chối đề xuất");
      }
    },
    [dateFilter, fetchInterviews, selectedJobIds, statusFilter]
  );

  const STATUS_STYLES: Record<string, string> = {
    SCHEDULED: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    CONFIRMED: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    PENDING_RESCHEDULE: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
    IN_PROGRESS: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
    COMPLETED: "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300",
    CANCELLED: "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400",
    NO_SHOW: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  };

  const STATUS_LABELS: Record<string, string> = {
    SCHEDULED: "Đã lên lịch",
    CONFIRMED: "Đã xác nhận",
    PENDING_RESCHEDULE: "Chờ xác nhận lại",
    IN_PROGRESS: "Đang diễn ra",
    COMPLETED: "Hoàn thành",
    CANCELLED: "Đã hủy",
    NO_SHOW: "Vắng mặt",
  };

  const hasLocalFeedback = useCallback(
    (interview: Interview) =>
      Array.isArray(interview.feedback) && interview.feedback.length > 0,
    []
  );

  const groupedOnlineRooms = useMemo(() => {
    const toMs = (value?: string) => {
      if (!value) return 0;
      const ms = new Date(value).getTime();
      return Number.isFinite(ms) ? ms : 0;
    };

    const groups = new Map<string, Interview[]>();

    interviews
      .filter((iv) => iv.type === "ONLINE" && !!iv.meetingLink)
      .forEach((iv) => {
        const key = iv.meetingLink as string;
        const bucket = groups.get(key) ?? [];
        bucket.push(iv);
        groups.set(key, bucket);
      });

    return Array.from(groups.entries())
      .map(([roomCode, list]) => {
        const sortedFromStore = [...list].sort(
          (a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime()
        );
        const sorted = [...sortedFromStore].sort(
          (a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime()
        );
        const representatives = groupInterviewsByChain(sorted)
          .map((group) => [...group].sort(compareRepresentativePriority)[0])
          .sort((a, b) => toMs(a.scheduledAt) - toMs(b.scheduledAt));

        const roomParticipants = roomParticipantsByCode[roomCode] ?? [];
        const joinedApplicationIds = new Set(
          roomParticipants.filter((participant) => participant.joinedAt && participant.applicationId).map((participant) => participant.applicationId as string)
        );
        const first = sorted[0];
        const latestEnd = [...sorted].sort((a, b) => new Date(b.endAt).getTime() - new Date(a.endAt).getTime())[0];

        const activeInterviews = sorted
          .filter((iv) => iv.interviewStatus !== "CANCELLED" && iv.interviewStatus !== "NO_SHOW")
          .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime());

        const scheduledAt = activeInterviews.length > 0 ? activeInterviews[0].scheduledAt : first.scheduledAt;
        const endAt = activeInterviews.length > 0
          ? [...activeInterviews].sort((a, b) => new Date(b.endAt).getTime() - new Date(a.endAt).getTime())[0].endAt
          : latestEnd.endAt;

        const resolvedStatus = [...representatives]
          .filter((iv) => iv.interviewStatus !== "CANCELLED" && iv.interviewStatus !== "NO_SHOW")
          .sort((a, b) => STATUS_PRIORITY[a.interviewStatus] - STATUS_PRIORITY[b.interviewStatus])[0]
          ?.interviewStatus
          ?? [...representatives]
          .sort((a, b) => STATUS_PRIORITY[a.interviewStatus] - STATUS_PRIORITY[b.interviewStatus])[0]
          ?.interviewStatus;

        const activeCandidateInterviews = representatives
          .filter((iv) => iv.interviewStatus !== "CANCELLED" && iv.interviewStatus !== "NO_SHOW")
          .sort((a, b) => toMs(a.scheduledAt) - toMs(b.scheduledAt));

        const cancelledCandidateInterviews = sorted
          .filter((iv) => iv.interviewStatus === "CANCELLED" || iv.interviewStatus === "NO_SHOW")
          .sort((a, b) => toMs(b.scheduledAt) - toMs(a.scheduledAt));

        const cancelledCount = cancelledCandidateInterviews.length;
        const totalCandidates = new Set(sorted.map((iv) => iv.applicationId).filter(Boolean)).size;

        const feedbackCandidates = representatives
          .filter(
            (iv) =>
              joinedApplicationIds.has(iv.applicationId) &&
              canAddInterviewFeedback(iv, roomParticipants)
          )
          .map((iv) => ({
            interviewId: iv.id,
            candidateName: iv.candidateName,
          }));

        return {
          roomCode,
          roomLabel: getInterviewRoomCode(roomCode),
          jobTitle: first.jobTitle,
          status: resolvedStatus,
          scheduledAt,
          endAt,
          interviews: activeCandidateInterviews,
          cancelledInterviews: cancelledCandidateInterviews,
          totalCandidates,
          cancelledCount,
          canJoinRoom: activeCandidateInterviews.some((iv) => canAccessInterviewRoomFromInterview(iv)),
          feedbackCandidates,
        };
      })
      .sort((a, b) => new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime());
  }, [interviews, roomParticipantsByCode]);

  const feedbackCheckInterviews = useMemo(() => {
    const candidates: Interview[] = [];

    for (const interview of displayInterviews) {
      if (interview.interviewStatus !== "COMPLETED") continue;
      if (hasLocalFeedback(interview)) continue;
      if (feedbackStatusByInterviewId[interview.id] !== undefined) continue;

      if (interview.type === "ONLINE" && interview.meetingLink) {
        const participants = roomParticipantsByCode[interview.meetingLink] ?? [];
        const hasJoined = participants.some(
          (participant) =>
            Boolean(participant.joinedAt) &&
            participant.applicationId === interview.applicationId
        );
        if (!hasJoined) continue;
      }

      candidates.push(interview);
    }

    return candidates;
  }, [displayInterviews, feedbackStatusByInterviewId, hasLocalFeedback, roomParticipantsByCode]);

  const groupedOnlineRoomCodes = useMemo(() => {
    return Array.from(
      new Set(
        displayInterviews
          .filter((interview) => interview.type === "ONLINE" && Boolean(interview.meetingLink))
          .map((interview) => interview.meetingLink as string)
      )
    );
  }, [displayInterviews]);

  useEffect(() => {
    const roomCodes = groupedOnlineRoomCodes;
    if (roomCodes.length === 0) {
      setRoomParticipantsByCode({});
      return;
    }

    let cancelled = false;

    Promise.all(
      roomCodes.map(async (roomCode) => {
        try {
          const roomParticipantsResp = await interviewService.fetchRoomParticipants(roomCode).catch(() => null);

          const participantsData = Array.isArray(roomParticipantsResp?.data)
            ? roomParticipantsResp.data
            : Array.isArray(roomParticipantsResp)
              ? roomParticipantsResp
              : [];

          return [roomCode, participantsData] as const;
        } catch {
          return [roomCode, []] as const;
        }
      })
    ).then((entries) => {
      if (cancelled) return;
      setRoomParticipantsByCode(Object.fromEntries(entries.map(([roomCode, participantsData]) => [roomCode, participantsData])));
    });

    return () => {
      cancelled = true;
    };
  }, [groupedOnlineRoomCodes]);

  useEffect(() => {
    if (feedbackCheckInterviews.length === 0) return;

    let cancelled = false;

    Promise.all(
      feedbackCheckInterviews.map(async (interview) => {
        try {
          const response = await interviewService.getFeedback(interview.id);
          const feedbackItems = Array.isArray(response?.data)
            ? response.data
            : Array.isArray(response)
              ? response
              : [];

          return [interview.id, feedbackItems.length > 0] as const;
        } catch {
          return [interview.id, true] as const;
        }
      })
    ).then((entries) => {
      if (cancelled) return;
      setFeedbackStatusByInterviewId((prev) => ({
        ...prev,
        ...Object.fromEntries(entries),
      }));
    });

    return () => {
      cancelled = true;
    };
  }, [feedbackCheckInterviews]);

  const openFeedbackForCandidates = useCallback(
    async (candidates: Array<{ interviewId: string; candidateName: string }>) => {
      const verified = (
        await Promise.all(
          candidates.map(async (candidate) => {
            try {
              const response = await interviewService.getFeedback(candidate.interviewId);
              const feedbackItems = Array.isArray(response?.data)
                ? response.data
                : Array.isArray(response)
                  ? response
                  : [];

              setFeedbackStatusByInterviewId((prev) => ({
                ...prev,
                [candidate.interviewId]: feedbackItems.length > 0,
              }));

              return feedbackItems.length === 0 ? candidate : null;
            } catch {
              setFeedbackStatusByInterviewId((prev) => ({
                ...prev,
                [candidate.interviewId]: true,
              }));
              return null;
            }
          })
        )
      ).filter((candidate): candidate is { interviewId: string; candidateName: string } => Boolean(candidate));

      const firstCandidate = verified[0];
      if (!firstCandidate) {
        toast.info("Tất cả ứng viên đủ điều kiện trong phòng này đã được đánh giá.");
        return;
      }

      setFeedbackInterview({
        interviewId: firstCandidate.interviewId,
        candidateName: firstCandidate.candidateName,
        candidateOptions: verified,
      });
    },
    []
  );

  const standaloneInterviews = useMemo(
    () => displayInterviews.filter((iv) => !(iv.type === "ONLINE" && !!iv.meetingLink)),
    [displayInterviews]
  );

  const selectedJobs = useMemo(
    () => jobOptions.filter((job) => selectedJobIds.includes(job.id)),
    [jobOptions, selectedJobIds]
  );
  const hasAdvancedFilters = Boolean(dateFilter || selectedJobIds.length > 0);

  const resetAdvancedFilters = () => {
    setDateFilter("");
    setSelectedJobIds([]);
  };

  const toggleJobFilter = (jobId: string) => {
    setSelectedJobIds((current) =>
      current.includes(jobId)
        ? current.filter((item) => item !== jobId)
        : [...current, jobId]
    );
  };

  const openDateFilterPicker = () => {
    const input = dateFilterInputRef.current as (HTMLInputElement & {
      showPicker?: () => void;
    }) | null;

    if (!input) return;

    if (typeof input.showPicker === "function") {
      try {
        input.showPicker();
      } catch {
        input.focus();
      }
      return;
    }

    input.focus();
  };

  return (
    <>
      <PageMeta title="Phỏng vấn | CareerGraph HR" description="Quản lý lịch phỏng vấn" />
      <PageBreadcrumb pageTitle="Phỏng vấn" />

      <div className="space-y-4">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Tabs value={statusFilter} onValueChange={setStatusFilter}>
            <div className="no-scrollbar -mx-4 overflow-x-auto px-4 md:mx-0 md:px-0">
              <TabsList className="inline-flex w-max gap-1 md:w-auto md:gap-2">
                {STATUS_TABS.map((tab) => (
                  <TabsTrigger key={tab.value} value={tab.value} className="shrink-0 whitespace-nowrap px-3 py-2 text-sm md:px-4">
                    {tab.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>
          </Tabs>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-3 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <div className="grid gap-3 lg:grid-cols-[180px_minmax(220px,1fr)_auto] lg:items-end">
            <div className="space-y-1.5">
              <label htmlFor="interview-date-filter" className="text-xs font-medium text-gray-600 dark:text-gray-300">
                Ngày phỏng vấn
              </label>
              <div className="relative">
              <input
                id="interview-date-filter"
                ref={dateFilterInputRef}
                type="date"
                value={dateFilter}
                onClick={openDateFilterPicker}
                onFocus={openDateFilterPicker}
                onChange={(event) => setDateFilter(event.target.value)}
                className="h-10 w-full rounded-lg border border-gray-200 bg-white px-3 pr-10 text-sm text-gray-700 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
              />
              <button
                type="button"
                aria-label="Chọn ngày phỏng vấn"
                onClick={openDateFilterPicker}
                className="absolute right-2 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md text-gray-500 transition hover:bg-gray-100 hover:text-gray-800 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-100"
              >
                <Calendar className="h-4 w-4" />
              </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-600 dark:text-gray-300">
                Công việc
              </label>
              <JobMultiSelectFilter
                jobs={jobOptions}
                selectedIds={selectedJobIds}
                onChange={setSelectedJobIds}
              />
              {/*
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    className="h-10 w-full justify-between border-gray-200 bg-white px-3 text-left font-normal text-gray-700 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
                  >
                    <span className="flex min-w-0 items-center gap-2">
                      <Briefcase className="h-4 w-4 shrink-0 text-gray-400" />
                      <span className="truncate">
                        {selectedJobs.length === 0
                          ? "Tất cả công việc"
                          : selectedJobs.length === 1
                            ? selectedJobs[0].title
                            : `${selectedJobs.length} công việc đã chọn`}
                      </span>
                    </span>
                    <ChevronsUpDown className="h-4 w-4 shrink-0 text-gray-400" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent align="start" className="w-[min(520px,calc(100vw-2rem))] p-0">
                  <div className="border-b border-gray-200 p-3 dark:border-gray-700">
                    <div className="relative">
                      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                      <Input
                        value={jobSearch}
                        onChange={(event) => setJobSearch(event.target.value)}
                        placeholder="Tìm công việc..."
                        className="h-9 pl-9"
                      />
                    </div>
                  </div>

                  <div className="max-h-72 overflow-y-auto p-2">
                    {visibleJobOptions.length === 0 ? (
                      <div className="px-3 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
                        Không tìm thấy công việc phù hợp
                      </div>
                    ) : (
                      visibleJobOptions.map((job) => {
                        const checked = selectedJobIds.includes(job.id);
                        return (
                          <button
                            key={job.id}
                            type="button"
                            onClick={() => toggleJobFilter(job.id)}
                            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm text-gray-700 transition hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-gray-800"
                          >
                            <span
                              aria-hidden="true"
                              className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
                                checked
                                  ? "border-brand-600 bg-brand-600 text-white"
                                  : "border-gray-300 bg-white dark:border-gray-600 dark:bg-gray-900"
                              }`}
                            >
                              {checked && <Check className="h-3 w-3" />}
                            </span>
                            <span className="min-w-0 flex-1 truncate">{job.title}</span>
                          </button>
                        );
                      })
                    )}
                  </div>

                  {selectedJobIds.length > 0 && (
                    <div className="flex items-center justify-between border-t border-gray-200 px-3 py-2 dark:border-gray-700">
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {selectedJobIds.length} công việc đang được lọc
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-8 px-2 text-xs"
                        onClick={() => setSelectedJobIds([])}
                      >
                        Xóa lọc job
                      </Button>
                    </div>
                  )}
                </PopoverContent>
              </Popover>
              */}
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant={dateFilter === getLocalDateInputValue() ? "default" : "outline"}
                className="h-10"
                onClick={() => setDateFilter(getLocalDateInputValue())}
              >
                <Calendar className="mr-1.5 h-4 w-4" />
                Hôm nay
              </Button>
              <Button
                type="button"
                variant="outline"
                className="h-10"
                onClick={resetAdvancedFilters}
                disabled={!hasAdvancedFilters}
              >
                <RotateCcw className="mr-1.5 h-4 w-4" />
                Xóa lọc
              </Button>
            </div>
          </div>

          {hasAdvancedFilters && (
            <div className="mt-3 flex flex-wrap gap-2 text-xs">
              {dateFilter && (
                <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-1 font-medium text-blue-700 dark:bg-blue-950/40 dark:text-blue-300">
                  <Calendar className="h-3.5 w-3.5" />
                  {dateFilter}
                </span>
              )}
              {selectedJobs.map((job) => (
                <button
                  key={job.id}
                  type="button"
                  onClick={() => toggleJobFilter(job.id)}
                  className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 font-medium text-emerald-700 transition hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300 dark:hover:bg-emerald-900/50"
                >
                  <Briefcase className="h-3.5 w-3.5" />
                  <span className="max-w-[220px] truncate">{job.title}</span>
                  <X className="h-3.5 w-3.5" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Interview list */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        ) : interviews.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800/50 p-12 text-center">
            <p className="text-gray-500 dark:text-gray-400">
              Chưa có phỏng vấn nào
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {groupedOnlineRooms.length > 0 && (
              <section className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-100">Phỏng vấn online theo phòng</h3>
                  <span className="text-xs text-gray-500 dark:text-gray-400">{groupedOnlineRooms.length} phòng</span>
                </div>

                <div className="grid grid-cols-1 gap-3 md:grid-cols-2 md:gap-4">
                  {groupedOnlineRooms.map((room) => {
                    const startDate = new Date(room.scheduledAt);
                    const endDate = new Date(room.endAt);

                    return (
                      <div
                        key={room.roomCode}
                        className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{room.jobTitle}</p>
                            <p className="mt-1 text-xs font-mono text-gray-500 dark:text-gray-400">Room: {room.roomLabel}</p>
                          </div>
                          <Badge className={STATUS_STYLES[room.status] ?? ""} variant="secondary">
                            {STATUS_LABELS[room.status] ?? room.status}
                          </Badge>
                        </div>

                        <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3.5 w-3.5" />
                            {formatDateYMD(startDate)}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5" />
                            {formatTimeHM(startDate)}
                            {" - "}
                            {formatTimeHM(endDate)}
                          </span>
                          <span className="flex items-center gap-1">
                            <Users className="h-3.5 w-3.5" />
                            {room.totalCandidates} ứng viên
                          </span>
                        </div>

                        <div className="mt-3 space-y-1 rounded-lg border border-gray-200/70 bg-gray-50/70 p-2 dark:border-gray-700 dark:bg-gray-900/30">
                          {room.interviews.slice(0, 4).map((iv) => (
                            <button
                              key={iv.id}
                              type="button"
                              onClick={() => navigate(`/interviews/${iv.id}`)}
                              className="block w-full truncate rounded-md px-2 py-1 text-left text-xs text-gray-600 transition-colors hover:bg-white hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-800"
                            >
                              {iv.candidateName}
                            </button>
                          ))}
                          {room.interviews.length > 4 && (
                            <p className="px-2 pt-1 text-[11px] text-gray-500 dark:text-gray-400">
                              +{room.interviews.length - 4} ứng viên khác
                            </p>
                          )}
                          {room.cancelledCount > 0 && (
                            <div className="px-2 pt-1">
                              <button
                                type="button"
                                onClick={() =>
                                  setExpandedCancelledByRoom((prev) => ({
                                    ...prev,
                                    [room.roomCode]: !prev[room.roomCode],
                                  }))
                                }
                                className="text-[11px] font-medium text-red-500 hover:underline dark:text-red-400"
                              >
                                {room.cancelledCount} lịch đã hủy/không tham gia - {expandedCancelledByRoom[room.roomCode] ? "Ẩn" : "Xem chi tiết"}
                              </button>

                              {expandedCancelledByRoom[room.roomCode] && (
                                <div className="mt-2 space-y-1 rounded-md border border-red-200/70 bg-red-50/60 p-2 dark:border-red-900/40 dark:bg-red-950/20">
                                  {room.cancelledInterviews.map((iv) => (
                                    <button
                                      key={iv.id}
                                      type="button"
                                      onClick={() => navigate(`/interviews/${iv.id}`)}
                                      className="block w-full truncate rounded px-2 py-1 text-left text-[11px] text-red-700 hover:bg-white dark:text-red-300 dark:hover:bg-gray-800"
                                    >
                                      {iv.candidateName} - {STATUS_LABELS[iv.interviewStatus] ?? iv.interviewStatus}
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                        </div>

                        <div className="mt-3 flex flex-wrap gap-2">
                          <Button
                            type="button"
                            size="sm"
                            className="h-8 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:text-gray-600"
                            onClick={() => navigate(buildInterviewRoomPath(room.roomCode))}
                            disabled={!room.canJoinRoom}
                          >
                            <ExternalLink className="mr-1 h-3.5 w-3.5" />
                            {room.canJoinRoom ? "Vào phòng" : "Đã quá giờ phỏng vấn"}
                          </Button>

                          {room.feedbackCandidates.length > 0 && (
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              className="h-8"
                              onClick={async () => {
                                await openFeedbackForCandidates(room.feedbackCandidates);
                              }}
                            >
                              Đánh giá ứng viên
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {standaloneInterviews.length > 0 && (
              <section className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-100">Phỏng vấn độc lập</h3>
                  <span className="text-xs text-gray-500 dark:text-gray-400">{standaloneInterviews.length} lịch</span>
                </div>

                <div className="grid grid-cols-1 gap-3 md:grid-cols-2 md:gap-4 xl:grid-cols-3">
                  {standaloneInterviews.map((interview) => (
                    <InterviewCard
                      key={interview.id}
                      interview={interview}
                      onCancel={handleCancel}
                      onComplete={handleComplete}
                      onFeedback={(iv) =>
                        setFeedbackInterview({
                          interviewId: iv.id,
                          candidateName: iv.candidateName,
                        })
                      }
                      onAcceptReschedule={handleAcceptProposal}
                      onRejectReschedule={handleRejectProposal}
                      onClick={(iv) => navigate(`/interviews/${iv.id}`)}
                    />
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </div>

      {/* Feedback modal */}
      {feedbackInterview && (
        <FeedbackModal
          open={!!feedbackInterview}
          onClose={() => setFeedbackInterview(null)}
          interviewId={feedbackInterview.interviewId}
          candidateName={feedbackInterview.candidateName}
          candidateOptions={feedbackInterview.candidateOptions}
          onSubmitted={async () => {
            await fetchInterviews({
              status: statusFilter || undefined,
              jobIds: selectedJobIds,
              date: dateFilter || undefined,
              size: INTERVIEW_PAGE_SIZE,
            });
          }}
        />
      )}
    </>
  );
}
