import { useEffect, useState } from "react";
import { AxiosError } from "axios";
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

const getDashboardErrorMessage = (err: unknown): string => {
  if (err instanceof AxiosError) {
    if (!err.response) {
      return "Không thể kết nối đến máy chủ. Vui lòng kiểm tra mạng hoặc thử lại sau.";
    }

    const status = err.response.status;
    const responseData = err.response.data as
      | { message?: string; error?: string }
      | undefined;
    const backendMessage =
      responseData?.message?.trim() || responseData?.error?.trim();

    if (status === 400 || status === 422) {
      return backendMessage || "Bộ lọc ngày chưa hợp lệ. Vui lòng kiểm tra lại.";
    }

    if (status === 401) {
      return "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.";
    }

    if (status === 403) {
      return "Bạn chưa có quyền xem trang tổng quan tuyển dụng.";
    }

    if (status >= 500) {
      return "Hệ thống đang bận hoặc gặp sự cố. Vui lòng thử lại sau ít phút.";
    }

    return backendMessage || "Không thể tải dữ liệu tổng quan.";
  }

  if (err instanceof Error && err.message.trim()) {
    return err.message;
  }

  return "Không thể tải dữ liệu tổng quan.";
};

export function useDashboardData(dateRange: DashboardDateRange, refreshTick = 0): UseDashboardDataResult {
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
        setError(getDashboardErrorMessage(err));
        setData(null);
      })
      .finally(() => {
        if (isCancelled) return;
        setLoading(false);
      });

    return () => {
      isCancelled = true;
    };
  }, [dateRange.from, dateRange.to, refreshTick]);

  return {
    data,
    loading,
    error,
  };
}

export default useDashboardData;
