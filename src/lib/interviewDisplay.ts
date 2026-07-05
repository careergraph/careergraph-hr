import type { Interview } from "@/types/interview";

const CANCELLED_STATUSES = new Set(["CANCELLED", "NO_SHOW"]);

const toMs = (value?: string) => {
  if (!value) return 0;
  const ms = new Date(value).getTime();
  return Number.isFinite(ms) ? ms : 0;
};

export const resolveInterviewChainKey = (
  interview: Interview,
  interviewsById: Map<string, Interview>
) => {
  let current = interview;
  let fallbackRootId = interview.rescheduledFromId || interview.id;
  const visited = new Set<string>([interview.id]);

  while (current.rescheduledFromId) {
    fallbackRootId = current.rescheduledFromId;
    const parent = interviewsById.get(current.rescheduledFromId);
    if (!parent || visited.has(parent.id)) {
      return fallbackRootId;
    }
    visited.add(parent.id);
    current = parent;
  }

  return current.id || fallbackRootId;
};

export const compareRepresentativePriority = (left: Interview, right: Interview) => {
  const leftCancelled = CANCELLED_STATUSES.has(left.interviewStatus);
  const rightCancelled = CANCELLED_STATUSES.has(right.interviewStatus);

  if (leftCancelled !== rightCancelled) {
    return leftCancelled ? 1 : -1;
  }

  const scheduledDiff = toMs(right.scheduledAt) - toMs(left.scheduledAt);
  if (scheduledDiff !== 0) {
    return scheduledDiff;
  }

  const modifiedDiff =
    toMs(right.lastModifiedDate || right.createdDate) -
    toMs(left.lastModifiedDate || left.createdDate);
  if (modifiedDiff !== 0) {
    return modifiedDiff;
  }

  return right.id.localeCompare(left.id);
};

export const groupInterviewsByChain = (interviews: Interview[]) => {
  if (!Array.isArray(interviews) || interviews.length === 0) {
    return [];
  }

  const interviewsById = new Map(interviews.map((interview) => [interview.id, interview]));
  const groupedByChain = new Map<string, Interview[]>();

  interviews.forEach((interview) => {
    const chainKey = resolveInterviewChainKey(interview, interviewsById);
    const bucket = groupedByChain.get(chainKey) ?? [];
    bucket.push(interview);
    groupedByChain.set(chainKey, bucket);
  });

  return Array.from(groupedByChain.values());
};

export const resolveDisplayInterviews = (interviews: Interview[]) => {
  return groupInterviewsByChain(interviews)
    .map((group) => [...group].sort(compareRepresentativePriority)[0])
    .sort((left, right) => toMs(right.scheduledAt) - toMs(left.scheduledAt));
};
