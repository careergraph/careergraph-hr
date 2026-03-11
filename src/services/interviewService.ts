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
};

export default interviewService;
