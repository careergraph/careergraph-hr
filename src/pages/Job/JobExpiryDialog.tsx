import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { CalendarDays, X } from "lucide-react";
import { Job } from "@/types/job";
import { Status } from "@/enums/commonEnum";
import type { JobSettingsPayload } from "@/services/jobService";

interface JobExpiryDialogProps {
  job: Job | null;
  open: boolean;
  isSubmitting?: boolean;
  onClose: () => void;
  onSave: (jobId: string, payload: JobSettingsPayload) => Promise<void> | void;
}

const getTodayValue = () => {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60_000;
  return new Date(now.getTime() - offset).toISOString().slice(0, 10);
};

const toDateInputValue = (value?: string) => value?.trim().slice(0, 10) ?? "";

export function JobExpiryDialog({
  job,
  open,
  isSubmitting = false,
  onClose,
  onSave,
}: JobExpiryDialogProps) {
  const [expiryDate, setExpiryDate] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const today = useMemo(() => getTodayValue(), []);
  const currentStatus = job?.status ?? Status.ACTIVE;
  const isClosed = currentStatus === Status.CLOSED;
  const isExpired =
    Boolean(job?.expiryDate) &&
    toDateInputValue(job?.expiryDate) < today &&
    !isClosed;
  const requiresReopen = isClosed || isExpired;

  useEffect(() => {
    if (!open) return;

    setExpiryDate(toDateInputValue(job?.expiryDate) || today);
    setErrorMessage(null);

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !isSubmitting) {
        onClose();
      }
    };

    document.addEventListener("keydown", handleEscape);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [isSubmitting, job, onClose, open, today]);

  if (!open || !job) {
    return null;
  }

  const hasExpiryChanged = expiryDate !== toDateInputValue(job.expiryDate);

  const handleOpenPicker = () => {
    const input = inputRef.current;
    if (!input) return;

    input.focus();
    if ("showPicker" in input) {
      try {
        input.showPicker();
      } catch {
        // Ignore browsers that restrict showPicker to trusted gestures only.
      }
    }
  };

  const handleSave = async () => {
    const normalizedExpiryDate = expiryDate.trim();

    if (!normalizedExpiryDate) {
      setErrorMessage("Vui lòng chọn ngày kết thúc.");
      return;
    }

    if (normalizedExpiryDate < today) {
      setErrorMessage("Ngày kết thúc phải từ hôm nay trở đi.");
      return;
    }

    const payload: JobSettingsPayload = {
      expiryDate: normalizedExpiryDate,
    };

    if (requiresReopen) {
      payload.status = Status.ACTIVE;
    }

    setErrorMessage(null);
    await onSave(job.id, payload);
  };

  return createPortal(
    <div className="fixed inset-0 z-[1300]">
      <div
        className="absolute inset-0 bg-slate-950/82"
        onClick={() => {
          if (!isSubmitting) {
            onClose();
          }
        }}
      />

      <div className="relative flex min-h-full items-center justify-center p-4">
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="job-expiry-dialog-title"
          className="relative w-full max-w-md rounded-[28px] border border-slate-200 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.42)] dark:border-slate-700 dark:bg-slate-950"
          onClick={(event) => event.stopPropagation()}
        >
          <button
            type="button"
            aria-label="Đóng popup"
            onClick={onClose}
            disabled={isSubmitting}
            className="absolute right-4 top-4 inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-slate-100"
          >
            <X className="h-4 w-4" />
          </button>

          <div className="border-b border-slate-200 px-6 py-5 dark:border-slate-800">
            <h2
              id="job-expiry-dialog-title"
              className="pr-12 text-xl font-semibold text-slate-900 dark:text-slate-50"
            >
              {requiresReopen ? "Mở lại công việc" : "Gia hạn công việc"}
            </h2>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
              {requiresReopen
                ? "Chọn ngày kết thúc mới để mở lại job này."
                : "Cập nhật ngày kết thúc để kéo dài thời gian tuyển dụng."}
            </p>
          </div>

          <div className="space-y-4 px-6 py-5">
            <div>
              <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                {job.title}
              </p>
              {job.expiryDate && (
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  Hạn hiện tại: {toDateInputValue(job.expiryDate)}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <label
                htmlFor="job-expiry-date"
                className="block text-sm font-medium text-slate-700 dark:text-slate-200"
              >
                Ngày kết thúc mới
              </label>

              <div className="relative">
                <input
                  ref={inputRef}
                  id="job-expiry-date"
                  type="date"
                  min={today}
                  value={expiryDate}
                  disabled={isSubmitting}
                  onChange={(event) => setExpiryDate(event.target.value)}
                  className="flex h-11 w-full rounded-xl border border-slate-300 bg-white px-3 pr-11 text-sm text-slate-900 outline-none transition focus:border-slate-500 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                />
                <button
                  type="button"
                  aria-label="Mở lịch"
                  onClick={handleOpenPicker}
                  disabled={isSubmitting}
                  className="absolute inset-y-0 right-0 inline-flex w-11 items-center justify-center text-slate-500 transition hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-50 dark:text-slate-400 dark:hover:text-slate-100"
                >
                  <CalendarDays className="h-4 w-4" />
                </button>
              </div>
            </div>

            {errorMessage && (
              <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/70 dark:bg-red-950/30 dark:text-red-300">
                {errorMessage}
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-3 border-t border-slate-200 px-6 py-4 dark:border-slate-800">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={onClose}
              className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-300 bg-white px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              Hủy
            </button>
            <button
              type="button"
              disabled={isSubmitting || (!requiresReopen && !hasExpiryChanged)}
              onClick={handleSave}
              className="inline-flex h-10 items-center justify-center rounded-xl bg-slate-900 px-4 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200"
            >
              {requiresReopen ? "Mở lại" : "Lưu ngày mới"}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
