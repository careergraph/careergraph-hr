import { useEffect } from "react";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";
import { BellRing, CheckCheck, Loader2 } from "lucide-react";
import { Link } from "react-router";
import { Dropdown } from "@/components/custom/dropdown/Dropdown";
import { DropdownItem } from "@/components/custom/dropdown/DropdownItem";
import useNotifications from "@/features/notifications/hooks/useNotifications";

interface NotificationDropdownProps {
  isOpen: boolean;
  onClose: () => void;
}

const toRelativeTime = (value: string): string => {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "vừa xong";
  }

  return formatDistanceToNow(date, {
    addSuffix: true,
    locale: vi,
  });
};

export function NotificationDropdown({ isOpen, onClose }: NotificationDropdownProps) {
  const {
    items,
    loading,
    error,
    hasMore,
    ensureLoaded,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
  } = useNotifications();

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    void ensureLoaded();
  }, [ensureLoaded, isOpen]);

  return (
    <Dropdown
      isOpen={isOpen}
      onClose={onClose}
      className="absolute -right-62.5 mt-4.25 flex h-125 w-90 flex-col rounded-2xl border border-gray-200 bg-white p-3 shadow-theme-lg dark:border-gray-800 dark:bg-gray-dark sm:w-95 lg:right-0"
    >
      <div className="mb-3 flex items-center justify-between border-b border-gray-100 pb-3 dark:border-gray-700">
        <div>
          <h5 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
            Thông báo
          </h5>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Cập nhật theo thời gian thực
          </p>
        </div>

        <button
          type="button"
          className="rounded-lg border border-gray-200 px-2 py-1 text-xs font-medium text-gray-600 transition hover:bg-gray-100 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
          onClick={() => {
            void markAllAsRead();
          }}
        >
          Đánh dấu đã đọc
        </button>
      </div>

      <ul className="custom-scrollbar flex-1 space-y-1 overflow-y-auto">
        {loading && items.length === 0 ? (
          <li className="flex items-center justify-center py-10 text-sm text-gray-500 dark:text-gray-400">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Đang tải thông báo...
          </li>
        ) : null}

        {!loading && error ? (
          <li className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300">
            {error}
          </li>
        ) : null}

        {!loading && !error && items.length === 0 ? (
          <li className="mx-2 mt-4 flex flex-col items-center rounded-2xl border border-dashed border-gray-300 px-4 py-8 text-center dark:border-gray-700">
            <BellRing className="mb-3 h-7 w-7 text-gray-400" />
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">
              Chưa có thông báo mới
            </p>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Khi có cập nhật hệ thống hoặc tin nhắn mới, bạn sẽ thấy tại đây.
            </p>
          </li>
        ) : null}

        {items.map((item) => (
          <li key={item.id}>
            <DropdownItem
              onItemClick={() => {
                void markAsRead(item.id);
                onClose();
              }}
              className={`rounded-xl px-3 py-2.5 text-left transition ${
                item.read
                  ? "bg-transparent hover:bg-gray-100 dark:hover:bg-white/5"
                  : "bg-brand-50/70 hover:bg-brand-50 dark:bg-brand-500/15 dark:hover:bg-brand-500/20"
              }`}
            >
              <div className="flex items-start gap-3">
                <span
                  className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${
                    item.read ? "bg-gray-300" : "bg-brand-500"
                  }`}
                />
                <span className="block min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium text-gray-800 dark:text-gray-100">
                    {item.title}
                  </span>
                  <span className="mt-0.5 block text-xs text-gray-500 dark:text-gray-400">
                    {item.body}
                  </span>
                  <span className="mt-1 block text-[11px] text-gray-400">
                    {toRelativeTime(item.createdAt)}
                  </span>
                </span>
              </div>
            </DropdownItem>
          </li>
        ))}
      </ul>

      <div className="mt-3 flex items-center justify-between gap-2">
        {hasMore ? (
          <button
            type="button"
            className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 transition hover:bg-gray-100 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
            onClick={() => {
              void fetchNotifications({ reset: false });
            }}
          >
            Tải thêm
          </button>
        ) : (
          <span className="text-xs text-gray-400">Đã tải toàn bộ thông báo</span>
        )}

        <Link
          to="/messages"
          onClick={onClose}
          className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 transition hover:bg-gray-100 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
        >
          <CheckCheck className="h-3.5 w-3.5" />
          Mở inbox
        </Link>
      </div>
    </Dropdown>
  );
}

export default NotificationDropdown;
