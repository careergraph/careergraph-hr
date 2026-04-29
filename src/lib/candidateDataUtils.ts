import { formatDateTimeYMDHM } from "@/lib/dateUtils";

/**
 * formatAppliedDate
 * ------------------
 * Format the ISO timestamp returned by the backend into the compact
 * `yyyy/mm/dd hh:mm` format requested. We use the local timezone so
 * times feel natural to the user. The function is defensive and
 * falls back to the original string if parsing fails.
 */
const formatDate = (iso?: string) => {
  if (!iso) return "";
  return formatDateTimeYMDHM(iso);
};

export { formatDate };
