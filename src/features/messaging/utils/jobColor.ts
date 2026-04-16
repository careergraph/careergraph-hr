const JOB_COLORS = ["#378ADD", "#534AB7", "#1D9E75", "#D85A30", "#D4537E"];

const jobColorCache = new Map<string, string>();
let colorIndex = 0;

export function getJobColor(jobId: string): string {
  const normalizedJobId = jobId.trim();
  if (!normalizedJobId) {
    return "#6B7280";
  }

  if (!jobColorCache.has(normalizedJobId)) {
    const color = JOB_COLORS[colorIndex % JOB_COLORS.length];
    jobColorCache.set(normalizedJobId, color);
    colorIndex += 1;
  }

  return jobColorCache.get(normalizedJobId) ?? "#6B7280";
}
