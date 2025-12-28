import api from "@/config/axiosConfig";
import { toast } from "sonner";
import type {
  CandidateResumeResponse,
  CandidateMessagesResponse,
  CandidateEmailsResponse,
  CandidateOverview,
  OverviewExperience,
} from "@/types/candidateTab";



// Minimal candidate service to fetch tab-specific data from backend
const fetchOverview = async (
  candidateId: string,
  signal?: AbortSignal
): Promise<CandidateOverview | null> => {
  if (!candidateId) throw new Error("fetchOverview: candidateId is required");
  const resp = await api.get(`/candidates/${candidateId}/overview`, { signal });
  // If backend returns non-200, show a soft warning and return null so UI falls back to local data.
  if (resp.status !== 200) {
    toast.warning("Tính năng đang trong quá trình phát triển");
    return null;
  }
  return resp.data.data as CandidateOverview;
};

const fetchExperience = async (
  candidateId: string,
  signal?: AbortSignal
): Promise<OverviewExperience | null> => {
  if (!candidateId) throw new Error("fetchExperience: candidateId is required");
  const resp = await api.get(`/candidates/${candidateId}/experience`, { signal });
  if (resp.status !== 200) {
    toast.warning("Tính năng đang trong quá trình phát triển");
    return null;
  }
  return resp.data.data as OverviewExperience;
};

const fetchResume = async (
  candidateId: string,
  applicationId: string,
  signal?: AbortSignal
): Promise<CandidateResumeResponse | null> => {
  if (!candidateId) throw new Error("fetchResume: candidateId is required");
  const resp = await api.get(`/candidates/${candidateId}/application/${applicationId}/resume`, { signal });
  if (resp.status !== 200) {
    toast.warning("Tính năng đang trong quá trình phát triển");
    return null;
  }
  const data = resp.data.data;
  return {
    id: data.applicationId,
    resumeUrl: data.url,
  } as CandidateResumeResponse;
};

const fetchMessages = async (
  candidateId: string,
  signal?: AbortSignal
): Promise<CandidateMessagesResponse | null> => {
  if (!candidateId) throw new Error("fetchMessages: candidateId is required");
  const resp = await api.get(`/candidate/${candidateId}/message`, { signal });
  if (resp.status !== 200) {
    toast.warning("Tính năng đang trong quá trình phát triển");
    return null;
  }
  return resp.data as CandidateMessagesResponse;
};

const fetchEmails = async (
  candidateId: string,
  signal?: AbortSignal
): Promise<CandidateEmailsResponse | null> => {
  if (!candidateId) throw new Error("fetchEmails: candidateId is required");
  const resp = await api.get(`/candidate/${candidateId}/email`, { signal });
  if (resp.status !== 200) {
    toast.warning("Tính năng đang trong quá trình phát triển");
    return null;
  }
  return resp.data as CandidateEmailsResponse;
};

export const candidateService = {
  fetchOverview,
  fetchExperience,
  fetchResume,
  fetchMessages,
  fetchEmails,
};

export default candidateService;
