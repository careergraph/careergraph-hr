import {
  CALENDAR_LEVELS,
  CALENDAR_LEVEL_META,
  CALENDAR_VARIANT_STYLES,
  formatEventDateRange,
  formatRelativeDay,
  getCalendarVariant,
  normalizeDate,
} from "../../lib/calendar-utils";
import { CalendarEvent } from "@/types/calendar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Clock3, MapPin, NotebookPen, UserRound } from "lucide-react";

interface CalendarSidebarProps {
  calendarCounts: Record<(typeof CALENDAR_LEVELS)[number], number>;
  activeEvent: CalendarEvent | null;
  onSelectEvent: (event: CalendarEvent) => void;
  onEditEvent: (event: CalendarEvent) => void;
  upcomingEvents: CalendarEvent[];
}

export const CalendarSidebar = ({
  calendarCounts,
  activeEvent,
  onSelectEvent,
  onEditEvent,
  upcomingEvents,
}: CalendarSidebarProps) => {
  const badgeClassName = activeEvent
    ? CALENDAR_VARIANT_STYLES[
        getCalendarVariant(activeEvent.extendedProps?.calendar)
      ].badge
    : "";

  return (
    <aside className="flex flex-col gap-6">
      <div className="rounded-3xl border border-border/60 bg-card/80 p-5 shadow-sm shadow-brand-950/5 dark:bg-slate-950/40">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Phân loại lịch
        </h3>
        <div className="mt-4 space-y-3">
          {CALENDAR_LEVELS.map((level) => {
            const variant = CALENDAR_LEVEL_META[level].variant;
            const styles = CALENDAR_VARIANT_STYLES[variant];
            return (
              <div
                key={level}
                className={`flex items-center justify-between gap-4 rounded-2xl border bg-background/60 px-4 py-3 ${styles.border}`}
              >
                <div className="flex items-center gap-3">
                  <span className={`size-2.5 rounded-full ${styles.indicator}`} />
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      {CALENDAR_LEVEL_META[level].label}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {CALENDAR_LEVEL_META[level].description}
                    </p>
                  </div>
                </div>
                <Badge className={`${styles.badge} text-xs font-semibold`}>
                  {calendarCounts[level] ?? 0}
                </Badge>
              </div>
            );
          })}
        </div>
      </div>

      <div className="rounded-3xl border border-border/60 bg-card/80 p-5 shadow-sm shadow-brand-950/5 dark:bg-slate-950/40">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold text-foreground">
            Chi tiết lịch hẹn
          </h3>
          {activeEvent ? (
            <Badge className={`${badgeClassName} text-[11px] font-semibold uppercase tracking-wide`}>
              {activeEvent.extendedProps?.calendar}
            </Badge>
          ) : null}
        </div>
        {activeEvent ? (
          <div className="mt-5 space-y-4">
            <div>
              <h4 className="text-lg font-semibold text-foreground">
                {activeEvent.title || "Chưa có tiêu đề"}
              </h4>
              <p className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                <Clock3 className="size-4" />
                {formatEventDateRange(normalizeDate(activeEvent.start), normalizeDate(activeEvent.end))}
              </p>
            </div>
            {activeEvent.extendedProps?.candidate ? (
              <p className="flex items-center gap-2 text-sm text-muted-foreground">
                <UserRound className="size-4" />
                {activeEvent.extendedProps.candidate}
              </p>
            ) : null}
            {activeEvent.extendedProps?.location ? (
              <p className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="size-4" />
                {activeEvent.extendedProps.location}
              </p>
            ) : null}
            <p className="flex items-start gap-2 text-sm text-muted-foreground">
              <NotebookPen className="mt-0.5 size-4" />
              <span>
                {activeEvent.extendedProps?.notes
                  ? activeEvent.extendedProps.notes
                  : "Thêm ghi chú để mọi người nắm rõ thông tin."}
              </span>
            </p>
            <div className="flex items-center gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onEditEvent(activeEvent)}
              >
                Chỉnh sửa lịch
              </Button>
            </div>
          </div>
        ) : (
          <p className="mt-4 text-sm text-muted-foreground">
            Chọn một lịch trên bảng để xem chi tiết.
          </p>
        )}
      </div>

      <div className="rounded-3xl border border-border/60 bg-card/80 p-5 shadow-sm shadow-brand-950/5 dark:bg-slate-950/40">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold text-foreground">
            Sắp diễn ra
          </h3>
        </div>
        <ScrollArea className="mt-4 h-[350px] pr-1">
          <div className="space-y-3">
            {upcomingEvents.length ? (
              upcomingEvents.map((event) => {
                const variant = getCalendarVariant(event.extendedProps?.calendar);
                const styles = CALENDAR_VARIANT_STYLES[variant];
                const isActive = activeEvent?.id === event.id;

                return (
                  <button
                    key={event.id}
                    type="button"
                    onClick={() => onSelectEvent(event)}
                    className={`w-full rounded-2xl border px-4 py-3 text-left transition ${
                      isActive
                        ? "border-brand-500 bg-brand-500/10"
                        : "border-border/70 bg-background/60 hover:-translate-y-0.5 hover:border-brand-500/40 hover:bg-brand-500/10"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-semibold text-foreground">
                        {event.title || "Chưa có tiêu đề"}
                      </p>
                      <Badge className={`${styles.badge} text-[11px] font-semibold`}>
                        {event.extendedProps?.calendar}
                      </Badge>
                    </div>
                    <p className="mt-2 text-xs text-muted-foreground">
                      {formatEventDateRange(normalizeDate(event.start), normalizeDate(event.end))}
                      {" · "}
                      {formatRelativeDay(normalizeDate(event.start))}
                    </p>
                    {event.extendedProps?.candidate ? (
                      <p className="mt-2 text-xs text-muted-foreground">
                        Ứng viên: {event.extendedProps.candidate}
                      </p>
                    ) : null}
                  </button>
                );
              })
            ) : (
              <div className="rounded-2xl border border-dashed border-border/70 bg-background/50 p-6 text-center text-sm text-muted-foreground">
                Chưa có lịch hẹn mới. Hãy tạo lịch để giữ kết nối với ứng viên.
              </div>
            )}
          </div>
        </ScrollArea>
      </div>
    </aside>
  );
};
