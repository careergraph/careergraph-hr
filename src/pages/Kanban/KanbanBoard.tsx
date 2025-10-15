import { useState } from "react";
// ...existing code...
import { Candidate, Status } from "@/types/candidate";
import { CandidateDetailDialog } from "./CandidateDetailDialog";
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

import { initialCandidates, columns } from "@/data/candidateData";

// Component quản lý toàn bộ Kanban board tuyển dụng
export const KanbanBoard = () => {
  const [candidates, setCandidates] = useState<Candidate[]>(initialCandidates);
  const [activeCandidate, setActiveCandidate] = useState<Candidate | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  // Xử lý khi click vào candidate để xem chi tiết
  const handleViewDetails = (candidate: Candidate) => {
    setActiveCandidate(candidate);
    setDialogOpen(true);
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
    setActiveCandidate(candidate || null);
  };

  // Khi kéo ứng viên qua column khác
  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    if (activeId === overId) return;

    const activeCandidate = candidates.find((c) => c.id === activeId);
    const overCandidate = candidates.find((c) => c.id === overId);

    if (!activeCandidate) return;

    // Check if dragging over a column or a candidate
    const overColumn = columns.find((c) => c.id === overId);

    if (overColumn) {
      // Dragging over a column
      setCandidates((candidates) => {
        return candidates.map((c) =>
          c.id === activeId ? { ...c, status: overColumn.id } : c
        );
      });
    } else if (
      overCandidate &&
      activeCandidate.status !== overCandidate.status
    ) {
      // Dragging over a candidate in different column
      setCandidates((candidates) => {
        return candidates.map((c) =>
          c.id === activeId ? { ...c, status: overCandidate.status } : c
        );
      });
    }
  };

  // Khi kết thúc kéo ứng viên
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveCandidate(null);

    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    if (activeId === overId) return;

    const activeCandidate = candidates.find((c) => c.id === activeId);
    const overCandidate = candidates.find((c) => c.id === overId);

    if (!activeCandidate || !overCandidate) return;

    // Reorder candidates in the same column
    if (activeCandidate.status === overCandidate.status) {
      setCandidates((candidates) => {
        const activeIndex = candidates.findIndex((c) => c.id === activeId);
        const overIndex = candidates.findIndex((c) => c.id === overId);
        return arrayMove(candidates, activeIndex, overIndex);
      });
    }
  };

  // Filter candidates by status
  const getCandidatesByStatus = (status: Status) => {
    return candidates.filter((candidate) => candidate.status === status);
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-[1600px] mx-auto">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          <div className="flex gap-4 items-start overflow-x-auto">
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
        <CandidateDetailDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          candidate={activeCandidate}
          setHeaderBlur={() => {}}
        />
      </div>
    </div>
  );
};
