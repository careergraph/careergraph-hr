import { useEffect, useState, useCallback, useMemo } from "react";
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, ExternalLink, Users } from "lucide-react";
import { formatDateYMD, formatTimeHM } from "@/lib/dateUtils";

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
  const [expandedCancelledByRoom, setExpandedCancelledByRoom] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetchInterviews({ status: statusFilter || undefined });
  }, [statusFilter, fetchInterviews]);

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
      try {
        await completeInterview(id);
        toast.success("Đã hoàn thành phỏng vấn");
      } catch {
        toast.error("Không thể hoàn thành phỏng vấn");
      }
    },
    [completeInterview]
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
        await fetchInterviews({ status: statusFilter || undefined });
      } catch {
        toast.error("Không thể chấp nhận đề xuất");
      }
    },
    [fetchInterviews, statusFilter]
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
        await fetchInterviews({ status: statusFilter || undefined });
      } catch {
        toast.error("Không thể từ chối đề xuất");
      }
    },
    [fetchInterviews, statusFilter]
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

        const latestByApplicationMap = new Map<string, Interview>();
        [...sorted]
          .sort((a, b) => {
            const slotDiff = toMs(b.scheduledAt) - toMs(a.scheduledAt);
            if (slotDiff !== 0) return slotDiff;
            return toMs(b.lastModifiedDate || b.createdDate) - toMs(a.lastModifiedDate || a.createdDate);
          })
          .forEach((iv) => {
            if (!iv.applicationId || latestByApplicationMap.has(iv.applicationId)) return;
            latestByApplicationMap.set(iv.applicationId, iv);
          });

        const latestByApplication = Array.from(latestByApplicationMap.values());
        const roomParticipants = roomParticipantsByCode[roomCode] ?? [];
        const joinedApplicationIds = new Set(
          roomParticipants.filter((participant) => participant.joinedAt && participant.applicationId).map((participant) => participant.applicationId as string)
        );
        const first = sorted[0];
        const latestEnd = [...sorted].sort((a, b) => new Date(b.endAt).getTime() - new Date(a.endAt).getTime())[0];

        const resolvedStatus = [...latestByApplication]
          .filter((iv) => iv.interviewStatus !== "CANCELLED" && iv.interviewStatus !== "NO_SHOW")
          .sort((a, b) => STATUS_PRIORITY[a.interviewStatus] - STATUS_PRIORITY[b.interviewStatus])[0]
          ?.interviewStatus
          ?? [...latestByApplication]
          .sort((a, b) => STATUS_PRIORITY[a.interviewStatus] - STATUS_PRIORITY[b.interviewStatus])[0]
          ?.interviewStatus;

        const activeCandidateInterviews = latestByApplication
          .filter((iv) => iv.interviewStatus !== "CANCELLED" && iv.interviewStatus !== "NO_SHOW")
          .sort((a, b) => toMs(a.scheduledAt) - toMs(b.scheduledAt));

        const cancelledCandidateInterviews = latestByApplication
          .filter((iv) => iv.interviewStatus === "CANCELLED" || iv.interviewStatus === "NO_SHOW")
          .sort((a, b) => toMs(b.scheduledAt) - toMs(a.scheduledAt));

        const cancelledCount = cancelledCandidateInterviews.length;
        const totalCandidates = latestByApplication.length;

        const feedbackCandidates = latestByApplication
          .filter(
            (iv) =>
              iv.interviewStatus === "COMPLETED" &&
              joinedApplicationIds.has(iv.applicationId) &&
              (!Array.isArray(iv.feedback) || iv.feedback.length === 0)
          )
          .map((iv) => ({
            interviewId: iv.id,
            candidateName: iv.candidateName,
          }));

        const canJoinRoom = activeCandidateInterviews.length > 0 && ["SCHEDULED", "CONFIRMED", "IN_PROGRESS"].includes(resolvedStatus);
        const now = Date.now();
        const canJoinRoomByTime = activeCandidateInterviews.some((iv) => {
          if (!["SCHEDULED", "CONFIRMED", "PENDING_RESCHEDULE", "IN_PROGRESS"].includes(iv.interviewStatus)) {
            return false;
          }
          const endTime = new Date(iv.endAt).getTime();
          return Number.isFinite(endTime) && endTime >= now;
        });

        return {
          roomCode,
          jobTitle: first.jobTitle,
          status: resolvedStatus,
          scheduledAt: first.scheduledAt,
          endAt: latestEnd.endAt,
          interviews: activeCandidateInterviews,
          cancelledInterviews: cancelledCandidateInterviews,
          totalCandidates,
          cancelledCount,
          canJoinRoom: canJoinRoom && canJoinRoomByTime,
          feedbackCandidates,
        };
      })
      .sort((a, b) => new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime());
  }, [interviews, roomParticipantsByCode]);

  const groupedOnlineRoomCodes = useMemo(() => {
    return Array.from(
      new Set(
        interviews
          .filter((interview) => interview.type === "ONLINE" && Boolean(interview.meetingLink))
          .map((interview) => interview.meetingLink as string)
      )
    );
  }, [interviews]);

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

  const standaloneInterviews = useMemo(
    () => interviews.filter((iv) => !(iv.type === "ONLINE" && !!iv.meetingLink)),
    [interviews]
  );

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
                            <p className="mt-1 text-xs font-mono text-gray-500 dark:text-gray-400">Room: {room.roomCode}</p>
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
                                {room.cancelledCount} ứng viên đã hủy/không tham gia - {expandedCancelledByRoom[room.roomCode] ? "Ẩn" : "Xem chi tiết"}
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
                          {room.canJoinRoom && (
                            <Button
                              type="button"
                              size="sm"
                              className="h-8 bg-blue-600 hover:bg-blue-700"
                              onClick={() => navigate(`/interview/room/${room.roomCode}`)}
                            >
                              <ExternalLink className="mr-1 h-3.5 w-3.5" />
                              Vào phòng
                            </Button>
                          )}

                          {room.feedbackCandidates.length > 0 && (
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              className="h-8"
                              onClick={async () => {
                                const firstCandidate = room.feedbackCandidates[0];
                                if (!firstCandidate) return;

                                setFeedbackInterview({
                                  interviewId: firstCandidate.interviewId,
                                  candidateName: firstCandidate.candidateName,
                                  candidateOptions: room.feedbackCandidates,
                                });
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
            await fetchInterviews({ status: statusFilter || undefined });
          }}
        />
      )}
    </>
  );
}
