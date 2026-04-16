import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";
import { Archive, Ban, EllipsisVertical, Trash2, Undo2 } from "lucide-react";
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import BlockDialog from "@/features/messaging/components/BlockDialog";
import type { ThreadSummary } from "@/features/messaging/types/messaging.types";
import { getJobColor } from "@/features/messaging/utils/jobColor";
import { cn } from "@/lib/utils";

interface ThreadItemProps {
  thread: ThreadSummary;
  isSelected: boolean;
  onClick: () => void;
  onArchiveToggle: (thread: ThreadSummary) => Promise<void>;
  onDeleteThread: (thread: ThreadSummary) => Promise<void>;
  onBlockToggle: (thread: ThreadSummary, reason?: string) => Promise<void>;
}

type ConfirmAction = "delete" | "unblock" | null;

const toRelativeTime = (dateString: string | null): string => {
  if (!dateString) {
    return "";
  }

  const parsed = new Date(dateString);
  if (Number.isNaN(parsed.getTime())) {
    return "";
  }

  return formatDistanceToNow(parsed, {
    addSuffix: true,
    locale: vi,
  });
};

const toDisplayName = (firstName: string, lastName: string, email: string, userId: string): string => {
  const fullName = `${firstName} ${lastName}`.trim();
  if (fullName) {
    return fullName;
  }

  if (email) {
    const localPart = email.split("@")[0]?.replace(/[._-]+/g, " ").trim();
    if (localPart) {
      return localPart
        .split(" ")
        .filter(Boolean)
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(" ");
    }
  }

  const normalizedId = userId.trim();
  if (normalizedId) {
    return `Ứng viên ${normalizedId.slice(0, 8)}`;
  }

  return "Ứng viên mới";
};

const avatarFallback = (displayName: string): string => {
  const letter = displayName.trim().charAt(0);
  return letter ? letter.toUpperCase() : "U";
};

