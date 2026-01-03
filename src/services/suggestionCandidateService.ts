import api from "@/config/axiosConfig";
import { toast } from "sonner";
import type {
  CandidateSuggestionResponse,
  CandidateFilterRequest,
  PageResponse,
  CandidateOverviewResponse,
  CandidateExperienceOverviewResponse,
} from "@/types/suggestionCandidate";

/**
 * API response wrapper type
 */
interface ApiResponse<T> {
  status: string;
  message?: string;
  data: T;
}

/**
 * Search candidates with hybrid search (fuzzy + embedding)
 * 
 * @param keyword Search keyword (optional) - matches desiredPosition, currentJobTitle, skills
 * @param filter Additional filters
 * @param page Page number (0-indexed)
 * @param size Page size
 * @param signal AbortSignal for cancellation
 * @returns Page of CandidateSuggestionResponse
 */
const searchCandidates = async (
  keyword?: string,
  filter?: CandidateFilterRequest,
  page: number = 0,
  size: number = 10,
  signal?: AbortSignal
): Promise<PageResponse<CandidateSuggestionResponse> | null> => {
  try {
    const params = new URLSearchParams();
    params.append("page", page.toString());
    params.append("size", size.toString());
    if (keyword) {
      params.append("keyword", keyword);
    }

    const resp = await api.post<ApiResponse<PageResponse<CandidateSuggestionResponse>>>(
      `/candidates/suggestion/search?${params.toString()}`,
      filter || {},
      { signal }
    );

    if (resp.status !== 200) {
      toast.error("Không thể tìm kiếm ứng viên");
      return null;
    }

    return resp.data.data;
  } catch (error: unknown) {
    // Ignore abort errors
    const e = error as { name?: string; message?: string };
    if (e?.name === "CanceledError" || e?.name === "AbortError") {
      return null;
    }
    
    console.error("Error searching candidates:", error);
    toast.error("Có lỗi xảy ra khi tìm kiếm ứng viên");
    return null;
  }
};

/**
 * Get candidate detail by ID
 * 
 * @param candidateId Candidate ID
 * @param signal AbortSignal for cancellation
 * @returns CandidateSuggestionResponse
 */
const getCandidateDetail = async (
  candidateId: string,
  signal?: AbortSignal
): Promise<CandidateSuggestionResponse | null> => {
  if (!candidateId) {
    throw new Error("getCandidateDetail: candidateId is required");
  }

  try {
    const resp = await api.get<ApiResponse<CandidateSuggestionResponse>>(
      `/candidates/suggestion/${candidateId}`,
      { signal }
    );

    if (resp.status !== 200) {
      toast.warning("Không thể lấy thông tin ứng viên");
      return null;
    }

    return resp.data.data;
  } catch (error: unknown) {
    const e = error as { name?: string; message?: string };
    if (e?.name === "CanceledError" || e?.name === "AbortError") {
      return null;
    }

    console.error("Error getting candidate detail:", error);
    toast.error("Có lỗi xảy ra khi lấy thông tin ứng viên");
    return null;
  }
};

/**
 * Sync all candidates to Elasticsearch
 * Admin only - triggers reindexing
 * 
 * @returns Number of candidates synced
 */
const syncCandidates = async (): Promise<number | null> => {
  try {
    const resp = await api.post<ApiResponse<number>>(
      "/candidates/suggestion/sync"
    );

    if (resp.status !== 200) {
      toast.error("Không thể đồng bộ ứng viên");
      return null;
    }

    toast.success(`Đã đồng bộ ${resp.data.data} ứng viên`);
    return resp.data.data;
  } catch (error) {
    console.error("Error syncing candidates:", error);
    toast.error("Có lỗi xảy ra khi đồng bộ ứng viên");
    return null;
  }
};

/**
 * Get candidate overview (profile, job criteria, skills, educations)
 * 
 * @param candidateId Candidate ID
 * @param signal AbortSignal for cancellation
 * @returns CandidateOverviewResponse
 */
const getCandidateOverview = async (
  candidateId: string,
  signal?: AbortSignal
): Promise<CandidateOverviewResponse | null> => {
  if (!candidateId) return null;

  try {
    const resp = await api.get<ApiResponse<CandidateOverviewResponse>>(
      `/candidates/${candidateId}/overview`,
      { signal }
    );

    if (resp.status !== 200) {
      return null;
    }

    return resp.data.data;
  } catch (error: unknown) {
    const e = error as { name?: string };
    if (e?.name === "CanceledError" || e?.name === "AbortError") {
      return null;
    }
    console.error("Error getting candidate overview:", error);
    return null;
  }
};

/**
 * Get candidate experience overview
 * 
 * @param candidateId Candidate ID
 * @param signal AbortSignal for cancellation
 * @returns CandidateExperienceOverviewResponse
 */
const getCandidateExperience = async (
  candidateId: string,
  signal?: AbortSignal
): Promise<CandidateExperienceOverviewResponse | null> => {
  if (!candidateId) return null;

  try {
    const resp = await api.get<ApiResponse<CandidateExperienceOverviewResponse>>(
      `/candidates/${candidateId}/experience`,
      { signal }
    );

    if (resp.status !== 200) {
      return null;
    }

    return resp.data.data;
  } catch (error: unknown) {
    const e = error as { name?: string };
    if (e?.name === "CanceledError" || e?.name === "AbortError") {
      return null;
    }
    console.error("Error getting candidate experience:", error);
    return null;
  }
};

export const suggestionCandidateService = {
  searchCandidates,
  getCandidateDetail,
  syncCandidates,
  getCandidateOverview,
  getCandidateExperience,
};

export default suggestionCandidateService;
