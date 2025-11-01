import { useEffect, useMemo, useRef, useState } from "react";
import type FullCalendar from "@fullcalendar/react";
import { DateSelectArg, EventClickArg, EventContentArg, DatesSetArg } from "@fullcalendar/core";
import { CalendarClock, CalendarDays, Clock3, UserRound } from "lucide-react";

import PageMeta from "@/components/common/PageMeta";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import { useModal } from "@/hooks/use-modal";

import { CalendarHero, type CalendarStatCard } from "./CalendarHero";
import { CalendarBoard } from "./CalendarBoard";
import { CalendarSidebar } from "./CalendarSidebar";
import { CalendarModalForm } from "./CalendarModalForm";
import {
  CALENDAR_LEVELS,
  CALENDAR_VARIANT_STYLES,
  DEFAULT_EVENT_LEVEL,
  DAY_IN_MS,
  type CalendarLevel,
  formatDateForInput,
  getCalendarVariant,
  normalizeDate,
  toDate,
} from "../../lib/calendar-utils";
import { CalendarEvent } from "@/types/calendar";

// Calendar điều phối bảng lịch, sidebar thống kê và modal chỉnh sửa lịch hẹn.

const renderEventContent = (eventInfo: EventContentArg) => {
  const variant = getCalendarVariant(eventInfo.event.extendedProps.calendar);
  const styles = CALENDAR_VARIANT_STYLES[variant];

  return (
    <div
      className={`flex items-center gap-2 rounded-2xl px-2.5 py-1 text-[11px] font-semibold tracking-wide ${styles.chip} ${styles.text}`}
    >
      <span className={`size-1.5 rounded-full ${styles.indicator}`} />
      <span className="truncate">{eventInfo.event.title}</span>
    </div>
  );
};

