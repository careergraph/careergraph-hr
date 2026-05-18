import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  CALENDAR_LEVELS,
  CALENDAR_LEVEL_META,
  CALENDAR_VARIANT_STYLES,
  CalendarLevel,
  formatTimeForInput,
} from "../../lib/calendar-utils";
import { CalendarEvent } from "@/types/calendar";
import type { InterviewType, CreateInterviewRequest, InterviewStatus } from "@/types/interview";

import { Modal } from "@/components/custom/modal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CalendarClock, Video, Briefcase, Users } from "lucide-react";
import { jobService } from "@/services/jobService";
import { interviewService } from "@/services/interviewService";
import { companyPipelineService } from "@/services/companyPipelineService";
import { useInterviewStore } from "@/stores/interviewStore";
import { extractApiErrorMessage } from "@/lib/error-utils";
import {
  DEFAULT_COMPANY_STAGES,
  DEFAULT_STAGE_ORDER,
  normalizeStageConfig,
  type ApplicationStageCode,
  type CompanyRecruitmentStage,
} from "@/lib/recruitmentPipeline";
import { toast } from "sonner";

interface UnscheduledApp {
  applicationId: string;
  candidateId: string;
  candidateName: string;
  candidateEmail: string;
  jobTitle: string;
  currentStage: string;
  appliedDate: string;
  maxRound?: number;
  nextRound?: number;
  maxCompletedRound?: number;
  hasFeedback?: boolean;
  hasParticipatedInterview?: boolean;
  hasActiveInterview?: boolean;
  activeInterviewCount?: number;
}

interface JobOption {
  id: string;
  title: string;
}

// CalendarModalForm xử lý việc tạo và chỉnh sửa lịch hẹn thông qua modal.

interface CalendarModalFormProps {
  isOpen: boolean;
  editingEvent: CalendarEvent | null;
  eventTitle: string;
  eventCandidate: string;
  eventLevel: CalendarLevel;
  eventStartDate: string;
  eventEndDate: string;
  eventLocation: string;
  eventNotes: string;
  onClose: () => void;
  onTitleChange: (value: string) => void;
  onCandidateChange: (value: string) => void;
  onLevelChange: (level: CalendarLevel) => void;
  onStartDateChange: (value: string) => void;
  onEndDateChange: (value: string) => void;
  onLocationChange: (value: string) => void;
  onNotesChange: (value: string) => void;
  onInterviewCreated?: () => void;
}

