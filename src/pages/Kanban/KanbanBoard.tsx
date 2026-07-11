import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router";
import { Candidate, Status as CandidateStatus } from "@/types/candidate";
import { CandidateDetail } from "./CandidateDetail";
import {
  DndContext,
  DragOverlay,
  closestCorners,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragOverEvent,
  DragEndEvent,
} from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import { Column } from "./Column";
import { CandidateCard } from "./CandidateCard";
import { Button } from "@/components/ui/button";

import { initialCandidates } from "@/data/candidateData";
import { applicationService } from "@/services/applicationService";
import { companyPipelineService } from "@/services/companyPipelineService";
import { interviewService } from "@/services/interviewService";
import { toast } from "sonner";
import { Status as CandidateStatusType } from "@/types/candidate";
import ScheduleInterviewKanbanModal from "./ScheduleInterviewKanbanModal";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import {
  canScheduleInterviewAtStage,
  DEFAULT_COMPANY_STAGES,
  STAGE_LABELS,
  STAGE_TO_STATUS,
  STATUS_TO_STAGE,
  buildColumnsFromStages,
  normalizeStageConfig,
  type CompanyRecruitmentStage,
} from "@/lib/recruitmentPipeline";

// KanbanBoard tổ chức danh sách ứng viên theo trạng thái và hỗ trợ kéo thả.

interface KanbanBoardProps {
  jobId?: string;
}

const BACKEND_STAGE_TO_STATUS: Record<string, CandidateStatusType> = {
  ...STAGE_TO_STATUS,
  SUBMITTED: "apply",
  SCHEDULED: "screening",
  INTERVIEW: "interview",
  PENDING_RESCHEDULE: "interview",
  INVITED: "interview",
  OFFER_ACCEPTED: "offer",
  OFFER_DECLINED: "offer",
  WITHDRAWN: "rejected",
} as const;

const AI_SCREENING_ACTOR = "system:ai-screening";

const normalizeString = (value: unknown, fallback = "") =>
  typeof value === "string" ? value : fallback;

const mapApplicationToCandidate = (
  raw: unknown,
  fallbackJobId?: string
): Candidate => {
  const app = raw as Record<string, unknown>;
  const applicationId = normalizeString(app["applicationId"] || app["id"]);
  const candidateObj = (app["candidate"] as Record<string, unknown>) || {};
  const candidateId = normalizeString(candidateObj["candidateId"]);
  const jobObj = (app["job"] as Record<string, unknown>) || {};

  const firstName = normalizeString(candidateObj["firstName"]);
  const lastName = normalizeString(candidateObj["lastName"]);
  const email = normalizeString(candidateObj["email"], "unknown@example.com");
  const name =
    [firstName, lastName].filter(Boolean).join(" ") ||
    (email.includes("@") ? email.split("@")[0] : email);

  const rawStage = normalizeString(app["currentStage"], "APPLIED");
  const status = BACKEND_STAGE_TO_STATUS[rawStage] || "apply";
  const stageHistory = Array.isArray(app["stageHistory"])
    ? (app["stageHistory"] as unknown[])
    : [];
  const latestRejectedHistory = [...stageHistory]
    .reverse()
    .find((entry) => {
      const event = (entry as Record<string, unknown>) || {};
      return normalizeString(event["toStage"]) === "REJECTED";
    }) as Record<string, unknown> | undefined;
  const stageNote = normalizeString(app["stageNote"] || "");
  const rejectedByAi =
    rawStage === "REJECTED" &&
    (normalizeString(latestRejectedHistory?.["changedBy"]) === AI_SCREENING_ACTOR ||
      stageNote.includes("Sàng lọc tự động (AI)"));

  return {
    id: applicationId,
    candidateId,
    ticketId: applicationId,
    jobId: normalizeString(jobObj["id"] || fallbackJobId),
    name,
    position: normalizeString(jobObj["title"], "Ứng viên"),
    email,
    phone: (() => {
      const contacts = candidateObj["contacts"];
      if (Array.isArray(contacts) && contacts.length > 0) {
        const first = contacts[0] as Record<string, unknown>;
        return normalizeString(first["value"] || "");
      }
      return "";
    })(),
    priority: "medium",
    status,
    appliedDate: normalizeString(app["appliedDate"], new Date().toISOString()),
    experienceLevel: "mid",
    salaryExpectation: normalizeString(jobObj["salaryRange"] || ""),
    assignee: undefined,
    labels: [],
    description: normalizeString(app["stageNote"] || app["coverLetter"] || ""),
    timeline: stageHistory.map((h, i) => {
      const evt = (h as Record<string, unknown>) || {};
      return {
        id: `${applicationId}-evt-${i}`,
        action: normalizeString(evt["toStage"] || evt["to"] || ""),
        description: normalizeString(evt["note"] || ""),
        date: normalizeString(evt["changedAt"] || new Date().toISOString()),
        user: normalizeString(evt["changedBy"] || ""),
      };
    }),
    avatar: normalizeString(candidateObj["avatar"] || candidateObj["profilePicture"] || ""),
    age: 0,
    experience: `${normalizeString(candidateObj["yearsOfExperience"] || "0")} năm`,
    lastActive: normalizeString(
      app["stageChangedAt"] || app["appliedDate"] || new Date().toISOString()
    ),
    gender: "Nam",
    birthYear: 1990,
    maritalStatus: "",
    location: {
      city: normalizeString(jobObj["city"] || ""),
      province: normalizeString(jobObj["state"] || ""),
    },
    address: normalizeString(jobObj["specific"] || ""),
    education: normalizeString(candidateObj["educationLevel"] || ""),
    yearsOfExperience: normalizeString(String(candidateObj["yearsOfExperience"] || "0")),
    currentLevel: "",
    desiredLevel: "",
    desiredSalary: normalizeString(String(candidateObj["salaryExpectationMin"] || "")),
    workLocation: normalizeString(candidateObj["workLocation"] || ""),
    workType: "",
    industry: normalizeString(candidateObj["industry"] || ""),
    skills: Array.isArray(candidateObj["skills"])
      ? (candidateObj["skills"] as unknown[]).map((s) =>
          typeof s === "string"
            ? s
            : normalizeString((s as Record<string, unknown>)["name"])
        )
      : [],
    languages: [],
    hasPurchased: false,
    educationLevel: normalizeString(candidateObj["educationLevel"] || undefined),
    hasInterviewed: false,
    interviewScore: undefined,
    rejectedByAi,
  } as Candidate;
};

