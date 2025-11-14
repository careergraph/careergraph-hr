import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Candidate, Status as CandidateStatus } from "@/types/candidate";
import { CandidateDetail } from "./CandidateDetail";
import {
  DndContext,
  DragOverlay,
  closestCorners,
  PointerSensor,
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

import { initialCandidates, columns } from "@/data/candidateData";
import { applicationService } from "@/services/applicationService";
import { toast } from "sonner";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { Status as CandidateStatusType } from "@/types/candidate";

// KanbanBoard tổ chức danh sách ứng viên theo trạng thái và hỗ trợ kéo thả.

interface KanbanBoardProps {
  jobId?: string;
}

// Component quản lý toàn bộ Kanban board tuyển dụng
export const KanbanBoard = ({ jobId }: KanbanBoardProps) => {
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

  useEffect(() => {
    setCandidates(filterByJob(initialCandidates));
    setActiveCandidate(null);
    setMoveRequest(null);
    dragSnapshotRef.current = null;
  }, [filterByJob]);

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
          APPLIED: "apply",
          SUBMITTED: "apply",
          // SCREENING is returned by the API for candidates who have been
          // reviewed and should appear in the 'Liên hệ' column in the UI.
          SCREENING: "meeting",
          SCHEDULED: "meeting",
          INVITED: "meeting",
          INTERVIEW: "interview",
          TRIAL: "trial",
          HIRED: "hired",
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
          } as Candidate;

          return candidate;
        });

        setCandidates(mapped);
      } catch (err: unknown) {
        if (signal.aborted) return;
        console.error("Error loading applications:", err);
        } finally {
          /* no-op; avoid console spam in production */
        }
    })();

    return () => controller.abort();
  }, [jobId]);
  // Xử lý khi click vào candidate để xem chi tiết
  const handleViewDetails = (candidate: Candidate) => {
    setActiveCandidate(candidate);
    setDetailOpen(true);
  };

  // Sensor config cho drag & drop
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 10, // Kéo tối thiểu 10px mới bắt đầu drag
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

    const overColumn = columns.find((column) => column.id === overId);
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

    if (activeId === overId) {
      setDragSourceStatus(null);
      return;
    }

    const activeCandidateData = candidates.find((c) => c.id === activeId);
    if (!activeCandidateData) {
      setDragSourceStatus(null);
      return;
    }

    const overColumn = columns.find((column) => column.id === overId);
    const overCandidate = candidates.find((c) => c.id === overId);

    let targetStatus: CandidateStatus | null = null;
    let targetCandidateId: string | undefined;

    if (overColumn) {
      targetStatus = overColumn.id;
    } else if (overCandidate) {
      targetStatus = overCandidate.status;
      targetCandidateId = overCandidate.id;
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
      const sourceIndex = columns.findIndex((c) => c.id === dragSourceStatus);
      const targetIndex = columns.findIndex((c) => c.id === targetStatus);
      if (sourceIndex > -1 && targetIndex > -1 && targetIndex < sourceIndex) {
        // Revert to the snapshot so the UI doesn't allow the left-ward move.
        if (dragSnapshotRef.current) {
          setCandidates(dragSnapshotRef.current);
          dragSnapshotRef.current = null;
        }
        setDragSourceStatus(null);
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
    (status: CandidateStatus) =>
      candidates.filter((candidate) => candidate.status === status),
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
      columns.find((col) => col.id === moveRequest.targetStatus)?.title ??
      moveRequest.targetStatus
    );
  }, [moveRequest]);

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
    const statusToStage: Record<
      CandidateStatus,
      string
    > = {
      apply: "APPLIED",
      meeting: "SCHEDULED",
      interview: "INTERVIEW",
      trial: "TRIAL",
      hired: "HIRED",
    };

    const stage = statusToStage[moveRequest.targetStatus] || "APPLIED";

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
          const currentLocal = prev.find((c) => c.id === moveRequest.candidateId);
          if (!currentLocal) return prev;
          const filtered = prev.filter((c) => c.id !== moveRequest.candidateId);
          const updatedCandidate = { ...currentLocal, status: moveRequest.targetStatus };

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
        if (!maybeResp || typeof maybeResp !== "object") return "Lỗi khi cập nhật trạng thái";
        const data = (maybeResp as { data?: unknown }).data;
        if (!data || typeof data !== "object") return "Lỗi khi cập nhật trạng thái";
        const message = (data as { message?: unknown }).message;
        return typeof message === "string" ? message : "Lỗi khi cập nhật trạng thái";
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100/60 p-6">
      {/* Vùng bảng Kanban với từng cột trạng thái và overlay kéo thả. */}
      <div className="mx-auto max-w-[1640px] space-y-6">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          <div className="flex items-start gap-5 overflow-x-auto pb-4">
            {columns.map((column) => (
              <Column
                key={column.id}
                id={column.id}
                title={column.title}
                candidates={getCandidatesByStatus(column.id)}
                onViewDetails={handleViewDetails}
              />
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
        {/* Dialog chi tiết ứng viên */}
        <CandidateDetail
          open={detailOpen}
          onOpenChange={setDetailOpen}
          candidate={activeCandidate}
          setHeaderBlur={() => {}}
        />
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
        <div className="fixed inset-0 z-[9999] flex items-center justify-center">
          {/* backdrop */}
          <div className="absolute inset-0 bg-black/40" />

          <div className="relative z-10 w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
            {isProcessing ? (
              <LoadingSpinner message="Đang cập nhật trạng thái..." variant="overlay" size="sm" />
            ) : null}

            <div className="text-center">
              <h3 className="text-lg font-semibold">Xác nhận chuyển trạng thái</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                {pendingCandidate
                  ? `Bạn có chắc chắn muốn chuyển ${pendingCandidate.name} sang cột "${targetColumnTitle}"?`
                  : "Bạn có chắc chắn muốn chuyển ứng viên sang cột mới?"}
              </p>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <Button variant="outline" onClick={handleCancelMove} disabled={isProcessing}>
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
      ) : null}
    </div>
  );
};
