import { useState, useEffect } from "react";
import { Modal } from "@/components/custom/modal";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Video, CheckCircle2, User, Clock } from "lucide-react";
import { interviewService } from "@/services/interviewService";
import { toast } from "sonner";
import type { Interview } from "@/types/interview";

interface Participant {
  id: string;
  applicationId: string;
  candidateId: string;
  candidateName: string;
  candidateEmail?: string;
  admitStatus: string;
  slotStart?: string;
  slotEnd?: string;
  joinedAt?: string;
}

interface RecordingAssignModalProps {
  open: boolean;
  onClose: () => void;
  roomCode: string;
  recordingUrl: string | null;
  interviewId: string;
  roomInterviews?: Interview[];
}

export default function RecordingAssignModal({
  open,
  onClose,
  roomCode,
  recordingUrl,
  interviewId,
  roomInterviews = [],
}: RecordingAssignModalProps) {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loadingParticipants, setLoadingParticipants] = useState(false);
  const [selectedParticipantId, setSelectedParticipantId] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open || !roomCode) return;
    setLoadingParticipants(true);
    interviewService
      .fetchRoomParticipants(roomCode)
      .then((resp) => {
        const items: Participant[] = Array.isArray(resp?.data)
          ? resp.data
          : Array.isArray(resp)
            ? resp
            : [];
        // A kicked/removed candidate still needs to be assignable if they already joined the room.
        const eligible = items
          .filter((p) => !!p.joinedAt)
          .sort((a, b) => {
            const aTime = a.joinedAt ? new Date(a.joinedAt).getTime() : 0;
            const bTime = b.joinedAt ? new Date(b.joinedAt).getTime() : 0;
            return bTime - aTime;
          });
        setParticipants(eligible);
        const preferred = eligible.find((p) => p.admitStatus === "ADMITTED") ?? eligible[0] ?? null;
        setSelectedParticipantId(preferred?.id ?? "");
      })
      .catch(() => {
        setParticipants([]);
        setSelectedParticipantId("");
      })
      .finally(() => setLoadingParticipants(false));
  }, [open, roomCode]);

  const handleSave = async () => {
    if (!recordingUrl) {
      toast.warning("Không có URL bản ghi để lưu");
      onClose();
      return;
    }

    setSaving(true);
    try {
      const selectedParticipant = participants.find((p) => p.id === selectedParticipantId);
      const matchedInterviewId = selectedParticipant
        ? roomInterviews.find((iv) => iv.applicationId === selectedParticipant.applicationId)?.id
        : null;

      const targetInterviewId = matchedInterviewId || interviewId;

      await interviewService.saveRecording(targetInterviewId, {
        fileKey: recordingUrl,
        roomParticipantId: selectedParticipant?.id,
      });
      toast.success(
        selectedParticipantId
          ? "Đã lưu và gán bản ghi cho ứng viên"
          : "Đã lưu bản ghi (chưa gán ứng viên)"
      );
      onClose();
    } catch {
      toast.error("Không thể lưu thông tin bản ghi");
    } finally {
      setSaving(false);
    }
  };

  const handleSkip = () => {
    if (recordingUrl && interviewId) {
      interviewService
        .saveRecording(interviewId, { fileKey: recordingUrl })
        .catch(() => {});
    }
    onClose();
  };

  return (
    <Modal isOpen={open} onClose={onClose} className="max-w-130 p-0">
      <div className="flex max-h-[85vh] flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white text-slate-900 shadow-[0_30px_80px_rgba(0,0,0,0.35)]">
        {/* Header */}
        <div className="flex items-center gap-2 border-b border-border/60 px-6 py-5">
          <Video className="h-5 w-5 text-red-500" />
          <h2 className="text-lg font-semibold text-foreground">
            Gán bản ghi cho ứng viên
          </h2>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-6">
          <p className="text-sm text-muted-foreground mb-4">
            Chọn ứng viên mà bản ghi này thuộc về. Bạn có thể gán lại sau từ
            trang chi tiết.
          </p>

          {loadingParticipants ? (
            <div className="rounded-lg border p-4 text-center text-sm text-muted-foreground">
              Đang tải danh sách ứng viên...
            </div>
          ) : participants.length === 0 ? (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700">
              Chưa có ứng viên nào đã vào phòng trong phiên này.
            </div>
          ) : (
            <div className="space-y-2">
              <Label className="text-sm font-medium">Chọn ứng viên</Label>
              {participants.map((p) => {
                const isSelected = selectedParticipantId === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() =>
                      setSelectedParticipantId(isSelected ? "" : p.id)
                    }
                    className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-colors ${
                      isSelected
                        ? "border-blue-500 bg-blue-50 ring-1 ring-blue-500"
                        : "border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100">
                      <User className="h-5 w-5 text-slate-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900 truncate">
                        {p.candidateName}
                      </p>
                      {p.candidateEmail && (
                        <p className="text-xs text-muted-foreground truncate">
                          {p.candidateEmail}
                        </p>
                      )}
                     {p.slotStart && (
                        <p className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                          <Clock className="h-3 w-3" />
                          {new Date(p.slotStart).toLocaleTimeString("vi-VN", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                          {p.slotEnd &&
                            ` – ${new Date(p.slotEnd).toLocaleTimeString("vi-VN", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}`}
                        </p>
                      )}
                    </div>
                    {isSelected && (
                      <CheckCircle2 className="h-5 w-5 shrink-0 text-blue-600" />
                    )}
                    {p.admitStatus === "ADMITTED" && (
                      <span className="shrink-0 rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-medium text-blue-700">
                        Đang active
                      </span>
                    )}
                    {p.admitStatus === "COMPLETED" && (
                      <span className="shrink-0 rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-medium text-green-700">
                        Đã phỏng vấn
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex flex-wrap justify-end gap-3 border-t border-border/60 px-6 py-5">
          <Button variant="outline" onClick={handleSkip} disabled={saving}>
            Bỏ qua
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving
              ? "Đang lưu..."
              : selectedParticipantId
                ? "Lưu & gán ứng viên"
                : "Lưu bản ghi"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
