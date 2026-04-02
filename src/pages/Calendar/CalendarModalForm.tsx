import { useEffect, useRef, useState } from "react";
import {
  CALENDAR_LEVELS,
  CALENDAR_LEVEL_META,
  CALENDAR_VARIANT_STYLES,
  CalendarLevel,
  formatTimeForInput,
} from "../../lib/calendar-utils";
import { CalendarEvent } from "@/types/calendar";
import type { InterviewType, CreateInterviewRequest } from "@/types/interview";

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
import { useInterviewStore } from "@/stores/interviewStore";
import { toast } from "sonner";

interface UnscheduledApp {
  applicationId: string;
  candidateId: string;
  candidateName: string;
  candidateEmail: string;
  jobTitle: string;
  currentStage: string;
  appliedDate: string;
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
  onSubmit: () => void;
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
  onSubmit,
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

  // Internal state for create mode
  const [jobs, setJobs] = useState<JobOption[]>([]);
  const [selectedJobId, setSelectedJobId] = useState("");
  const [unscheduledApps, setUnscheduledApps] = useState<UnscheduledApp[]>([]);
  const [selectedAppId, setSelectedAppId] = useState("");
  const [interviewType, setInterviewType] = useState<InterviewType>("ONLINE");
  const [startTime, setStartTime] = useState("09:00");
  const [duration, setDuration] = useState<number>(60);
  const [loadingJobs, setLoadingJobs] = useState(false);
  const [loadingApps, setLoadingApps] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const startDateInputRef = useRef<HTMLInputElement>(null);
  const endDateInputRef = useRef<HTMLInputElement>(null);

  // Fetch jobs when modal opens in create mode
  useEffect(() => {
    if (!isOpen || !isCreateMode) return;
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

  // Fetch unscheduled candidates when job changes
  useEffect(() => {
    if (!selectedJobId) {
      setUnscheduledApps([]);
      setSelectedAppId("");
      return;
    }
    setLoadingApps(true);
    interviewService
      .fetchUnscheduledByJob(selectedJobId)
      .then((resp) => {
        setUnscheduledApps(resp?.data ?? []);
      })
      .catch(() => setUnscheduledApps([]))
      .finally(() => setLoadingApps(false));
  }, [selectedJobId]);

  // Reset internal state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setSelectedJobId("");
      setSelectedAppId("");
      setInterviewType("ONLINE");
      setStartTime("09:00");
      setDuration(60);
      setUnscheduledApps([]);
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

  const handleCreateSubmit = async () => {
    if (!selectedAppId) {
      toast.error("Vui lòng chọn ứng viên");
      return;
    }
    if (!eventStartDate) {
      toast.error("Vui lòng chọn ngày phỏng vấn");
      return;
    }
    if (interviewType === "OFFLINE" && !eventLocation) {
      toast.error("Vui lòng nhập địa điểm cho phỏng vấn offline");
      return;
    }

    const request: CreateInterviewRequest = {
      applicationId: selectedAppId,
      date: eventStartDate,
      startTime,
      durationMinutes: duration,
      type: interviewType,
      location: interviewType === "OFFLINE" ? eventLocation : undefined,
      notes: eventNotes || undefined,
      notifyCandidate: true,
    };

    setIsSubmitting(true);
    try {
      await createInterview(request);
      toast.success("Đã tạo lịch phỏng vấn thành công");
      onInterviewCreated?.();
      onClose();
    } catch {
      toast.error("Không thể tạo lịch phỏng vấn");
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
            Lịch tuyển dụng
          </Badge>
        </div>
        <ScrollArea className="flex-1 h-full px-6 py-6 overflow-y-auto">
          <div className="grid gap-5 p-4">
            {/* ========== CREATE MODE: Job → Candidate → Type ========== */}
            {isCreateMode && (
              <>
                {/* Job selector */}
                <div className="space-y-2">
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
                    <Select value={selectedJobId} onValueChange={setSelectedJobId}>
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
                </div>

                {/* Candidate selector (appears after job is selected) */}
                {selectedJobId && (
                  <div className="space-y-2">
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
                      <Select value={selectedAppId} onValueChange={setSelectedAppId}>
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
                  onChange={(e) => onStartDateChange(e.target.value)}
                  min={isCreateMode ? new Date().toISOString().split("T")[0] : undefined}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground" htmlFor="event-start-time">
                  Giờ bắt đầu
                </label>
                <Input
                  id="event-start-time"
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                />
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
                  />
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
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground" htmlFor="event-location">
                    Địa điểm
                  </label>
                  <Input
                    id="event-location"
                    value={eventLocation}
                    onChange={(e) => onLocationChange(e.target.value)}
                    placeholder="Ví dụ: Phòng họp tầng 5"
                  />
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
        <div className="flex flex-wrap justify-end gap-3 border-t border-border/60 px-6 py-5">
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Huỷ
          </Button>
          {isCreateMode ? (
            <Button
              onClick={handleCreateSubmit}
              disabled={isSubmitting || !selectedAppId}
            >
              {isSubmitting ? "Đang xử lý..." : "Lên lịch phỏng vấn"}
            </Button>
          ) : (
            <Button onClick={onSubmit}>
              Lưu thay đổi
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
};
