import api from "@/config/axiosConfig";

/**
 * applicationService
 * ------------------
 * Minimal wrapper around the backend /applications endpoint used by the
 * HR Kanban. We keep this small and focused: it exposes a single method
 * `fetchApplicationsByJob` that returns the raw response payload from the
 * backend. The Kanban page is responsible for mapping the returned
 * application objects into the local `Candidate` shape.
 *
 * Reasons for separation:
 * - Keeps API surface explicit and testable.
 * - Mapping/normalization logic lives in the UI layer where type
 *   expectations are known.
 */

const fetchApplicationsByJob = async (jobId: string, signal?: AbortSignal) => {
  if (!jobId) {
    throw new Error("fetchApplicationsByJob: jobId is required");
  }

  // Perform the GET request. We intentionally return the full backend
  // envelope (response.data) so callers can inspect `status`, `message`
  // and the nested `data` array. Returning the envelope keeps the
  // service predictable and lets the UI layer decide how to map/normalize
  // the inner `data` as needed.
  const response = await api.get("/applications", {
    params: { jobId },
    signal,
  });

  return response.data as { status: string; message?: string; data?: unknown[] };
};

// Update application stage on backend
const updateApplicationStage = async (
  applicationId: string,
  body: { stage: string; note: string }
) => {
  if (!applicationId) throw new Error("updateApplicationStage: applicationId is required");
  // PUT /applications/{id}/stage
  // Return the full axios response so callers can inspect HTTP status
  // in addition to the envelope in response.data.
  const response = await api.put(`/applications/${applicationId}/stage`, body);
  return response;
};

export const applicationService = {
  fetchApplicationsByJob,
  updateApplicationStage,
};

export default applicationService;
