import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Modal } from "@/components/custom/modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useInterviewStore } from "@/stores/interviewStore";
import { interviewService } from "@/services/interviewService";
import { companyPipelineService } from "@/services/companyPipelineService";
import type { CreateInterviewRequest, Interview, InterviewType } from "@/types/interview";
import { extractApiErrorMessage } from "@/lib/error-utils";
import {
  DEFAULT_COMPANY_STAGES,
  DEFAULT_STAGE_ORDER,
  normalizeStageConfig,
  type ApplicationStageCode,
  type CompanyRecruitmentStage,
} from "@/lib/recruitmentPipeline";
import { toast } from "sonner";
import { Video, Copy, ExternalLink, CheckCircle2, Users } from "lucide-react";
import { formatDateTimeYMDHM } from "@/lib/dateUtils";

interface UnscheduledApp {
  applicationId: string;
  candidateId: string;
  candidateName: string;
  candidateEmail: string;
  jobTitle: string;
  currentStage: string;
  appliedDate: string;
  nextRound?: number;
  maxCompletedRound?: number;
  hasActiveInterview?: boolean;
  activeInterviewCount?: number;
}

interface ScheduleInterviewKanbanModalProps {
  open: boolean;
  onClose: () => void;
  onScheduled: (applicationId: string, interview: Interview) => void;
  jobId: string;
  /** The applicationId of the candidate being dragged (pre-selected) */
  preselectedApplicationId?: string;
  preselectedCandidateName?: string;
}