const enrichCandidateWithInterviewMeta = async (candidate: Candidate) => {
  if (candidate.status !== "interview") {
    return candidate;
  }

  try {
    const interviewResp = await interviewService.fetchInterviewsByApplication(candidate.id);
    const interviews = Array.isArray(interviewResp?.data)
      ? interviewResp.data
      : Array.isArray(interviewResp)
        ? interviewResp
        : [];

    const completedInterviews = interviews.filter(
      (iv: { interviewStatus?: string }) => iv?.interviewStatus === "COMPLETED"
    );

    const ratings = completedInterviews.flatMap(
      (iv: { feedback?: Array<{ overallRating?: number }> }) =>
        Array.isArray(iv.feedback)
          ? iv.feedback
              .map((f) =>
                typeof f?.overallRating === "number" ? f.overallRating : null
              )
              .filter((value): value is number => value !== null)
          : []
    );

    const interviewScore =
      ratings.length > 0
        ? ratings.reduce((sum: number, value: number) => sum + value, 0) /
          ratings.length
        : undefined;

    return {
      ...candidate,
      labels:
        completedInterviews.length > 0
          ? [...candidate.labels, "da-phong-van"]
          : candidate.labels,
      hasInterviewed: completedInterviews.length > 0,
      interviewScore,
    };
  } catch {
    return candidate;
  }
};

