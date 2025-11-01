import { RefObject } from "react";

import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import {
  DateSelectArg,
  EventClickArg,
  EventContentArg,
  DatesSetArg,
  EventInput,
} from "@fullcalendar/core";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";

// CalendarBoard hiển thị FullCalendar tương tác cùng các nút điều hướng và đổi chế độ xem.

interface CalendarBoardProps {
  calendarRef: RefObject<FullCalendar | null>;
  currentRangeTitle: string;
  activeView: string;
  onChangeView: (view: string) => void;
  onNavigate: (direction: "prev" | "next") => void;
  onSelectDate: (selectInfo: DateSelectArg) => void;
  onEventClick: (event: EventClickArg) => void;
  onDatesSet: (arg: DatesSetArg) => void;
  events: EventInput[];
  renderEventContent: (eventInfo: EventContentArg) => EventContentArg;
}

const VIEW_LABELS: Record<string, string> = {
  dayGridMonth: "Tháng",
  timeGridWeek: "Tuần",
  timeGridDay: "Ngày",
};

export const CalendarBoard = ({
  calendarRef,
  currentRangeTitle,
  activeView,
  onChangeView,
  onNavigate,
  onSelectDate,
  onEventClick,
  onDatesSet,
  events,
  renderEventContent,
}: CalendarBoardProps) => {
  const activeViewLabel = VIEW_LABELS[activeView] ?? "Lịch phỏng vấn";

  return (
    <section className="overflow-hidden overflow-y-auto max-h-3/4 rounded-3xl border border-border/60 bg-card/80 p-4 shadow-md shadow-brand-950/5 backdrop-blur-sm dark:bg-slate-950/40 sm:p-6">
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
          <div className="flex items-center gap-1">
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
      <div className="mt-6 overflow-hidden rounded-3xl border border-border/60 bg-background/50">
        <FullCalendar
          ref={calendarRef}
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          headerToolbar={false}
          height="auto"
          events={events}
          selectable
          select={onSelectDate}
          eventClick={onEventClick}
          eventContent={renderEventContent}
          datesSet={onDatesSet}
          dayMaxEvents={3}
          eventDisplay="block"
          selectMirror
        />
      </div>
    </section>
  );
};