export default function ScheduleInterviewKanbanModal({
  open,
  onClose,
  onScheduled,
  jobId,
  preselectedApplicationId,
  preselectedCandidateName,
}: ScheduleInterviewKanbanModalProps) {
  const { createInterview, isLoading } = useInterviewStore();

  const [unscheduledApps, setUnscheduledApps] = useState<UnscheduledApp[]>([]);
  const [loadingApps, setLoadingApps] = useState(false);
  const [pipelineStages, setPipelineStages] = useState<CompanyRecruitmentStage[]>(
    DEFAULT_COMPANY_STAGES
  );
  const [selectedAppId, setSelectedAppId] = useState(preselectedApplicationId || "");
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("09:00");
  const [duration, setDuration] = useState<number>(60);
  const [type, setType] = useState<InterviewType>("ONLINE");
  const [location, setLocation] = useState("");
  const [notes, setNotes] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState("");
  const formErrorRef = useRef<HTMLDivElement>(null);
  const candidateFieldRef = useRef<HTMLDivElement>(null);
  const dateInputRef = useRef<HTMLInputElement>(null);
  const timeInputRef = useRef<HTMLInputElement>(null);
  const locationInputRef = useRef<HTMLInputElement>(null);
  const todayStr = new Date().toISOString().split("T")[0];

  const stageOrderMap = useMemo(() => {
    const normalized = normalizeStageConfig(
      pipelineStages.length > 0 ? pipelineStages : DEFAULT_COMPANY_STAGES
    );
    const map = new Map<ApplicationStageCode, number>();
    normalized.forEach((stage) => {
      map.set(stage.stage, stage.displayOrder);
    });
    return map;
  }, [pipelineStages]);

  const interviewStageOrder = useMemo(() => {
    const fallbackIndex = DEFAULT_STAGE_ORDER.indexOf("INTERVIEW");
    const fallbackOrder = fallbackIndex >= 0 ? fallbackIndex + 1 : 0;
    return stageOrderMap.get("INTERVIEW") ?? fallbackOrder;
  }, [stageOrderMap]);

  const isStageEligible = useCallback(
    (stage?: string) => {
      if (!stage) return false;
      if (stage === "INTERVIEW_COMPLETED") return true;
      const order = stageOrderMap.get(stage as ApplicationStageCode);
      if (typeof order !== "number") return false;
      if (interviewStageOrder <= 0) {
        return order === interviewStageOrder;
      }
      return order === interviewStageOrder || order === interviewStageOrder - 1;
    },
    [interviewStageOrder, stageOrderMap]
  );

  const isAppEligible = useCallback(
    (app: UnscheduledApp) => {
      const hasActiveInterview =
        app.hasActiveInterview || (app.activeInterviewCount ?? 0) > 0;
      return isStageEligible(app.currentStage) && !hasActiveInterview;
    },
    [isStageEligible]
  );

  useEffect(() => {
    if (!open) return;
    companyPipelineService
      .fetchMyRecruitmentStages()
      .then((stages) => {
        setPipelineStages(stages.length > 0 ? stages : DEFAULT_COMPANY_STAGES);
      })
      .catch(() => {
        setPipelineStages(DEFAULT_COMPANY_STAGES);
      });
  }, [open]);

  // Result state after scheduling
  const [scheduledResult, setScheduledResult] = useState<Interview | null>(null);
  const [copied, setCopied] = useState(false);

  // Load unscheduled applications when modal opens
  useEffect(() => {
    if (!open || !jobId) return;
    setLoadingApps(true);
    interviewService
      .fetchUnscheduledByJob(jobId)
      .then((resp) => {
        const raw = resp?.data;
        const apps: UnscheduledApp[] = Array.isArray(raw)
          ? raw
          : Array.isArray(raw?.applications)
            ? raw.applications
            : [];
        const eligibleApps = apps.filter(isAppEligible);
        setUnscheduledApps(eligibleApps);
        if (
          preselectedApplicationId &&
          !eligibleApps.find((a) => a.applicationId === preselectedApplicationId)
        ) {
          setFormError("Ứng viên không đủ điều kiện để lên lịch ở giai đoạn hiện tại.");
          setSelectedAppId("");
        }
      })
      .catch(() => {
        setUnscheduledApps([]);
      })
      .finally(() => setLoadingApps(false));
  }, [
    isAppEligible,
    jobId,
    open,
    preselectedApplicationId,
    preselectedCandidateName,
  ]);

  // Pre-select the dragged candidate
  useEffect(() => {
    if (preselectedApplicationId) {
      setSelectedAppId(preselectedApplicationId);
    }
  }, [preselectedApplicationId]);

  const resetForm = () => {
    setSelectedAppId(preselectedApplicationId || "");
    setDate("");
    setStartTime("09:00");
    setDuration(60);
    setType("ONLINE");
    setLocation("");
    setNotes("");
    setFieldErrors({});
    setFormError("");
    setScheduledResult(null);
    setCopied(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const selectedApp = unscheduledApps.find((a) => a.applicationId === selectedAppId);
  const displayName =
    selectedApp?.candidateName || preselectedCandidateName || "Ứng viên";

  const scrollToFirstError = (errors: Record<string, string>) => {
    if (errors.selectedAppId) {
      candidateFieldRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    if (errors.date) {
      dateInputRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    if (errors.startTime) {
      timeInputRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    if (errors.location) {
      locationInputRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    formErrorRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  const handleSubmit = async () => {
    const nextErrors: Record<string, string> = {};
    if (!selectedAppId) {
      nextErrors.selectedAppId = "Vui lòng chọn ứng viên.";
    }
    if (!date || !startTime) {
      if (!date) nextErrors.date = "Vui lòng nhập ngày phỏng vấn.";
      if (!startTime) nextErrors.startTime = "Vui lòng nhập giờ bắt đầu.";
    }
    if (type === "OFFLINE" && !location) {
      nextErrors.location = "Vui lòng nhập địa điểm cho phỏng vấn offline.";
    }

    if (Object.keys(nextErrors).length > 0) {
      setFieldErrors(nextErrors);
      setFormError("Vui lòng kiểm tra lại các trường bắt buộc.");
      setTimeout(() => scrollToFirstError(nextErrors), 0);
      return;
    }

    setFieldErrors({});
    setFormError("");

    const submitRequest = async (confirmOverwrite: boolean) => {
      const request: CreateInterviewRequest = {
        applicationId: selectedAppId,
        date,
        startTime,
        durationMinutes: duration,
        type,
        location: type === "OFFLINE" ? location : undefined,
        notes: notes || undefined,
        confirmOverwrite,
        notifyCandidate: true,
        roundNumber: selectedApp?.nextRound ?? undefined,
      };

      return createInterview(request);
    };

    try {
      const interview = await submitRequest(false);
      toast.success("Đã lên lịch phỏng vấn thành công");
      setScheduledResult(interview);
      onScheduled(selectedAppId, interview);
    } catch (error: unknown) {
      const rawMessage = extractApiErrorMessage(error, "Không thể lên lịch phỏng vấn");
      if (rawMessage.includes("ACTIVE_INTERVIEW")) {
        const confirm = window.confirm(
          "Ứng viên đã có một lịch phỏng vấn đang hoạt động cho vị trí này. Bạn có muốn ghi đè lịch cũ bằng lịch mới không?"
        );
        if (confirm) {
          try {
            const interview = await submitRequest(true);
            toast.success("Đã cập nhật lịch phỏng vấn thành công");
            setScheduledResult(interview);
            onScheduled(selectedAppId, interview);
            return;
          } catch (confirmError: unknown) {
            setFormError(extractApiErrorMessage(confirmError, "Không thể cập nhật lịch phỏng vấn"));
            setTimeout(() => formErrorRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }), 0);
            return;
          }
        }
        setFormError("Bạn đã hủy thao tác ghi đè lịch hiện tại.");
        setTimeout(() => formErrorRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }), 0);
        return;
      }

      setFormError(rawMessage);
      setTimeout(() => formErrorRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }), 0);
    }
  };

  const meetingUrl = scheduledResult?.meetingLink
    ? `${window.location.origin}/interview/room/${scheduledResult.meetingLink}`
    : null;

  const openDatePicker = () => {
    const input = dateInputRef.current as (HTMLInputElement & {
      showPicker?: () => void;
    }) | null;

    if (!input || typeof input.showPicker !== "function") {
      return;
    }

    try {
      input.showPicker();
    } catch {
      // Ignore browser gesture restrictions; native picker still opens on manual interaction.
    }
  };

  const handleCopyLink = () => {
    if (meetingUrl) {
      navigator.clipboard.writeText(meetingUrl);
      setCopied(true);
      toast.success("Đã sao chép link phỏng vấn");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <Modal isOpen={open} onClose={handleClose} className="max-w-[600px] p-0">
      <div className="flex max-h-[90vh] flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white text-slate-900 shadow-[0_30px_80px_rgba(0,0,0,0.35)]">
        <div className="flex items-center gap-2 border-b border-border/60 px-6 py-5">
          <Video className="h-5 w-5 text-blue-600" />
          <h2 className="text-lg font-semibold text-foreground">
            Lên lịch phỏng vấn
          </h2>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-6">
          {/* Success state: show meeting link */}
          {scheduledResult ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2 rounded-lg bg-green-50 p-4">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                <div>
                  <p className="font-medium text-green-900">
                    Đã lên lịch phỏng vấn thành công!
                  </p>
                  <p className="text-sm text-green-700">
                    {displayName} - {formatDateTimeYMDHM(scheduledResult.scheduledAt)}
                  </p>
                </div>
              </div>

              {scheduledResult.type === "ONLINE" && meetingUrl && (
                <div className="space-y-3">
                  <Label className="text-sm font-medium">
                    Link phòng phỏng vấn WebRTC
                  </Label>
                  <div className="flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 p-3">
                    <Video className="h-4 w-4 shrink-0 text-blue-600" />
                    <span className="flex-1 truncate text-sm text-blue-700">
                      {meetingUrl}
                    </span>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={handleCopyLink}
                      className="shrink-0"
                    >
                      {copied ? (
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => window.open(meetingUrl, "_blank")}
                      className="shrink-0"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Chia sẻ link này với ứng viên để tham gia phỏng vấn online
                  </p>
                </div>
              )}

              {scheduledResult.type === "OFFLINE" && scheduledResult.location && (
                <div className="rounded-lg border p-3">
                  <p className="text-sm text-muted-foreground">
                    <span className="font-medium">Địa điểm:</span>{" "}
                    {scheduledResult.location}
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {formError ? (
                <div ref={formErrorRef} className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                  {formError.replace(/^ACTIVE_INTERVIEW_[A-Z_]+\|/, "")}
                </div>
              ) : null}
              {/* Candidate selector */}
              <div ref={candidateFieldRef} className="space-y-2">
                <Label className="flex items-center gap-1.5">
                  <Users className="h-4 w-4" />
                  Chọn ứng viên
                </Label>
                {loadingApps ? (
                  <div className="rounded-lg border p-3 text-center text-sm text-muted-foreground">
                    Đang tải danh sách ứng viên...
                  </div>
                ) : unscheduledApps.length === 0 ? (
                  <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-700">
                    Tất cả ứng viên của job này đã được lên lịch phỏng vấn
                  </div>
                ) : (
                  <Select
                    value={selectedAppId}
                    onValueChange={(value) => {
                      setSelectedAppId(value);
                      setFieldErrors((prev) => ({ ...prev, selectedAppId: "" }));
                    }}
                    disabled={!!preselectedApplicationId}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn ứng viên chưa lên lịch..." />
                    </SelectTrigger>
                    <SelectContent className="border border-slate-200 bg-white text-slate-900">
                      {unscheduledApps.map((app) => (
                        <SelectItem
                          key={app.applicationId}
                          value={app.applicationId}
                        >
                          <div className="flex flex-col">
                            <span>{app.candidateName}</span>
                            <span className="text-xs text-muted-foreground">
                              {app.candidateEmail}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                {fieldErrors.selectedAppId ? (
                  <p className="text-xs text-rose-600">{fieldErrors.selectedAppId}</p>
                ) : null}
              </div>

              {selectedApp && (
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                  <p className="text-sm text-slate-800">
                    <span className="font-medium">Ứng viên:</span>{" "}
                    {selectedApp.candidateName}
                  </p>
                  <p className="text-sm text-slate-800">
                    <span className="font-medium">Email:</span>{" "}
                    {selectedApp.candidateEmail}
                  </p>
                  {selectedApp.jobTitle && (
                    <p className="text-sm text-slate-800">
                      <span className="font-medium">Vị trí:</span>{" "}
                      {selectedApp.jobTitle}
                    </p>
                  )}
                </div>
              )}

              {/* Scheduling form */}
              <div className="grid gap-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="kanban-interview-date">Ngày</Label>
                    <Input
                      ref={dateInputRef}
                      id="kanban-interview-date"
                      type="date"
                      value={date}
                      onClick={openDatePicker}
                      onChange={(e) => {
                        setDate(e.target.value);
                        setFieldErrors((prev) => ({ ...prev, date: "" }));
                      }}
                      min={todayStr}
                    />
                    {fieldErrors.date ? (
                      <p className="text-xs text-rose-600">{fieldErrors.date}</p>
                    ) : null}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="kanban-interview-time">Giờ bắt đầu</Label>
                    <Input
                      ref={timeInputRef}
                      id="kanban-interview-time"
                      type="time"
                      value={startTime}
                      onChange={(e) => {
                        setStartTime(e.target.value);
                        setFieldErrors((prev) => ({ ...prev, startTime: "" }));
                      }}
                    />
                    {fieldErrors.startTime ? (
                      <p className="text-xs text-rose-600">{fieldErrors.startTime}</p>
                    ) : null}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Thời lượng (phút)</Label>
                    <Select
                      value={String(duration)}
                      onValueChange={(v) => setDuration(Number(v))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="border border-slate-200 bg-white text-slate-900">
                        <SelectItem value="30">30 phút</SelectItem>
                        <SelectItem value="45">45 phút</SelectItem>
                        <SelectItem value="60">60 phút</SelectItem>
                        <SelectItem value="90">90 phút</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Hình thức</Label>
                    <Select
                      value={type}
                      onValueChange={(v) => setType(v as InterviewType)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="border border-slate-200 bg-white text-slate-900">
                        <SelectItem value="ONLINE">
                          <span className="flex items-center gap-1.5">
                            <Video className="h-3.5 w-3.5" />
                            Online (WebRTC)
                          </span>
                        </SelectItem>
                        <SelectItem value="OFFLINE">Offline</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {type === "OFFLINE" && (
                  <div className="space-y-2">
                    <Label htmlFor="kanban-interview-location">Địa điểm</Label>
                    <Input
                      ref={locationInputRef}
                      id="kanban-interview-location"
                      placeholder="Ví dụ: Phòng họp tầng 5"
                      value={location}
                      onChange={(e) => {
                        setLocation(e.target.value);
                        setFieldErrors((prev) => ({ ...prev, location: "" }));
                      }}
                    />
                    {fieldErrors.location ? (
                      <p className="text-xs text-rose-600">{fieldErrors.location}</p>
                    ) : null}
                  </div>
                )}

                {type === "ONLINE" && (
                  <div className="rounded-lg border border-blue-200 bg-blue-50 p-3">
                    <p className="flex items-center gap-1.5 text-xs text-blue-700">
                      <Video className="h-3.5 w-3.5" />
                      Link phòng WebRTC sẽ được tạo tự động sau khi lên lịch
                    </p>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="kanban-interview-notes">Ghi chú</Label>
                  <Textarea
                    id="kanban-interview-notes"
                    placeholder="Ghi chú cho buổi phỏng vấn..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={2}
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-wrap justify-end gap-3 border-t border-border/60 px-6 py-5">
          {scheduledResult ? (
            <Button onClick={handleClose}>Đóng</Button>
          ) : (
            <>
              <Button
                variant="outline"
                onClick={handleClose}
                disabled={isLoading}
              >
                Hủy
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={isLoading || !selectedAppId}
              >
                {isLoading ? "Đang xử lý..." : "Lên lịch phỏng vấn"}
              </Button>
            </>
          )}
        </div>
      </div>
    </Modal>
  );
}
