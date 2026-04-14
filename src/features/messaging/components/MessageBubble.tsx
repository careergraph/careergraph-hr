import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { RotateCcw, Trash2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import ReadReceipt from "@/features/messaging/components/ReadReceipt";
import type { Message, UserSummary } from "@/features/messaging/types/messaging.types";
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

const getInitials = (firstName: string, lastName: string, email: string): string => {
  const rawName = `${firstName} ${lastName}`.trim();

  if (!rawName) {
    return email.slice(0, 2).toUpperCase();
  }

  return rawName
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
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

  const sender = otherUser ?? message.sender;

  return (
    <div
      className={cn(
        "group message-bubble-enter flex w-full items-end gap-2",
        isOwn ? "justify-end" : "justify-start"
      )}
    >
      {!isOwn && showAvatar ? (
        <Avatar className="h-8 w-8 border border-gray-200 dark:border-gray-700">
          {sender.avatarUrl ? <AvatarImage src={sender.avatarUrl} alt={sender.email} /> : null}
          <AvatarFallback className="text-[11px] font-semibold uppercase">
            {getInitials(sender.firstName, sender.lastName, sender.email)}
          </AvatarFallback>
        </Avatar>
      ) : !isOwn ? (
        <div className="w-8" />
      ) : null}

      <div
        className={cn(
          "max-w-[82%] space-y-1",
          isOwn ? "items-end text-right" : "items-start text-left"
        )}
      >
        <div
          className={cn(
            "relative rounded-2xl px-3.5 py-2.5 text-sm shadow-sm",
            isOwn
              ? "bg-brand-500 text-white"
              : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100"
          )}
        >
          {canDelete ? (
            <button
              type="button"
              className="absolute -top-2 -right-2 hidden h-6 w-6 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-500 shadow-sm transition hover:text-red-500 group-hover:flex dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
              onClick={() => onDelete?.(message.id)}
              aria-label="Thu hồi tin nhắn"
              title="Thu hồi tin nhắn"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
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
            <p className="whitespace-pre-wrap wrap-break-word">{message.content}</p>
          )}
        </div>

        <div
          className={cn(
            "flex items-center gap-2 text-[11px] text-gray-400",
            isOwn ? "justify-end" : "justify-start"
          )}
        >
          <span>{toDisplayTime(message.createdAt)}</span>
          {isOwn && showReadReceipt ? <ReadReceipt message={message} /> : null}
        </div>
      </div>

      {isOwn ? <div className="w-8" /> : null}
    </div>
  );
}

export default MessageBubble;
