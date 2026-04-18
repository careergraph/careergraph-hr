import { useEffect, useState } from "react";
import dashboardApi from "@/features/dashboard/api/dashboardApi";
import type {
  DashboardDateRange,
  DashboardSummaryDto,
} from "@/features/dashboard/types/dashboard.types";

interface UseDashboardDataResult {
  data: DashboardSummaryDto | null;
  loading: boolean;
  error: string | null;
}

export function useDashboardData(dateRange: DashboardDateRange): UseDashboardDataResult {
  const [data, setData] = useState<DashboardSummaryDto | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (dateRange.from && dateRange.to && dateRange.from > dateRange.to) {
      setLoading(false);
      setData(null);
      setError("Ngày bắt đầu không được lớn hơn ngày kết thúc.");
      return;
    }

    let isCancelled = false;

    setLoading(true);
    setError(null);

    dashboardApi
      .getSummary(dateRange.from, dateRange.to)
      .then((response) => {
        if (isCancelled) return;
        setData(response);
      })
      .catch((err: unknown) => {
        if (isCancelled) return;
        const message =
          err instanceof Error ? err.message : "Không thể tải dữ liệu dashboard.";
        setError(message);
        setData(null);
      })
      .finally(() => {
        if (isCancelled) return;
        setLoading(false);
      });

    return () => {
      isCancelled = true;
    };
  }, [dateRange.from, dateRange.to]);

  return {
    data,
    loading,
    error,
  };
}

export default useDashboardData;
