import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { useEffect, useRef, useState } from "react";
import { MoreHorizontal, RotateCcw, Undo2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import ReadReceipt from "@/features/messaging/components/ReadReceipt";
import useUnsendCountdown from "@/features/messaging/hooks/useUnsendCountdown";
import type { Message, UserSummary } from "@/features/messaging/types/messaging.types";
import { getJobColor } from "@/features/messaging/utils/jobColor";
import { cn } from "@/lib/utils";

interface MessageBubbleProps {
  message: Message;
  isOwn: boolean;
  showAvatar: boolean;
  showReadReceipt?: boolean;
  otherUser?: UserSummary;
  onDelete?: (messageId: string) => void;
  onRetry?: (messageId: string) => void;
}

const getAvatarFallback = (sender: UserSummary): string => {
  const rawName = `${sender.firstName} ${sender.lastName}`.trim();

  if (rawName) {
    return rawName.charAt(0).toUpperCase();
  }

  if (sender.email) {
    return sender.email.charAt(0).toUpperCase();
  }

  return "HR";
};

const toDisplayTime = (value: string): string => {
  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return "";
  }

  return format(parsed, "HH:mm, dd/MM", { locale: vi });
};

export function MessageBubble({
  message,
  isOwn,
  showAvatar,
  showReadReceipt = false,
  otherUser,
  onDelete,
  onRetry,
}: MessageBubbleProps) {
  const canDelete = isOwn && !message.deleted && !message.id.startsWith("temp-");
  const canRetry = isOwn && message.localStatus === "failed";
  const { canUnsend, secondsLeft, urgent } = useUnsendCountdown(message.createdAt);
  const [isActionMenuOpen, setIsActionMenuOpen] = useState(false);
  const actionMenuRef = useRef<HTMLDivElement | null>(null);

  const sender = otherUser ?? message.sender;

  useEffect(() => {
    if (!isActionMenuOpen) {
      return;
    }

    const handlePointerDown = (event: PointerEvent) => {
      if (!actionMenuRef.current) {
        return;
      }

      if (!actionMenuRef.current.contains(event.target as Node)) {
        setIsActionMenuOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsActionMenuOpen(false);
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isActionMenuOpen]);

  return (
    <div
      className={cn(
        "message-bubble-enter flex w-full min-w-0 items-end gap-2",
        isOwn ? "justify-end" : "justify-start"
      )}
    >
      {!isOwn && showAvatar ? (
        <Avatar className="h-8 w-8 border border-gray-200 dark:border-gray-700">
          {sender.avatarUrl ? <AvatarImage src={sender.avatarUrl} alt={sender.email} /> : null}
          <AvatarFallback className="text-[11px] font-semibold uppercase">
            {getAvatarFallback(sender)}
          </AvatarFallback>
        </Avatar>
      ) : !isOwn ? (
        <div className="w-8" />
      ) : null}

      <div
        className={cn(
          "group flex min-w-0 max-w-[90%] flex-col space-y-1 sm:max-w-[85%] md:max-w-[75%] lg:max-w-[70%]",
          isOwn ? "items-end text-right" : "items-start text-left"
        )}
      >
        <div
          className={cn(
            "relative inline-flex w-fit min-w-0 max-w-full rounded-2xl px-3 py-2 text-sm shadow-sm md:px-3.5 md:py-2.5",
            isOwn
              ? "bg-brand-500 text-white"
              : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100"
          )}
        >
          {canDelete ? (
            <div
              ref={actionMenuRef}
              className="absolute -top-3 right-0 z-20 opacity-0 pointer-events-none transition-opacity duration-150 group-hover:opacity-100 group-hover:pointer-events-auto"
            >
              <button
                type="button"
                className="flex h-7 w-7 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-500 shadow-sm transition hover:text-gray-700 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
                aria-label="Tùy chọn tin nhắn"
                aria-expanded={isActionMenuOpen}
                onClick={() => setIsActionMenuOpen((current) => !current)}
              >
                <MoreHorizontal className="h-3.5 w-3.5" />
              </button>

              {isActionMenuOpen ? (
                <div className="absolute right-0 top-full mt-2 w-48 overflow-hidden rounded-2xl border border-slate-200 bg-white p-1 shadow-[0_14px_36px_rgba(15,23,42,0.22)] dark:border-slate-700 dark:bg-slate-900">
                  {canUnsend ? (
                    <button
                      type="button"
                      className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-red-600 transition hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-500/10"
                      onClick={() => {
                        setIsActionMenuOpen(false);
                        onDelete?.(message.id);
                      }}
                    >
                      <Undo2 className="h-4 w-4" />
                      <span>Gỡ tin nhắn</span>
                      <span
                        className={cn(
                          "ml-auto text-[11px] font-semibold",
                          urgent ? "text-red-500" : "text-gray-400"
                        )}
                      >
                        {secondsLeft}s
                      </span>
                    </button>
                  ) : (
                    <div className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-gray-400">
                      <Undo2 className="h-4 w-4" />
                      <span>Không thể gỡ</span>
                    </div>
                  )}
                </div>
              ) : null}
            </div>
          ) : null}

          {canRetry ? (
            <button
              type="button"
              className="absolute -top-2 -right-2 hidden h-6 w-6 items-center justify-center rounded-full border border-red-200 bg-red-50 text-red-500 shadow-sm transition hover:bg-red-100 group-hover:flex"
              onClick={() => onRetry?.(message.id)}
              aria-label="Gửi lại tin nhắn"
              title="Gửi lại"
            >
              <RotateCcw className="h-3.5 w-3.5" />
            </button>
          ) : null}

          {message.deleted ? (
            <p className="italic opacity-80">Tin nhắn đã được thu hồi</p>
          ) : (
            <p
              className="block max-w-full whitespace-pre-wrap break-words"
              style={{ overflowWrap: "anywhere", wordBreak: "break-word" }}
            >
              {message.content}
            </p>
          )}
        </div>

        <div
          className={cn(
            "flex items-center gap-2 text-[11px] text-gray-400",
            isOwn ? "justify-end" : "justify-start"
          )}
        >
          {message.jobContext ? (
            <span className="msg-job-tag">
              <span
                className="job-tag-dot"
                style={{ background: getJobColor(message.jobContext.jobId) }}
              />
              <span>{message.jobContext.jobTitle}</span>
            </span>
          ) : null}
          <span>{toDisplayTime(message.createdAt)}</span>
          {isOwn && showReadReceipt ? <ReadReceipt message={message} /> : null}
        </div>
      </div>

    </div>
  );
}

export default MessageBubble;
