import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
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
import type { CreateInterviewRequest, Interview, InterviewType } from "@/types/interview";
import { toast } from "sonner";
import { Video, Copy, ExternalLink, CheckCircle2, Users } from "lucide-react";

interface UnscheduledApp {
  applicationId: string;
  candidateId: string;
  candidateName: string;
  candidateEmail: string;
  jobTitle: string;
  currentStage: string;
  appliedDate: string;
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
  const [selectedAppId, setSelectedAppId] = useState(preselectedApplicationId || "");
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("09:00");
  const [duration, setDuration] = useState<number>(60);
  const [type, setType] = useState<InterviewType>("ONLINE");
  const [location, setLocation] = useState("");
  const [notes, setNotes] = useState("");

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
        const apps: UnscheduledApp[] = resp?.data ?? [];
        setUnscheduledApps(apps);
      })
      .catch(() => {
        setUnscheduledApps([]);
      })
      .finally(() => setLoadingApps(false));
  }, [open, jobId]);

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

  const handleSubmit = async () => {
    if (!selectedAppId) {
      toast.error("Vui lòng chọn ứng viên");
      return;
    }
    if (!date || !startTime) {
      toast.error("Vui lòng nhập ngày và giờ bắt đầu");
      return;
    }
    if (type === "OFFLINE" && !location) {
      toast.error("Vui lòng nhập địa điểm cho phỏng vấn offline");
      return;
    }

    const request: CreateInterviewRequest = {
      applicationId: selectedAppId,
      date,
      startTime,
      durationMinutes: duration,
      type,
      location: type === "OFFLINE" ? location : undefined,
      notes: notes || undefined,
      notifyCandidate: true,
    };

    try {
      const interview = await createInterview(request);
      toast.success("Đã lên lịch phỏng vấn thành công");
      setScheduledResult(interview);
      onScheduled(selectedAppId, interview);
    } catch {
      toast.error("Không thể lên lịch phỏng vấn");
    }
  };

  const meetingUrl = scheduledResult?.meetingLink
    ? `${window.location.origin}/interview/room/${scheduledResult.meetingLink}`
    : null;

  const handleCopyLink = () => {
    if (meetingUrl) {
      navigator.clipboard.writeText(meetingUrl);
      setCopied(true);
      toast.success("Đã sao chép link phỏng vấn");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="sm:max-w-[560px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Video className="h-5 w-5 text-blue-600" />
            Lên lịch phỏng vấn
          </DialogTitle>
        </DialogHeader>

        {/* Success state: show meeting link */}
        {scheduledResult ? (
          <div className="space-y-4 py-2">
            <div className="flex items-center gap-2 rounded-lg bg-green-50 p-4 dark:bg-green-900/20">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              <div>
                <p className="font-medium text-green-800 dark:text-green-300">
                  Đã lên lịch phỏng vấn thành công!
                </p>
                <p className="text-sm text-green-600 dark:text-green-400">
                  {displayName} -{" "}
                  {new Date(scheduledResult.scheduledAt).toLocaleString("vi-VN")}
                </p>
              </div>
            </div>

            {scheduledResult.type === "ONLINE" && meetingUrl && (
              <div className="space-y-3">
                <Label className="text-sm font-medium">
                  Link phòng phỏng vấn WebRTC
                </Label>
                <div className="flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 p-3 dark:border-blue-800 dark:bg-blue-900/20">
                  <Video className="h-4 w-4 shrink-0 text-blue-600" />
                  <span className="flex-1 truncate text-sm text-blue-700 dark:text-blue-300">
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

            <DialogFooter>
              <Button onClick={handleClose}>Đóng</Button>
            </DialogFooter>
          </div>
        ) : (
          <>
            {/* Candidate selector */}
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
                <Select value={selectedAppId} onValueChange={setSelectedAppId} disabled={!!preselectedApplicationId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn ứng viên chưa lên lịch..." />
                  </SelectTrigger>
                  <SelectContent>
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
            </div>

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

            {/* Scheduling form */}
            <div className="grid gap-4 py-2">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="kanban-interview-date">Ngày</Label>
                  <Input
                    id="kanban-interview-date"
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    min={new Date().toISOString().split("T")[0]}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="kanban-interview-time">Giờ bắt đầu</Label>
                  <Input
                    id="kanban-interview-time"
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                  />
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
                    <SelectContent>
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
                    <SelectContent>
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
                    id="kanban-interview-location"
                    placeholder="Ví dụ: Phòng họp tầng 5"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                  />
                </div>
              )}

              {type === "ONLINE" && (
                <div className="rounded-lg border border-blue-100 bg-blue-50/50 p-3 dark:border-blue-900 dark:bg-blue-950/20">
                  <p className="flex items-center gap-1.5 text-xs text-blue-600 dark:text-blue-400">
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

            <DialogFooter>
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
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
