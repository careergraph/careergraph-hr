import { create } from "zustand";
import type { Interview } from "@/types/interview";
import interviewService from "@/services/interviewService";
import type {
  CreateInterviewRequest,
  RescheduleInterviewRequest,
  InterviewFeedbackRequest,
} from "@/types/interview";

interface InterviewState {
  interviews: Interview[];
  calendarEvents: Interview[];
  selectedInterview: Interview | null;
  isLoading: boolean;
  error: string | null;

  fetchInterviews: (params?: { page?: number; size?: number; status?: string; jobId?: string; jobIds?: string[]; date?: string }) => Promise<void>;
  fetchCalendarEvents: (year?: number, month?: number) => Promise<void>;
  fetchInterviewById: (id: string) => Promise<void>;
  createInterview: (data: CreateInterviewRequest) => Promise<Interview>;
  cancelInterview: (id: string, reason?: string) => Promise<void>;
  rescheduleInterview: (id: string, data: RescheduleInterviewRequest) => Promise<Interview>;
  completeInterview: (id: string) => Promise<void>;
  addFeedback: (interviewId: string, data: InterviewFeedbackRequest) => Promise<void>;
  setSelectedInterview: (interview: Interview | null) => void;
  clearError: () => void;
}

export const useInterviewStore = create<InterviewState>()((set) => ({
  interviews: [],
  calendarEvents: [],
  selectedInterview: null,
  isLoading: false,
  error: null,

  fetchInterviews: async (params) => {
    set({ isLoading: true, error: null });
    try {
      const result = await interviewService.fetchInterviews(params);
      const data = result?.data;
      set({
        interviews: data?.content ?? data ?? [],
        isLoading: false,
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to fetch interviews";
      set({ error: message, isLoading: false });
    }
  },

  fetchCalendarEvents: async (year, month) => {
    set({ isLoading: true, error: null });
    try {
      const result = await interviewService.fetchCalendarEvents(year, month);
      set({ calendarEvents: result?.data ?? [], isLoading: false });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to fetch calendar events";
      set({ error: message, isLoading: false });
    }
  },

  fetchInterviewById: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const result = await interviewService.fetchInterviewById(id);
      set({ selectedInterview: result?.data ?? null, isLoading: false });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to fetch interview";
      set({ error: message, isLoading: false });
    }
  },

  createInterview: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const result = await interviewService.createInterview(data);
      const newInterview = result?.data;
      set((state) => ({
        interviews: [newInterview, ...state.interviews],
        calendarEvents: [...state.calendarEvents, newInterview],
        isLoading: false,
      }));
      return newInterview;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to create interview";
      set({ error: message, isLoading: false });
      throw err;
    }
  },

  cancelInterview: async (id, reason) => {
    set({ isLoading: true, error: null });
    try {
      await interviewService.cancelInterview(id, reason);
      set((state) => ({
        interviews: state.interviews.map((i) =>
          i.id === id ? { ...i, interviewStatus: "CANCELLED" as const, cancellationReason: reason } : i
        ),
        calendarEvents: state.calendarEvents.map((i) =>
          i.id === id ? { ...i, interviewStatus: "CANCELLED" as const } : i
        ),
        isLoading: false,
      }));
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to cancel interview";
      set({ error: message, isLoading: false });
      throw err;
    }
  },

  rescheduleInterview: async (id, data) => {
    set({ isLoading: true, error: null });
    try {
      const result = await interviewService.rescheduleInterview(id, data);
      const newInterview = result?.data;
      set((state) => ({
        interviews: [
          newInterview,
          ...state.interviews.map((i) =>
            i.id === id ? { ...i, interviewStatus: "CANCELLED" as const } : i
          ),
        ],
        isLoading: false,
      }));
      return newInterview;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to reschedule interview";
      set({ error: message, isLoading: false });
      throw err;
    }
  },

  completeInterview: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await interviewService.completeInterview(id);
      set((state) => ({
        interviews: state.interviews.map((i) =>
          i.id === id ? { ...i, interviewStatus: "COMPLETED" as const } : i
        ),
        isLoading: false,
      }));
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to complete interview";
      set({ error: message, isLoading: false });
      throw err;
    }
  },

  addFeedback: async (interviewId, data) => {
    set({ isLoading: true, error: null });
    try {
      await interviewService.addFeedback(interviewId, data);
      set({ isLoading: false });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to add feedback";
      set({ error: message, isLoading: false });
      throw err;
    }
  },

  setSelectedInterview: (interview) => set({ selectedInterview: interview }),
  clearError: () => set({ error: null }),
}));
