import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router";
import { AlertTriangle, CalendarDays, ClipboardCheck, Link2 } from "lucide-react";
import PageMeta from "@/components/common/PageMeta";
import RecruitmentKpiCards from "@/components/recruitment/RecruitmentKpiCards";
import PipelineVelocityChart from "@/components/recruitment/PipelineVelocityChart";
import HiringTargetProgress from "@/components/recruitment/HiringTargetProgress";
import FunnelConversionChart from "@/components/recruitment/FunnelConversionChart";
import RecentCandidateActivity from "@/components/recruitment/RecentCandidateActivity";
import { useDashboardData } from "@/features/dashboard/hooks/useDashboardData";
import { toast } from "sonner";

const toInputDate = (date: Date): string => {
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60 * 1000);
  return local.toISOString().slice(0, 10);
};

const createDefaultDateRange = () => {
  const to = new Date();
  const from = new Date();
  from.setDate(to.getDate() - 29);

  return {
    from: toInputDate(from),
    to: toInputDate(to),
  };
};

const isValidInputDate = (value: string | null | undefined): value is string => {
  if (!value) return false;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;

  const parsed = new Date(`${value}T00:00:00`);
  return !Number.isNaN(parsed.getTime());
};

const getInitialDateRange = (searchParams: URLSearchParams) => {
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  if (isValidInputDate(from) && isValidInputDate(to)) {
    return { from, to };
  }

  return createDefaultDateRange();
};

const copyToClipboard = async (content: string): Promise<boolean> => {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(content);
      return true;
    }
  } catch {
    // Fallback below.
  }

  try {
    const textarea = document.createElement("textarea");
    textarea.value = content;
    textarea.setAttribute("readonly", "");
    textarea.style.position = "fixed";
    textarea.style.left = "-9999px";
    document.body.appendChild(textarea);
    textarea.select();

    const copied = document.execCommand("copy");
    document.body.removeChild(textarea);
    return copied;
  } catch {
    return false;
  }
};

// Trang Home tổng hợp các widget thống kê và biểu đồ phục vụ quản trị tuyển dụng.

