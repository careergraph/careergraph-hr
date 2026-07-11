import { useEffect, useMemo, useState } from "react";
import { Lock, Save, Plus, Edit2, Check, Trash2, GripVertical } from "lucide-react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import PageMeta from "@/components/common/PageMeta";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import {
  DEFAULT_COMPANY_STAGES,
  STAGE_LABELS,
  STAGE_TO_STATUS,
  normalizeStageConfig,
  type CompanyRecruitmentStage,
  type ApplicationStageCode,
} from "@/lib/recruitmentPipeline";
import { KANBAN_STAGE_META } from "@/lib/kanbanStageMeta";
import { companyPipelineService } from "@/services/companyPipelineService";

function SortableStageItem({
  stage,
  editingStage,
  editingLabel,
  setEditingStage,
  setEditingLabel,
  handleSaveLabel,
  handleToggle,
  handleDeleteCustomStage,
}: any) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: stage.stage,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 1 : 0,
  };

  const statusKey = STAGE_TO_STATUS[stage.stage];
  const meta = KANBAN_STAGE_META[statusKey];

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={`relative overflow-hidden rounded-2xl border ${meta.border} bg-white/95 p-4 shadow-sm ${
        isDragging ? "opacity-50 ring-2 ring-emerald-500" : ""
      }`}
    >
      <div className={`pointer-events-none absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r ${meta.accent} opacity-60`} />
      <div className="relative flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <div
            {...attributes}
            {...listeners}
            className="flex h-8 w-8 cursor-grab items-center justify-center rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-600 active:cursor-grabbing"
          >
            <GripVertical className="h-5 w-5" />
          </div>
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/80 shadow-sm">
            {meta.icon}
          </div>
          <div>
            {editingStage === stage.stage ? (
              <div className="flex items-center gap-2">
                <Input
                  value={editingLabel}
                  onChange={(e) => setEditingLabel(e.target.value)}
                  className="h-8 w-40 text-sm"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSaveLabel(stage.stage);
                    if (e.key === "Escape") setEditingStage(null);
                  }}
                />
                <Button size="icon" variant="ghost" className="h-8 w-8 text-emerald-600" onClick={() => handleSaveLabel(stage.stage)}>
                  <Check className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold text-slate-800">
                  {stage.label || STAGE_LABELS[stage.stage]}
                </p>
                {stage.stage.startsWith("CUSTOM_") && (
                  <button
                    onClick={() => {
                      setEditingStage(stage.stage);
                      setEditingLabel(stage.label || STAGE_LABELS[stage.stage]);
                    }}
                    className="text-slate-400 hover:text-slate-600"
                  >
                    <Edit2 className="h-3 w-3" />
                  </button>
                )}
              </div>
            )}
            {!stage.stage.startsWith("CUSTOM_") && (
              <p className="text-xs text-slate-400">{stage.stage}</p>
            )}
          </div>
          {stage.required ? (
            <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-500">
              <Lock className="h-3 w-3" />
              Bắt buộc
            </span>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Switch
            checked={stage.active}
            onCheckedChange={() => handleToggle(stage.stage)}
            disabled={stage.required}
            aria-label={`Bật/tắt trạng thái ${STAGE_LABELS[stage.stage]}`}
            className="data-[state=checked]:bg-emerald-500 data-[state=unchecked]:bg-slate-200/80 ring-1 ring-slate-200"
          />

          <div className="flex items-center gap-1">
            {stage.stage.startsWith("CUSTOM_") && (
              <Button
                variant="ghost"
                size="icon"
                className="mr-2 h-8 w-8 text-rose-500 hover:bg-rose-50 hover:text-rose-600"
                onClick={() => handleDeleteCustomStage(stage.stage)}
                title="Xóa bước tùy chỉnh"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}

export default function PipelineSettings() {
  const [stages, setStages] = useState<CompanyRecruitmentStage[]>(
    normalizeStageConfig(DEFAULT_COMPANY_STAGES)
  );
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingStage, setEditingStage] = useState<ApplicationStageCode | null>(null);
  const [editingLabel, setEditingLabel] = useState("");

  const handleAddCustomStage = () => {
    const customCodes: ApplicationStageCode[] = ["CUSTOM_1", "CUSTOM_2", "CUSTOM_3", "CUSTOM_4", "CUSTOM_5"];
    const available = customCodes.find((code) => !stages.find((s) => s.stage === code));
    if (!available) {
      toast.error("Bạn chỉ có thể thêm tối đa 5 bước tùy chỉnh.");
      return;
    }
    const newStage: CompanyRecruitmentStage = {
      stage: available,
      label: "Bước tùy chỉnh",
      displayOrder: stages.length + 1,
      active: true,
      required: false,
    };
    setStages([...stages, newStage]);
  };

  const handleSaveLabel = (stageCode: ApplicationStageCode) => {
    if (!editingLabel.trim()) {
      toast.error("Tên bước không được để trống");
      return;
    }
    setStages((prev) =>
      prev.map((s) => (s.stage === stageCode ? { ...s, label: editingLabel.trim() } : s))
    );
    setEditingStage(null);
  };

  const handleDeleteCustomStage = (stageCode: ApplicationStageCode) => {
    setStages((prev) => prev.filter((s) => s.stage !== stageCode));
  };

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const data = await companyPipelineService.fetchMyRecruitmentStages();
        if (mounted) {
          const filteredData = data.filter((s) => !s.stage.startsWith("CUSTOM_") || s.active);
          setStages(normalizeStageConfig(filteredData));
        }
      } catch (err) {
        console.error("Failed to load recruitment stages:", err);
        if (mounted) {
          setStages(normalizeStageConfig(DEFAULT_COMPANY_STAGES));
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  const activeStages = useMemo(
    () => stages.filter((stage) => stage.active),
    [stages]
  );

  const handleToggle = (stageCode: ApplicationStageCode) => {
    setStages((prev) =>
      prev.map((stage) => {
        if (stage.stage !== stageCode) {
          return stage;
        }
        if (stage.required) {
          return stage;
        }
        return {
          ...stage,
          active: !stage.active,
        };
      })
    );
  };

  const handleSave = async () => {
    if (saving) return;
    setSaving(true);

    try {
      const payload = stages.map((stage, index) => ({
        stage: stage.stage,
        active: stage.active,
        displayOrder: index + 1,
        label: stage.label,
      }));

      const resp = await companyPipelineService.updateMyRecruitmentStages(payload);
      if (resp && resp.status >= 200 && resp.status < 300) {
        toast.success("Đã cập nhật pipeline tuyển dụng");
        const updated = await companyPipelineService.fetchMyRecruitmentStages();
        const filteredData = updated.filter((s) => !s.stage.startsWith("CUSTOM_") || s.active);
        setStages(normalizeStageConfig(filteredData));
      } else {
        toast.error("Không thể cập nhật pipeline tuyển dụng");
      }
    } catch (err: unknown) {
      console.error("Failed to update recruitment stages:", err);
      const message =
        typeof err === "object" && err && "response" in err
          ? ((err as { response?: { data?: { message?: string } } }).response?.data?.message ??
              "Không thể cập nhật pipeline tuyển dụng")
          : "Không thể cập nhật pipeline tuyển dụng";
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setStages((prev) => {
        const oldIndex = prev.findIndex((s) => s.stage === active.id);
        const newIndex = prev.findIndex((s) => s.stage === over.id);
        const next = arrayMove(prev, oldIndex, newIndex);
        return next.map((stage, idx) => ({ ...stage, displayOrder: idx + 1 }));
      });
    }
  };

  return (
    <div className="bg-gradient-to-br from-slate-50 via-white to-slate-100/70 p-3 md:p-6">
      <PageMeta title="HR - Pipeline tuyển dụng" description="HR - Pipeline tuyển dụng" />
      <PageBreadcrumb pageTitle="Pipeline tuyển dụng" />

      <div className="mx-auto max-w-[1280px] space-y-6">
        <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-sm md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Tùy chỉnh quy trình tuyển dụng</h2>
            <p className="mt-1 text-sm text-slate-500">
              Bật/tắt các trạng thái và sắp xếp thứ tự hiển thị cho bảng Kanban.
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button onClick={handleAddCustomStage} disabled={saving || loading} variant="outline" className="gap-2">
              <Plus className="h-4 w-4" />
              Thêm bước tùy chỉnh
            </Button>
            <Button onClick={handleSave} disabled={saving || loading} className="gap-2">
              <Save className="h-4 w-4" />
              {saving ? "Đang lưu" : "Lưu thay đổi"}
            </Button>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="space-y-4">
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={stages.map((s) => s.stage)}
                strategy={verticalListSortingStrategy}
              >
                {stages.map((stage, index) => (
                  <SortableStageItem
                    key={stage.stage}
                    stage={stage}
                    index={index}
                    editingStage={editingStage}
                    editingLabel={editingLabel}
                    setEditingStage={setEditingStage}
                    setEditingLabel={setEditingLabel}
                    handleSaveLabel={handleSaveLabel}
                    handleToggle={handleToggle}
                    handleDeleteCustomStage={handleDeleteCustomStage}
                  />
                ))}
              </SortableContext>
            </DndContext>
          </div>

          <div className="space-y-4">
            <div className="rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-sm">
              <h3 className="text-sm font-semibold text-slate-800">Xem trước Kanban</h3>
              <p className="mt-1 text-xs text-slate-500">
                Các cột đang bật sẽ hiển thị như bên dưới.
              </p>

              <div className="mt-4 space-y-3">
                {activeStages.map((stage) => {
                  const statusKey = STAGE_TO_STATUS[stage.stage];
                  const meta = KANBAN_STAGE_META[statusKey];
                  return (
                    <div
                      key={stage.stage}
                      className={`relative overflow-hidden rounded-2xl border ${meta.border} bg-white/95 px-4 py-3 shadow-sm`}
                    >
                      <div
                        className={`pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${meta.accent} opacity-50`}
                      />
                      <div className="relative flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/80 shadow-sm">
                          {meta.icon}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-700">
                            {stage.label || STAGE_LABELS[stage.stage]}
                          </p>
                          {!stage.stage.startsWith("CUSTOM_") && (
                            <p className="text-xs text-slate-400">{stage.stage}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
