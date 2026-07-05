import type { Interview, InterviewStatus, InterviewType } from "@/types/interview";

const ROOM_ACCESSIBLE_STATUSES: InterviewStatus[] = ["SCHEDULED", "CONFIRMED", "IN_PROGRESS"];

type InterviewRoomAccessSource = {
  type?: InterviewType | string | null;
  meetingLink?: string | null;
  interviewStatus?: InterviewStatus | string | null;
  endAt?: unknown;
};

const toEndTimeMs = (value?: unknown) => {
  if (!value) return Number.NaN;
  const parsed = Array.isArray(value)
    ? Number.NaN
    : typeof value === "number"
      ? value
      : value instanceof Date
        ? value.getTime()
        : typeof value === "string"
          ? new Date(value).getTime()
          : Number.NaN;
  return Number.isFinite(parsed) ? parsed : Number.NaN;
};

export const buildInterviewRoomPath = (meetingLink?: string | null) =>
  meetingLink ? `/interview/room/${meetingLink}` : "";

export const getInterviewRoomCode = (meetingLink?: string | null) => {
  if (!meetingLink) return "";
  return meetingLink.replace(/^\/?interview\/room\//, "").trim();
};

export const buildInterviewRoomUrl = (meetingLink?: string | null) => {
  const path = buildInterviewRoomPath(getInterviewRoomCode(meetingLink));
  if (!path || typeof window === "undefined") return "";
  return `${window.location.origin}${path}`;
};

export const hasInterviewRoomLink = (source?: InterviewRoomAccessSource | null) =>
  source?.type === "ONLINE" && Boolean(source.meetingLink);

export const canAccessInterviewRoom = (source?: InterviewRoomAccessSource | null) => {
  if (!hasInterviewRoomLink(source)) return false;
  if (!source?.interviewStatus || !ROOM_ACCESSIBLE_STATUSES.includes(source.interviewStatus as InterviewStatus)) {
    return false;
  }

  const endTime = toEndTimeMs(source.endAt);
  return !Number.isFinite(endTime) || endTime >= Date.now();
};

export const isInterviewRoomExpired = (source?: InterviewRoomAccessSource | null) => {
  if (!hasInterviewRoomLink(source)) return false;
  const endTime = toEndTimeMs(source?.endAt);
  return Number.isFinite(endTime) && endTime < Date.now();
};

export const getInterviewRoomAccessLabel = (source?: InterviewRoomAccessSource | null) => {
  if (isInterviewRoomExpired(source)) return "Đã quá giờ phỏng vấn";
  if (source?.interviewStatus === "IN_PROGRESS") return "Tham gia lại";
  return "Vào phòng phỏng vấn";
};

export const canAccessInterviewRoomFromInterview = (interview?: Interview | null) =>
  canAccessInterviewRoom({
    type: interview?.type,
    meetingLink: interview?.meetingLink,
    interviewStatus: interview?.interviewStatus,
    endAt: interview?.endAt,
  });
