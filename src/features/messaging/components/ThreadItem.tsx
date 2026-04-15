import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import type { ThreadSummary } from "@/features/messaging/types/messaging.types";
import { cn } from "@/lib/utils";

interface ThreadItemProps {
  thread: ThreadSummary;
  isSelected: boolean;
  onClick: () => void;
}

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

export function ThreadItem({ thread, isSelected, onClick }: ThreadItemProps) {
  const displayName = toDisplayName(
    thread.otherUser.firstName,
    thread.otherUser.lastName,
    thread.otherUser.email,
    thread.otherUser.id
  );

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "thread-item-hover flex w-full items-start gap-3 rounded-2xl border px-3 py-3 text-left",
        isSelected
          ? "border-brand-300 bg-brand-50/80 dark:border-brand-400/60 dark:bg-brand-500/15"
          : "border-transparent bg-transparent hover:bg-gray-100 dark:hover:bg-gray-800/60"
      )}
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
          {thread.application?.jobTitle || "Tin nhắn ứng viên"}
        </p>

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
  );
}

export default ThreadItem;
