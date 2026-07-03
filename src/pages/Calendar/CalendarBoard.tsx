import { RefObject } from "react";

import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import listPlugin from "@fullcalendar/list";
import interactionPlugin from "@fullcalendar/interaction";
import {
  DateSelectArg,
  EventApi,
  EventClickArg,
  EventContentArg,
  DatesSetArg,
  EventInput,
  EventHoveringArg,
} from "@fullcalendar/core";
import viLocale from "@fullcalendar/core/locales/vi";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";

// CalendarBoard hiển thị FullCalendar tương tác cùng các nút điều hướng và đổi chế độ xem.

interface CalendarBoardProps {
  calendarRef: RefObject<FullCalendar | null>;
  currentRangeTitle: string;
  activeView: string;
  onChangeView: (view: string) => void;
  onNavigate: (direction: "prev" | "next") => void;
  onToday: () => void;
  periodValue: string;
  onPeriodChange: (value: string) => void;
  onSelectDate: (selectInfo: DateSelectArg) => void;
  onEventClick: (event: EventClickArg) => void;
  onEventMouseEnter?: (event: EventHoveringArg) => void;
  onEventMouseLeave?: (event: EventHoveringArg) => void;
  onDatesSet: (arg: DatesSetArg) => void;
  events: EventInput[];
  renderEventContent: (eventInfo: EventContentArg) => React.JSX.Element;
  initialView?: string;
  initialDate?: Date;
  headerToolbar?: Record<string, string> | false;
}

const VIEW_LABELS: Record<string, string> = {
  dayGridMonth: "Lịch theo tháng",
  timeGridWeek: "Lịch theo tuần",
  timeGridDay: "Lịch theo ngày",
  listWeek: "Lịch theo danh sách",
};

export const CalendarBoard = ({
  calendarRef,
  currentRangeTitle,
  activeView,
  onChangeView,
  onNavigate,
  onToday,
  periodValue,
  onPeriodChange,
  onSelectDate,
  onEventClick,
  onEventMouseEnter,
  onEventMouseLeave,
  onDatesSet,
  events,
  renderEventContent,
  initialView,
  initialDate,
  headerToolbar,
}: CalendarBoardProps) => {
  const activeViewLabel = VIEW_LABELS[activeView] ?? "Lịch phỏng vấn";
  const periodInputType =
    activeView === "dayGridMonth"
      ? "month"
      : activeView === "timeGridWeek" || activeView === "listWeek"
        ? "week"
        : "date";

  const toTime = (value: unknown) => {
    if (value instanceof Date) return value.getTime();
    if (typeof value === "string" || typeof value === "number") {
      const parsed = new Date(value).getTime();
      return Number.isFinite(parsed) ? parsed : 0;
    }
    return 0;
  };

  return (
    <section className="overflow-hidden rounded-[28px] border border-border/60 bg-card/80 p-4 shadow-md shadow-brand-950/5 backdrop-blur-sm dark:bg-slate-950/40 sm:p-6">
      {/* Lưới lịch kèm thanh điều hướng, chuyển chế độ xem và thao tác sự kiện. */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-muted-foreground">
            {activeViewLabel}
          </p>
          <h2 className="text-xl font-semibold text-foreground">
            {currentRangeTitle || "Lịch phỏng vấn"}
          </h2>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 rounded-full border border-border/70 bg-background/50 p-1">
            <Button
              variant={activeView === "dayGridMonth" ? "default" : "ghost"}
              size="sm"
              className={
                activeView === "dayGridMonth"
                  ? "bg-brand-500 text-white hover:bg-brand-500"
                  : ""
              }
              onClick={() => onChangeView("dayGridMonth")}
            >
              Tháng
            </Button>
            <Button
              variant={activeView === "timeGridWeek" ? "default" : "ghost"}
              size="sm"
              className={
                activeView === "timeGridWeek"
                  ? "bg-brand-500 text-white hover:bg-brand-500"
                  : ""
              }
              onClick={() => onChangeView("timeGridWeek")}
            >
              Tuần
            </Button>
            <Button
              variant={activeView === "timeGridDay" ? "default" : "ghost"}
              size="sm"
              className={
                activeView === "timeGridDay"
                  ? "bg-brand-500 text-white hover:bg-brand-500"
                  : ""
              }
              onClick={() => onChangeView("timeGridDay")}
            >
              Ngày
            </Button>
          </div>
          <input
            type={periodInputType}
            value={periodValue}
            onChange={(event) => onPeriodChange(event.target.value)}
            aria-label="Chọn mốc thời gian lịch"
            className="h-9 rounded-lg border border-border/70 bg-background px-3 text-sm text-foreground outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
          />
          <div className="flex items-center gap-1">
            <Button variant="outline" size="sm" onClick={onToday}>
              Hôm nay
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onNavigate("prev")}
              aria-label="Đi tới khoảng thời gian trước"
            >
              <ChevronLeft className="size-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onNavigate("next")}
              aria-label="Đi tới khoảng thời gian tiếp theo"
            >
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>
      </div>
      <div className="calendar-enterprise mt-6 overflow-hidden rounded-3xl border border-border/60 bg-background/50">
        <FullCalendar
          ref={calendarRef}
          plugins={[dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin]}
          locale={viLocale}
          initialView={initialView ?? "dayGridMonth"}
          initialDate={initialDate}
          headerToolbar={headerToolbar ?? false}
          height="auto"
          events={events}
          eventOrder={((a: EventApi, b: EventApi) => {
            const priorityA = Number(a.extendedProps?.priority ?? 999);
            const priorityB = Number(b.extendedProps?.priority ?? 999);
            if (priorityA !== priorityB) return priorityA - priorityB;

            const timeA = toTime(a.start ?? a.startStr);
            const timeB = toTime(b.start ?? b.startStr);
            return timeA - timeB;
          }) as never}
          eventOrderStrict
          selectable
          select={onSelectDate}
          eventClick={onEventClick}
          eventMouseEnter={onEventMouseEnter}
          eventMouseLeave={onEventMouseLeave}
          eventContent={renderEventContent}
          datesSet={onDatesSet}
          moreLinkContent={(args) => (
            <span className="text-[11px] font-semibold text-brand-700">
              +{args.num} lịch khác
            </span>
          )}
          dayMaxEvents={3}
          dayMaxEventRows={3}
          eventDisplay="block"
          selectMirror
        />
      </div>
    </section>
  );
};
