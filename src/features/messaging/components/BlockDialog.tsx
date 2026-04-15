import { useEffect, useState } from "react";
import { Ban } from "lucide-react";
import { Modal } from "@/components/custom/modal";
import { Button } from "@/components/ui/button";
import type { UserSummary } from "@/features/messaging/types/messaging.types";

interface BlockDialogProps {
  open: boolean;
  candidate: UserSummary;
  onCancel: () => void;
  onConfirm: (reason?: string) => void;
}

const REASON_OPTIONS = [
  { value: "", label: "Chọn lý do..." },
  { value: "SPAM", label: "Gửi tin nhắn spam" },
  { value: "INAPPROPRIATE", label: "Nội dung không phù hợp" },
  { value: "HARASSMENT", label: "Quấy rối" },
  { value: "OTHER", label: "Lý do khác" },
] as const;

export function BlockDialog({ open, candidate, onCancel, onConfirm }: BlockDialogProps) {
  const [reason, setReason] = useState<string>("");

  useEffect(() => {
    if (open) {
      setReason("");
    }
  }, [open]);

  const displayName = `${candidate.firstName} ${candidate.lastName}`.trim() || candidate.email || "ứng viên";

  return (
    <Modal isOpen={open} onClose={onCancel} className="max-w-[560px] p-0" showCloseButton={false}>
      <div className="flex max-h-[86vh] flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white text-slate-900 shadow-[0_30px_80px_rgba(0,0,0,0.35)] dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100">
        <div className="flex items-center gap-2 border-b border-border/60 px-6 py-5">
          <Ban className="h-5 w-5 text-rose-600" />
          <h2 className="text-lg font-semibold">Chặn {displayName}</h2>
        </div>

        <div className="space-y-4 px-6 py-5">
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Sau khi chặn, {displayName} sẽ không thể gửi tin nhắn cho bạn. Bạn có thể bỏ chặn bất cứ lúc nào.
          </p>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-200" htmlFor="block-reason">
              Lý do (không bắt buộc)
            </label>
            <select
              id="block-reason"
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-700 outline-none transition focus:border-brand-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            >
              {REASON_OPTIONS.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex flex-wrap justify-end gap-3 border-t border-border/60 px-6 py-5">
          <Button type="button" variant="outline" onClick={onCancel}>
            Hủy
          </Button>
          <Button
            type="button"
            className="bg-rose-600 text-white hover:bg-rose-700"
            onClick={() => onConfirm(reason || undefined)}
          >
            Chặn ứng viên
          </Button>
        </div>
      </div>
    </Modal>
  );
}

export default BlockDialog;
