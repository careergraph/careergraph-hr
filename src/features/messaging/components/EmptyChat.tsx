import { MessageCircleMore } from "lucide-react";

interface EmptyChatProps {
  title?: string;
  description?: string;
  compact?: boolean;
}

export function EmptyChat({
  title = "Chưa có cuộc trò chuyện nào được chọn",
  description = "Hãy chọn một hội thoại từ danh sách để bắt đầu trao đổi với ứng viên.",
  compact = false,
}: EmptyChatProps) {
  return (
    <div
      className={`flex h-full w-full flex-col items-center justify-center px-6 text-center ${
        compact ? "py-8" : "py-14"
      }`}
    >
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-50 text-brand-600 shadow-sm dark:bg-brand-500/20 dark:text-brand-300">
        <MessageCircleMore className="h-8 w-8" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white/90">
        {title}
      </h3>
      <p className="mt-2 max-w-md text-sm text-gray-500 dark:text-gray-400">
        {description}
      </p>
    </div>
  );
}

export default EmptyChat;
