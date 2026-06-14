import { Status } from "@/enums/commonEnum";

const DAY_MS = 24 * 60 * 60 * 1000;

const parseDateOnly = (value: string) => {
  const normalized = value.trim();
  if (!normalized) return null;

  const match = normalized.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (match) {
    const [, year, month, day] = match;
    return new Date(Number(year), Number(month) - 1, Number(day));
  }

  const parsed = new Date(normalized);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

export const isJobExpired = (expiryDate?: string | null) => {
  if (!expiryDate || !expiryDate.trim()) return false;

  const deadline = parseDateOnly(expiryDate);
  if (!deadline) return false;

  const today = new Date();
  const normalizedToday = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate()
  );

  return deadline.getTime() + DAY_MS <= normalizedToday.getTime();
};

export const getJobDisplayStatus = (
  status?: Status | null,
  expiryDate?: string | null
) => {
  const normalizedStatus = status ?? Status.ACTIVE;
  const expired = normalizedStatus === Status.ACTIVE && isJobExpired(expiryDate);

  return {
    expired,
    status: expired ? Status.CLOSED : normalizedStatus,
    requiresReopen: expired || normalizedStatus === Status.INACTIVE || normalizedStatus === Status.CLOSED,
  };
};
