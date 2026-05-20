import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router";
import PageMeta from "@/components/common/PageMeta";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import { useInterviewStore } from "@/stores/interviewStore";
import { interviewService } from "@/services/interviewService";
import type { InterviewRecording, InterviewTimeProposal } from "@/types/interview";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import FeedbackModal from "./FeedbackModal";
import {
  Calendar,
  Clock,
  MapPin,
  Monitor,
  User,
  ArrowLeft,
  MessageSquare,
  CalendarClock,
  Check,
  X,
  Link as LinkIcon,
  Copy,
} from "lucide-react";
import { toast } from "sonner";
import { formatDateYMD, formatTimeHM } from "@/lib/dateUtils";
import {
  canCompleteByStatus,
  canCompleteInterview,
  getInterviewCompletionBlockReason,
  type RoomParticipantLike,
} from "./interviewCompletionRules";
import { getFeedbackRecommendationLabel } from "./feedbackRecommendationOptions";

const STATUS_STYLES: Record<string, string> = {
  SCHEDULED: "bg-blue-100 text-blue-700",
  CONFIRMED: "bg-green-100 text-green-700",
  PENDING_RESCHEDULE: "bg-purple-100 text-purple-700",
  IN_PROGRESS: "bg-yellow-100 text-yellow-700",
  COMPLETED: "bg-gray-100 text-gray-700",
  CANCELLED: "bg-red-100 text-red-600",
  NO_SHOW: "bg-orange-100 text-orange-700",
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

const RECORDING_STATUS_LABELS: Record<string, string> = {
  PENDING: "Đang chờ",
  AVAILABLE: "Sẵn sàng",
  PROCESSING: "Đang xử lý",
  DELETED: "Đã xóa",
};

export default function InterviewDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const {
    selectedInterview,
    isLoading,
    fetchInterviewById,
    cancelInterview,
    completeInterview,
  } = useInterviewStore();

  const [showFeedback, setShowFeedback] = useState(false);
  const [proposals, setProposals] = useState<InterviewTimeProposal[]>([]);
  const [recordings, setRecordings] = useState<InterviewRecording[]>([]);
  const [roomParticipants, setRoomParticipants] = useState<RoomParticipantLike[]>([]);
  const [loadingRoomParticipants, setLoadingRoomParticipants] = useState(false);
  const [processingProposal, setProcessingProposal] = useState<string | null>(null);
  const [actionSubmitting, setActionSubmitting] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  useEffect(() => {
    if (id) fetchInterviewById(id);
  }, [id, fetchInterviewById]);

  // Load proposals when interview is in PENDING_RESCHEDULE
  useEffect(() => {
    if (selectedInterview?.interviewStatus === "PENDING_RESCHEDULE" && selectedInterview?.id) {
      interviewService
        .fetchProposals(selectedInterview.id)
        .then((res) => setProposals(res?.data ?? []))
        .catch(() => setProposals([]));
    } else {
      setProposals([]);
    }
  }, [selectedInterview?.id, selectedInterview?.interviewStatus]);

  useEffect(() => {
    if (!selectedInterview?.id) {
      setRecordings([]);
      return;
    }

    interviewService
      .fetchRecordings(selectedInterview.id)
      .then((res) => {
        const items = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
        setRecordings(items);
      })
      .catch(() => setRecordings([]));
  }, [selectedInterview?.id]);

  useEffect(() => {
    if (selectedInterview?.type !== "ONLINE" || !selectedInterview.meetingLink) {
      setRoomParticipants([]);
      setLoadingRoomParticipants(false);
      return;
    }

    let cancelled = false;
    setLoadingRoomParticipants(true);

    interviewService
      .fetchRoomParticipants(selectedInterview.meetingLink)
      .then((resp) => {
        if (cancelled) return;
        const items = Array.isArray(resp?.data) ? resp.data : Array.isArray(resp) ? resp : [];
        setRoomParticipants(items);
      })
      .catch(() => {
        if (!cancelled) setRoomParticipants([]);
      })
      .finally(() => {
        if (!cancelled) setLoadingRoomParticipants(false);
      });

    return () => {
      cancelled = true;
    };
  }, [selectedInterview?.type, selectedInterview?.meetingLink]);

  if (isLoading || !selectedInterview) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  const iv = selectedInterview;
  const scheduledDate = new Date(iv.scheduledAt);
  const endDate = new Date(iv.endAt);
  const canCancelFromDetail = ["SCHEDULED", "CONFIRMED", "PENDING_RESCHEDULE", "IN_PROGRESS"].includes(iv.interviewStatus);
  const roomLink = iv.meetingLink ? `${window.location.origin}/interview/room/${iv.meetingLink}` : "";
  const isCompleted = iv.interviewStatus === "COMPLETED";
  const hasFeedback = Array.isArray(iv.feedback) && iv.feedback.length > 0;
  const isPastEndTime = Number.isFinite(endDate.getTime()) && Date.now() > endDate.getTime();
  const canOpenRoomFromDetail =
    ["SCHEDULED", "CONFIRMED", "IN_PROGRESS"].includes(iv.interviewStatus) && !isPastEndTime;
  const showRoomActionFromDetail = ["SCHEDULED", "CONFIRMED", "IN_PROGRESS"].includes(iv.interviewStatus);
  const completeBlockReason = getInterviewCompletionBlockReason(iv, roomParticipants);
  const canCompleteFromDetail =
    canCompleteInterview(iv, roomParticipants) &&
    (iv.type !== "ONLINE" || !loadingRoomParticipants);
  const shouldShowCompleteAction = canCompleteByStatus(iv.interviewStatus);

  const handleCancel = async () => {
    if (actionSubmitting) return;

    setActionSubmitting(true);
    try {
      await cancelInterview(iv.id, "Hủy bởi HR");
      toast.success("Đã hủy phỏng vấn");
      if (id) fetchInterviewById(id);
    } catch {
      toast.error("Lỗi khi hủy phỏng vấn");
    } finally {
      setActionSubmitting(false);
      setShowCancelConfirm(false);
    }
  };

  const handleComplete = async () => {
    if (actionSubmitting) return;

    if (!canCompleteFromDetail) {
      toast.warning(completeBlockReason || "Chưa đủ điều kiện hoàn thành phỏng vấn");
      return;
    }

    setActionSubmitting(true);
    try {
      await completeInterview(iv.id);
      toast.success("Đã hoàn thành phỏng vấn");
      if (id) fetchInterviewById(id);
    } catch {
      toast.error("Lỗi khi hoàn thành phỏng vấn");
    } finally {
      setActionSubmitting(false);
    }
  };

  const handleAcceptProposal = async (proposalId: string) => {
    setProcessingProposal(proposalId);
    try {
      const res = await interviewService.acceptProposal(iv.id, proposalId);
      toast.success("Đã chấp nhận đề xuất — lịch mới đã được tạo");
      const newId = res?.data?.id;
      if (newId) navigate(`/interviews/${newId}`);
      else if (id) fetchInterviewById(id);
    } catch {
      toast.error("Lỗi khi chấp nhận đề xuất");
    } finally {
      setProcessingProposal(null);
    }
  };

  const handleRejectProposal = async (proposalId: string) => {
    setProcessingProposal(proposalId);
    try {
      await interviewService.rejectProposal(iv.id, proposalId);
      toast.success("Đã từ chối đề xuất");
      const res = await interviewService.fetchProposals(iv.id);
      setProposals(res?.data ?? []);
      if (id) fetchInterviewById(id);
    } catch {
      toast.error("Lỗi khi từ chối đề xuất");
    } finally {
      setProcessingProposal(null);
    }
  };

  return (
    <>
      <PageMeta title="Chi tiết phỏng vấn | CareerGraph HR" description="Chi tiết phỏng vấn" />
      <PageBreadcrumb pageTitle="Chi tiết phỏng vấn" />

      <div className="space-y-6">
        <Button variant="ghost" onClick={() => navigate("/interviews")} className="gap-1">
          <ArrowLeft className="h-4 w-4" /> Quay lại
        </Button>

        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Phỏng vấn: {iv.candidateName}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">{iv.jobTitle}</p>
          </div>
          <Badge className={STATUS_STYLES[iv.interviewStatus] ?? ""} variant="secondary">
            {STATUS_LABELS[iv.interviewStatus] ?? iv.interviewStatus}
          </Badge>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Info card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Thông tin phỏng vấn</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                <Calendar className="h-4 w-4" />
                {formatDateYMD(scheduledDate)}
              </div>
              <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                <Clock className="h-4 w-4" />
                {formatTimeHM(scheduledDate)}
                {" – "}
                {formatTimeHM(endDate)}
                {" "}({iv.durationMinutes} phút)
              </div>
              <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                {iv.type === "ONLINE" ? (
                  <>
                    <Monitor className="h-4 w-4" /> Online
                    {iv.meetingLink && showRoomActionFromDetail && (
                      <button
                        onClick={() => {
                          if (!canOpenRoomFromDetail) return;
                          navigate(`/interview/room/${iv.meetingLink}`);
                        }}
                        disabled={!canOpenRoomFromDetail}
                        className="ml-2 inline-flex items-center gap-1 font-mono text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 px-2 py-0.5 rounded hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <Monitor className="h-3 w-3" /> Vào phòng
                      </button>
                    )}
                  </>
                ) : (
                  <>
                    <MapPin className="h-4 w-4" /> {iv.location ?? "Offline"}
                  </>
                )}
              </div>
              {roomLink && (
                <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                  <LinkIcon className="h-4 w-4" />
                  <span className="truncate font-mono">{roomLink}</span>
                  <button
                    onClick={async () => {
                      await navigator.clipboard.writeText(roomLink);
                      toast.success("Đã sao chép link phòng");
                    }}
                    className="inline-flex items-center gap-1 rounded-md border border-gray-200 px-2 py-1 text-[11px] text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
                  >
                    <Copy className="h-3 w-3" /> Sao chép
                  </button>
                </div>
              )}
              {iv.notes && (
                <div className="mt-2 rounded-lg bg-gray-50 dark:bg-gray-900 p-3 text-gray-600 dark:text-gray-300 text-xs">
                  {iv.notes}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Participants */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Người tham gia</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                <User className="h-4 w-4" />
                <span className="font-medium">Ứng viên:</span> {iv.candidateName}
              </div>
              {iv.interviewers?.map((p) => (
                <div key={p.id} className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                  <User className="h-4 w-4" />
                  <span className="font-medium">{p.role === "INTERVIEWER" ? "Phỏng vấn viên" : p.role}:</span>{" "}
                  {p.name}
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Feedback section */}
        {iv.feedback && iv.feedback.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <MessageSquare className="h-4 w-4" /> Đánh giá
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {iv.feedback.map((fb) => (
                  <div key={fb.id} className="rounded-lg border p-4 dark:border-gray-700">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
                        {fb.reviewerName}
                      </span>
                      <Badge variant="outline">{getFeedbackRecommendationLabel(fb.recommendation)}</Badge>
                    </div>
                    <div className="flex gap-4 text-xs text-gray-500 mb-2">
                      <span>Tổng: {fb.overallRating}/5</span>
                      {fb.technicalScore && <span>Kỹ thuật: {fb.technicalScore}/10</span>}
                      {fb.communicationScore && <span>Giao tiếp: {fb.communicationScore}/10</span>}
                    </div>
                    {fb.strengths && (
                      <p className="text-xs text-green-600 dark:text-green-400">
                        + {fb.strengths}
                      </p>
                    )}
                    {fb.weaknesses && (
                      <p className="text-xs text-red-500 dark:text-red-400">
                        - {fb.weaknesses}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {recordings.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Bản ghi phòng</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recordings.map((recording) => {
                  const recordingUrl = recording.fileKey || "";
                  const previewable = /\.(mp4|webm|ogg|mov)(\?.*)?$/i.test(recordingUrl) || recording.mimeType?.startsWith("video/");

                  return (
                    <div key={recording.id} className="rounded-lg border border-gray-200 p-3 dark:border-gray-700">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-xs text-gray-500">
                          {recording.createdDate ? `Recorded: ${new Date(recording.createdDate).toLocaleString("vi-VN")}` : "Recorded clip"}
                        </p>
                        {recording.recordingStatus && (
                          <Badge variant="outline">
                            {RECORDING_STATUS_LABELS[recording.recordingStatus] ?? recording.recordingStatus}
                          </Badge>
                        )}
                      </div>
                      {previewable ? (
                        <video
                          className="mx-auto mt-3 w-full max-w-2xl aspect-video rounded-lg border border-gray-200 bg-black object-contain"
                          controls
                          preload="metadata"
                          src={recordingUrl}
                        />
                      ) : (
                        <p className="mt-3 text-xs text-gray-500">Không thể preview trực tiếp. Hãy mở link để xem.</p>
                      )}
                      <a
                        href={recordingUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:underline"
                      >
                        <LinkIcon className="h-3.5 w-3.5" /> Mở link recording
                      </a>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Proposals section */}
        {proposals.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <CalendarClock className="h-4 w-4" /> Đề xuất thời gian từ ứng viên
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {proposals.map((p) => {
                  const isPending = p.proposalStatus === "PENDING";
                  const isProcessing = processingProposal === p.id;
                  return (
                    <div
                      key={p.id}
                      className={`flex items-center justify-between rounded-lg border p-4 dark:border-gray-700 ${
                        p.proposalStatus === "ACCEPTED"
                          ? "border-green-300 bg-green-50 dark:bg-green-900/20"
                          : p.proposalStatus === "REJECTED"
                          ? "border-red-200 bg-red-50/50 dark:bg-red-900/10 opacity-60"
                          : ""
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-sm font-medium text-gray-800 dark:text-gray-100">
                          <Calendar className="h-4 w-4" />
                          {formatDateYMD(p.proposedDate)}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                          <Clock className="h-4 w-4" />
                          {p.proposedStartTime?.slice(0, 5)}
                          {p.proposedDurationMinutes && ` (${p.proposedDurationMinutes} phút)`}
                        </div>
                        {p.notes && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            💬 {p.notes}
                          </p>
                        )}
                        {!isPending && (
                          <Badge
                            className={
                              p.proposalStatus === "ACCEPTED"
                                ? "bg-green-100 text-green-700"
                                : "bg-red-100 text-red-600"
                            }
                            variant="secondary"
                          >
                            {p.proposalStatus === "ACCEPTED" ? "Đã chấp nhận" : "Đã từ chối"}
                          </Badge>
                        )}
                      </div>
                      {isPending && (
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-green-600 border-green-300 hover:bg-green-50"
                            disabled={isProcessing}
                            onClick={() => handleAcceptProposal(p.id)}
                          >
                            <Check className="h-4 w-4 mr-1" /> Chấp nhận
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-red-600 border-red-300 hover:bg-red-50"
                            disabled={isProcessing}
                            onClick={() => handleRejectProposal(p.id)}
                          >
                            <X className="h-4 w-4 mr-1" /> Từ chối
                          </Button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          {iv.type === "ONLINE" && iv.meetingLink && showRoomActionFromDetail && (
            <Button
              className="bg-blue-600 hover:bg-blue-700"
              onClick={() => {
                if (!canOpenRoomFromDetail) return;
                navigate(`/interview/room/${iv.meetingLink}`);
              }}
              disabled={!canOpenRoomFromDetail}
            >
              <Monitor className="h-4 w-4 mr-1" />
              {canOpenRoomFromDetail ? "Tham gia phỏng vấn" : "Đã quá giờ phỏng vấn"}
            </Button>
          )}
          {(canCancelFromDetail || shouldShowCompleteAction) && (
            <>
              {shouldShowCompleteAction && (
                <Button
                  onClick={handleComplete}
                  disabled={actionSubmitting || !canCompleteFromDetail}
                  title={!canCompleteFromDetail ? completeBlockReason : undefined}
                >
                  {actionSubmitting ? "Đang xử lý..." : "Hoàn thành"}
                </Button>
              )}
              {canCancelFromDetail && (
                <Button
                  variant="destructive"
                  disabled={actionSubmitting}
                  onClick={() => setShowCancelConfirm(true)}
                >
                  Hủy phỏng vấn
                </Button>
              )}
            </>
          )}
          {isCompleted && !hasFeedback && (
            <Button onClick={() => setShowFeedback(true)}>
              <MessageSquare className="h-4 w-4 mr-1" /> Thêm đánh giá
            </Button>
          )}
        </div>
      </div>

      {showFeedback && (
        <FeedbackModal
          open={showFeedback}
          onClose={() => {
            setShowFeedback(false);
            if (id) fetchInterviewById(id);
          }}
          interviewId={iv.id}
          candidateName={iv.candidateName}
        />
      )}

      {showCancelConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-md rounded-xl border border-gray-200 bg-white p-5 shadow-xl dark:border-gray-700 dark:bg-gray-900">
            <h3 className="text-base font-semibold text-gray-900 dark:text-white">
              Xác nhận hủy phỏng vấn
            </h3>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
              Hành động này sẽ hủy lịch phỏng vấn của {iv.candidateName}. Bạn có chắc chắn muốn tiếp tục?
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <Button
                variant="outline"
                disabled={actionSubmitting}
                onClick={() => setShowCancelConfirm(false)}
              >
                Giữ lịch
              </Button>
              <Button
                variant="destructive"
                disabled={actionSubmitting}
                onClick={handleCancel}
              >
                {actionSubmitting ? "Đang hủy..." : "Xác nhận hủy"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