export function ThreadItem({
  thread,
  isSelected,
  onClick,
  onArchiveToggle,
  onDeleteThread,
  onBlockToggle,
}: ThreadItemProps) {
  const [confirmAction, setConfirmAction] = useState<ConfirmAction>(null);
  const [openBlockDialog, setOpenBlockDialog] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const displayName = toDisplayName(
    thread.otherUser.firstName,
    thread.otherUser.lastName,
    thread.otherUser.email,
    thread.otherUser.id
  );

  const handleArchiveToggle = async () => {
    if (submitting) {
      return;
    }

    setSubmitting(true);
    try {
      await onArchiveToggle(thread);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (submitting) {
      return;
    }

    setSubmitting(true);
    try {
      await onDeleteThread(thread);
    } finally {
      setSubmitting(false);
      setConfirmAction(null);
    }
  };

  const handleBlockWithReason = async (reason?: string) => {
    if (submitting) {
      return;
    }

    setSubmitting(true);
    try {
      await onBlockToggle(thread, reason);
    } finally {
      setSubmitting(false);
      setOpenBlockDialog(false);
      setConfirmAction(null);
    }
  };

  return (
    <>
      <div
        className={cn(
          "thread-item-hover group flex w-full items-start gap-3 rounded-2xl border px-3 py-3",
          isSelected
            ? "border-brand-300 bg-brand-50/80 dark:border-brand-400/60 dark:bg-brand-500/15"
            : "border-transparent bg-transparent hover:bg-gray-100 dark:hover:bg-gray-800/60"
        )}
      >
        <button
          type="button"
          onClick={onClick}
          className="flex min-w-0 flex-1 items-start gap-3 text-left"
        >
          <div className="relative shrink-0">
            <Avatar className="h-11 w-11 border border-gray-200 dark:border-gray-700">
              {thread.otherUser.avatarUrl ? (
                <AvatarImage src={thread.otherUser.avatarUrl} alt={displayName} />
              ) : null}
              <AvatarFallback className="text-xs font-semibold uppercase">
                {avatarFallback(displayName)}
              </AvatarFallback>
            </Avatar>

            {thread.isOnline ? (
              <span className="absolute bottom-0 right-0 block h-3.5 w-3.5 rounded-full border-2 border-white bg-emerald-500 dark:border-gray-900" />
            ) : null}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <p
                className={cn(
                  "truncate text-sm",
                  thread.unreadCount > 0
                    ? "font-semibold text-gray-900 dark:text-white"
                    : "font-medium text-gray-700 dark:text-gray-100"
                )}
              >
                {displayName}
              </p>
              <span className="shrink-0 text-[11px] text-gray-400">
                {toRelativeTime(thread.lastMessageAt)}
              </span>
            </div>

            <p className="truncate text-xs text-gray-500 dark:text-gray-400">
              {thread.primaryJob?.jobTitle || thread.application?.jobTitle || "Tin nhắn ứng viên"}
            </p>

            {thread.jobs && thread.jobs.length > 0 ? (
              <div className="thread-job-chips mt-1 flex-col">
                {thread.jobs.slice(0, 2).map((job) => (
                  <span
                    key={job.jobId}
                    className={cn("job-chip", job.unreadCount > 0 && "has-unread")}
                  >
                    <span
                      className="chip-dot"
                      style={{ background: getJobColor(job.jobId) }}
                    />
                    <span className="truncate">{job.jobTitle}</span>
                  </span>
                ))}
              </div>
            ) : null}

            <div className="mt-1 flex items-center justify-between gap-2">
              <p className="truncate text-xs text-gray-500 dark:text-gray-400">
                {thread.lastMessagePreview || "Bắt đầu cuộc trò chuyện mới"}
              </p>

              {thread.unreadCount > 0 ? (
                <Badge className="shrink-0 rounded-full bg-brand-500 px-2 py-0 text-[11px] text-white">
                  {thread.unreadCount > 99 ? "99+" : thread.unreadCount}
                </Badge>
              ) : null}
            </div>
          </div>
        </button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-gray-400 opacity-100 transition hover:bg-gray-200 hover:text-gray-600 md:opacity-0 md:group-hover:opacity-100 dark:hover:bg-gray-700"
              aria-label="Tùy chọn hội thoại"
              disabled={submitting}
            >
              <EllipsisVertical className="h-4 w-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            sideOffset={8}
            className="w-56 border border-slate-200 bg-white shadow-[0_14px_36px_rgba(15,23,42,0.22)] dark:border-slate-700 dark:bg-slate-900"
          >
            <DropdownMenuItem onClick={() => {
              void handleArchiveToggle();
            }}>
              {thread.isArchived ? <Undo2 className="h-4 w-4" /> : <Archive className="h-4 w-4" />}
              {thread.isArchived ? "Bỏ lưu trữ hội thoại" : "Lưu trữ hội thoại"}
            </DropdownMenuItem>

            <DropdownMenuItem onClick={() => setConfirmAction("delete")}>
              <Trash2 className="h-4 w-4" />
              Xóa hội thoại
            </DropdownMenuItem>

            <DropdownMenuSeparator />

            <DropdownMenuItem
              className="text-red-600 focus:text-red-700"
              onClick={() => {
                if (thread.isBlocked) {
                  setConfirmAction("unblock");
                } else {
                  setOpenBlockDialog(true);
                }
              }}
            >
              <Ban className="h-4 w-4" />
              {thread.isBlocked ? "Bỏ chặn ứng viên" : "Chặn ứng viên"}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <AlertDialog open={confirmAction === "delete"} onOpenChange={(open) => {
        if (!open) {
          setConfirmAction(null);
        }
      }}>
        <AlertDialogContent className="border-slate-200 bg-white shadow-[0_28px_80px_rgba(15,23,42,0.30)] sm:max-w-md dark:border-slate-700 dark:bg-slate-900">
          <AlertDialogHeader>
            <AlertDialogTitle>Xóa hội thoại</AlertDialogTitle>
            <AlertDialogDescription>
              Hội thoại sẽ bị xóa khỏi danh sách của bạn. Ứng viên vẫn có thể xem lịch sử tin nhắn này.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={(event) => {
                event.preventDefault();
                void handleDelete();
              }}
            >
              Xóa hội thoại
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={confirmAction === "unblock"} onOpenChange={(open) => {
        if (!open) {
          setConfirmAction(null);
        }
      }}>
        <AlertDialogContent className="border-slate-200 bg-white shadow-[0_28px_80px_rgba(15,23,42,0.30)] sm:max-w-md dark:border-slate-700 dark:bg-slate-900">
          <AlertDialogHeader>
            <AlertDialogTitle>Bỏ chặn ứng viên</AlertDialogTitle>
            <AlertDialogDescription>
              Sau khi bỏ chặn, ứng viên sẽ có thể gửi tin nhắn cho bạn như bình thường.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={(event) => {
                event.preventDefault();
                void handleBlockWithReason(undefined);
              }}
            >
              Bỏ chặn
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <BlockDialog
        open={openBlockDialog}
        candidate={thread.otherUser}
        onCancel={() => setOpenBlockDialog(false)}
        onConfirm={(reason: string | undefined) => {
          void handleBlockWithReason(reason);
        }}
      />
    </>
  );
}

export default ThreadItem;