export const CalendarModalForm = ({
  isOpen,
  editingEvent,
  eventTitle,
  eventCandidate,
  eventLevel,
  eventStartDate,
  eventEndDate,
  eventLocation,
  eventNotes,
  onClose,
  onTitleChange,
  onCandidateChange,
  onLevelChange,
  onStartDateChange,
  onEndDateChange,
  onLocationChange,
  onNotesChange,
  onInterviewCreated,
}: CalendarModalFormProps) => {
  const isCreateMode = !editingEvent;
  const { createInterview } = useInterviewStore();
  const todayStr = new Date().toISOString().split("T")[0];

  // Internal state for create mode
  const [jobs, setJobs] = useState<JobOption[]>([]);
  const [selectedJobId, setSelectedJobId] = useState("");
  const [unscheduledApps, setUnscheduledApps] = useState<UnscheduledApp[]>([]);
  const [selectedAppId, setSelectedAppId] = useState("");
  const [interviewType, setInterviewType] = useState<InterviewType>("ONLINE");
  const [selectedRound, setSelectedRound] = useState<number>(1);
  const [availableRounds, setAvailableRounds] = useState<number[]>([1]);
  const [pipelineStages, setPipelineStages] = useState<CompanyRecruitmentStage[]>(
    DEFAULT_COMPANY_STAGES
  );
  const [startTime, setStartTime] = useState("09:00");
  const [duration, setDuration] = useState<number>(60);
  const [loadingJobs, setLoadingJobs] = useState(false);
  const [loadingApps, setLoadingApps] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState("");
  const formErrorRef = useRef<HTMLDivElement>(null);
  const jobFieldRef = useRef<HTMLDivElement>(null);
  const appFieldRef = useRef<HTMLDivElement>(null);
  const timeFieldRef = useRef<HTMLDivElement>(null);
  const locationFieldRef = useRef<HTMLDivElement>(null);
  const startDateInputRef = useRef<HTMLInputElement>(null);
  const endDateInputRef = useRef<HTMLInputElement>(null);

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

  // Fetch jobs when modal opens in create mode
  useEffect(() => {
    if (!isOpen || !isCreateMode) return;
    setFieldErrors({});
    setFormError("");
    setLoadingJobs(true);
    jobService
      .getAllJobs()
      .then((data: unknown) => {
        const list = Array.isArray(data)
          ? data
          : (data as Record<string, unknown>)?.content ?? [];
        setJobs(
          (list as Record<string, unknown>[]).map((j) => ({
            id: String(j.id ?? ""),
            title: String(j.title ?? ""),
          }))
        );
      })
      .catch(() => setJobs([]))
      .finally(() => setLoadingJobs(false));
  }, [isOpen, isCreateMode]);

  useEffect(() => {
    if (!isOpen || !isCreateMode) return;
    companyPipelineService
      .fetchMyRecruitmentStages()
      .then((stages) => {
        setPipelineStages(stages.length > 0 ? stages : DEFAULT_COMPANY_STAGES);
      })
      .catch(() => {
        setPipelineStages(DEFAULT_COMPANY_STAGES);
      });
  }, [isOpen, isCreateMode]);

  // Fetch unscheduled candidates when job changes
  useEffect(() => {
    if (!selectedJobId) {
      setUnscheduledApps([]);
      setSelectedAppId("");
      setAvailableRounds([1]);
      setSelectedRound(1);
      setFieldErrors((prev) => ({ ...prev, selectedJobId: "" }));
      return;
    }
    setSelectedAppId("");
    setLoadingApps(true);
    interviewService
      .fetchUnscheduledByJob(selectedJobId, selectedRound)
      .then((resp) => {
        const payload = (resp?.data ?? {}) as {
          applications?: UnscheduledApp[];
          availableRounds?: number[];
        };
        const apps = Array.isArray(payload.applications) ? payload.applications : [];
        const roundsRaw = Array.isArray(payload.availableRounds) ? payload.availableRounds : [1];
        const rounds = roundsRaw
          .map((item) => Number(item))
          .filter((item) => Number.isFinite(item) && item >= 1)
          .sort((a, b) => a - b);
        const normalizedRounds = rounds.length > 0 ? rounds : [1];
        setAvailableRounds(normalizedRounds);
        if (!normalizedRounds.includes(selectedRound)) {
          setSelectedRound(normalizedRounds[0]);
          return;
        }
        const eligibleApps = apps.filter(isAppEligible);
        setUnscheduledApps(eligibleApps);
        if (eligibleApps.length > 0) {
          setSelectedAppId(eligibleApps[0].applicationId);
        }
      })
      .catch(() => {
        setUnscheduledApps([]);
        setAvailableRounds([1]);
      })
      .finally(() => setLoadingApps(false));
  }, [selectedJobId, selectedRound]);

  // Reset internal state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setSelectedJobId("");
      setSelectedAppId("");
      setInterviewType("ONLINE");
      setStartTime("09:00");
      setDuration(60);
      setSelectedRound(1);
      setAvailableRounds([1]);
      setUnscheduledApps([]);
      setFieldErrors({});
      setFormError("");
    }
  }, [isOpen]);

  // Initialize startTime from editing event (edit mode)
  useEffect(() => {
    if (editingEvent?.start) {
      const time = formatTimeForInput(editingEvent.start);
      if (time) setStartTime(time);
    }
  }, [editingEvent]);

  // Sync candidate name when selecting from dropdown
  const selectedApp = unscheduledApps.find(
    (a) => a.applicationId === selectedAppId
  );
  const scrollToFirstError = (errors: Record<string, string>) => {
    if (errors.selectedJobId) {
      jobFieldRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    if (errors.selectedAppId) {
      appFieldRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    if (errors.eventStartDate) {
      startDateInputRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    if (errors.startTime) {
      timeFieldRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    if (errors.eventLocation) {
      locationFieldRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    formErrorRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  const handleCreateSubmit = async () => {
    const nextErrors: Record<string, string> = {};

    if (!selectedJobId) {
      nextErrors.selectedJobId = "Vui lòng chọn công việc.";
    }
    if (!selectedAppId) {
      nextErrors.selectedAppId = "Vui lòng chọn ứng viên.";
    }
    if (!selectedRound || selectedRound < 1) {
      nextErrors.selectedRound = "Vui lòng chọn vòng phỏng vấn.";
    }
    if (!eventStartDate) {
      nextErrors.eventStartDate = "Vui lòng chọn ngày phỏng vấn.";
    }
    if (!startTime) {
      nextErrors.startTime = "Vui lòng chọn giờ bắt đầu.";
    }
    if (interviewType === "OFFLINE" && !eventLocation.trim()) {
      nextErrors.eventLocation = "Vui lòng nhập địa điểm cho phỏng vấn offline.";
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
        date: eventStartDate,
        startTime,
        durationMinutes: duration,
        type: interviewType,
        location: interviewType === "OFFLINE" ? eventLocation : undefined,
        notes: eventNotes || undefined,
        confirmOverwrite,
        notifyCandidate: true,
        roundNumber: selectedRound,
      };

      await createInterview(request);
    };

    setIsSubmitting(true);
    try {
      await submitRequest(false);
      toast.success("Đã tạo lịch phỏng vấn thành công");
      onInterviewCreated?.();
      onClose();
    } catch (error: unknown) {
      const rawMessage = extractApiErrorMessage(error, "Không thể tạo lịch phỏng vấn");
      if (rawMessage.includes("ACTIVE_INTERVIEW")) {
        const confirm = window.confirm(
          "Ứng viên đã có một lịch phỏng vấn đang hoạt động cho vị trí này. Bạn có muốn ghi đè lịch cũ bằng lịch mới không?"
        );
        if (confirm) {
          try {
            await submitRequest(true);
            toast.success("Đã cập nhật lịch phỏng vấn thành công");
            onInterviewCreated?.();
            onClose();
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
    } finally {
      setIsSubmitting(false);
    }
  };

  const resolveEditingDuration = () => {
    if (!editingEvent?.start || !editingEvent?.end) {
      return 60;
    }

    const startMs = new Date(String(editingEvent.start)).getTime();
    const endMs = new Date(String(editingEvent.end)).getTime();
    if (!Number.isFinite(startMs) || !Number.isFinite(endMs) || endMs <= startMs) {
      return 60;
    }

    const minutes = Math.round((endMs - startMs) / 60000);
    return minutes >= 15 ? minutes : 60;
  };

  const mapLevelToInterviewStatus = (level: CalendarLevel): InterviewStatus => {
    switch (level) {
      case "Warning":
        return "PENDING_RESCHEDULE";
      case "Success":
        return "CONFIRMED";
      case "Danger":
        return "CANCELLED";
      case "Primary":
      default:
        return "SCHEDULED";
    }
  };

  const getEditingStartFromEvent = useCallback(() => {
    if (!editingEvent?.start) return "";
    const dateObj = new Date(String(editingEvent.start));
    if (!Number.isFinite(dateObj.getTime())) return "";
    const yyyy = dateObj.getFullYear();
    const mm = String(dateObj.getMonth() + 1).padStart(2, "0");
    const dd = String(dateObj.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  }, [editingEvent]);

  const isEditFormChanged = useMemo(() => {
    if (!editingEvent) return false;

    const currentStatus = editingEvent.extendedProps?.interviewStatus as InterviewStatus | undefined;
    const nextStatus = mapLevelToInterviewStatus(eventLevel);
    const oldDate = getEditingStartFromEvent();
    const oldTime = formatTimeForInput(editingEvent.start);
    const oldNotes = String(editingEvent.extendedProps?.notes ?? "").trim();
    const nextNotes = String(eventNotes ?? "").trim();

    const timeChanged = oldDate !== eventStartDate || oldTime !== startTime;
    const notesChanged = oldNotes !== nextNotes;
    const statusChanged = !!currentStatus && currentStatus !== nextStatus;

    return timeChanged || notesChanged || statusChanged;
  }, [editingEvent, eventLevel, eventNotes, eventStartDate, getEditingStartFromEvent, startTime]);

  const handleEditSubmit = async () => {
    if (!editingEvent?.id) {
      setFormError("Không xác định được lịch phỏng vấn cần chỉnh sửa.");
      return;
    }

    const nextStatus = mapLevelToInterviewStatus(eventLevel);
    const currentStatus = editingEvent.extendedProps?.interviewStatus as InterviewStatus | undefined;
    const isCancelAction = nextStatus === "CANCELLED";
    const oldDate = getEditingStartFromEvent();
    const oldTime = formatTimeForInput(editingEvent.start);
    const oldDuration = resolveEditingDuration();
    const oldNotes = String(editingEvent.extendedProps?.notes ?? "").trim();
    const nextNotes = String(eventNotes ?? "").trim();
    const timeChanged = oldDate !== eventStartDate || oldTime !== startTime;
    const notesChanged = oldNotes !== nextNotes;
    const statusChanged = !!currentStatus && currentStatus !== nextStatus;

    if (isCancelAction && currentStatus === "CANCELLED") {
      toast.info("Lịch phỏng vấn này đã ở trạng thái hủy.");
      return;
    }

    if (!isCancelAction && !timeChanged && !notesChanged && !statusChanged) {
      toast.info("Không có thay đổi nào để cập nhật.");
      return;
    }

    const nextErrors: Record<string, string> = {};

    if (!isCancelAction && !eventStartDate) {
      nextErrors.eventStartDate = "Vui lòng chọn ngày phỏng vấn.";
    }
    if (!isCancelAction && !startTime) {
      nextErrors.startTime = "Vui lòng chọn giờ bắt đầu.";
    }

    if (!isCancelAction && eventStartDate && startTime) {
      const nextStart = new Date(`${eventStartDate}T${startTime}:00`);
      if (Number.isFinite(nextStart.getTime()) && nextStart.getTime() < Date.now()) {
        nextErrors.eventStartDate = "Không thể chỉnh lịch phỏng vấn vào thời điểm trong quá khứ.";
      }
    }

    if (Object.keys(nextErrors).length > 0) {
      setFieldErrors(nextErrors);
      setFormError("Vui lòng kiểm tra lại thông tin lịch hẹn.");
      setTimeout(() => scrollToFirstError(nextErrors), 0);
      return;
    }

    setFieldErrors({});
    setFormError("");
    setIsSubmitting(true);

    try {
      if (isCancelAction) {
        await interviewService.cancelInterview(editingEvent.id, "Hủy từ lịch phỏng vấn");
        toast.success("Đã hủy lịch phỏng vấn");
        onInterviewCreated?.();
        onClose();
        return;
      }

      if (timeChanged) {
        await interviewService.rescheduleInterview(editingEvent.id, {
          newDate: eventStartDate,
          newStartTime: startTime,
          durationMinutes: oldDuration,
          notes: nextNotes || undefined,
        });
      } else {
        await interviewService.updateInterview(editingEvent.id, {
          notes: nextNotes || undefined,
          durationMinutes: oldDuration,
        });

        if (currentStatus && currentStatus !== nextStatus) {
          await interviewService.updateInterviewStatus(editingEvent.id, {
            status: nextStatus,
          });
        }
      }

      toast.success("Đã cập nhật lịch phỏng vấn thành công");
      onInterviewCreated?.();
      onClose();
    } catch (error: unknown) {
      setFormError(extractApiErrorMessage(error, "Không thể chỉnh sửa lịch phỏng vấn"));
      setTimeout(() => formErrorRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }), 0);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickCancel = async () => {
    if (!editingEvent?.id) return;

    const currentStatus = editingEvent.extendedProps?.interviewStatus as InterviewStatus | undefined;
    if (currentStatus && ["CANCELLED", "COMPLETED", "NO_SHOW"].includes(currentStatus)) {
      toast.warning("Lịch phỏng vấn này không thể hủy thêm.");
      return;
    }

    const confirmed = window.confirm("Bạn có chắc muốn hủy lịch phỏng vấn này?");
    if (!confirmed) return;

    setIsSubmitting(true);
    try {
      await interviewService.cancelInterview(editingEvent.id, "Hủy từ lịch phỏng vấn");
      toast.success("Đã hủy lịch phỏng vấn");
      onInterviewCreated?.();
      onClose();
    } catch (error: unknown) {
      setFormError(extractApiErrorMessage(error, "Không thể hủy lịch phỏng vấn"));
      setTimeout(() => formErrorRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }), 0);
    } finally {
      setIsSubmitting(false);
    }
  };

  const openDatePicker = (input: HTMLInputElement | null) => {
    const typedInput = input as (HTMLInputElement & { showPicker?: () => void }) | null;
    typedInput?.showPicker?.();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-[760px] p-0">
      <div className="flex max-h-[80vh] flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white text-slate-900 shadow-[0_30px_80px_rgba(0,0,0,0.35)]">
        <div className="flex items-center justify-between border-b border-border/60 px-6 py-5">
          <div>
            <h2 className="text-lg font-semibold text-foreground">
              {editingEvent ? "Chỉnh sửa lịch hẹn" : "Tạo lịch phỏng vấn"}
            </h2>
            <p className="text-sm text-muted-foreground">
              Ghi rõ thông tin để ứng viên và đội ngũ phối hợp hiệu quả.
            </p>
          </div>
          <Badge className="bg-brand-500/15 text-brand-700 pr-15">
            <CalendarClock className="mr-1 size-3.5" />
            Lịch phỏng vấn
          </Badge>
        </div>
        <ScrollArea className="flex-1 h-full px-6 py-6 overflow-y-auto">
          <div className="grid gap-5 p-4">
            {formError ? (
              <div ref={formErrorRef} className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:border-rose-900 dark:bg-rose-950/30 dark:text-rose-300">
                {formError.replace(/^ACTIVE_INTERVIEW_[A-Z_]+\|/, "")}
              </div>
            ) : null}
            {/* ========== CREATE MODE: Job → Candidate → Type ========== */}
            {isCreateMode && (
              <>
                {/* Job selector */}
                <div ref={jobFieldRef} className="space-y-2">
                  <Label className="flex items-center gap-1.5">
                    <Briefcase className="h-4 w-4" />
                    Chọn công việc
                  </Label>
                  {loadingJobs ? (
                    <div className="rounded-lg border p-3 text-center text-sm text-muted-foreground">
                      Đang tải danh sách công việc...
                    </div>
                  ) : jobs.length === 0 ? (
                    <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-700 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-400">
                      Chưa có công việc nào
                    </div>
                  ) : (
                    <Select
                      value={selectedJobId}
                      onValueChange={(value) => {
                        setSelectedJobId(value);
                        setFieldErrors((prev) => ({ ...prev, selectedJobId: "", selectedAppId: "" }));
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn công việc..." />
                      </SelectTrigger>
                      <SelectContent className="border border-gray-400 bg-white text-slate-900">
                        {jobs.map((job) => (
                          <SelectItem key={job.id} value={job.id}>
                            {job.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                  {fieldErrors.selectedJobId ? (
                    <p className="text-xs text-rose-600">{fieldErrors.selectedJobId}</p>
                  ) : null}
                </div>

                {/* Candidate selector (appears after job is selected) */}
                {selectedJobId && (
                  <div ref={appFieldRef} className="space-y-2">
                    <div className="grid gap-4 md:grid-cols-3">
                      <div className="space-y-2 col-span-1 ">
                        <Label className="text-slate-700">Vòng đánh giá</Label>
                        <Select
                          value={String(selectedRound)}
                          onValueChange={(value) => {
                            setSelectedRound(Number(value));
                            setSelectedAppId("");
                            setFieldErrors((prev) => ({ ...prev, selectedRound: "", selectedAppId: "" }));
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Chọn vòng phỏng vấn" />
                          </SelectTrigger>
                          <SelectContent className="border border-slate-200 bg-white text-slate-900">
                            {availableRounds.map((round) => (
                              <SelectItem key={round} value={String(round)}>
                                Vòng {round}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {fieldErrors.selectedRound ? (
                          <p className="text-xs text-rose-600">{fieldErrors.selectedRound}</p>
                        ) : null}
                      </div>
                      <div className="space-y-2 col-span-2">
                        <Label className="flex items-center gap-1.5">
                          <Users className="h-4 w-4" />
                          Chọn ứng viên
                        </Label>
                        {loadingApps ? (
                          <div className="rounded-lg border p-3 text-center text-sm text-muted-foreground">
                            Đang tải danh sách ứng viên...
                          </div>
                        ) : unscheduledApps.length === 0 ? (
                          <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-700 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-400">
                            Tất cả ứng viên của job này đã được lên lịch phỏng vấn
                          </div>
                        ) : (
                          <Select
                            value={selectedAppId}
                            onValueChange={(value) => {
                              setSelectedAppId(value);
                              const next = unscheduledApps.find((item) => item.applicationId === value)?.nextRound ?? 1;
                              setSelectedRound(next);
                              setFieldErrors((prev) => ({ ...prev, selectedAppId: "" }));
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Chọn ứng viên chưa lên lịch..." />
                            </SelectTrigger>
                            <SelectContent className="border border-slate-200 bg-white text-slate-900">
                              {unscheduledApps.map((app) => (
                                <SelectItem key={app.applicationId} value={app.applicationId}>
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
                    </div>
                  </div>
                )}

                {/* Selected candidate info */}
                {selectedApp && (
                  <div className="rounded-lg bg-gray-50 p-3 dark:bg-gray-800">
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      <span className="font-medium">Ứng viên:</span>{" "}
                      {selectedApp.candidateName}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      <span className="font-medium">Email:</span>{" "}
                      {selectedApp.candidateEmail}
                    </p>
                    {selectedApp.jobTitle && (
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        <span className="font-medium">Vị trí:</span>{" "}
                        {selectedApp.jobTitle}
                      </p>
                    )}
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      <span className="font-medium">Vòng hiện có:</span>{" "}
                      {selectedApp.maxRound ?? 0} | <span className="font-medium">Đề xuất vòng:</span>{" "}
                      {selectedApp.nextRound ?? 1}
                    </p>
                  </div>
                )}

                {/* Interview type selector */}
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Hình thức phỏng vấn</Label>
                    <Select
                      value={interviewType}
                      onValueChange={(v) => setInterviewType(v as InterviewType)}
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
                </div>

                {interviewType === "ONLINE" && (
                  <div className="rounded-lg border border-blue-100 bg-blue-50/50 p-3 dark:border-blue-900 dark:bg-blue-950/20">
                    <p className="flex items-center gap-1.5 text-xs text-blue-600 dark:text-blue-400">
                      <Video className="h-3.5 w-3.5" />
                      Link phòng WebRTC sẽ được tạo tự động sau khi lên lịch
                    </p>
                  </div>
                )}
              </>
            )}

            {/* ========== EDIT MODE: Title + Candidate (free text) ========== */}
            {!isCreateMode && (
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground" htmlFor="event-title">
                    Tiêu đề lịch
                  </label>
                  <Input
                    id="event-title"
                    value={eventTitle}
                    onChange={(e) => onTitleChange(e.target.value)}
                    placeholder="Ví dụ: Phỏng vấn vòng 2 - Nguyễn Văn A"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground" htmlFor="event-candidate">
                    Ứng viên
                  </label>
                  <Input
                    id="event-candidate"
                    value={eventCandidate}
                    onChange={(e) => onCandidateChange(e.target.value)}
                    placeholder="Nhập tên ứng viên"
                  />
                </div>
              </div>
            )}

            {!isCreateMode && editingEvent?.extendedProps?.jobTitle ? (
              <div className="rounded-lg bg-gray-50 p-3 text-sm text-gray-600 dark:bg-gray-800 dark:text-gray-300">
                <span className="font-medium">Vị trí phỏng vấn:</span> {editingEvent.extendedProps.jobTitle}
              </div>
            ) : null}

            {/* ========== Title (create mode) ========== */}
            {isCreateMode && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground" htmlFor="event-title">
                  Tiêu đề lịch
                </label>
                <Input
                  id="event-title"
                  value={eventTitle}
                  onChange={(e) => onTitleChange(e.target.value)}
                  placeholder="Ví dụ: Phỏng vấn vòng 2 - Nguyễn Văn A"
                />
              </div>
            )}

            <div className="space-y-2">
              <p className="text-sm font-medium text-foreground">Nhóm lịch</p>
              <div className="grid gap-3 sm:grid-cols-2">
                {CALENDAR_LEVELS.map((level) => {
                  const variant = CALENDAR_LEVEL_META[level].variant;
                  const styles = CALENDAR_VARIANT_STYLES[variant];
                  const active = eventLevel === level;

                  return (
                    <button
                      key={level}
                      type="button"
                      onClick={() => onLevelChange(level)}
                      className={`flex items-start gap-3 rounded-2xl border px-4 py-3 text-left transition focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:ring-offset-2 ${
                        active
                          ? "border-transparent bg-brand-500/10 shadow-sm"
                          : "border-border/60 bg-background/60 hover:bg-background"
                      }`}
                    >
                      <span className={`mt-1 size-2.5 rounded-full ${styles.indicator}`} />
                      <span>
                        <span className="block text-sm font-semibold text-foreground">
                          {CALENDAR_LEVEL_META[level].label}
                        </span>
                        <span className="mt-1 block text-xs text-muted-foreground">
                          {CALENDAR_LEVEL_META[level].description}
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground" htmlFor="event-start-date">
                  {isCreateMode ? "Ngày phỏng vấn" : "Ngày bắt đầu"}
                </label>
                <Input
                  id="event-start-date"
                  type="date"
                  ref={startDateInputRef}
                  value={eventStartDate}
                  onClick={() => openDatePicker(startDateInputRef.current)}
                  onFocus={() => openDatePicker(startDateInputRef.current)}
                    onChange={(e) => {
                      onStartDateChange(e.target.value);
                      setFieldErrors((prev) => ({ ...prev, eventStartDate: "" }));
                    }}
                  min={todayStr}
                />
                {fieldErrors.eventStartDate ? (
                  <p className="text-xs text-rose-600">{fieldErrors.eventStartDate}</p>
                ) : null}
                {isCreateMode ? (
                  <p className="text-xs text-muted-foreground">
                    Hệ thống sẽ tự tính giờ kết thúc dựa trên thời lượng bạn chọn.
                  </p>
                ) : null}
              </div>
              <div ref={timeFieldRef} className="space-y-2">
                <label className="text-sm font-medium text-foreground" htmlFor="event-start-time">
                  Giờ bắt đầu
                </label>
                <Input
                  id="event-start-time"
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

            {!isCreateMode && (
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground" htmlFor="event-end-date">
                    Ngày kết thúc
                  </label>
                  <Input
                    id="event-end-date"
                    type="date"
                    ref={endDateInputRef}
                    value={eventEndDate}
                    onClick={() => openDatePicker(endDateInputRef.current)}
                    onFocus={() => openDatePicker(endDateInputRef.current)}
                    onChange={(e) => onEndDateChange(e.target.value)}
                    min={eventStartDate || todayStr}
                  />
                  <p className="text-xs text-muted-foreground">
                    Ngày kết thúc dùng cho trường hợp lịch kéo dài qua nhiều ngày.
                  </p>
                </div>
                {editingEvent?.extendedProps?.location && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">
                      Hình thức / Link phỏng vấn
                    </label>
                    {(() => {
                      const loc = editingEvent.extendedProps.location;
                      const isLink = loc.startsWith("http") || loc.startsWith("/interview/room/");
                      return isLink ? (
                        <div className="flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 p-2.5 dark:border-blue-800 dark:bg-blue-900/20">
                          <Video className="h-4 w-4 shrink-0 text-blue-600" />
                          <a
                            href={loc.startsWith("http") ? loc : `${window.location.origin}${loc}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1 truncate text-sm text-blue-700 underline dark:text-blue-300"
                          >
                            {loc}
                          </a>
                        </div>
                      ) : (
                        <Input value={loc} readOnly className="bg-muted" />
                      );
                    })()}
                  </div>
                )}
              </div>
            )}

            <div className="grid gap-4 md:grid-cols-2">
              {isCreateMode && interviewType === "OFFLINE" && (
                <div ref={locationFieldRef} className="space-y-2">
                  <label className="text-sm font-medium text-foreground" htmlFor="event-location">
                    Địa điểm
                  </label>
                  <Input
                    id="event-location"
                    value={eventLocation}
                    onChange={(e) => {
                      onLocationChange(e.target.value);
                      setFieldErrors((prev) => ({ ...prev, eventLocation: "" }));
                    }}
                    placeholder="Ví dụ: Phòng họp tầng 5"
                  />
                  {fieldErrors.eventLocation ? (
                    <p className="text-xs text-rose-600">{fieldErrors.eventLocation}</p>
                  ) : null}
                </div>
              )}
              <div className={`space-y-2 ${isCreateMode && interviewType === "ONLINE" ? "md:col-span-2" : "md:col-span-2"}`}>
                <label className="text-sm font-medium text-foreground" htmlFor="event-notes">
                  Ghi chú
                </label>
                <Textarea
                  id="event-notes"
                  value={eventNotes}
                  onChange={(e) => onNotesChange(e.target.value)}
                  placeholder="Thông tin thêm để ứng viên và interviewer nắm rõ"
                  rows={3}
                />
              </div>
            </div>
          </div>
        </ScrollArea>
        <div className="sticky bottom-0 z-10 border-t border-border/60 bg-white px-6 py-5 dark:bg-slate-900">
          {isCreateMode ? (
            <div className="flex flex-wrap justify-end gap-3">
              <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
                Đóng
              </Button>
              <Button
                onClick={handleCreateSubmit}
                disabled={isSubmitting || !selectedAppId}
              >
                {isSubmitting ? "Đang xử lý..." : "Lên lịch phỏng vấn"}
              </Button>
            </div>
          ) : (
            <div className="flex flex-wrap items-center gap-3">
              <Button variant="destructive" onClick={handleQuickCancel} disabled={isSubmitting}>
                {isSubmitting ? "Đang xử lý..." : "Hủy lịch phỏng vấn"}
              </Button>

              <div className="ml-auto flex flex-wrap gap-3">
                <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
                  Đóng
                </Button>
                <Button onClick={handleEditSubmit} disabled={isSubmitting || !isEditFormChanged}>
                  {isSubmitting ? "Đang xử lý..." : "Lưu thay đổi"}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};