export default function Home() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [dateRange, setDateRange] = useState(() => getInitialDateRange(searchParams));
  const [refreshTick, setRefreshTick] = useState(0);
  // @ts-ignore
  const [lastCopiedReport, setLastCopiedReport] = useState<string | null>(null);
  // @ts-ignore
  const [lastCopiedAt, setLastCopiedAt] = useState<string | null>(null);

  const fromInputRef = useRef<HTMLInputElement>(null);
  const toInputRef = useRef<HTMLInputElement>(null);

  const { data, loading, error } = useDashboardData(dateRange, refreshTick);

  const dateValidation = useMemo(() => {
    const fromError = !dateRange.from
      ? "Vui lòng chọn ngày bắt đầu."
      : !isValidInputDate(dateRange.from)
      ? "Ngày bắt đầu không đúng định dạng yyyy-mm-dd."
      : "";

    const toError = !dateRange.to
      ? "Vui lòng chọn ngày kết thúc."
      : !isValidInputDate(dateRange.to)
      ? "Ngày kết thúc không đúng định dạng yyyy-mm-dd."
      : "";

    const invalidRangeError =
      !fromError && !toError && dateRange.from > dateRange.to
        ? "Ngày bắt đầu không được lớn hơn ngày kết thúc."
        : "";

    return {
      fromError: invalidRangeError || fromError,
      toError: invalidRangeError || toError,
      rangeError: invalidRangeError,
      hasError: Boolean(fromError || toError || invalidRangeError),
    };
  }, [dateRange.from, dateRange.to]);

  const currentFromParam = searchParams.get("from");
  const currentToParam = searchParams.get("to");

  useEffect(() => {
    if (isValidInputDate(dateRange.from) && isValidInputDate(dateRange.to)) {
      if (currentFromParam === dateRange.from && currentToParam === dateRange.to) {
        return;
      }

      setSearchParams(
        {
          from: dateRange.from,
          to: dateRange.to,
        },
        { replace: true }
      );
      return;
    }

    if (!currentFromParam && !currentToParam) {
      return;
    }

    setSearchParams({}, { replace: true });
  }, [
    currentFromParam,
    currentToParam,
    dateRange.from,
    dateRange.to,
    setSearchParams,
  ]);

  const rangeLabel = useMemo(() => {
    if (!dateRange.from || !dateRange.to) {
      return "Khoảng thời gian tùy chọn";
    }

    return `${dateRange.from} -> ${dateRange.to}`;
  }, [dateRange.from, dateRange.to]);

  const resetToLast30Days = () => {
    setDateRange(createDefaultDateRange());
  };

  const openDatePicker = (inputRef: React.RefObject<HTMLInputElement | null>) => {
    const target = inputRef.current;
    if (!target) {
      return;
    }

    target.focus();
    if (typeof target.showPicker === "function") {
      target.showPicker();
    }
  };

  const handleRefreshPipeline = () => {
    if (dateValidation.hasError) {
      toast.error("Bộ lọc ngày chưa hợp lệ. Vui lòng kiểm tra lại trước khi cập nhật.");
      return;
    }

    setRefreshTick((value) => value + 1);
    toast.success("Đã cập nhật pipeline mới nhất");
  };

  const handleCopyFilterLink = async () => {
    if (!isValidInputDate(dateRange.from) || !isValidInputDate(dateRange.to)) {
      toast.error("Chỉ có thể chia sẻ link khi đã chọn đủ ngày bắt đầu và kết thúc.");
      return;
    }

    const shareUrl = `${window.location.origin}${window.location.pathname}?from=${dateRange.from}&to=${dateRange.to}`;
    const copied = await copyToClipboard(shareUrl);

    if (copied) {
      toast.success("Đã sao chép link bộ lọc. Bạn có thể gửi link này để chia sẻ dashboard.");
    } else {
      toast.error("Không thể sao chép link bộ lọc vào clipboard");
    }
  };

  const handleSendDailyReport = async () => {
    if (dateValidation.hasError) {
      toast.error("Vui lòng chọn khoảng ngày hợp lệ trước khi sao chép báo cáo.");
      return;
    }

    if (!data) {
      toast.error("Chưa có dữ liệu để gửi báo cáo");
      return;
    }

    const now = new Date();
    const since = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const changes24h = (data.recentActivities ?? []).filter((item) => {
      const updatedAt = new Date(item.updatedAt);
      return !Number.isNaN(updatedAt.getTime()) && updatedAt >= since;
    });

    const report = [
      "Bao cao pipeline 24h",
      `Khoang du lieu dashboard: ${data.from} -> ${data.to}`,
      `Tong thay doi 24h: ${changes24h.length}`,
      `Ung vien: ${data.kpi.candidates.value}`,
      `Don ung tuyen moi: ${data.kpi.newApplications.value}`,
      `Lich phong van da len: ${data.kpi.scheduledInterviews.value}`,
    ].join("\n");

    const copied = await copyToClipboard(report);
    if (copied) {
      setLastCopiedReport(report);
      setLastCopiedAt(new Date().toLocaleString("vi-VN"));
      toast.success("Đã sao chép báo cáo 24h, sẵn sàng gửi cho stakeholder");
    } else {
      toast.error("Không thể sao chép báo cáo vào clipboard");
    }
  };

  const dashboardErrorMessage = dateValidation.rangeError || error;

  return (
    <>
      {/* Bố cục dashboard kết hợp thẻ KPI và biểu đồ cung cấp thông tin nhanh. */}
      <PageMeta
        title="HR - CareerGraph"
        description="HR - CareerGraph"
      />

      <div className="mb-4 rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/3 sm:p-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-base font-semibold text-gray-800 dark:text-white/90">
              Bộ lọc thời gian dashboard
            </h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Dữ liệu tuyển dụng được tổng hợp theo applied_date trong khoảng đã chọn. Bấm vào ô ngày hoặc biểu tượng lịch để mở calendar.
            </p>
          </div>

          <div className="grid w-full gap-3 sm:grid-cols-2 lg:w-auto lg:grid-cols-[minmax(190px,1fr)_auto_minmax(190px,1fr)] lg:items-start">
            <div>
              <div
                className={`flex items-center rounded-lg border bg-white pr-2 focus-within:border-brand-500 dark:bg-gray-900 ${
                  dateValidation.fromError
                    ? "border-red-400 dark:border-red-700"
                    : "border-gray-300 dark:border-gray-700"
                }`}
              >
                <input
                  ref={fromInputRef}
                  type="date"
                  value={dateRange.from}
                  max={dateRange.to || undefined}
                  title="Ngày bắt đầu"
                  aria-label="Ngày bắt đầu"
                  onChange={(event) =>
                    setDateRange((prev) => ({ ...prev, from: event.target.value }))
                  }
                  className="w-full rounded-l-lg bg-transparent px-3 py-2 text-base text-gray-700 outline-none dark:text-gray-200 focus:!shadow-none focus:!ring-0 md:text-sm"
                />
                <button
                  type="button"
                  title="Mở lịch ngày bắt đầu"
                  aria-label="Mở lịch ngày bắt đầu"
                  onClick={() => openDatePicker(fromInputRef)}
                  className="rounded-md p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-300 dark:hover:bg-white/10 dark:hover:text-white"
                >
                  <CalendarDays className="h-4 w-4" />
                </button>
              </div>
              {dateValidation.fromError && (
                <p className="mt-1 text-xs text-red-600 dark:text-red-400">{dateValidation.fromError}</p>
              )}
            </div>

            <span className="hidden self-center text-sm text-gray-400 lg:block">đến</span>

            <div>
              <div
                className={`flex items-center rounded-lg border bg-white pr-2 focus-within:border-brand-500 dark:bg-gray-900 ${
                  dateValidation.toError
                    ? "border-red-400 dark:border-red-700"
                    : "border-gray-300 dark:border-gray-700"
                }`}
              >
                <input
                  ref={toInputRef}
                  type="date"
                  value={dateRange.to}
                  min={dateRange.from || undefined}
                  title="Ngày kết thúc"
                  aria-label="Ngày kết thúc"
                  onChange={(event) =>
                    setDateRange((prev) => ({ ...prev, to: event.target.value }))
                  }
                  className="w-full rounded-l-lg bg-transparent px-3 py-2 text-base text-gray-700 outline-none dark:text-gray-200 focus:!shadow-none focus:!ring-0 md:text-sm"
                />
                <button
                  type="button"
                  title="Mở lịch ngày kết thúc"
                  aria-label="Mở lịch ngày kết thúc"
                  onClick={() => openDatePicker(toInputRef)}
                  className="rounded-md p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-300 dark:hover:bg-white/10 dark:hover:text-white"
                >
                  <CalendarDays className="h-4 w-4" />
                </button>
              </div>
              {dateValidation.toError && (
                <p className="mt-1 text-xs text-red-600 dark:text-red-400">{dateValidation.toError}</p>
              )}
            </div>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-gray-100 pt-3 dark:border-gray-800">
          <button
            type="button"
            onClick={resetToLast30Days}
            className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-white/5"
          >
            30 ngày gần nhất
          </button>
          <button
            type="button"
            onClick={handleRefreshPipeline}
            className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-white/5"
          >
            Cập nhật pipeline mới nhất
          </button>
          <button
            type="button"
            onClick={handleCopyFilterLink}
            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-white/5"
          >
            <Link2 className="h-4 w-4" />
            Sao chép link bộ lọc
          </button>
          <button
            type="button"
            onClick={handleSendDailyReport}
            className="inline-flex items-center gap-1.5 rounded-lg bg-brand-500 px-3 py-2 text-sm font-medium text-white hover:bg-brand-600"
          >
            <ClipboardCheck className="h-4 w-4" />
            Sao chép nội dung báo cáo 24h
          </button>
          {/* <p className="w-full text-xs text-gray-500 dark:text-gray-400">
            Link bộ lọc được đồng bộ vào URL để có thể chia sẻ. Nút báo cáo 24h sẽ sao chép nội dung tổng hợp vào clipboard để dán vào email hoặc chat nhóm.
          </p> */}
        </div>

        {dashboardErrorMessage && (
          <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-900/20 dark:text-red-300">
            <div className="flex items-start gap-2">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <p>{dashboardErrorMessage}</p>
            </div>
          </div>
        )}

        {/* {lastCopiedReport && (
          <div className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-3 dark:border-emerald-900/60 dark:bg-emerald-900/20">
            <p className="text-sm font-medium text-emerald-800 dark:text-emerald-300">
              Báo cáo đã sao chép {lastCopiedAt ? `lúc ${lastCopiedAt}` : "thành công"}
            </p>
            <pre className="mt-2 overflow-x-auto whitespace-pre-wrap rounded-md bg-white/70 p-2 text-xs text-emerald-900 dark:bg-black/20 dark:text-emerald-100">
              {lastCopiedReport}
            </pre>
          </div>
        )} */}
      </div>

      <div className="grid grid-cols-1 gap-4 md:gap-6 lg:grid-cols-12">
        <div className="col-span-12 space-y-4 md:space-y-6 lg:col-span-7">
          {/* KPI chính giúp đánh giá sức khỏe pipeline tuyển dụng */}
          {!error && <RecruitmentKpiCards
            data={data?.kpi}
            loading={loading}
            // error={error}
          />}

          {/* Biểu đồ cột theo dõi số ứng viên chuyển bước mỗi tháng */}
          {!error  && <PipelineVelocityChart
            data={data?.pipelineVelocity}
            loading={loading}
            error={error}
          />}
        </div>

        <div className="col-span-12 lg:col-span-5">
          {/* Tỷ lệ hoàn thành mục tiêu tuyển dụng hàng tháng */}
          {!error && <HiringTargetProgress
            data={data?.hiringTargetProgress}
            loading={loading}
            error={error}
          />}
        </div>

        <div className="col-span-12">
          {/* So sánh chuyển đổi giữa phỏng vấn và offer */}
          {!error && <FunnelConversionChart
            data={data?.funnelConversion}
            loading={loading}
            error={error}
          />}
        </div>

        <div className="col-span-12">
          {/* Bảng hoạt động ứng viên gần nhất để ưu tiên xử lý */}
          {!error && <RecentCandidateActivity
            data={data?.recentActivities}
            loading={loading}
            error={error}
            dateRangeLabel={rangeLabel}
          />}
        </div>
      </div>
    </>
  );
}
