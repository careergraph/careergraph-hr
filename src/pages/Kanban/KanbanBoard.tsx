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
  DEFAULT_COMPANY_STAGES,
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
  const pipelineColumns = useMemo(
    () => buildColumnsFromStages(pipelineStages),
    [pipelineStages]
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

  // If a jobId is supplied we should load real applications from the API
  // instead of the local `initialCandidates` fixture. We keep the mapping
  // logic here so the rest of the Kanban app continues to work with the
  // existing `Candidate` type.
  useEffect(() => {
    if (!jobId) return; // nothing to do when not filtering by job

    const controller = new AbortController();
    const signal = controller.signal;

    (async () => {
      try {
        // We don't render a loading UI here in the board; keep silent in console.

        // Call the backend: GET /applications?jobId=...
        const resp = await applicationService.fetchApplicationsByJob(
          jobId,
          signal
        );

        // The backend returns an envelope { status, message, data: [...] }
        const items = Array.isArray(resp.data) ? resp.data : [];

        // MAP: application -> Candidate (typed defensively)
        // Map backend application.currentStage values to local CandidateStatus
        // The backend may use different stage names (e.g. SCREENING). Ensure
        // each known backend stage maps to the correct Kanban column. If a
        // stage is missing it will currently fall back to `apply` (which
        // caused the bug where SCREENING appeared under "Ứng tuyển").
        const stageToStatus: Record<string, CandidateStatusType> = {
          ...STAGE_TO_STATUS,
          SUBMITTED: "apply",
          SCHEDULED: "screening",
          INTERVIEW_SCHEDULED: "interview",
          PENDING_RESCHEDULE: "interview",
          INVITED: "interview",
          OFFER_ACCEPTED: "offer",
          OFFER_DECLINED: "offer",
          WITHDRAWN: "rejected",
        } as const;

        const normalizeString = (v: unknown, fallback = "") =>
          typeof v === "string" ? v : fallback;

        const mapped: Candidate[] = items.map((raw) => {
          const app = raw as unknown as Record<string, unknown>;
          const applicationId = normalizeString(
            app["applicationId"] || app["id"]
          );
          const candidateObj =
            (app["candidate"] as Record<string, unknown>) || {};

          const candidateId = normalizeString(candidateObj["candidateId"]);
          const jobObj = (app["job"] as Record<string, unknown>) || {};

          const firstName = normalizeString(candidateObj["firstName"]);
          const lastName = normalizeString(candidateObj["lastName"]);
          const email = normalizeString(
            candidateObj["email"],
            "unknown@example.com"
          );

          const name =
            [firstName, lastName].filter(Boolean).join(" ") ||
            (email.includes("@") ? email.split("@")[0] : email);

          const rawStage = normalizeString(app["currentStage"], "APPLIED");
          const status =
            (stageToStatus[rawStage] as CandidateStatusType) || "apply";

          const stageHistory = Array.isArray(app["stageHistory"])
            ? (app["stageHistory"] as unknown[])
            : [];

          const candidate: Candidate = {
            id: applicationId,
            candidateId: candidateId,
            ticketId: applicationId,
            jobId: normalizeString(jobObj["id"] || jobId),
            name,
            position: normalizeString(jobObj["title"], "Ứng viên"),
            email,
            phone: ((): string => {
              const contacts = candidateObj["contacts"];
              if (Array.isArray(contacts) && contacts.length > 0) {
                const first = contacts[0] as Record<string, unknown>;
                return normalizeString(first["value"] || "");
              }
              return "";
            })(),
            priority: "medium",
            status,
            appliedDate: normalizeString(
              app["appliedDate"],
              new Date().toISOString()
            ),
            experienceLevel: "mid",
            salaryExpectation: normalizeString(jobObj["salaryRange"] || ""),
            assignee: undefined,
            labels: [],
            description: normalizeString(
              app["stageNote"] || app["coverLetter"] || ""
            ),
            timeline: stageHistory.map((h, i) => {
              const evt = (h as Record<string, unknown>) || {};
              return {
                id: `${applicationId}-evt-${i}`,
                action: normalizeString(evt["toStage"] || evt["to"] || ""),
                description: normalizeString(evt["note"] || ""),
                date: normalizeString(
                  evt["changedAt"] || new Date().toISOString()
                ),
                user: normalizeString(evt["changedBy"] || ""),
              };
            }),

            avatar: normalizeString(
              candidateObj["avatar"] || candidateObj["profilePicture"] || ""
            ),
            age: 0,
            experience: `${normalizeString(
              candidateObj["yearsOfExperience"] || "0"
            )} năm`,
            lastActive: normalizeString(
              app["stageChangedAt"] ||
                app["appliedDate"] ||
                new Date().toISOString()
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
            yearsOfExperience: normalizeString(
              String(candidateObj["yearsOfExperience"] || "0")
            ),
            currentLevel: "",
            desiredLevel: "",

            desiredSalary: normalizeString(
              String(candidateObj["salaryExpectationMin"] || "")
            ),
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
            educationLevel: normalizeString(
              candidateObj["educationLevel"] || undefined
            ),
            hasInterviewed: false,
            interviewScore: undefined,
          } as Candidate;

          return candidate;
        });

        const mappedWithInterviewMeta = await Promise.all(
          mapped.map(async (candidate) => {
            if (candidate.status !== "interview") {
              return candidate;
            }

            try {
              const interviewResp = await interviewService.fetchInterviewsByApplication(
                candidate.id
              );
              const interviews = Array.isArray(interviewResp?.data)
                ? interviewResp.data
                : Array.isArray(interviewResp)
                  ? interviewResp
                  : [];

              const completedInterviews = interviews.filter(
                (iv: { interviewStatus?: string }) => iv?.interviewStatus === "COMPLETED"
              );

              const ratings = completedInterviews
                .flatMap((iv: { feedback?: Array<{ overallRating?: number }> }) =>
                  Array.isArray(iv.feedback)
                    ? iv.feedback
                        .map((f) => (typeof f?.overallRating === "number" ? f.overallRating : null))
                        .filter((v): v is number => v !== null)
                    : []
                );

              const interviewScore =
                ratings.length > 0
                  ? ratings.reduce((sum: number, value: number) => sum + value, 0) / ratings.length
                  : undefined;

              const labels = candidate.hasInterviewed
                ? candidate.labels
                : completedInterviews.length > 0
                  ? [...candidate.labels, "da-phong-van"]
                  : candidate.labels;

              return {
                ...candidate,
                labels,
                hasInterviewed: completedInterviews.length > 0,
                interviewScore,
              };
            } catch {
              return candidate;
            }
          })
        );

        setCandidates(mappedWithInterviewMeta);
      } catch (err: unknown) {
        if (signal.aborted) return;
        console.error("Error loading applications:", err);
      } finally {
        /* no-op; avoid console spam in production */
      }
    })();

    return () => controller.abort();
  }, [jobId]);

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

    // PREVENT MOVING BACKWARDS:
    // The Kanban columns have a left-to-right progression defined by
    // `columns`. We enforce a rule: a candidate cannot be moved to a
    // column to the left (an earlier stage) relative to its current
    // status. This prevents reversing progress once a candidate has
    // advanced.
    if (dragSourceStatus) {
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

    // Guard double-click while request inflight
    if (isProcessing) return;
    setIsProcessing(true);

    // snapshot current list so we can revert if needed (we haven't changed UI yet)
    const prevCandidates = candidates.map((c) => ({ ...c }));

    // Find candidate being moved
    const current = candidates.find((c) => c.id === moveRequest.candidateId);
    if (!current) {
      setMoveRequest(null);
      setIsProcessing(false);
      return;
    }

    // Map local status -> backend stage string
    const stage = STATUS_TO_STAGE[moveRequest.targetStatus] || "APPLIED";

    // Ensure note is not null (backend expects empty string rather than null)
    const note = (current.description ?? "") as string;

    try {
      // Persist change to backend first
      const resp = await applicationService.updateApplicationStage(current.id, {
        stage,
        note,
      });

      // Check HTTP status code (axios response has `status`)
      if (resp && resp.status >= 200 && resp.status < 300) {
        // Backend success -> now update local UI to reflect new status
        setCandidates((prev) => {
          const currentLocal = prev.find(
            (c) => c.id === moveRequest.candidateId
          );
          if (!currentLocal) return prev;
          const filtered = prev.filter((c) => c.id !== moveRequest.candidateId);
          const updatedCandidate = {
            ...currentLocal,
            status: moveRequest.targetStatus,
          };

          if (moveRequest.targetCandidateId) {
            const targetIndex = filtered.findIndex(
              (c) => c.id === moveRequest.targetCandidateId
            );
            if (targetIndex >= 0) {
              // Nếu có ứng viên reference, chèn vào ngay sau họ.
              filtered.splice(targetIndex, 0, updatedCandidate);
            } else {
              filtered.push(updatedCandidate);
            }
          } else {
            // Nếu thả vào vùng trống, thêm cuối danh sách.
            filtered.push(updatedCandidate);
          }

          return filtered;
        });

        // Clear snapshot and dialog state
        dragSnapshotRef.current = null;
        didConfirmRef.current = true;
        setMoveRequest(null);
        // Friendly success feedback
        toast.success("Cập nhật trạng thái thành công");
      } else {
        // Non-2xx status -> show a generic toast and keep UI unchanged
        toast.error("Không thể cập nhật trạng thái (server trả lỗi)");
        // ensure UI stays as before: restore snapshot
        setCandidates(prevCandidates);
      }
    } catch (err: unknown) {
      // Network / unexpected error -> notify user and keep UI unchanged
      console.error("Failed to update application stage:", err);

      // Safe extraction of a nested error message without using `any`.
      const getErrorMessage = (e: unknown) => {
        if (!e || typeof e !== "object") return "Lỗi khi cập nhật trạng thái";
        const maybeResp = (e as { response?: unknown }).response;
        if (!maybeResp || typeof maybeResp !== "object")
          return "Lỗi khi cập nhật trạng thái";
        const data = (maybeResp as { data?: unknown }).data;
        if (!data || typeof data !== "object")
          return "Lỗi khi cập nhật trạng thái";
        const message = (data as { message?: unknown }).message;
        return typeof message === "string"
          ? message
          : "Lỗi khi cập nhật trạng thái";
      };

      toast.error(getErrorMessage(err));
      setCandidates(prevCandidates);
    } finally {
      setIsProcessing(false);
    }
  };

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
          <div className="flex min-h-[calc(100vh-220px)] items-start gap-4 overflow-x-auto pb-4 custom-scrollbar md:gap-5 px-1 snap-x snap-mandatory md:snap-none">
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
              // After interview is scheduled, also update the application stage
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
                    { stage: "INTERVIEW_SCHEDULED", note: current.description ?? "" }
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
                  dragSnapshotRef.current = null;
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
        setHeaderBlur={() => {}}
        onRejectCandidate={async (candidate) => {
          const current = candidates.find((item) => item.id === candidate.id);
          if (!current) return;

          try {
            const resp = await applicationService.updateApplicationStage(current.id, {
              stage: "REJECTED",
              note: current.description ?? "Rejected from Kanban",
            });

            if (resp && resp.status >= 200 && resp.status < 300) {
              setCandidates((prev) =>
                prev.map((item) =>
                  item.id === candidate.id ? { ...item, status: "rejected" } : item
                )
              );
              setActiveCandidate((prev) =>
                prev && prev.id === candidate.id ? { ...prev, status: "rejected" } : prev
              );
              toast.success("Đã từ chối ứng viên");
            }
          } catch (err: unknown) {
            console.error("Failed to reject application:", err);
            toast.error("Không thể từ chối ứng viên");
            throw err;
          }
        }}
      />
    </div>
  );
};