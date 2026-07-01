import type { Interview, InterviewStatus } from "@/types/interview";

export interface RoomParticipantLike {
  applicationId?: string | null;
  candidateId?: string | null;
  admitStatus?: string | null;
  joinedAt?: string | null;
}

const COMPLETE_ALLOWED_STATUSES = new Set<InterviewStatus>([
  "SCHEDULED",
  "CONFIRMED",
  "IN_PROGRESS",
]);

export const canCompleteByStatus = (status?: InterviewStatus | string | null) =>
  COMPLETE_ALLOWED_STATUSES.has(status as InterviewStatus);

const FEEDBACK_ALLOWED_STATUSES = new Set<InterviewStatus>([
  "COMPLETED",
]);

export const hasInterviewStarted = (
  interview: Pick<Interview, "scheduledAt">
) => {
  const scheduledAtMs = new Date(interview.scheduledAt).getTime();
  return Number.isFinite(scheduledAtMs) && Date.now() >= scheduledAtMs;
};

export const hasCandidateJoinedRoom = (
  interview: Pick<Interview, "applicationId" | "candidateId">,
  participants: RoomParticipantLike[] = []
) =>
  participants.some((participant) => {
    if (!participant?.joinedAt) return false;
    if (interview.applicationId && participant.applicationId === interview.applicationId) return true;
    if (interview.candidateId && participant.candidateId === interview.candidateId) return true;
    return false;
  });

export const getInterviewCompletionBlockReason = (
  interview: Pick<Interview, "type" | "interviewStatus" | "applicationId" | "candidateId">,
  participants: RoomParticipantLike[] = []
) => {
  if (interview.interviewStatus === "COMPLETED") {
    return "Phỏng vấn này đã được hoàn thành.";
  }

  if (!canCompleteByStatus(interview.interviewStatus)) {
    return "Chỉ có thể hoàn thành phỏng vấn ở trạng thái đã lên lịch, đã xác nhận, hoặc đang diễn ra.";
  }

  if (interview.type === "ONLINE" && !hasCandidateJoinedRoom(interview, participants)) {
    return "Chỉ có thể hoàn thành sau khi ứng viên đã thực sự vào phòng phỏng vấn online.";
  }

  return "";
};

export const canCompleteInterview = (
  interview: Pick<Interview, "type" | "interviewStatus" | "applicationId" | "candidateId">,
  participants: RoomParticipantLike[] = []
) => !getInterviewCompletionBlockReason(interview, participants);

export const canAddInterviewFeedback = (
  interview: Pick<Interview, "type" | "interviewStatus" | "applicationId" | "candidateId">,
  participants: RoomParticipantLike[] = []
) =>
  FEEDBACK_ALLOWED_STATUSES.has(interview.interviewStatus as InterviewStatus) &&
  (interview.type === "ONLINE"
    ? hasCandidateJoinedRoom(interview, participants)
    : true);
