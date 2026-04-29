const pad2 = (value: number): string => String(value).padStart(2, "0");

type DateInput = string | number | Date | null | undefined;

const normalizeDate = (value: DateInput): Date | null => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date;
};

export const formatDateYMD = (value: DateInput): string => {
  const date = normalizeDate(value);
  if (!date) return typeof value === "string" ? value : "";
  return `${date.getFullYear()}/${pad2(date.getMonth() + 1)}/${pad2(date.getDate())}`;
};

export const formatDateTimeYMDHM = (value: DateInput): string => {
  const date = normalizeDate(value);
  if (!date) return typeof value === "string" ? value : "";
  return `${formatDateYMD(date)} ${pad2(date.getHours())}:${pad2(date.getMinutes())}`;
};

export const formatTimeHM = (value: DateInput): string => {
  const date = normalizeDate(value);
  if (!date) return typeof value === "string" ? value : "";
  return `${pad2(date.getHours())}:${pad2(date.getMinutes())}`;
};
