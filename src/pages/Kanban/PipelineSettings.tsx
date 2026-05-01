import { useEffect, useMemo, useState } from "react";
import { ArrowDown, ArrowUp, Lock, Save } from "lucide-react";
import PageMeta from "@/components/common/PageMeta";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import { Button } from "@/components/ui/button";
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

const reorderStages = (
  stages: CompanyRecruitmentStage[],
  index: number,
  direction: "up" | "down"
) => {
  const next = [...stages];
  const targetIndex = direction === "up" ? index - 1 : index + 1;
  if (targetIndex < 0 || targetIndex >= next.length) {
    return stages;
  }

  const temp = next[index];
  next[index] = next[targetIndex];
  next[targetIndex] = temp;

  return next.map((stage, idx) => ({
    ...stage,
    displayOrder: idx + 1,
  }));
};

export default function PipelineSettings() {
  const [stages, setStages] = useState<CompanyRecruitmentStage[]>(
    normalizeStageConfig(DEFAULT_COMPANY_STAGES)
  );
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const data = await companyPipelineService.fetchMyRecruitmentStages();
        if (mounted) {
          setStages(normalizeStageConfig(data));
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
      }));

      const resp = await companyPipelineService.updateMyRecruitmentStages(payload);
      if (resp && resp.status >= 200 && resp.status < 300) {
        toast.success("Đã cập nhật pipeline tuyển dụng");
        const updated = await companyPipelineService.fetchMyRecruitmentStages();
        setStages(normalizeStageConfig(updated));
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
          <Button onClick={handleSave} disabled={saving || loading} className="gap-2">
            <Save className="h-4 w-4" />
            {saving ? "Đang lưu" : "Lưu thay đổi"}
          </Button>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="space-y-4">
            {stages.map((stage, index) => {
              const statusKey = STAGE_TO_STATUS[stage.stage];
              const meta = KANBAN_STAGE_META[statusKey];
              return (
                <Card
                  key={stage.stage}
                  className={`relative overflow-hidden rounded-2xl border ${meta.border} bg-white/95 p-4 shadow-sm`}
                >
                  <div
                    className={`pointer-events-none absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r ${meta.accent} opacity-60`}
                  />
                  <div className="relative flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/80 shadow-sm">
                        {meta.icon}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-800">
                          {STAGE_LABELS[stage.stage]}
                        </p>
                        <p className="text-xs text-slate-400">{stage.stage}</p>
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
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={index === 0}
                          onClick={() =>
                            setStages((prev) => reorderStages(prev, index, "up"))
                          }
                        >
                          <ArrowUp className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={index === stages.length - 1}
                          onClick={() =>
                            setStages((prev) => reorderStages(prev, index, "down"))
                          }
                        >
                          <ArrowDown className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
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
                            {STAGE_LABELS[stage.stage]}
                          </p>
                          <p className="text-xs text-slate-400">{stage.stage}</p>
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
