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
        const sorted = [...list].sort(
          (a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime()
        );
        const first = sorted[0];
        const latestEnd = [...sorted].sort(
          (a, b) => new Date(b.endAt).getTime() - new Date(a.endAt).getTime()
        )[0];

        const resolvedStatus = [...sorted]
          .filter((iv) => iv.interviewStatus !== "CANCELLED" && iv.interviewStatus !== "NO_SHOW")
          .sort((a, b) => STATUS_PRIORITY[a.interviewStatus] - STATUS_PRIORITY[b.interviewStatus])[0]
          ?.interviewStatus
          ?? [...sorted]
          .sort((a, b) => STATUS_PRIORITY[a.interviewStatus] - STATUS_PRIORITY[b.interviewStatus])[0]
          ?.interviewStatus;

        const roomActiveInterviews = sorted.filter(
          (iv) => iv.interviewStatus !== "CANCELLED" && iv.interviewStatus !== "NO_SHOW"
        );
        const cancelledCount = sorted.length - roomActiveInterviews.length;

        const feedbackEligible = sorted.filter(
          (iv) => iv.interviewStatus !== "CANCELLED" && iv.interviewStatus !== "NO_SHOW"
        );
        const completedCandidates = feedbackEligible.filter((iv) => iv.interviewStatus === "COMPLETED");
        const feedbackCandidates = (completedCandidates.length > 0 ? completedCandidates : feedbackEligible).map((iv) => ({
          interviewId: iv.id,
          candidateName: iv.candidateName,
        }));

        const canJoinRoom = roomActiveInterviews.length > 0 && ["SCHEDULED", "CONFIRMED", "IN_PROGRESS"].includes(resolvedStatus);

        return {
          roomCode,
          jobTitle: first.jobTitle,
          status: resolvedStatus,
          scheduledAt: first.scheduledAt,
          endAt: latestEnd.endAt,
          interviews: roomActiveInterviews,
          totalInterviews: sorted.length,
          cancelledCount,
          canJoinRoom,
          feedbackCandidates,
        };
      })
      .sort((a, b) => new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime());
  }, [interviews]);

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
            <TabsList>
              {STATUS_TABS.map((tab) => (
                <TabsTrigger key={tab.value} value={tab.value}>
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>
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

                <div className="grid gap-3 md:grid-cols-2">
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
                            {startDate.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" })}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5" />
                            {startDate.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}
                            {" - "}
                            {endDate.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}
                          </span>
                          <span className="flex items-center gap-1">
                            <Users className="h-3.5 w-3.5" />
                            {room.totalInterviews} ứng viên
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
                            <p className="px-2 pt-1 text-[11px] text-red-500 dark:text-red-400">
                              {room.cancelledCount} lịch đã hủy/không tham gia
                            </p>
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
                              onClick={() => {
                                setFeedbackInterview({
                                  interviewId: room.feedbackCandidates[0].interviewId,
                                  candidateName: room.feedbackCandidates[0].candidateName,
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

                <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
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
        />
      )}
    </>
  );
}
