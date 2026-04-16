import type { TypingStatus } from "@/features/messaging/types/messaging.types";

interface TypingIndicatorProps {
  users: TypingStatus[];
}

const getTypingText = (users: TypingStatus[]): string => {
  if (users.length === 0) {
    return "";
  }

  if (users.length === 1) {
    return `${users[0].displayName || "Ứng viên"} đang nhập`;
  }

  return `${users.length} người đang nhập`;
};

export function TypingIndicator({ users }: TypingIndicatorProps) {
  if (users.length === 0) {
    return null;
  }

  return (
    <div className="inline-flex items-center gap-2 rounded-lg bg-gray-100/95 px-2.5 py-1.5 text-[11px] font-medium text-gray-600 shadow-sm dark:bg-gray-800/85 dark:text-gray-300">
      <div className="flex items-center gap-1">
        <span className="typing-dot h-2 w-2 rounded-full bg-brand-500" />
        <span className="typing-dot h-2 w-2 rounded-full bg-brand-500" />
        <span className="typing-dot h-2 w-2 rounded-full bg-brand-500" />
      </div>
      <span>{getTypingText(users)}...</span>
    </div>
  );
}

export default TypingIndicator;
