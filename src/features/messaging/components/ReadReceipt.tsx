import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";
import type { Message } from "@/features/messaging/types/messaging.types";

interface ReadReceiptProps {
  message: Message;
}

const toRelativeTime = (dateString?: string): string => {
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

export function ReadReceipt({ message }: ReadReceiptProps) {
  if (message.localStatus === "failed") {
    return (
      <span className="text-[11px] font-medium text-red-500">Gửi thất bại</span>
    );
  }

  if (message.localStatus === "sending") {
    return (
      <span className="text-[11px] font-medium text-gray-400">Đang gửi...</span>
    );
  }

  if (message.isRead) {
    return (
      <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
        Đã xem{message.readAt ? ` ${toRelativeTime(message.readAt)}` : ""}
      </span>
    );
  }

  return <span className="text-[11px] font-medium text-gray-400">Đã gửi</span>;
}

export default ReadReceipt;
