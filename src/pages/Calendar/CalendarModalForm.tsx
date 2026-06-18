import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  CALENDAR_LEVELS,
  CALENDAR_LEVEL_META,
  CALENDAR_VARIANT_STYLES,
  CalendarLevel,
  formatTimeForInput,
} from "../../lib/calendar-utils";
import { CalendarEvent } from "@/types/calendar";
import type { InterviewType, InterviewStatus } from "@/types/interview";

import { Modal } from "@/components/custom/modal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CalendarClock, Video, Briefcase, Users, X } from "lucide-react";
import { jobService } from "@/services/jobService";
import { interviewService } from "@/services/interviewService";
import { companyPipelineService } from "@/services/companyPipelineService";
import { useInterviewStore } from "@/stores/interviewStore";
import { useAuthStore } from "@/stores/authStore";
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
  eventLocation: string;
  eventNotes: string;
  onClose: () => void;
  onTitleChange: (value: string) => void;
  onCandidateChange: (value: string) => void;
  onLevelChange: (level: CalendarLevel) => void;
  onStartDateChange: (value: string) => void;
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
  eventLocation,
  eventNotes,
  onClose,
  onTitleChange,
  onCandidateChange,
  onLevelChange,
  onStartDateChange,
  onLocationChange,
  onNotesChange,
  onInterviewCreated,
}: CalendarModalFormProps) => {
  const isCreateMode = !editingEvent;
  const { createInterview } = useInterviewStore();
  const companyId = useAuthStore((state) => state.company?.id ?? state.user?.companyId ?? "");
  const todayStr = new Date().toISOString().split("T")[0];
  const scrollableSelectContentClass =
    "custom-scrollbar max-h-72 w-[var(--radix-select-trigger-width)] overflow-y-auto border bg-white text-slate-900";

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
  const [overwritePromptOpen, setOverwritePromptOpen] = useState(false);
  const [overwritePromptMessage, setOverwritePromptMessage] = useState("");
  const [cancelPromptOpen, setCancelPromptOpen] = useState(false);
  const durationPresets = [30, 45, 60, 90];
  const formErrorRef = useRef<HTMLDivElement>(null);
  const jobFieldRef = useRef<HTMLDivElement>(null);
  const appFieldRef = useRef<HTMLDivElement>(null);
  const timeFieldRef = useRef<HTMLDivElement>(null);
  const durationFieldRef = useRef<HTMLDivElement>(null);
  const locationFieldRef = useRef<HTMLDivElement>(null);
  const startDateInputRef = useRef<HTMLInputElement>(null);

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

  // Fetch jobs when modal opens in create mode
  useEffect(() => {
    if (!isOpen || !isCreateMode) return;
    setFieldErrors({});
    setFormError("");
    if (!companyId) {
      setJobs([]);
      setLoadingJobs(false);
      return;
    }
    setLoadingJobs(true);
    jobService
      .getMyCompanyJobs()
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
  }, [companyId, isOpen, isCreateMode]);

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
  }, [isAppEligible, selectedJobId, selectedRound]);

  const resolveEditingDuration = useCallback(() => {
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
  }, [editingEvent]);

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
      setOverwritePromptOpen(false);
      setOverwritePromptMessage("");
      setCancelPromptOpen(false);
    }
  }, [isOpen]);

  // Initialize startTime from editing event (edit mode)
  useEffect(() => {
    if (editingEvent?.start) {
      const time = formatTimeForInput(editingEvent.start);
      if (time) setStartTime(time);
    }
    if (editingEvent) {
      setDuration(resolveEditingDuration());
    }
  }, [editingEvent, resolveEditingDuration]);

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
    if (errors.duration) {
      durationFieldRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
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
    if (!duration || duration < 15) {
      nextErrors.duration = "Thời lượng tối thiểu là 15 phút.";
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

    setIsSubmitting(true);
    try {
      await createInterview({
        applicationId: selectedAppId,
        date: eventStartDate,
        startTime,
        durationMinutes: duration,
        type: interviewType,
        location: interviewType === "OFFLINE" ? eventLocation : undefined,
        notes: eventNotes || undefined,
        confirmOverwrite: false,
        notifyCandidate: true,
        roundNumber: selectedRound,
      });
      toast.success("Đã tạo lịch phỏng vấn thành công");
      onInterviewCreated?.();
      onClose();
    } catch (error: unknown) {
      const rawMessage = extractApiErrorMessage(error, "Không thể tạo lịch phỏng vấn");
      if (rawMessage.includes("ACTIVE_INTERVIEW")) {
        setOverwritePromptMessage(
          rawMessage.replace(/^ACTIVE_INTERVIEW_[A-Z_]+\|/, "")
        );
        setOverwritePromptOpen(true);
        return;
      }

      setFormError(rawMessage);
      setTimeout(() => formErrorRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }), 0);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmOverwrite = async () => {
    setIsSubmitting(true);
    setFormError("");
    try {
      await createInterview({
        applicationId: selectedAppId,
        date: eventStartDate,
        startTime,
        durationMinutes: duration,
        type: interviewType,
        location: interviewType === "OFFLINE" ? eventLocation : undefined,
        notes: eventNotes || undefined,
        confirmOverwrite: true,
        notifyCandidate: true,
        roundNumber: selectedRound,
      });
      setOverwritePromptOpen(false);
      setOverwritePromptMessage("");
      toast.success("Đã cập nhật lịch phỏng vấn thành công");
      onInterviewCreated?.();
      onClose();
    } catch (error: unknown) {
      setOverwritePromptOpen(false);
      setFormError(extractApiErrorMessage(error, "Không thể cập nhật lịch phỏng vấn"));
      setTimeout(() => formErrorRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }), 0);
    } finally {
      setIsSubmitting(false);
    }
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
    const oldDuration = resolveEditingDuration();
    const oldNotes = String(editingEvent.extendedProps?.notes ?? "").trim();
    const nextNotes = String(eventNotes ?? "").trim();

    const timeChanged = oldDate !== eventStartDate || oldTime !== startTime;
    const durationChanged = oldDuration !== duration;
    const notesChanged = oldNotes !== nextNotes;
    const statusChanged = !!currentStatus && currentStatus !== nextStatus;

    return timeChanged || durationChanged || notesChanged || statusChanged;
  }, [duration, editingEvent, eventLevel, eventNotes, eventStartDate, getEditingStartFromEvent, resolveEditingDuration, startTime]);

  const currentInterviewStatus = editingEvent?.extendedProps?.interviewStatus as InterviewStatus | undefined;
  const canEditCurrentInterview =
    !isCreateMode &&
    !!currentInterviewStatus &&
    ["SCHEDULED", "CONFIRMED", "PENDING_RESCHEDULE"].includes(currentInterviewStatus);
  const canCancelCurrentInterview =
    !isCreateMode &&
    !!currentInterviewStatus &&
    ["SCHEDULED", "CONFIRMED", "PENDING_RESCHEDULE"].includes(currentInterviewStatus);
  const readOnlyEditReason = useMemo(() => {
    if (isCreateMode || !currentInterviewStatus) return "";
    if (currentInterviewStatus === "CANCELLED") {
      return "Lịch này đã bị hủy hoặc đã trở thành bản ghi lịch sử sau khi dời lịch, chỉ có thể xem thông tin.";
    }
    if (currentInterviewStatus === "NO_SHOW") {
      return "Lịch này đã được đánh dấu vắng mặt, không thể chỉnh sửa hoặc hủy thêm.";
    }
    if (currentInterviewStatus === "COMPLETED") {
      return "Lịch này đã hoàn thành, không thể chỉnh sửa thêm.";
    }
    if (currentInterviewStatus === "IN_PROGRESS") {
      return "Buổi phỏng vấn đang diễn ra, không thể đổi lịch hoặc hủy từ modal này.";
    }
    return "";
  }, [currentInterviewStatus, isCreateMode]);

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
    const durationChanged = oldDuration !== duration;
    const notesChanged = oldNotes !== nextNotes;
    const statusChanged = !!currentStatus && currentStatus !== nextStatus;

    if (isCancelAction && currentStatus === "CANCELLED") {
      toast.info("Lịch phỏng vấn này đã ở trạng thái hủy.");
      return;
    }

    if (!isCancelAction && !timeChanged && !durationChanged && !notesChanged && !statusChanged) {
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
    if (!isCancelAction && (!duration || duration < 15)) {
      nextErrors.duration = "Thời lượng tối thiểu là 15 phút.";
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
          durationMinutes: duration,
          notes: nextNotes || undefined,
        });

        if (currentStatus && currentStatus !== nextStatus) {
          await interviewService.updateInterviewStatus(editingEvent.id, {
            status: nextStatus,
          });
        }
      } else {
        await interviewService.updateInterview(editingEvent.id, {
          notes: nextNotes || undefined,
          durationMinutes: duration,
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

    setCancelPromptOpen(true);
  };

  const handleConfirmCancel = async () => {
    if (!editingEvent?.id) return;

    setIsSubmitting(true);
    try {
      await interviewService.cancelInterview(editingEvent.id, "Hủy từ lịch phỏng vấn");
      setCancelPromptOpen(false);
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

  const normalizeDurationInput = (value: string) => {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) {
      setDuration(15);
      return;
    }

    setDuration(Math.min(480, Math.max(15, parsed)));
    setFieldErrors((prev) => ({ ...prev, duration: "" }));
  };

  const computedEndDateTime = useMemo(() => {
    if (!eventStartDate || !startTime || !duration) return "";
    const start = new Date(`${eventStartDate}T${startTime}:00`);
    if (!Number.isFinite(start.getTime())) return "";

    const end = new Date(start.getTime() + duration * 60_000);
    return end.toLocaleString("vi-VN", {
      weekday: "short",
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  }, [duration, eventStartDate, startTime]);

  const isPromptOpen = overwritePromptOpen || cancelPromptOpen;

  return (
    <Modal
      isOpen={isOpen}
      onClose={isPromptOpen ? () => undefined : onClose}
      className="max-w-[760px] p-0"
      showCloseButton={!isPromptOpen}
    >
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
            {!isCreateMode && readOnlyEditReason ? (
              <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-300">
                {readOnlyEditReason}
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
                      <SelectContent className={`${scrollableSelectContentClass} max-w-[min(36rem,var(--radix-select-trigger-width))] border-gray-400 pr-1`}>
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
                            <SelectContent className="max-h-72 w-[var(--radix-select-trigger-width)] border border-slate-200 bg-white text-slate-900">
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
                            <SelectContent className={`${scrollableSelectContentClass} border-slate-200 pr-1`}>
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
                  <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 dark:border-slate-800 dark:bg-slate-900/60">
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
                <div className="grid gap-4 md:grid-cols-1">
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
                    disabled
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
                    disabled
                  />
                </div>
              </div>
            )}

            {!isCreateMode && editingEvent?.extendedProps?.jobTitle ? (
              <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 text-sm text-gray-600 dark:border-slate-800 dark:bg-slate-900/60 dark:text-gray-300">
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

            <div className="space-y-3 rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-sm">
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
                      onClick={() => {
                        if (!isCreateMode && !canEditCurrentInterview) return;
                        onLevelChange(level);
                      }}
                      disabled={!isCreateMode && !canEditCurrentInterview}
                      className={`flex items-start gap-3 rounded-2xl border px-4 py-3 text-left transition focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:ring-offset-2 ${
                        active
                          ? "border-transparent bg-brand-500/10 shadow-sm"
                          : "border-border/60 bg-background/60 hover:bg-background"
                      } ${!isCreateMode && !canEditCurrentInterview ? "cursor-not-allowed opacity-60" : ""}`}
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

            <div className="grid gap-4 rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-sm md:grid-cols-2">
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
                  disabled={!isCreateMode && !canEditCurrentInterview}
                />
                {fieldErrors.eventStartDate ? (
                  <p className="text-xs text-rose-600">{fieldErrors.eventStartDate}</p>
                ) : null}
                <p className="text-xs text-muted-foreground">
                  {isCreateMode
                    ? "Hệ thống sẽ tự tính giờ kết thúc dựa trên thời lượng bạn chọn."
                    : "Chỉ cần thay ngày bắt đầu và thời lượng, hệ thống sẽ tự cập nhật mốc kết thúc."}
                </p>
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
                  disabled={!isCreateMode && !canEditCurrentInterview}
                />
                {fieldErrors.startTime ? (
                  <p className="text-xs text-rose-600">{fieldErrors.startTime}</p>
                ) : null}
              </div>
            </div>

            <div className="grid gap-4 rounded-2xl border border-slate-200 bg-slate-50/80 p-4 md:grid-cols-[minmax(0,1fr)_220px]">
              <div ref={durationFieldRef} className="space-y-2">
                <label className="text-sm font-medium text-foreground" htmlFor="event-duration">
                  Thời lượng
                </label>
                <div className="mb-3 flex flex-wrap gap-2">
                  {durationPresets.map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => normalizeDurationInput(String(preset))}
                      disabled={!isCreateMode && !canEditCurrentInterview}
                      className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                        duration === preset
                          ? "border-brand-500 bg-brand-500 text-white"
                          : "border-slate-200 bg-white text-slate-600 hover:border-brand-200 hover:text-brand-700"
                      } ${!isCreateMode && !canEditCurrentInterview ? "cursor-not-allowed opacity-60" : ""}`}
                    >
                      {preset} phút
                    </button>
                  ))}
                </div>
                <Input
                  id="event-duration"
                  type="number"
                  min={15}
                  max={480}
                  step={15}
                  value={String(duration)}
                  onChange={(e) => normalizeDurationInput(e.target.value)}
                  disabled={!isCreateMode && !canEditCurrentInterview}
                />
                {fieldErrors.duration ? (
                  <p className="text-xs text-rose-600">{fieldErrors.duration}</p>
                ) : null}
                <p className="text-xs text-muted-foreground">
                  Dùng số phút để đội tuyển dụng dễ so khớp availability và reschedule sau này.
                </p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                  Kết thúc dự kiến
                </p>
                <p className="mt-2 text-base font-semibold text-slate-900">
                  {computedEndDateTime || "Chưa đủ thông tin"}
                </p>
                <p className="mt-2 text-xs text-slate-500">
                  Tự động tính từ ngày bắt đầu, giờ bắt đầu và thời lượng.
                </p>
              </div>
            </div>

            {!isCreateMode && editingEvent?.extendedProps?.location && (
              <div className="space-y-2 rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-sm">
                <label className="text-sm font-medium text-foreground">
                  Hình thức / Link phỏng vấn
                </label>
                {(() => {
                  const loc = editingEvent.extendedProps.location;
                  const isLink = loc.startsWith("http") || loc.startsWith("/interview/room/");
                  return isLink ? (
                    <div className="flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 p-3 dark:border-blue-800 dark:bg-blue-900/20">
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
                  disabled={!isCreateMode && !canEditCurrentInterview}
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
              <div className="pl-3">
                {canCancelCurrentInterview ? (
                  <Button variant="destructive" onClick={handleQuickCancel} disabled={isSubmitting}>
                    {isSubmitting ? "Đang xử lý..." : "Hủy lịch phỏng vấn"}
                  </Button>
                ) : null}
              </div>
              <div className="ml-auto flex flex-wrap gap-3">
                <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
                  Đóng
                </Button>
                {canEditCurrentInterview ? (
                  <Button onClick={handleEditSubmit} disabled={isSubmitting || !isEditFormChanged}>
                    {isSubmitting ? "Đang xử lý..." : "Lưu thay đổi"}
                  </Button>
                ) : null}
              </div>
            </div>
          )}
        </div>
      </div>
      <AlertDialog open={overwritePromptOpen} onOpenChange={setOverwritePromptOpen}>
        <AlertDialogContent
          className="border-slate-200 bg-white shadow-[0_28px_80px_rgba(15,23,42,0.30)] sm:max-w-md dark:border-slate-700 dark:bg-slate-900"
          onInteractOutside={(event) => event.preventDefault()}
          onPointerDownOutside={(event) => event.preventDefault()}
        >
          <AlertDialogCancel
            className="absolute right-4 top-4 mt-0 h-9 w-9 min-w-0 rounded-full border-0 p-0 text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
            disabled={isSubmitting}
            aria-label="Đóng xác nhận ghi đè lịch"
          >
            <X className="h-4 w-4" />
          </AlertDialogCancel>
          <AlertDialogHeader>
            <AlertDialogTitle>Ghi đè lịch phỏng vấn hiện tại</AlertDialogTitle>
            <AlertDialogDescription>
              {overwritePromptMessage || "Ứng viên đang có một lịch phỏng vấn còn hiệu lực cho vị trí này. Xác nhận để hủy lịch hiện tại và tạo lịch mới."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>Giữ lịch hiện tại</AlertDialogCancel>
            <AlertDialogAction
              className="bg-brand-600 hover:bg-brand-700"
              disabled={isSubmitting}
              onClick={(event) => {
                event.preventDefault();
                void handleConfirmOverwrite();
              }}
            >
              {isSubmitting ? "Đang xử lý..." : "Xác nhận ghi đè"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <AlertDialog open={cancelPromptOpen} onOpenChange={setCancelPromptOpen}>
        <AlertDialogContent
          className="border-slate-200 bg-white shadow-[0_28px_80px_rgba(15,23,42,0.30)] sm:max-w-md dark:border-slate-700 dark:bg-slate-900"
          onInteractOutside={(event) => event.preventDefault()}
          onPointerDownOutside={(event) => event.preventDefault()}
        >
          <AlertDialogCancel
            className="absolute right-4 top-4 mt-0 h-9 w-9 min-w-0 rounded-full border-0 p-0 text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
            disabled={isSubmitting}
            aria-label="Đóng xác nhận hủy lịch"
          >
            <X className="h-4 w-4" />
          </AlertDialogCancel>
          <AlertDialogHeader>
            <AlertDialogTitle>Hủy lịch phỏng vấn</AlertDialogTitle>
            <AlertDialogDescription>
              Lịch hiện tại sẽ chuyển sang trạng thái đã hủy và vẫn hiển thị trong lịch sử của ứng viên. Bạn có muốn tiếp tục không?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>Giữ lịch</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              disabled={isSubmitting}
              onClick={(event) => {
                event.preventDefault();
                void handleConfirmCancel();
              }}
            >
              {isSubmitting ? "Đang xử lý..." : "Xác nhận hủy lịch"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Modal>
  );
};