// Component quản lý toàn bộ Kanban board tuyển dụng
export const KanbanBoard = ({ jobId }: KanbanBoardProps) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const applicationIdParam = searchParams.get("applicationId");
  const [highlightedApplicationId, setHighlightedApplicationId] = useState<string | null>(null);
  const highlightTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [pipelineStages, setPipelineStages] = useState<CompanyRecruitmentStage[]>(
    DEFAULT_COMPANY_STAGES
  );

  const filterByJob = useCallback(
    (items: Candidate[]) =>
      items.filter((candidate) => (jobId ? candidate.jobId === jobId : true)),
    [jobId]
  );

  const [candidates, setCandidates] = useState<Candidate[]>(() =>
    filterByJob(initialCandidates)
  );
  // Note: we intentionally do not render a loading indicator inside this
  // board to keep the UI simple — errors are logged to console. If you want
  // a spinner or placeholder, we can render it where appropriate.
  const [activeCandidate, setActiveCandidate] = useState<Candidate | null>(
    null
  );
  const [detailOpen, setDetailOpen] = useState(false);
  const [dragSourceStatus, setDragSourceStatus] =
    useState<CandidateStatus | null>(null);
  // Flag to indicate update-stage API is inflight. Declared early so
  // other hooks/effects can reference it safely.
  const [isProcessing, setIsProcessing] = useState(false);
  const [moveRequest, setMoveRequest] = useState<{
    candidateId: string;
    targetStatus: CandidateStatus;
    targetCandidateId?: string;
  } | null>(null);
  // Lưu lại snapshot trước khi kéo để hoàn tác khi cần.
  const dragSnapshotRef = useRef<Candidate[] | null>(null);
  // Cờ giúp phân biệt đóng dialog do xác nhận hay hủy.
  const didConfirmRef = useRef(false);
  // State for interview scheduling modal (shown when moving to "interview" column)
  const [showInterviewModal, setShowInterviewModal] = useState(false);
  const [scheduleFromDetailCandidate, setScheduleFromDetailCandidate] =
    useState<Candidate | null>(null);
  const pipelineColumns = useMemo(
    () => buildColumnsFromStages(pipelineStages),
    [pipelineStages]
  );

  const syncActiveCandidate = useCallback((updater: (current: Candidate) => Candidate) => {
    setActiveCandidate((prev) => (prev ? updater(prev) : prev));
  }, []);

  const loadApplicationsByJob = useCallback(
    async (currentJobId: string, signal?: AbortSignal) => {
      const resp = await applicationService.fetchApplicationsByJob(currentJobId, signal);
      const items = Array.isArray(resp.data) ? resp.data : [];
      const mapped = items.map((raw) => mapApplicationToCandidate(raw, currentJobId));
      return Promise.all(mapped.map((candidate) => enrichCandidateWithInterviewMeta(candidate)));
    },
    []
  );

  const syncApplicationFromServer = useCallback(
    async (applicationId: string) => {
      if (!applicationId) return null;

      const resp = await applicationService.fetchApplicationById(applicationId);
      const raw = resp?.data;
      if (!raw) return null;

      const mapped = await enrichCandidateWithInterviewMeta(
        mapApplicationToCandidate(raw, jobId)
      );

      setCandidates((prev) => {
        const existingIndex = prev.findIndex((item) => item.id === mapped.id);
        if (existingIndex === -1) {
          return prev;
        }

        const next = [...prev];
        next.splice(existingIndex, 1);

        const sameStatusIndexes = next.reduce<number[]>((acc, item, index) => {
          if (item.status === mapped.status) {
            acc.push(index);
          }
          return acc;
        }, []);

        if (sameStatusIndexes.length > 0) {
          next.splice(sameStatusIndexes[sameStatusIndexes.length - 1] + 1, 0, mapped);
        } else {
          next.push(mapped);
        }

        return next;
      });

      syncActiveCandidate((current) =>
        current.id === mapped.id ? mapped : current
      );

      return mapped;
    },
    [jobId, syncActiveCandidate]
  );

  const updateCandidateStage = useCallback(
    async (
      applicationId: string,
      targetStatus: CandidateStatus,
      targetCandidateId?: string
    ) => {
      setIsProcessing(true);

      const prevCandidates = candidates.map((candidate) => ({ ...candidate }));
      const current = candidates.find((candidate) => candidate.id === applicationId);

      if (!current) {
        setIsProcessing(false);
        return false;
      }

      const stage = STATUS_TO_STAGE[targetStatus] || "APPLIED";
      const note = current.description ?? "";

      try {
        if (targetStatus === "interviewed") {
          const interviewResp = await interviewService.fetchInterviewsByApplication(current.id);
          const interviews = Array.isArray(interviewResp?.data)
            ? interviewResp.data
            : Array.isArray(interviewResp)
              ? interviewResp
              : [];
          const now = Date.now();
          const hasCompletedInterview = interviews.some(
            (item: { interviewStatus?: string }) => item?.interviewStatus === "COMPLETED"
          );
          const hasFeedback = interviews.some(
            (item: { feedback?: unknown[] }) =>
              Array.isArray(item?.feedback) && item.feedback.length > 0
          );
          const hasStartedOfflineInterview = interviews.some(
            (item: {
              type?: string;
              interviewStatus?: string;
              scheduledAt?: string;
            }) => {
              if (item?.type !== "OFFLINE") return false;
              if (
                !["SCHEDULED", "CONFIRMED", "IN_PROGRESS", "COMPLETED"].includes(
                  item?.interviewStatus || ""
                )
              ) {
                return false;
              }
              const scheduledAtMs = new Date(item.scheduledAt || "").getTime();
              return Number.isFinite(scheduledAtMs) && scheduledAtMs <= now;
            }
          );
          if (!hasCompletedInterview && !hasFeedback && !hasStartedOfflineInterview) {
            toast.error("Ứng viên chưa đủ điều kiện hoàn tất vòng phỏng vấn để chuyển trạng thái.");
            setCandidates(prevCandidates);
            return false;
          }
        }

        const resp = await applicationService.updateApplicationStage(current.id, {
          stage,
          note,
        });

        if (!(resp && resp.status >= 200 && resp.status < 300)) {
          toast.error("Không thể cập nhật trạng thái (server trả lỗi)");
          setCandidates(prevCandidates);
          return false;
        }

        setCandidates((prev) => {
          const currentLocal = prev.find((candidate) => candidate.id === applicationId);
          if (!currentLocal) return prev;

          const filtered = prev.filter((candidate) => candidate.id !== applicationId);
          const updatedCandidate = {
            ...currentLocal,
            status: targetStatus,
            lastActive: new Date().toISOString(),
            rejectedByAi: false,
          };

          if (targetCandidateId) {
            const targetIndex = filtered.findIndex((candidate) => candidate.id === targetCandidateId);
            if (targetIndex >= 0) {
              filtered.splice(targetIndex, 0, updatedCandidate);
              return filtered;
            }
          }

          filtered.push(updatedCandidate);
          return filtered;
        });

        syncActiveCandidate((candidate) =>
          candidate.id === applicationId
            ? {
                ...candidate,
                status: targetStatus,
                lastActive: new Date().toISOString(),
                rejectedByAi: false,
              }
            : candidate
        );

        return true;
      } catch (err: unknown) {
        console.error("Failed to update application stage:", err);

        const getErrorMessage = (error: unknown) => {
          if (!error || typeof error !== "object") return "Lỗi khi cập nhật trạng thái";
          const maybeResp = (error as { response?: unknown }).response;
          if (!maybeResp || typeof maybeResp !== "object") return "Lỗi khi cập nhật trạng thái";
          const data = (maybeResp as { data?: unknown }).data;
          if (!data || typeof data !== "object") return "Lỗi khi cập nhật trạng thái";
          const message = (data as { message?: unknown }).message;
          return typeof message === "string" ? message : "Lỗi khi cập nhật trạng thái";
        };

        toast.error(getErrorMessage(err));
        setCandidates(prevCandidates);
        return false;
      } finally {
        setIsProcessing(false);
      }
    },
    [candidates, syncActiveCandidate]
  );

  useEffect(() => {
    setCandidates(filterByJob(initialCandidates));
    setActiveCandidate(null);
    setMoveRequest(null);
    dragSnapshotRef.current = null;
  }, [filterByJob]);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const stages = await companyPipelineService.fetchMyRecruitmentStages();
        if (isMounted) {
          setPipelineStages(normalizeStageConfig(stages));
        }
      } catch (err) {
        if (isMounted) {
          setPipelineStages(normalizeStageConfig(DEFAULT_COMPANY_STAGES));
        }
        console.error("Error loading recruitment pipeline:", err);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [jobId]);

  useEffect(() => {
    if (!jobId) return;

    const controller = new AbortController();
    void loadApplicationsByJob(jobId, controller.signal)
      .then((items) => {
        if (!controller.signal.aborted) {
          setCandidates(items);
        }
      })
      .catch((err: unknown) => {
        if (!controller.signal.aborted) {
          console.error("Error loading applications:", err);
        }
      });

    return () => controller.abort();
  }, [jobId, loadApplicationsByJob]);

  // Highlight + scroll to targeted applicationId from URL params
  useEffect(() => {
    if (!applicationIdParam || candidates.length === 0) {
      return;
    }

    const matched = candidates.find((c) => c.id === applicationIdParam);
    if (!matched) {
      return;
    }

    setHighlightedApplicationId(applicationIdParam);

    // On mobile, switch to the correct stage/column tab
    setActiveStageId(matched.status);

    // Scroll the card into view after DOM renders
    requestAnimationFrame(() => {
      const el = document.querySelector(
        `[data-application-id="${applicationIdParam}"]`
      );
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    });

    // Auto-remove highlight and clean URL after 4s
    highlightTimerRef.current = setTimeout(() => {
      setHighlightedApplicationId(null);
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        next.delete("applicationId");
        return next;
      }, { replace: true });
    }, 4000);

    return () => {
      if (highlightTimerRef.current) {
        clearTimeout(highlightTimerRef.current);
      }
    };
  }, [applicationIdParam, candidates, setSearchParams]);

  // Xử lý khi click vào candidate để xem chi tiết
  const handleViewDetails = (candidate: Candidate) => {
    setActiveCandidate(candidate);
    setDetailOpen(true);
  };

  // Sensor config cho drag & drop
  const isMobile = useMediaQuery("(max-width: 767px)");
  const [activeStageId, setActiveStageId] = useState<CandidateStatus | null>(null);

  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 8, // Kéo tối thiểu 8px mới bắt đầu drag
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 200,
        tolerance: 5,
      },
    })
  );

  // Khi bắt đầu kéo ứng viên
  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const candidate = candidates.find((c) => c.id === active.id);
    if (candidate) {
      // Hiển thị overlay và ghi nhận trạng thái hiện tại.
      setActiveCandidate(candidate);
      setDragSourceStatus(candidate.status);
      dragSnapshotRef.current = candidates.map((item) => ({ ...item }));
    }
  };

  // Khi kéo ứng viên qua column khác
  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    if (activeId === overId) return;

    const overColumn = pipelineColumns.find((column) => column.id === overId);
    const containerId = over.data?.current?.sortable?.containerId;

    setCandidates((prev) => {
      const activeIndex = prev.findIndex(
        (candidate) => candidate.id === activeId
      );
      if (activeIndex === -1) return prev;

      const activeCandidateData = prev[activeIndex];
      const overCandidateData = prev.find(
        (candidate) => candidate.id === overId
      );

      const inferredStatus =
        typeof containerId === "string"
          ? (containerId as CandidateStatus)
          : undefined;

      const targetStatus =
        overColumn?.id ?? overCandidateData?.status ?? inferredStatus;

      if (!targetStatus) return prev;

      const updatedActiveCandidate: Candidate = {
        ...activeCandidateData,
        status: targetStatus,
      };

      const withoutActive = prev.filter(
        (candidate) => candidate.id !== activeId
      );

      if (overCandidateData && overCandidateData.id !== activeId) {
        const overIndex = withoutActive.findIndex(
          (candidate) => candidate.id === overCandidateData.id
        );
        if (overIndex === -1) return prev;
        const next = [...withoutActive];
        next.splice(overIndex, 0, updatedActiveCandidate);
        return next;
      }

      if (overColumn) {
        const next = [...withoutActive];
        const lastIndexInColumn = next.reduce((last, candidate, index) => {
          return candidate.status === targetStatus ? index : last;
        }, -1);
        if (lastIndexInColumn >= 0) {
          next.splice(lastIndexInColumn + 1, 0, updatedActiveCandidate);
        } else {
          next.push(updatedActiveCandidate);
        }
        return next;
      }

      const next = [...withoutActive];
      const fallbackIndex = next.reduce((last, candidate, index) => {
        return candidate.status === targetStatus ? index : last;
      }, -1);
      if (fallbackIndex >= 0) {
        next.splice(fallbackIndex + 1, 0, updatedActiveCandidate);
      } else {
        next.push(updatedActiveCandidate);
      }
      return next;
    });
  };

  // Khi kết thúc kéo ứng viên
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveCandidate(null);

    if (!over) {
      if (dragSnapshotRef.current) {
        setCandidates(dragSnapshotRef.current);
        dragSnapshotRef.current = null;
      }
      setDragSourceStatus(null);
      return;
    }

    const activeId = active.id;
    const overId = over.id;

    const activeCandidateData = candidates.find((c) => c.id === activeId);
    if (!activeCandidateData) {
      setDragSourceStatus(null);
      return;
    }

    const containerId = over.data?.current?.sortable?.containerId;
    const overColumn = pipelineColumns.find((column) => column.id === overId);
    const overCandidate = candidates.find((c) => c.id === overId);
    const inferredTargetStatus =
      typeof containerId === "string" &&
      pipelineColumns.some((column) => column.id === containerId)
        ? (containerId as CandidateStatus)
        : null;

    let targetStatus: CandidateStatus | null = null;
    let targetCandidateId: string | undefined;

    if (overColumn) {
      targetStatus = overColumn.id;
    } else if (overCandidate) {
      targetStatus = overCandidate.status;
      if (overCandidate.id !== activeCandidateData.id) {
        targetCandidateId = overCandidate.id;
      }
    } else if (inferredTargetStatus) {
      targetStatus = inferredTargetStatus;
    }

    // In some drop scenarios `over.id` can be the dragged item itself while
    // the optimistic `handleDragOver` state already moved it into another
    // column. Preserve that target so the confirm dialog is still shown.
    if (
      !targetStatus &&
      dragSourceStatus &&
      activeCandidateData.status !== dragSourceStatus
    ) {
      targetStatus = activeCandidateData.status;
    }

    if (!targetStatus) {
      // Không xác định được cột đích: hoàn tác về snapshot ban đầu.
      if (dragSnapshotRef.current) {
        setCandidates(dragSnapshotRef.current);
        dragSnapshotRef.current = null;
        // Sau khi xác nhận dialog, handleConfirmMove sẽ cập nhật state chính thức.
      }
      setDragSourceStatus(null);
      return;
    }

    // PREVENT INVALID MOVES:
    // Candidates may only move to the next adjacent column (no skipping),
    // and cannot move backwards — except when moving to the rejected column.
    if (dragSourceStatus && targetStatus !== "rejected") {
      const sourceIndex = pipelineColumns.findIndex((c) => c.id === dragSourceStatus);
      const targetIndex = pipelineColumns.findIndex((c) => c.id === targetStatus);
      if (sourceIndex > -1 && targetIndex > -1 && targetIndex < sourceIndex) {
        // Revert to the snapshot so the UI doesn't allow the left-ward move.
        if (dragSnapshotRef.current) {
          setCandidates(dragSnapshotRef.current);
          dragSnapshotRef.current = null;
        }
        setDragSourceStatus(null);
        toast.warning("Thao tác không hợp lệ");
        return;
      }
      if (sourceIndex > -1 && targetIndex > -1 && targetIndex > sourceIndex + 1) {
        if (dragSnapshotRef.current) {
          setCandidates(dragSnapshotRef.current);
          dragSnapshotRef.current = null;
        }
        setDragSourceStatus(null);
        toast.warning("Chỉ được chuyển sang cột kế tiếp.");
        return;
      }
    }

    if (dragSourceStatus && dragSourceStatus === targetStatus) {
      if (!targetCandidateId) {
        dragSnapshotRef.current = null;
        setDragSourceStatus(null);
        return;
      }
      // Cùng cột => chỉ cần sắp xếp lại vị trí ngay lập tức.
      setCandidates((prev) => {
        const activeIndex = prev.findIndex((c) => c.id === activeId);
        const overIndex = prev.findIndex((c) => c.id === targetCandidateId);
        if (activeIndex === -1 || overIndex === -1) return prev;
        return arrayMove(prev, activeIndex, overIndex);
      });
      dragSnapshotRef.current = null;
      setDragSourceStatus(null);
      return;
    }

    setMoveRequest({
      candidateId: activeCandidateData.id,
      targetStatus,
      targetCandidateId,
    });
    // Reset để dialog confirm quyết định cập nhật.
    setDragSourceStatus(null);
  };

  // NOTE: removed debug logging to avoid console spam in production.

  // Filter candidates by status
  const getCandidatesByStatus = useCallback(
    (status: CandidateStatus) => {
      const candidatesByStatus = candidates.filter(
        (candidate) => candidate.status === status
      );

      if (status !== "interview") {
        return candidatesByStatus;
      }

      return [...candidatesByStatus].sort((a, b) => {
        const aInterviewed = a.hasInterviewed ? 1 : 0;
        const bInterviewed = b.hasInterviewed ? 1 : 0;
        if (aInterviewed !== bInterviewed) {
          return bInterviewed - aInterviewed;
        }

        const aScore = typeof a.interviewScore === "number" ? a.interviewScore : -1;
        const bScore = typeof b.interviewScore === "number" ? b.interviewScore : -1;
        if (aScore !== bScore) {
          return bScore - aScore;
        }

        return (
          new Date(b.lastActive || b.appliedDate).getTime() -
          new Date(a.lastActive || a.appliedDate).getTime()
        );
      });
    },
    [candidates]
  );

  // Ứng viên đang chuẩn bị chuyển trạng thái để hiển thị trong dialog xác nhận.
  const pendingCandidate = useMemo(
    () =>
      moveRequest
        ? candidates.find(
            (candidate) => candidate.id === moveRequest.candidateId
          ) ?? null
        : null,
    [candidates, moveRequest]
  );

  // Lấy tiêu đề cột đích phục vụ thông báo xác nhận.
  const targetColumnTitle = useMemo(() => {
    if (!moveRequest) return "";
    return (
      pipelineColumns.find((col) => col.id === moveRequest.targetStatus)?.title ??
      moveRequest.targetStatus
    );
  }, [moveRequest, pipelineColumns]);

  const canScheduleActiveCandidate = useMemo(() => {
    if (!activeCandidate) {
      return false;
    }

    return canScheduleInterviewAtStage(
      STATUS_TO_STAGE[activeCandidate.status],
      pipelineStages
    );
  }, [activeCandidate, pipelineStages]);

  const nextActiveStage = useMemo(() => {
    if (!activeCandidate) return null;
    const currentIndex = pipelineColumns.findIndex((column) => column.id === activeCandidate.status);
    if (currentIndex < 0 || currentIndex >= pipelineColumns.length - 1) {
      return null;
    }
    return pipelineColumns[currentIndex + 1];
  }, [activeCandidate, pipelineColumns]);

  const nextStageButtonLabel = useMemo(() => {
    if (!nextActiveStage) return null;
    return STAGE_LABELS[nextActiveStage.stage] ?? nextActiveStage.title;
  }, [nextActiveStage]);

  useEffect(() => {
    if (!isMobile) return;
    if (!pipelineColumns.length) return;
    if (!activeStageId || !pipelineColumns.some((col) => col.id === activeStageId)) {
      setActiveStageId(pipelineColumns[0].id);
    }
  }, [activeStageId, isMobile, pipelineColumns]);

  // Confirm move: call backend first and only move the candidate in UI when
  // the API responds with a successful HTTP status (2xx). If the API fails
  // we show a toast.error and keep the UI unchanged (revert to snapshot).

  const handleConfirmMove = async () => {
    if (!moveRequest) return;

    const updated = await updateCandidateStage(
      moveRequest.candidateId,
      moveRequest.targetStatus,
      moveRequest.targetCandidateId
    );

    if (updated) {
      dragSnapshotRef.current = null;
      didConfirmRef.current = true;
      setMoveRequest(null);
      toast.success("Cập nhật trạng thái thành công");
    }
  };

  const handleAdvanceStage = useCallback(
    async (candidate: Candidate) => {
      const currentIndex = pipelineColumns.findIndex((column) => column.id === candidate.status);
      if (currentIndex < 0 || currentIndex >= pipelineColumns.length - 1) {
        return;
      }

      const nextColumn = pipelineColumns[currentIndex + 1];

      if (nextColumn.id === "interview") {
        setDetailOpen(false);
        setScheduleFromDetailCandidate(candidate);
        return;
      }

      const updated = await updateCandidateStage(candidate.id, nextColumn.id);
      if (!updated) {
        return;
      }

      syncActiveCandidate((current) =>
        current.id === candidate.id ? { ...current, status: nextColumn.id } : current
      );
      toast.success(`Đã chuyển sang ${STAGE_LABELS[nextColumn.stage] ?? nextColumn.title}`);
    },
    [pipelineColumns, syncActiveCandidate, updateCandidateStage]
  );

  const restoreStageOptions = useMemo(() => {
    if (!activeCandidate || activeCandidate.status !== "rejected" || !activeCandidate.rejectedByAi) {
      return [];
    }

    return pipelineColumns
      .filter(
        (column) => column.id === "apply" || column.id === "screening"
      )
      .map((column) => ({
        status: column.id,
        label: STAGE_LABELS[column.stage] ?? column.title,
      }));
  }, [activeCandidate, pipelineColumns]);

  const handleRestoreRejectedCandidate = useCallback(
    async (candidate: Candidate, targetStatus: CandidateStatus) => {
      const updated = await updateCandidateStage(candidate.id, targetStatus);
      if (!updated) {
        throw new Error("Restore failed");
      }

      syncActiveCandidate((current) =>
        current.id === candidate.id
          ? {
              ...current,
              status: targetStatus,
              rejectedByAi: false,
              lastActive: new Date().toISOString(),
            }
          : current
      );
      toast.success(
        `Đã khôi phục hồ sơ về ${STAGE_LABELS[STATUS_TO_STAGE[targetStatus]] ?? targetStatus}`
      );
    },
    [syncActiveCandidate, updateCandidateStage]
  );

  const handleMessageStageSync = useCallback(async () => {
    if (!activeCandidate?.id) return;

    const previousStatus = activeCandidate.status;

    try {
      const synced = await syncApplicationFromServer(activeCandidate.id);
      if (!synced) return;

      if (synced.status !== previousStatus) {
        toast.success(
          `Ứng viên đã được chuyển sang ${STAGE_LABELS[STATUS_TO_STAGE[synced.status]] ?? synced.status}`
        );
      }
    } catch (err) {
      console.error("Failed to sync application after messaging:", err);
    }
  }, [activeCandidate, syncApplicationFromServer]);

  const handleCancelMove = () => {
    if (dragSnapshotRef.current) {
      // Hoàn tác về trạng thái trước khi kéo.
      setCandidates(dragSnapshotRef.current);
      dragSnapshotRef.current = null;
    }
    setMoveRequest(null);
  };

  return (
    <div className="bg-gradient-to-br from-slate-50 via-white to-slate-100/60 p-3 md:p-6">
      {/* Vùng bảng Kanban với từng cột trạng thái và overlay kéo thả. */}
      <div className="mx-auto max-w-[1640px] space-y-4 md:space-y-6">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          <div className="kanban-board-scrollbar flex min-h-[calc(100vh-220px)] items-start gap-4 overflow-x-auto px-1 pb-4 snap-x snap-mandatory md:gap-5 md:snap-none">
            {pipelineColumns.map((column) => (
              <div key={column.id} className="snap-start shrink-0">
                <Column
                  id={column.id}
                  title={column.title}
                  candidates={getCandidatesByStatus(column.id)}
                  onViewDetails={handleViewDetails}
                  highlightedApplicationId={highlightedApplicationId}
                />
              </div>
            ))}
          </div>
          <DragOverlay>
            {activeCandidate ? (
              <div className="z-[1000] opacity-100">
                <CandidateCard candidate={activeCandidate} isDragPreview />
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>

      {/*
        NOTE: The Radix AlertDialog previously rendered here sometimes
        appeared visually clipped or created stacking/backdrop artifacts in
        some environments. To ensure a consistent, visible, and clean
        confirmation UI across environments we render a single fallback
        modal below (instead of duplicating overlays). This modal uses
        the project's Button component for consistent styling.
      */}

      {/*
        Fallback centered modal: in some environments the Radix AlertDialog
        content may be pushed visually off-screen due to stacking/transform
        contexts. To guarantee the user always sees the confirm UI we render
        a simple fixed fallback modal controlled by the same `moveRequest`
        state. It mirrors the AlertDialog content and actions and is placed
        at a very high z-index so it's always visible.
      */}
      {moveRequest ? (
        moveRequest.targetStatus === "interview" ? (
          <ScheduleInterviewKanbanModal
            open={showInterviewModal || moveRequest.targetStatus === "interview"}
            onClose={() => {
              handleCancelMove();
              setShowInterviewModal(false);
            }}
            onScheduled={async () => {
              if (!moveRequest) return;
              setIsProcessing(true);
              const current = candidates.find(
                (c) => c.id === moveRequest.candidateId
              );
              if (!current) {
                setMoveRequest(null);
                setIsProcessing(false);
                setShowInterviewModal(false);
                return;
              }
              try {
                const resp =
                  await applicationService.updateApplicationStage(
                    current.id,
                    { stage: "INTERVIEW", note: current.description ?? "" }
                  );
                if (resp && resp.status >= 200 && resp.status < 300) {
                  setCandidates((prev) => {
                    const currentLocal = prev.find(
                      (c) => c.id === moveRequest.candidateId
                    );
                    if (!currentLocal) return prev;
                    const filtered = prev.filter(
                      (c) => c.id !== moveRequest.candidateId
                    );
                    const updatedCandidate = {
                      ...currentLocal,
                      status: "interview" as CandidateStatusType,
                    };
                    filtered.push(updatedCandidate);
                    return filtered;
                  });
                  syncActiveCandidate((candidate) =>
                    candidate.id === current.id
                      ? {
                          ...candidate,
                          status: "interview" as CandidateStatusType,
                          lastActive: new Date().toISOString(),
                        }
                      : candidate
                  );
                  dragSnapshotRef.current = null;
                  toast.success("Đã chuyển ứng viên sang giai đoạn phỏng vấn");
                }
              } catch {
                // Interview was created but stage update failed — still close
              } finally {
                setMoveRequest(null);
                setIsProcessing(false);
                setShowInterviewModal(false);
              }
            }}
            jobId={jobId || ""}
            preselectedApplicationId={moveRequest.candidateId}
            preselectedCandidateName={pendingCandidate?.name}
          />
        ) : (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center">
          {/* backdrop */}
          <div className="absolute inset-0 bg-black/40" />

          <div className="relative z-10 w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
            <div className="text-center">
              <h3 className="text-lg font-semibold">
                Xác nhận chuyển trạng thái
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">
                {pendingCandidate
                  ? `Bạn có chắc chắn muốn chuyển ${pendingCandidate.name} sang cột "${targetColumnTitle}"?`
                  : "Bạn có chắc chắn muốn chuyển ứng viên sang cột mới?"}
              </p>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={handleCancelMove}
                disabled={isProcessing}
              >
                Huỷ
              </Button>
              <Button
                onClick={() => {
                  didConfirmRef.current = true;
                  handleConfirmMove();
                }}
                disabled={isProcessing}
              >
                Xác nhận
              </Button>
            </div>
          </div>
        </div>
        )
      ) : null}

      <CandidateDetail
        open={detailOpen}
        onOpenChange={setDetailOpen}
        candidate={activeCandidate}
        pipelineStages={pipelineStages}
        canScheduleInterview={canScheduleActiveCandidate}
        setHeaderBlur={() => {}}
        onScheduleInterview={(candidate) => {
          setDetailOpen(false);
          setScheduleFromDetailCandidate(candidate);
        }}
        onAdvanceStage={handleAdvanceStage}
        nextStageLabel={nextStageButtonLabel}
        isAdvancingStage={isProcessing}
        onMessageSent={handleMessageStageSync}
        restoreStageOptions={restoreStageOptions}
        onRestoreCandidateStage={handleRestoreRejectedCandidate}
        onRejectCandidate={async (candidate) => {
          const updated = await updateCandidateStage(candidate.id, "rejected");
          if (!updated) {
            throw new Error("Reject failed");
          }
          toast.success("Đã từ chối ứng viên");
        }}
      />

      {scheduleFromDetailCandidate ? (
        <ScheduleInterviewKanbanModal
          open={!!scheduleFromDetailCandidate}
          onClose={() => setScheduleFromDetailCandidate(null)}
          onScheduled={async (applicationId) => {
            try {
              const synced = await syncApplicationFromServer(applicationId);

              if (!synced) {
                setCandidates((prev) =>
                  prev.map((item) =>
                    item.id === applicationId
                      ? {
                          ...item,
                          status: "interview" as CandidateStatusType,
                          lastActive: new Date().toISOString(),
                        }
                      : item
                  )
                );
                syncActiveCandidate((candidate) =>
                  candidate.id === applicationId
                    ? {
                        ...candidate,
                        status: "interview" as CandidateStatusType,
                        lastActive: new Date().toISOString(),
                      }
                    : candidate
                );
              }

              toast.success("Đã chuyển ứng viên sang giai đoạn phỏng vấn");
            } finally {
              setScheduleFromDetailCandidate(null);
            }
          }}
          jobId={scheduleFromDetailCandidate.jobId}
          preselectedApplicationId={scheduleFromDetailCandidate.id}
          preselectedCandidateName={scheduleFromDetailCandidate.name}
        />
      ) : null}
    </div>
  );
};
