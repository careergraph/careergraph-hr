import api from "@/config/axiosConfig";
import type {
  DashboardSummaryDto,
  RestEnvelope,
} from "@/features/dashboard/types/dashboard.types";

const unwrapEnvelope = <T>(payload: unknown): T => {
  if (
    payload &&
    typeof payload === "object" &&
    "data" in (payload as Record<string, unknown>)
  ) {
    return (payload as { data: T }).data;
  }

  return payload as T;
};

const getSummary = async (
  from?: string,
  to?: string
): Promise<DashboardSummaryDto> => {
  const response = await api.get<RestEnvelope<DashboardSummaryDto>>(
    "/analytics/dashboard-summary",
    { 
      params: {
        ...(from ? { from } : {}),
        ...(to ? { to } : {}),
      },
    }
  );

  return unwrapEnvelope<DashboardSummaryDto>(response.data);
};

export const dashboardApi = {
  getSummary,
};

export default dashboardApi;
