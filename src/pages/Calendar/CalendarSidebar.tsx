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
import { canAccessInterviewRoom } from "@/lib/interviewRoomAccess";

interface CalendarSidebarProps {
  variant?: "detail" | "status";
  calendarCounts: Record<(typeof CALENDAR_LEVELS)[number], number>;
  activeEvent: CalendarEvent | null;
  onSelectEvent: (event: CalendarEvent) => void;
  onEditEvent: (event: CalendarEvent) => void;
  onJoinEventRoom: (event: CalendarEvent) => void;
  upcomingEvents: CalendarEvent[];
}

export const CalendarSidebar = ({
  variant = "detail",
  calendarCounts,
  activeEvent,
  onSelectEvent,
  onEditEvent,
  onJoinEventRoom,
  upcomingEvents,
}: CalendarSidebarProps) => {
  const badgeClassName = activeEvent
    ? CALENDAR_VARIANT_STYLES[getCalendarVariant(activeEvent.extendedProps?.calendar)].badge
    : "";

  const canJoinActiveEventRoom = canAccessInterviewRoom({
    type: activeEvent?.extendedProps?.interviewType,
    meetingLink: activeEvent?.extendedProps?.meetingLink,
    interviewStatus: activeEvent?.extendedProps?.interviewStatus,
    endAt: activeEvent?.end,
  });

  if (variant === "status") {
    return (
      <section className="rounded-[28px] border border-border/60 bg-card/80 p-5 shadow-sm shadow-brand-950/5 dark:bg-slate-950/40">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-semibold text-foreground">Chú thích trạng thái</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Giải thích nhanh ý nghĩa từng nhóm trạng thái trên lịch phỏng vấn.
            </p>
          </div>
          <Badge variant="outline" className="rounded-full px-3 py-1 text-xs">
            {CALENDAR_LEVELS.reduce((sum, level) => sum + (calendarCounts[level] ?? 0), 0)} lịch
          </Badge>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {CALENDAR_LEVELS.map((level) => {
            const variantKey = CALENDAR_LEVEL_META[level].variant;
            const styles = CALENDAR_VARIANT_STYLES[variantKey];

            return (
              <div
                key={level}
                className={`rounded-2xl border px-4 py-3 ${styles.border} bg-background/70`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground">
                      {CALENDAR_LEVEL_META[level].label}
                    </p>
                    <p className="mt-1 text-xs leading-5 text-muted-foreground">
                      {CALENDAR_LEVEL_META[level].description}
                    </p>
                  </div>
                  <Badge className={`${styles.badge} shrink-0 text-xs font-semibold`}>
                    {calendarCounts[level] ?? 0}
                  </Badge>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    );
  }

  return (
    <aside className="xl:sticky xl:top-6 self-start space-y-4">
      <section className="rounded-[28px] border border-border/60 bg-card/80 p-5 shadow-sm shadow-brand-950/5 dark:bg-slate-950/40">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-semibold text-foreground">Sắp diễn ra</h3>
          </div>
          <Badge variant="outline" className="rounded-full px-3 py-1 text-xs">
            {upcomingEvents.length} lịch
          </Badge>
        </div>

        <ScrollArea className="mt-4 h-[340px] pr-3">
          <div className="space-y-3 pr-2">
            {upcomingEvents.length ? (
              upcomingEvents.slice(0, 8).map((event) => {
                const variantKey = getCalendarVariant(event.extendedProps?.calendar);
                const styles = CALENDAR_VARIANT_STYLES[variantKey];
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
                    <div className="flex items-start justify-between gap-3">
                      <p className="line-clamp-2 min-w-0 text-sm font-semibold leading-5 text-foreground">
                        {event.title || "Chưa có tiêu đề"}
                      </p>
                      <Badge className={`${styles.badge} shrink-0 text-[11px] font-semibold`}>
                        {CALENDAR_LEVEL_META[event.extendedProps?.calendar ?? "Primary"].label}
                      </Badge>
                    </div>
                    <p className="mt-3 text-xs leading-5 text-muted-foreground">
                      {formatEventDateRange(normalizeDate(event.start), normalizeDate(event.end))}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatRelativeDay(normalizeDate(event.start))}
                    </p>
                    {event.extendedProps?.candidate ? (
                      <p className="mt-2 truncate text-xs text-muted-foreground">
                        Ứng viên: {event.extendedProps.candidate}
                      </p>
                    ) : null}
                    {event.extendedProps?.jobTitle ? (
                      <p className="mt-1 truncate text-xs text-muted-foreground">
                        Vị trí: {event.extendedProps.jobTitle}
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
        <div className="mt-4 h-px w-full bg-border/80" />
      </section>

      <section className="rounded-[28px] border border-border/60 bg-card/80 p-5 shadow-sm shadow-brand-950/5 dark:bg-slate-950/40">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-base font-semibold text-foreground">Chi tiết lịch hẹn</h3>
          {activeEvent ? (
            <Badge className={`${badgeClassName} text-[11px] font-semibold uppercase tracking-wide`}>
              {CALENDAR_LEVEL_META[activeEvent.extendedProps?.calendar ?? "Primary"].label}
            </Badge>
          ) : null}
        </div>

        {activeEvent ? (
          <div className="mt-5 space-y-4">
            <div>
              <h4 className="line-clamp-2 text-lg font-semibold leading-6 text-foreground">
                {activeEvent.title || "Chưa có tiêu đề"}
              </h4>
              <p className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
                <Clock3 className="size-4 shrink-0" />
                {formatEventDateRange(normalizeDate(activeEvent.start), normalizeDate(activeEvent.end))}
              </p>
            </div>

            {activeEvent.extendedProps?.candidate ? (
              <p className="flex items-center gap-2 text-sm text-muted-foreground">
                <UserRound className="size-4 shrink-0" />
                <span className="truncate">{activeEvent.extendedProps.candidate}</span>
              </p>
            ) : null}

            {activeEvent.extendedProps?.jobTitle ? (
              <p className="truncate text-sm text-muted-foreground">
                Vị trí: {activeEvent.extendedProps.jobTitle}
              </p>
            ) : null}

            {activeEvent.extendedProps?.location ? (
              <p className="flex items-start gap-2 text-sm text-muted-foreground">
                <MapPin className="mt-0.5 size-4 shrink-0" />
                <span className="line-clamp-2 break-words">{activeEvent.extendedProps.location}</span>
              </p>
            ) : null}

            <p className="flex items-start gap-2 text-sm text-muted-foreground">
              <NotebookPen className="mt-0.5 size-4 shrink-0" />
              <span className="line-clamp-3">
                {activeEvent.extendedProps?.notes
                  ? activeEvent.extendedProps.notes
                  : "Thêm ghi chú để mọi người nắm rõ thông tin."}
              </span>
            </p>

            <div className="flex flex-wrap items-center gap-2 pt-2">
              {canJoinActiveEventRoom ? (
                <Button size="sm" onClick={() => onJoinEventRoom(activeEvent)}>
                  Vào phòng
                </Button>
              ) : null}
              <Button variant="outline" size="sm" onClick={() => onEditEvent(activeEvent)}>
                Chỉnh sửa lịch
              </Button>
            </div>
          </div>
        ) : (
          <p className="mt-4 text-sm text-muted-foreground">
            Chọn một lịch trong danh sách bên trên để xem chi tiết.
          </p>
        )}
      </section>
    </aside>
  );
};