const Calendar = () => {
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [activeEvent, setActiveEvent] = useState<CalendarEvent | null>(null);
  const [eventTitle, setEventTitle] = useState("");
  const [eventCandidate, setEventCandidate] = useState("");
  const [eventStartDate, setEventStartDate] = useState("");
  const [eventEndDate, setEventEndDate] = useState("");
  const [eventLevel, setEventLevel] = useState<CalendarLevel>(DEFAULT_EVENT_LEVEL);
  const [eventLocation, setEventLocation] = useState("");
  const [eventNotes, setEventNotes] = useState("");
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [currentRangeTitle, setCurrentRangeTitle] = useState("");
  const [activeView, setActiveView] = useState("dayGridMonth");

  const calendarRef = useRef<FullCalendar | null>(null);
  const { isOpen, openModal, closeModal } = useModal();

  useEffect(() => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 3);

    const initialEvents: CalendarEvent[] = [
      {
        id: "1",
        title: "Phỏng vấn kỹ thuật - Nguyễn Văn A",
        start: formatDateForInput(today),
        allDay: true,
        extendedProps: {
          calendar: "Danger",
          candidate: "Nguyễn Văn A",
          location: "Phòng họp Aurora - Tầng 5",
          notes: "Pair-programming với Tech Lead và review CV",
        },
      },
      {
        id: "2",
        title: "Trao đổi offer - Trần Thu Hà",
        start: formatDateForInput(tomorrow),
        allDay: true,
        extendedProps: {
          calendar: "Success",
          candidate: "Trần Thu Hà",
          location: "Google Meet",
          notes: "Chia sẻ chi tiết gói lương, phúc lợi và thời gian nhận việc",
        },
      },
      {
        id: "3",
        title: "Phỏng vấn HR - Lê Minh Quân",
        start: formatDateForInput(nextWeek),
        end: formatDateForInput(nextWeek),
        allDay: true,
        extendedProps: {
          calendar: "Primary",
          candidate: "Lê Minh Quân",
          location: "Văn phòng - Tầng 7",
          notes: "Phỏng vấn văn hoá và trao đổi kỳ vọng",
        },
      },
    ];

    setEvents(initialEvents);
    setActiveEvent(initialEvents[0]);
  }, []);

  const sortedEvents = useMemo(() => {
    return [...events].sort((a, b) => {
      const first = toDate(a.start)?.getTime() ?? 0;
      const second = toDate(b.start)?.getTime() ?? 0;
      return first - second;
    });
  }, [events]);

  const { upcomingEvents, eventsThisWeek, todaysEvents, candidateCount } = useMemo(() => {
    const now = new Date();
    const start = normalizeDate(now) ?? new Date();
    const tomorrow = new Date(start.getTime() + DAY_IN_MS);
    const weekAhead = new Date(start.getTime() + 7 * DAY_IN_MS);

    const upcoming: CalendarEvent[] = [];
    const week: CalendarEvent[] = [];
    const todayEvents: CalendarEvent[] = [];
    let candidateTotal = 0;

    sortedEvents.forEach((event) => {
      const date = normalizeDate(event.start);
      if (event.extendedProps?.candidate) {
        candidateTotal += 1;
      }

      if (!date) return;

      if (date >= start) {
        upcoming.push(event);
      }

      if (date >= start && date < tomorrow) {
        todayEvents.push(event);
      }

      if (date >= start && date <= weekAhead) {
        week.push(event);
      }
    });

    return {
      upcomingEvents: upcoming,
      eventsThisWeek: week,
      todaysEvents: todayEvents,
      candidateCount: candidateTotal,
    };
  }, [sortedEvents]);

  const calendarCounts = useMemo(() => {
    const base = CALENDAR_LEVELS.reduce((acc, level) => {
      acc[level] = 0;
      return acc;
    }, {} as Record<CalendarLevel, number>);

    events.forEach((event) => {
      const level = event.extendedProps?.calendar ?? DEFAULT_EVENT_LEVEL;
      if (CALENDAR_LEVELS.includes(level as CalendarLevel)) {
        base[level as CalendarLevel] = (base[level as CalendarLevel] ?? 0) + 1;
      }
    });

    return base;
  }, [events]);

  const firstUpcomingEvent = useMemo(() => {
    return upcomingEvents[0] ?? sortedEvents[0] ?? null;
  }, [upcomingEvents, sortedEvents]);

  useEffect(() => {
    if (!activeEvent && firstUpcomingEvent) {
      setActiveEvent(firstUpcomingEvent);
    }
  }, [activeEvent, firstUpcomingEvent]);

  const handleDatesSet = (arg: DatesSetArg) => {
    setCurrentRangeTitle(arg.view.title);
    setActiveView(arg.view.type);
  };

  const resetModalFields = () => {
    setEditingEvent(null);
    setEventTitle("");
    setEventCandidate("");
    setEventStartDate("");
    setEventEndDate("");
    setEventLevel(DEFAULT_EVENT_LEVEL);
    setEventLocation("");
    setEventNotes("");
  };

  const handleCloseModal = () => {
    closeModal();
    resetModalFields();
  };

  const handleOpenCreateModal = () => {
    resetModalFields();
    openModal();
  };

  const populateModalFields = (eventData: CalendarEvent) => {
    setEditingEvent(eventData);
    setEventTitle(eventData.title ?? "");
    setEventCandidate(eventData.extendedProps?.candidate ?? "");
    setEventStartDate(formatDateForInput(eventData.start));
    setEventEndDate(formatDateForInput(eventData.end));
    setEventLevel(eventData.extendedProps?.calendar ?? DEFAULT_EVENT_LEVEL);
    setEventLocation(eventData.extendedProps?.location ?? "");
    setEventNotes(eventData.extendedProps?.notes ?? "");
  };

  const handleDateSelect = (selectInfo: DateSelectArg) => {
    resetModalFields();
    const startInput = formatDateForInput(selectInfo.start);

    let endInput = formatDateForInput(selectInfo.end);
    if (selectInfo.allDay && selectInfo.end) {
      const adjusted = new Date(selectInfo.end.getTime() - DAY_IN_MS);
      endInput = formatDateForInput(adjusted);
    }

    setEventStartDate(startInput);
    setEventEndDate(endInput || startInput);
    openModal();
    selectInfo.view.calendar.unselect();
  };

  const handleEventClick = (clickInfo: EventClickArg) => {
    const matched = events.find((event) => event.id === clickInfo.event.id);

    const eventData: CalendarEvent =
      matched ?? {
        id: clickInfo.event.id,
        title: clickInfo.event.title,
        start: clickInfo.event.start ?? clickInfo.event.startStr,
        end: clickInfo.event.end ?? clickInfo.event.endStr,
        allDay: clickInfo.event.allDay,
        extendedProps: {
          calendar:
            (clickInfo.event.extendedProps.calendar as CalendarLevel) ??
            DEFAULT_EVENT_LEVEL,
          candidate: clickInfo.event.extendedProps.candidate,
          location: clickInfo.event.extendedProps.location,
          notes: clickInfo.event.extendedProps.notes,
        },
      };

    populateModalFields(eventData);
    setActiveEvent(matched ?? eventData);
    openModal();
  };

  const handleAddOrUpdateEvent = () => {
    const payload: CalendarEvent = {
      id: editingEvent?.id ?? Date.now().toString(),
      title: eventTitle,
      start: eventStartDate,
      end: eventEndDate || undefined,
      allDay: true,
      extendedProps: {
        calendar: eventLevel,
        candidate: eventCandidate || undefined,
        location: eventLocation || undefined,
        notes: eventNotes || undefined,
      },
    };

    if (editingEvent) {
      setEvents((prev) =>
        prev.map((event) => (event.id === editingEvent.id ? payload : event))
      );

      setActiveEvent((prev: CalendarEvent | null) => (prev && prev.id === editingEvent.id ? payload : prev));
    } else {
      setEvents((prev) => [...prev, payload]);
      setActiveEvent(payload);
    }

    handleCloseModal();
  };

  const handleViewChange = (view: string) => {
    const api = calendarRef.current?.getApi();
    if (!api || api.view.type === view) return;
    api.changeView(view);
  };

  const handleNavigate = (direction: "prev" | "next") => {
    const api = calendarRef.current?.getApi();
    if (!api) return;
    if (direction === "prev") {
      api.prev();
    } else {
      api.next();
    }
  };

  const handleToday = () => {
    const api = calendarRef.current?.getApi();
    api?.today();
  };

  const handleEditEvent = (event: CalendarEvent) => {
    populateModalFields(event);
    openModal();
  };

  const totalScheduled = useMemo(
    () => CALENDAR_LEVELS.reduce((sum, level) => sum + (calendarCounts[level] ?? 0), 0),
    [calendarCounts]
  );

  const statCards = useMemo<CalendarStatCard[]>(
    () => [
      {
        title: "Tổng lịch hẹn",
        value: events.length,
        icon: CalendarDays,
        helper: `${totalScheduled} lịch đã tạo`,
      },
      {
        title: "Trong 7 ngày tới",
        value: eventsThisWeek.length,
        icon: CalendarClock,
        helper: eventsThisWeek.length
          ? "Theo dõi tiến độ từng vòng phỏng vấn"
          : "Chưa có lịch hẹn trong tuần",
      },
      {
        title: "Hôm nay",
        value: todaysEvents.length,
        icon: Clock3,
        helper: todaysEvents.length
          ? "Chuẩn bị nội dung phỏng vấn ngay"
          : "Hôm nay chưa có lịch nào",
      },
      {
        title: "Ứng viên tham gia",
        value: candidateCount,
        icon: UserRound,
        helper: candidateCount
          ? "Theo ghi chú trong từng lịch hẹn"
          : "Thêm tên ứng viên để theo dõi",
      },
    ],
    [candidateCount, events.length, eventsThisWeek.length, todaysEvents.length, totalScheduled]
  );

  return (
    <>
      {/* Trang lịch kết hợp phần thống kê, bảng lịch, sidebar và modal chỉnh sửa. */}
      <PageMeta title="HR - CareerGraph" description="HR - CareerGraph" />
      <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background dark:via-muted/10">
        <div className="mx-auto max-w-7xl px-4 pb-16 pt-6 sm:px-6 lg:px-8">
          <PageBreadcrumb pageTitle="Lịch phỏng vấn" />
          <div className="mt-8 space-y-6">
            <CalendarHero
              statCards={statCards}
              onCreate={handleOpenCreateModal}
              onToday={handleToday}
            />

            <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
              <CalendarBoard
                calendarRef={calendarRef}
                currentRangeTitle={currentRangeTitle}
                activeView={activeView}
                onChangeView={handleViewChange}
                onNavigate={handleNavigate}
                onSelectDate={handleDateSelect}
                onEventClick={handleEventClick}
                onDatesSet={handleDatesSet}
                events={events}
                renderEventContent={renderEventContent}
              />

              <CalendarSidebar
                calendarCounts={calendarCounts}
                activeEvent={activeEvent}
                onSelectEvent={setActiveEvent}
                onEditEvent={handleEditEvent}
                upcomingEvents={upcomingEvents}
              />
            </div>
          </div>
        </div>
      </div>

      <CalendarModalForm
        isOpen={isOpen}
        editingEvent={editingEvent}
        eventTitle={eventTitle}
        eventCandidate={eventCandidate}
        eventLevel={eventLevel}
        eventStartDate={eventStartDate}
        eventEndDate={eventEndDate}
        eventLocation={eventLocation}
        eventNotes={eventNotes}
        onClose={handleCloseModal}
        onSubmit={handleAddOrUpdateEvent}
        onTitleChange={setEventTitle}
        onCandidateChange={setEventCandidate}
        onLevelChange={setEventLevel}
        onStartDateChange={setEventStartDate}
        onEndDateChange={setEventEndDate}
        onLocationChange={setEventLocation}
        onNotesChange={setEventNotes}
      />
    </>
  );
};

export default Calendar;
