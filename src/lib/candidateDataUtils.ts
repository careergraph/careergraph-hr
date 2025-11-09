/**
 * formatAppliedDate
 * ------------------
 * Format the ISO timestamp returned by the backend into the compact
 * `yyyy mm dd hh:mm` format requested. We use the local timezone so
 * times feel natural to the user. If you prefer UTC, switch to
 * `getUTCFullYear()/getUTCMonth()` etc. The function is defensive and
 * falls back to the original string if parsing fails.
 */
const formatDate = (iso?: string) => {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;

  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const min = String(d.getMinutes()).padStart(2, "0");

  return `${yyyy}-${mm}-${dd} at ${hh}:${min}`;
};

export { formatDate };
