import type { Interview, InterviewStatus } from "@/types/interview";

export interface RoomParticipantLike {
  applicationId?: string | null;
  candidateId?: string | null;
  admitStatus?: string | null;
  joinedAt?: string | null;
}

const COMPLETE_ALLOWED_STATUSES = new Set<InterviewStatus>([
  "CONFIRMED",
  "IN_PROGRESS",
]);

export const canCompleteByStatus = (status?: InterviewStatus | string | null) =>
  COMPLETE_ALLOWED_STATUSES.has(status as InterviewStatus);

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
    return "Chỉ có thể hoàn thành phỏng vấn đã xác nhận hoặc đang diễn ra.";
  }

  if (interview.type === "ONLINE" && !hasCandidateJoinedRoom(interview, participants)) {
    return "Chỉ có thể hoàn thành sau khi ứng viên đã được duyệt và vào phòng phỏng vấn.";
  }

  return "";
};

export const canCompleteInterview = (
  interview: Pick<Interview, "type" | "interviewStatus" | "applicationId" | "candidateId">,
  participants: RoomParticipantLike[] = []
) => !getInterviewCompletionBlockReason(interview, participants);
