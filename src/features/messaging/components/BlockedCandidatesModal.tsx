import { useEffect, useMemo, useState } from "react";
import { Ban, Loader2, ShieldX, UserRoundMinus } from "lucide-react";
import { Modal } from "@/components/custom/modal";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import messagingApi from "@/features/messaging/api/messagingApi";
import type { BlockedUserDto } from "@/features/messaging/types/messaging.types";
import { toast } from "sonner";

interface BlockedCandidatesModalProps {
  open: boolean;
  onClose: () => void;
  onUpdated?: () => Promise<void> | void;
}

const toDisplayName = (user: BlockedUserDto): string => {
  const fullName = user.fullName.trim();
  if (fullName) {
    return fullName;
  }

  if (user.email) {
    return user.email;
  }

  return "Ứng viên";
};

const firstLetter = (value: string): string => {
  const char = value.trim().charAt(0);
  return char ? char.toUpperCase() : "U";
};

const formatBlockedAt = (value: string): string => {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return "Không rõ thời gian";
  }

  return parsed.toLocaleString("vi-VN");
};

export function BlockedCandidatesModal({ open, onClose, onUpdated }: BlockedCandidatesModalProps) {
  const [items, setItems] = useState<BlockedUserDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState("");
  const [unblockingUserId, setUnblockingUserId] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    setLoading(true);
    messagingApi
      .getBlockedUsers()
      .then((result) => {
        setItems(result);
      })
      .catch((error: unknown) => {
        const message = error instanceof Error ? error.message : "Không thể tải danh sách ứng viên đã chặn.";
        toast.error(message);
        setItems([]);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [open]);

  const filteredItems = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) {
      return items;
    }

    return items.filter((item) => {
      const fullName = item.fullName.toLowerCase();
      const email = item.email.toLowerCase();
      const reason = (item.reason ?? "").toLowerCase();

      return (
        fullName.includes(normalized) ||
        email.includes(normalized) ||
        reason.includes(normalized)
      );
    });
  }, [items, query]);

  const handleUnblock = async (userId: string) => {
    if (unblockingUserId) {
      return;
    }

    setUnblockingUserId(userId);
    try {
      await messagingApi.unblockUser(userId);
      setItems((previous) => previous.filter((item) => item.userId !== userId));
      toast.success("Đã bỏ chặn ứng viên");
      await onUpdated?.();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Không thể bỏ chặn ứng viên.";
      toast.error(message);
    } finally {
      setUnblockingUserId(null);
    }
  };

  return (
    <Modal isOpen={open} onClose={onClose} className="max-w-[760px] p-0" showCloseButton={false}>
      <div className="flex max-h-[86vh] min-h-[420px] flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white text-slate-900 shadow-[0_30px_80px_rgba(0,0,0,0.35)] dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100">
        <div className="flex items-center justify-between gap-3 border-b border-border/60 px-5 py-4 sm:px-6 sm:py-5">
          <div className="flex items-center gap-2">
            <ShieldX className="h-5 w-5 text-rose-600" />
            <h2 className="text-base font-semibold sm:text-lg">Quản lý ứng viên đã chặn</h2>
          </div>

          <Button type="button" variant="outline" onClick={onClose}>
            Đóng
          </Button>
        </div>

        <div className="flex min-h-0 flex-1 flex-col gap-4 px-5 py-4 sm:px-6 sm:py-5">
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Tìm theo tên, email hoặc lý do chặn..."
            className="h-10 rounded-xl border-slate-200 bg-slate-50 text-sm dark:border-slate-700 dark:bg-slate-800"
          />

          <div className="custom-scrollbar min-h-0 flex-1 overflow-y-auto pr-1">
            {loading ? (
              <div className="flex h-full items-center justify-center gap-2 text-sm text-slate-500 dark:text-slate-300">
                <Loader2 className="h-4 w-4 animate-spin" />
                Đang tải danh sách ứng viên đã chặn...
              </div>
            ) : null}

            {!loading && filteredItems.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 px-4 py-10 text-center dark:border-slate-700">
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-300">
                  <Ban className="h-6 w-6" />
                </div>
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                  Không có ứng viên bị chặn
                </p>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  Danh sách này sẽ hiển thị các ứng viên bạn đã chặn trong trò chuyện.
                </p>
              </div>
            ) : null}

            {!loading ? (
              <div className="space-y-2">
                {filteredItems.map((item) => {
                  const displayName = toDisplayName(item);
                  const isPending = unblockingUserId === item.userId;

                  return (
                    <div
                      key={item.userId}
                      className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 sm:flex-row sm:items-center sm:justify-between dark:border-slate-700 dark:bg-slate-800"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <Avatar className="h-10 w-10 border border-slate-200 dark:border-slate-600">
                          {item.avatarUrl ? <AvatarImage src={item.avatarUrl} alt={displayName} /> : null}
                          <AvatarFallback className="text-xs font-semibold uppercase">
                            {firstLetter(displayName)}
                          </AvatarFallback>
                        </Avatar>

                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">
                            {displayName}
                          </p>
                          <p className="truncate text-xs text-slate-500 dark:text-slate-400">{item.email}</p>
                          <p className="text-[11px] text-slate-400 dark:text-slate-500">
                            Bị chặn lúc: {formatBlockedAt(item.blockedAt)}
                          </p>
                          {item.reason ? (
                            <p className="mt-1 inline-flex items-center gap-1 rounded-md bg-rose-100 px-2 py-0.5 text-[11px] text-rose-700 dark:bg-rose-500/20 dark:text-rose-300">
                              <UserRoundMinus className="h-3 w-3" />
                              Lý do: {item.reason}
                            </p>
                          ) : null}
                        </div>
                      </div>

                      <Button
                        type="button"
                        variant="outline"
                        className="shrink-0"
                        disabled={isPending}
                        onClick={() => {
                          void handleUnblock(item.userId);
                        }}
                      >
                        {isPending ? "Đang xử lý..." : "Bỏ chặn"}
                      </Button>
                    </div>
                  );
                })}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </Modal>
  );
}

export default BlockedCandidatesModal;
