import { useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { BriefcaseBusiness, Clock3, MapPin, UserRound } from "lucide-react";

import {
  CALENDAR_VARIANT_STYLES,
  formatEventDateRange,
  formatTimeForInput,
  getCalendarVariant,
} from "../../lib/calendar-utils";
import type { CalendarEvent } from "@/types/calendar";

interface HoverPosition {
  top: number;
  bottom: number;
  left: number;
  right: number;
  cursorX?: number;
  cursorY?: number;
}

interface CalendarEventHoverModalProps {
  event: CalendarEvent | null;
  position: HoverPosition | null;
}

const STATUS_LABELS: Record<string, string> = {
  SCHEDULED: "Chờ xác nhận",
  CONFIRMED: "Đã xác nhận",
  PENDING_RESCHEDULE: "Chờ dời lịch",
  IN_PROGRESS: "Đang diễn ra",
  COMPLETED: "Đã hoàn thành",
  CANCELLED: "Đã hủy",
  NO_SHOW: "Vắng mặt",
};

export const CalendarEventHoverModal = ({
  event,
  position,
}: CalendarEventHoverModalProps) => {
  const mounted = typeof window !== "undefined";
  const cardRef = useRef<HTMLDivElement>(null);
  const [computedPosition, setComputedPosition] = useState<{
    left: number;
    top: number;
    placement: "top" | "bottom";
    arrowLeft: number;
  } | null>(null);

  useLayoutEffect(() => {
    if (!mounted || !position || !event || !cardRef.current) {
      setComputedPosition(null);
      return;
    }

    const gap = 16;
    const viewportPadding = 16;
    const rect = cardRef.current.getBoundingClientRect();
    const cardWidth = rect.width || 320;
    const cardHeight = rect.height || 236;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const cursorX = position.cursorX ?? position.left;
    const cursorY = position.cursorY ?? position.top;

    const spaceBelow = viewportHeight - cursorY - gap - viewportPadding;
    const spaceAbove = cursorY - gap - viewportPadding;
    const placement: "top" | "bottom" =
      spaceBelow >= cardHeight || spaceBelow >= spaceAbove ? "bottom" : "top";

    const preferredLeft = cursorX + 12;
    const left = Math.min(
      Math.max(viewportPadding, preferredLeft),
      viewportWidth - cardWidth - viewportPadding
    );

    const unclampedTop =
      placement === "bottom" ? cursorY + gap : cursorY - cardHeight - gap;
    const top = Math.min(
      Math.max(viewportPadding, unclampedTop),
      viewportHeight - cardHeight - viewportPadding
    );

    const arrowLeft = Math.min(
      Math.max(28, cursorX - left),
      cardWidth - 28
    );

    setComputedPosition({
      left,
      top,
      placement,
      arrowLeft,
    });
  }, [event, mounted, position]);

  if (!mounted || !event) return null;

  const variant = getCalendarVariant(event.extendedProps?.calendar);
  const styles = CALENDAR_VARIANT_STYLES[variant];
  const statusLabel =
    STATUS_LABELS[String(event.extendedProps?.interviewStatus ?? "")] ?? "Lịch phỏng vấn";
  const startTime = formatTimeForInput(event.start);
  const endTime = formatTimeForInput(event.end);

  return createPortal(
    <div
      className="pointer-events-none fixed z-[100001] w-[320px]"
      style={{
        left: computedPosition?.left ?? -9999,
        top: computedPosition?.top ?? -9999,
        opacity: computedPosition ? 1 : 0,
      }}
    >
      <div
        ref={cardRef}
        className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_24px_60px_rgba(15,23,42,0.22)] dark:border-slate-700 dark:bg-slate-900"
      >
        <div
          className={`absolute h-3 w-3 rotate-45 border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900 ${
            computedPosition?.placement === "bottom"
              ? "-top-1.5 border-l border-t"
              : "-bottom-1.5 border-b border-r"
          }`}
          style={{
            left: `${computedPosition?.arrowLeft ?? 28}px`,
          }}
        />
        <div className="border-b border-slate-200 px-4 py-3 dark:border-slate-800">
          <div className="mb-2 flex items-center justify-between gap-3">
            <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${styles.badge}`}>
              {statusLabel}
            </span>
            <span className="text-[11px] font-medium uppercase tracking-[0.18em] text-slate-400">
              Preview
            </span>
          </div>
          <h3 className="text-sm font-semibold leading-5 text-slate-900 dark:text-white">
            {event.title}
          </h3>
        </div>

        <div className="space-y-3 px-4 py-4 text-sm text-slate-600 dark:text-slate-300">
          <div className="flex items-start gap-2">
            <Clock3 className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
            <div>
              <p className="font-medium text-slate-900 dark:text-white">
                {startTime && endTime ? `${startTime} - ${endTime}` : "Chưa xác định giờ"}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {formatEventDateRange(event.start, event.end)}
              </p>
            </div>
          </div>

          {event.extendedProps?.candidate ? (
            <div className="flex items-start gap-2">
              <UserRound className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
              <div>
                <p className="font-medium text-slate-900 dark:text-white">
                  {event.extendedProps.candidate}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Ứng viên</p>
              </div>
            </div>
          ) : null}

          {event.extendedProps?.jobTitle ? (
            <div className="flex items-start gap-2">
              <BriefcaseBusiness className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
              <div>
                <p className="font-medium text-slate-900 dark:text-white">
                  {event.extendedProps.jobTitle}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Vị trí tuyển dụng</p>
              </div>
            </div>
          ) : null}

          {event.extendedProps?.location ? (
            <div className="flex items-start gap-2">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
              <div>
                <p className="line-clamp-2 font-medium text-slate-900 dark:text-white">
                  {event.extendedProps.location}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Địa điểm / phòng phỏng vấn
                </p>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>,
    document.body
  );
};
