import { useState } from "react";
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
import type { CreateInterviewRequest, InterviewType } from "@/types/interview";
import { toast } from "sonner";

interface ScheduleInterviewModalProps {
  open: boolean;
  onClose: () => void;
  applicationId: string;
  candidateName?: string;
  jobTitle?: string;
}

export default function ScheduleInterviewModal({
  open,
  onClose,
  applicationId,
  candidateName,
  jobTitle,
}: ScheduleInterviewModalProps) {
  const { createInterview, isLoading } = useInterviewStore();

  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("09:00");
  const [duration, setDuration] = useState<number>(60);
  const [type, setType] = useState<InterviewType>("ONLINE");
  const [location, setLocation] = useState("");
  const [notes, setNotes] = useState("");

  const resetForm = () => {
    setDate("");
    setStartTime("09:00");
    setDuration(60);
    setType("ONLINE");
    setLocation("");
    setNotes("");
  };

  const handleSubmit = async () => {
    if (!date || !startTime) {
      toast.error("Vui lòng nhập ngày và giờ bắt đầu");
      return;
    }

    if (type === "OFFLINE" && !location) {
      toast.error("Vui lòng nhập địa điểm cho phỏng vấn offline");
      return;
    }

    const request: CreateInterviewRequest = {
      applicationId,
      date,
      startTime,
      durationMinutes: duration,
      type,
      location: type === "OFFLINE" ? location : undefined,
      notes: notes || undefined,
      notifyCandidate: true,
    };

    try {
      await createInterview(request);
      toast.success("Đã lên lịch phỏng vấn thành công");
      resetForm();
      onClose();
    } catch {
      toast.error("Không thể lên lịch phỏng vấn");
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Lên lịch phỏng vấn</DialogTitle>
        </DialogHeader>

        {(candidateName || jobTitle) && (
          <div className="rounded-lg bg-gray-50 p-3 dark:bg-gray-800">
            {candidateName && (
              <p className="text-sm text-gray-600 dark:text-gray-300">
                <span className="font-medium">Ứng viên:</span> {candidateName}
              </p>
            )}
            {jobTitle && (
              <p className="text-sm text-gray-600 dark:text-gray-300">
                <span className="font-medium">Vị trí:</span> {jobTitle}
              </p>
            )}
          </div>
        )}

        <div className="grid gap-4 py-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="interview-date">Ngày</Label>
              <Input
                id="interview-date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                min={new Date().toISOString().split("T")[0]}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="interview-time">Giờ bắt đầu</Label>
              <Input
                id="interview-time"
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
              <Select value={type} onValueChange={(v) => setType(v as InterviewType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ONLINE">Online</SelectItem>
                  <SelectItem value="OFFLINE">Offline</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {type === "OFFLINE" && (
            <div className="space-y-2">
              <Label htmlFor="interview-location">Địa điểm</Label>
              <Input
                id="interview-location"
                placeholder="Ví dụ: Phòng họp tầng 5"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="interview-notes">Ghi chú</Label>
            <Textarea
              id="interview-notes"
              placeholder="Ghi chú cho buổi phỏng vấn..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Hủy
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading}>
            {isLoading ? "Đang xử lý..." : "Lên lịch"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
