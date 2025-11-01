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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import { initialCandidates, columns } from "@/data/candidateData";

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
  const [activeCandidate, setActiveCandidate] = useState<Candidate | null>(
    null
  );
  const [detailOpen, setDetailOpen] = useState(false);
  const [dragSourceStatus, setDragSourceStatus] =
    useState<CandidateStatus | null>(null);
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

  const handleConfirmMove = () => {
    if (!moveRequest) return;
    setCandidates((prev) => {
      const current = prev.find((c) => c.id === moveRequest.candidateId);
      if (!current) return prev;
      const filtered = prev.filter((c) => c.id !== moveRequest.candidateId);
      const updatedCandidate = { ...current, status: moveRequest.targetStatus };

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
    dragSnapshotRef.current = null;
    // Đánh dấu confirm để tránh gọi lại handleCancel khi dialog đóng.
    didConfirmRef.current = true;
    setMoveRequest(null);
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
              <CandidateCard candidate={activeCandidate} />
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

      <AlertDialog
        open={Boolean(moveRequest)}
        onOpenChange={(open) => {
          if (!open) {
            if (didConfirmRef.current) {
              didConfirmRef.current = false;
              return;
            }
            handleCancelMove();
          }
        }}
      >
        <AlertDialogContent className="max-w-lg rounded-2xl border border-slate-200 bg-white shadow-xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận chuyển trạng thái</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingCandidate
                ? `Bạn có chắc chắn muốn chuyển ${pendingCandidate.name} sang cột "${targetColumnTitle}"?`
                : "Bạn có chắc chắn muốn chuyển ứng viên sang cột mới?"}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancelMove}>
              Huỷ
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmMove}>
              Xác nhận
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
