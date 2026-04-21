import { useEffect } from "react";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";
import {
  BellRing,
  Briefcase,
  CalendarCheck2,
  CheckCheck,
  Eye,
  Loader2,
  MessageSquareText,
  SearchCheck,
  UserRoundPlus,
  XCircle,
} from "lucide-react";
import { Link, useNavigate } from "react-router";
import { Dropdown } from "@/components/custom/dropdown/Dropdown";
import { DropdownItem } from "@/components/custom/dropdown/DropdownItem";
import useNotifications from "@/features/notifications/hooks/useNotifications";
import type { NotificationItem } from "@/features/notifications/types/notification.types";

interface NotificationDropdownProps {
  dropdownId?: string;
  isOpen: boolean;
  onClose: () => void;
}

type NotificationData = Record<string, unknown> | undefined;

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

const toDataString = (data: NotificationData, key: string): string | null => {
  if (!data || typeof data[key] === "undefined" || data[key] === null) {
    return null;
  }

  const value = data[key];
  return typeof value === "string" ? value : String(value);
};

const normalizeNavigatePathForHr = (
  rawPath: string,
  data: NotificationData
): string | null => {
  if (!rawPath.startsWith("/")) {
    return null;
  }

  if (rawPath.startsWith("/messages")) {
    return rawPath;
  }

  if (rawPath.startsWith("/jobs/") && rawPath.endsWith("/applications")) {
    const jobId = rawPath.split("/")[2] || toDataString(data, "jobId");
    return jobId ? `/kanbans/${jobId}` : "/kanbans";
  }

  if (rawPath.startsWith("/applications/")) {
    return "/kanbans";
  }

  if (rawPath === "/jobs") {
    return "/jobs";
  }

  return rawPath;
};

const getNavigatePath = (notification: NotificationItem): string | null => {
  const data = notification.data;
  const explicitPath = toDataString(data, "navigateTo");

  if (explicitPath) {
    const normalized = normalizeNavigatePathForHr(explicitPath, data);
    if (normalized) {
      return normalized;
    }
  }

  const threadId = toDataString(data, "threadId");
  const jobId = toDataString(data, "jobId");

  switch (notification.type) {
    case "NEW_MESSAGE":
      return threadId ? `/messages?thread=${threadId}` : "/messages";
    case "NEW_APPLICATION":
    case "APPLICATION_AI_SCREENING":
      return jobId ? `/kanbans/${jobId}` : "/kanbans";
    default:
      return null;
  }
};

const getNotificationTypeMeta = (type: string) => {
  switch (type) {
    case "NEW_MESSAGE":
      return {
        icon: <MessageSquareText className="h-4 w-4" />,
        iconClass: "bg-sky-100 text-sky-600 dark:bg-sky-500/20 dark:text-sky-300",
      };
    case "NEW_APPLICATION":
      return {
        icon: <UserRoundPlus className="h-4 w-4" />,
        iconClass: "bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-300",
      };
    case "APPLICATION_AI_SCREENING":
      return {
        icon: <SearchCheck className="h-4 w-4" />,
        iconClass: "bg-cyan-100 text-cyan-700 dark:bg-cyan-500/20 dark:text-cyan-300",
      };
    case "APPLICATION_VIEWED":
      return {
        icon: <Eye className="h-4 w-4" />,
        iconClass: "bg-amber-100 text-amber-600 dark:bg-amber-500/20 dark:text-amber-300",
      };
    case "APPLICATION_SHORTLISTED":
      return {
        icon: <SearchCheck className="h-4 w-4" />,
        iconClass: "bg-violet-100 text-violet-600 dark:bg-violet-500/20 dark:text-violet-300",
      };
    case "APPLICATION_INTERVIEW_SCHEDULED":
      return {
        icon: <CalendarCheck2 className="h-4 w-4" />,
        iconClass: "bg-indigo-100 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-300",
      };
    case "APPLICATION_REJECTED":
      return {
        icon: <XCircle className="h-4 w-4" />,
        iconClass: "bg-rose-100 text-rose-600 dark:bg-rose-500/20 dark:text-rose-300",
      };
    default:
      return {
        icon: <Briefcase className="h-4 w-4" />,
        iconClass: "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300",
      };
  }
};

export function NotificationDropdown({
  dropdownId,
  isOpen,
  onClose,
}: NotificationDropdownProps) {
  const navigate = useNavigate();
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

  const handleClickNotification = async (item: NotificationItem) => {
    if (!item.read) {
      await markAsRead(item.id);
    }

    const nextPath = getNavigatePath(item);
    onClose();

    if (nextPath) {
      navigate(nextPath);
    }
  };

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    void ensureLoaded();
  }, [ensureLoaded, isOpen]);

  return (
    <Dropdown
      id={dropdownId}
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

        {items.map((item) => {
          const { icon, iconClass } = getNotificationTypeMeta(item.type);

          return (
          <li key={item.id}>
            <DropdownItem
              onItemClick={() => {
                void handleClickNotification(item);
              }}
              className={`rounded-xl px-3 py-2.5 text-left transition ${
                item.read
                  ? "bg-transparent hover:bg-gray-100 dark:hover:bg-white/5"
                  : "bg-brand-50/70 hover:bg-brand-50 dark:bg-brand-500/15 dark:hover:bg-brand-500/20"
              }`}
            >
              <div className="flex items-start gap-3">
                <span
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${iconClass}`}
                  aria-hidden="true"
                >
                  {icon}
                </span>
                <span className="block min-w-0 flex-1">
                  <span className="flex items-center gap-2">
                    <span className="block truncate text-sm font-medium text-gray-800 dark:text-gray-100">
                      {item.title}
                    </span>
                    {!item.read ? (
                      <span className="rounded-full border border-brand-200 bg-brand-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-brand-700 dark:border-brand-500/50 dark:bg-brand-500/20 dark:text-brand-200">
                        Mới
                      </span>
                    ) : null}
                  </span>
                  <span className="mt-0.5 block text-xs text-gray-500 dark:text-gray-400">
                    {item.body}
                  </span>
                  <span className="mt-1 block text-[11px] text-gray-400">
                    {toRelativeTime(item.createdAt)}
                  </span>
                </span>

                {!item.read ? (
                  <span
                    className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-brand-500"
                    aria-hidden="true"
                  />
                ) : null}
              </div>
            </DropdownItem>
          </li>
          );
        })}
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
