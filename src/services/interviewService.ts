import api from "@/config/axiosConfig";
import type {
  CreateInterviewRequest,
  RescheduleInterviewRequest,
  InterviewFeedbackRequest,
} from "@/types/interview";

const BASE = "/interviews";

const fetchInterviews = async (params?: {
  page?: number;
  size?: number;
  status?: string;
  signal?: AbortSignal;
}) => {
  const response = await api.get(BASE, {
    params: { page: params?.page, size: params?.size, status: params?.status },
    signal: params?.signal,
  });
  return response.data;
};

const fetchInterviewById = async (id: string) => {
  const response = await api.get(`${BASE}/${id}`);
  return response.data;
};

const fetchCalendarEvents = async (year?: number, month?: number, signal?: AbortSignal) => {
  const response = await api.get(`${BASE}/calendar`, {
    params: { year, month },
    signal,
  });
  return response.data;
};

const createInterview = async (data: CreateInterviewRequest) => {
  const response = await api.post(BASE, data);
  return response.data;
};

const cancelInterview = async (id: string, reason?: string) => {
  const response = await api.post(`${BASE}/${id}/cancel`, { reason });
  return response.data;
};

const rescheduleInterview = async (id: string, data: RescheduleInterviewRequest) => {
  const response = await api.post(`${BASE}/${id}/reschedule`, data);
  return response.data;
};

const completeInterview = async (id: string) => {
  const response = await api.post(`${BASE}/${id}/complete`);
  return response.data;
};

const addFeedback = async (interviewId: string, data: InterviewFeedbackRequest) => {
  const response = await api.post(`${BASE}/${interviewId}/feedback`, data);
  return response.data;
};

const getFeedback = async (interviewId: string) => {
  const response = await api.get(`${BASE}/${interviewId}/feedback`);
  return response.data;
};

const fetchInterviewsByApplication = async (applicationId: string) => {
  const response = await api.get(`${BASE}/application/${applicationId}`);
  return response.data;
};

const fetchUnscheduledByJob = async (jobId: string) => {
  const response = await api.get(`${BASE}/job/${jobId}/unscheduled`);
  return response.data;
};

const fetchProposals = async (interviewId: string) => {
  const response = await api.get(`${BASE}/${interviewId}/proposals`);
  return response.data;
};

const acceptProposal = async (interviewId: string, proposalId: string) => {
  const response = await api.post(`${BASE}/${interviewId}/proposals/${proposalId}/accept`);
  return response.data;
};

const rejectProposal = async (interviewId: string, proposalId: string) => {
  const response = await api.post(`${BASE}/${interviewId}/proposals/${proposalId}/reject`);
  return response.data;
};

const fetchByRoomCode = async (roomCode: string) => {
  const response = await api.get(`${BASE}/room/${roomCode}`);
  return response.data;
};

const fetchAllByRoomCode = async (roomCode: string) => {
  const response = await api.get(`${BASE}/room/${roomCode}/all`);
  return response.data;
};

// ── Room lifecycle API ──────────────────────────────────────

const fetchRoom = async (roomCode: string) => {
  const response = await api.get(`/rooms/${roomCode}`);
  return response.data;
};

const openRoom = async (roomCode: string) => {
  const response = await api.post(`/rooms/${roomCode}/open`);
  return response.data;
};

const closeRoom = async (roomCode: string) => {
  const response = await api.post(`/rooms/${roomCode}/close`);
  return response.data;
};

const fetchRoomParticipants = async (roomCode: string) => {
  const response = await api.get(`/rooms/${roomCode}/participants`);
  return response.data;
};

const admitParticipant = async (roomCode: string, candidateId: string) => {
  const response = await api.post(`/rooms/${roomCode}/participants/${candidateId}/admit`);
  return response.data;
};

const removeParticipant = async (roomCode: string, candidateId: string) => {
  const response = await api.post(`/rooms/${roomCode}/participants/${candidateId}/remove`);
  return response.data;
};

const completeParticipant = async (roomCode: string, candidateId: string) => {
  const response = await api.post(`/rooms/${roomCode}/participants/${candidateId}/complete`);
  return response.data;
};

// ── Interview start & recordings ────────────────────────────

const startInterview = async (interviewId: string) => {
  const response = await api.post(`${BASE}/${interviewId}/start`);
  return response.data;
};

const saveRecording = async (interviewId: string, data: {
  fileKey: string;
  fileSize?: number;
  durationSeconds?: number;
  mimeType?: string;
  participantId?: string;
}) => {
  const response = await api.post(`${BASE}/${interviewId}/recordings`, data);
  return response.data;
};

const fetchRecordings = async (interviewId: string) => {
  const response = await api.get(`${BASE}/${interviewId}/recordings`);
  return response.data;
};

const uploadInterviewRecording = async (params: {
  file: Blob;
  ownerType: "company" | "candidate";
  ownerId: string;
  fileName?: string;
}) => {
  const formData = new FormData();
  const fileName = params.fileName || `interview-recording-${Date.now()}.webm`;
  formData.append("file", params.file, fileName);
  formData.append("ownerType", params.ownerType);
  formData.append("idd", params.ownerId);
  formData.append("fileType", "VIDEO");

  const response = await api.post("/media/video", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data;
};

export const interviewService = {
  fetchInterviews,
  fetchInterviewById,
  fetchCalendarEvents,
  createInterview,
  cancelInterview,
  rescheduleInterview,
  completeInterview,
  addFeedback,
  getFeedback,
  fetchInterviewsByApplication,
  fetchUnscheduledByJob,
  fetchProposals,
  acceptProposal,
  rejectProposal,
  fetchByRoomCode,
  fetchAllByRoomCode,
  uploadInterviewRecording,
  fetchRoom,
  openRoom,
  closeRoom,
  fetchRoomParticipants,
  admitParticipant,
  removeParticipant,
  completeParticipant,
  startInterview,
  saveRecording,
  fetchRecordings,
};

export default interviewService;
