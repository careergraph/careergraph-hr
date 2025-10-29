export const CALENDAR_LEVELS = ["Danger", "Success", "Primary", "Warning"] as const;

export type CalendarLevel = (typeof CALENDAR_LEVELS)[number];

export type CalendarVariant = "danger" | "success" | "primary" | "warning";

export const CALENDAR_LEVEL_META: Record<
  CalendarLevel,
  { label: string; description: string; variant: CalendarVariant }
> = {
  Danger: {
    label: "Ưu tiên cao",
    description: "Ứng viên cần ưu tiên phản hồi hoặc phỏng vấn gấp",
    variant: "danger",
  },
  Success: {
    label: "Đã xác nhận",
    description: "Lịch hẹn đã được xác nhận với ứng viên",
    variant: "success",
  },
  Primary: {
    label: "Đang xử lý",
    description: "Lịch phỏng vấn đang chờ xác nhận",
    variant: "primary",
  },
  Warning: {
    label: "Chờ phản hồi",
    description: "Đang đợi phản hồi hoặc bổ sung thông tin",
    variant: "warning",
  },
};

export const CALENDAR_VARIANT_STYLES: Record<
  CalendarVariant,
  { chip: string; text: string; indicator: string; badge: string; border: string }
> = {
  danger: {
    chip: "bg-rose-500/10 border border-rose-500/20",
    text: "text-rose-600 dark:text-rose-300",
    indicator: "bg-rose-500",
    badge:
      "border border-rose-500/20 bg-rose-500/10 text-rose-600 dark:text-rose-300",
    border: "border-rose-500/20",
  },
  success: {
    chip: "bg-emerald-500/10 border border-emerald-500/20",
    text: "text-emerald-600 dark:text-emerald-300",
    indicator: "bg-emerald-500",
    badge:
      "border border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-300",
    border: "border-emerald-500/20",
  },
  primary: {
    chip: "bg-brand-500/10 border border-brand-500/20",
    text: "text-brand-600 dark:text-brand-300",
    indicator: "bg-brand-500",
    badge:
      "border border-brand-500/20 bg-brand-500/10 text-brand-600 dark:text-brand-300",
    border: "border-brand-500/20",
  },
  warning: {
    chip: "bg-amber-500/10 border border-amber-500/20",
    text: "text-amber-600 dark:text-amber-300",
    indicator: "bg-amber-500",
    badge:
      "border border-amber-500/20 bg-amber-500/10 text-amber-600 dark:text-amber-300",
    border: "border-amber-500/20",
  },
};

export const DEFAULT_EVENT_LEVEL: CalendarLevel = "Primary";
export const DAY_IN_MS = 86_400_000;

export const toDate = (
  value: string | number | number[] | Date | null | undefined
): Date | null => {
  if (value === null || value === undefined) return null;
  if (Array.isArray(value)) {
    if (value.length === 0) return null;
    const [year, month = 0, day = 1, hours = 0, minutes = 0, seconds = 0, milliseconds = 0] = value;
    const date = new Date(year, month, day, hours, minutes, seconds, milliseconds);
    return Number.isNaN(date.getTime()) ? null : date;
  }
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

export const normalizeDate = (
  value: string | number | number[] | Date | null | undefined
): Date | null => {
  const date = toDate(value);
  if (!date) return null;
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
};

export const formatDateForInput = (
  value: string | number | number[] | Date | null | undefined
): string => {
  const date = toDate(value);
  if (!date) return "";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export const formatEventDateRange = (
  start: string | number | number[] | Date | null | undefined,
  end: string | number | number[] | Date | null | undefined
): string => {
  const startDate = toDate(start);
  const endDate = toDate(end);
  if (!startDate) return "Chưa xác định";

  const formatter = new Intl.DateTimeFormat("vi-VN", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  if (!endDate || startDate.toDateString() === endDate.toDateString()) {
    return formatter.format(startDate);
  }

  return `${formatter.format(startDate)} - ${formatter.format(endDate)}`;
};

export const formatRelativeDay = (date: Date | null): string => {
  if (!date) return "Không xác định";
  const today = normalizeDate(new Date());
  if (!today) return "";

  const diff = Math.round((date.getTime() - today.getTime()) / DAY_IN_MS);

  if (diff === 0) return "Hôm nay";
  if (diff === 1) return "Ngày mai";
  if (diff > 1) return `Còn ${diff} ngày`;
  if (diff === -1) return "Hôm qua";
  return `${Math.abs(diff)} ngày trước`;
};

export const getCalendarVariant = (
  level: CalendarLevel | undefined
): CalendarVariant => {
  const meta = level ? CALENDAR_LEVEL_META[level] : undefined;
  return meta?.variant ?? CALENDAR_LEVEL_META[DEFAULT_EVENT_LEVEL].variant;
};
