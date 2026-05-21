const JOB_COLOR_PALETTE = [
  { color: "#378ADD", className: "job-color-1" },
  { color: "#534AB7", className: "job-color-2" },
  { color: "#1D9E75", className: "job-color-3" },
  { color: "#D85A30", className: "job-color-4" },
  { color: "#D4537E", className: "job-color-5" },
] as const;

const jobColorCache = new Map<string, number>();
let colorIndex = 0;

function getJobColorIndex(jobId: string): number {
  const normalizedJobId = jobId.trim();
  if (!normalizedJobId) {
    return -1;
  }

  if (!jobColorCache.has(normalizedJobId)) {
    jobColorCache.set(normalizedJobId, colorIndex % JOB_COLOR_PALETTE.length);
    colorIndex += 1;
  }

  return jobColorCache.get(normalizedJobId) ?? -1;
}

export function getJobColor(jobId: string): string {
  const paletteIndex = getJobColorIndex(jobId);
  return paletteIndex >= 0 ? JOB_COLOR_PALETTE[paletteIndex].color : "#6B7280";
}

export function getJobColorClass(jobId: string): string {
  const paletteIndex = getJobColorIndex(jobId);
  return paletteIndex >= 0 ? JOB_COLOR_PALETTE[paletteIndex].className : "job-color-default";
}
