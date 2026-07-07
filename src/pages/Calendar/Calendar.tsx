import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type FullCalendar from "@fullcalendar/react";
import {
  DateSelectArg,
  EventClickArg,
  EventContentArg,
  EventHoveringArg,
  DatesSetArg,
} from "@fullcalendar/core";
import { useNavigate } from "react-router";
import { CalendarClock, CalendarDays, Clock3, UserRound } from "lucide-react";

import PageMeta from "@/components/common/PageMeta";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import { useModal } from "@/hooks/use-modal";
import { useMediaQuery } from "@/hooks/useMediaQuery";

import { CalendarHero, type CalendarStatCard } from "./CalendarHero";
import { CalendarBoard } from "./CalendarBoard";
import { CalendarEventHoverModal } from "./CalendarEventHoverModal";
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
import { useInterviewStore } from "@/stores/interviewStore";
import type { Interview, InterviewStatus } from "@/types/interview";
import { toast } from "sonner";
import { buildInterviewRoomPath, canAccessInterviewRoom } from "@/lib/interviewRoomAccess";

const STATUS_TO_CALENDAR_LEVEL: Record<InterviewStatus, CalendarLevel> = {
  SCHEDULED: "Primary",
  CONFIRMED: "Success",
  PENDING_RESCHEDULE: "Warning",
  IN_PROGRESS: "Warning",
  COMPLETED: "Success",
  CANCELLED: "Danger",
  NO_SHOW: "Danger",
};

const CALENDAR_LEVEL_PRIORITY: Record<CalendarLevel, number> = {
  Warning: 1,
  Success: 2,
  Primary: 3,
  Danger: 4,
};

const buildInterviewTitle = (round: number) => {
  if (round <= 1) return "Phỏng vấn";
  return `Phỏng vấn vòng ${round}`;
};

const CALENDAR_VIEW_OPTIONS = new Set(["dayGridMonth", "timeGridWeek", "timeGridDay", "listWeek"]);
const UPCOMING_EXCLUDED_STATUSES = new Set(["CANCELLED", "NO_SHOW", "COMPLETED"]);

const getDefaultCalendarView = () => {
  if (typeof window !== "undefined" && window.innerWidth < 768) return "listWeek";
  if (typeof window !== "undefined" && window.innerWidth < 1024) return "timeGridWeek";
  return "dayGridMonth";
};

const normalizeCalendarView = (value: string | null) =>
  value && CALENDAR_VIEW_OPTIONS.has(value) ? value : getDefaultCalendarView();

const buildCalendarUrlStateKey = (view: string, date: Date) =>
  `${view}::${formatDateParam(date)}`;

const getCalendarSearchParams = () => {
  if (typeof window === "undefined") {
    return new URLSearchParams();
  }

  return new URLSearchParams(window.location.search);
};

const formatDateParam = (value: Date) => {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const parseDateParam = (value: string | null) => {
  if (!value) return null;
  const parsed = new Date(`${value}T00:00:00`);
  return Number.isFinite(parsed.getTime()) ? parsed : null;
};

const getWeekInputValue = (anchorDate: Date) => {
  const monday = new Date(anchorDate);
  const day = monday.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  monday.setDate(monday.getDate() + diff);

  const tmp = new Date(Date.UTC(monday.getFullYear(), monday.getMonth(), monday.getDate()));
  tmp.setUTCDate(tmp.getUTCDate() + 4 - (tmp.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(tmp.getUTCFullYear(), 0, 1));
  const week = Math.ceil((((tmp.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);

  return `${tmp.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
};

const getPeriodInputValue = (view: string, anchorDate: Date) => {
  if (view === "dayGridMonth") {
    return `${anchorDate.getFullYear()}-${String(anchorDate.getMonth() + 1).padStart(2, "0")}`;
  }

  if (view === "timeGridWeek" || view === "listWeek") {
    return getWeekInputValue(anchorDate);
  }

  return formatDateParam(anchorDate);
};

const parseWeekInputValue = (value: string) => {
  const [yearPart, weekPart] = value.split("-W");
  const year = Number(yearPart);
  const week = Number(weekPart);
  if (!Number.isFinite(year) || !Number.isFinite(week)) return null;

  const jan4 = new Date(Date.UTC(year, 0, 4));
  const jan4Day = jan4.getUTCDay() || 7;
  const monday = new Date(jan4);
  monday.setUTCDate(jan4.getUTCDate() - jan4Day + 1 + (week - 1) * 7);

  const localDate = new Date(monday.getUTCFullYear(), monday.getUTCMonth(), monday.getUTCDate());
  return Number.isFinite(localDate.getTime()) ? localDate : null;
};

const getInitialCalendarState = () => {
  const params = getCalendarSearchParams();
  return {
    view: normalizeCalendarView(params.get("view")),
    date: parseDateParam(params.get("date")) ?? new Date(),
  };
};

const replaceCalendarUrl = (view: string, date: Date) => {
  if (typeof window === "undefined") return;

  const currentUrl = new URL(window.location.href);
  const nextKey = buildCalendarUrlStateKey(view, date);
  const currentView = normalizeCalendarView(currentUrl.searchParams.get("view"));
  const currentDate = parseDateParam(currentUrl.searchParams.get("date")) ?? new Date();
  const currentKey = buildCalendarUrlStateKey(currentView, currentDate);

  if (nextKey === currentKey) return;

  currentUrl.searchParams.set("view", view);
  currentUrl.searchParams.set("date", formatDateParam(date));
  window.history.replaceState(window.history.state, "", currentUrl.toString());
};

const mapInterviewToCalendarEvent = (interview: Interview, round: number): CalendarEvent => {
  const level = STATUS_TO_CALENDAR_LEVEL[interview.interviewStatus] ?? DEFAULT_EVENT_LEVEL;

  return {
    id: interview.id,
    title: `${buildInterviewTitle(round)} - ${interview.candidateName}`,
    start: toDate(interview.scheduledAt) || undefined,
    end: toDate(interview.endAt) || undefined,
    allDay: false,
    extendedProps: {
      calendar: level,
      priority: CALENDAR_LEVEL_PRIORITY[level],
      candidate: interview.candidateName,
      jobTitle: interview.jobTitle,
      interviewStatus: interview.interviewStatus,
      location: interview.location ?? interview.meetingLink,
      notes: interview.notes,
      meetingLink: interview.meetingLink,
      interviewType: interview.type,
    },
  };
};

// Calendar điều phối bảng lịch, sidebar thống kê và modal chỉnh sửa lịch hẹn.

const mapCalendarApiEventToCalendarEvent = (eventArg: {
  id: string;
  title: string;
  start: Date | null;
  startStr: string;
  end: Date | null;
  endStr: string;
  allDay: boolean;
  extendedProps: Record<string, unknown>;
}) => ({
  id: eventArg.id,
  title: eventArg.title,
  start: eventArg.start ?? eventArg.startStr,
  end: eventArg.end ?? eventArg.endStr,
  allDay: eventArg.allDay,
  extendedProps: {
    calendar: (eventArg.extendedProps.calendar as CalendarLevel) ?? DEFAULT_EVENT_LEVEL,
    priority: Number(eventArg.extendedProps.priority ?? 999),
    candidate: eventArg.extendedProps.candidate as string | undefined,
    location: eventArg.extendedProps.location as string | undefined,
    notes: eventArg.extendedProps.notes as string | undefined,
    jobTitle: eventArg.extendedProps.jobTitle as string | undefined,
    interviewStatus: eventArg.extendedProps.interviewStatus as string | undefined,
    meetingLink: eventArg.extendedProps.meetingLink as string | undefined,
    interviewType: eventArg.extendedProps.interviewType as Interview["type"] | undefined,
  },
});

const Calendar = () => {
  const navigate = useNavigate();
  const isMobile = useMediaQuery("(max-width: 767px)");
  const initialCalendarStateRef = useRef(getInitialCalendarState());
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [activeEvent, setActiveEvent] = useState<CalendarEvent | null>(null);
  const [eventTitle, setEventTitle] = useState("");
  const [eventCandidate, setEventCandidate] = useState("");
  const [eventStartDate, setEventStartDate] = useState("");
  const [eventLevel, setEventLevel] = useState<CalendarLevel>(DEFAULT_EVENT_LEVEL);
  const [eventLocation, setEventLocation] = useState("");
  const [eventNotes, setEventNotes] = useState("");
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [currentRangeTitle, setCurrentRangeTitle] = useState("");
  const [hoveredEvent, setHoveredEvent] = useState<CalendarEvent | null>(null);
  const [hoveredEventPosition, setHoveredEventPosition] = useState<{
    top: number;
    bottom: number;
    left: number;
    right: number;
    cursorX?: number;
    cursorY?: number;
  } | null>(null);
  const [activeView, setActiveView] = useState(() =>
    initialCalendarStateRef.current.view
  );
  const [activeDate, setActiveDate] = useState<Date>(() => initialCalendarStateRef.current.date);

  const calendarRef = useRef<FullCalendar | null>(null);
  const { isOpen, openModal, closeModal } = useModal();

  const { calendarEvents: interviewEvents, fetchCalendarEvents } = useInterviewStore();

  const handleJoinEventRoom = useCallback(
    (event: CalendarEvent) => {
      const meetingLink = event.extendedProps?.meetingLink;
      if (!meetingLink) return;

      const canJoin = canAccessInterviewRoom({
        type: event.extendedProps?.interviewType,
        meetingLink,
        interviewStatus: event.extendedProps?.interviewStatus,
        endAt: event.end,
      });

      if (!canJoin) {
        toast.warning("Hiện chưa thể vào phòng phỏng vấn này.");
        return;
      }

      navigate(buildInterviewRoomPath(meetingLink));
    },
    [navigate]
  );

  const renderEventContent = useCallback(
    (eventInfo: EventContentArg) => {
      const variant = getCalendarVariant(eventInfo.event.extendedProps.calendar);
      const styles = CALENDAR_VARIANT_STYLES[variant];
      const start = toDate(eventInfo.event.start);
      const eventView = eventInfo.view.type;
      const isMonthView = eventView === "dayGridMonth";
      const timeLabel = start
        ? start.toLocaleTimeString("vi-VN", {
            hour: "2-digit",
            minute: "2-digit",
          })
        : "";
      const isPastEvent = start ? start.getTime() < Date.now() : false;
      const canJoinRoom = canAccessInterviewRoom({
        type: eventInfo.event.extendedProps.interviewType as Interview["type"] | undefined,
        meetingLink: eventInfo.event.extendedProps.meetingLink as string | undefined,
        interviewStatus: eventInfo.event.extendedProps.interviewStatus as string | undefined,
        endAt: eventInfo.event.end,
      });

      return (
        <div
          className={`calendar-event-card flex min-w-0 rounded-[18px] border px-2 py-1.5 text-left transition ${styles.chip} ${styles.text} ${
            isPastEvent ? "calendar-event-card--past" : ""
          }`}
          title={eventInfo.event.title}
        >
          <div className="min-w-0 flex-1">
            {timeLabel ? (
              <p className="mb-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-current/70">
                {timeLabel}
              </p>
            ) : null}
            <p className={`${isMonthView ? "truncate" : "line-clamp-2"} text-[11px] font-semibold leading-4`}>
              {eventInfo.event.title}
            </p>
            {!isMonthView && canJoinRoom ? (
              <button
                type="button"
                className="mt-1 inline-flex max-w-full truncate rounded-full bg-white/70 px-2 py-0.5 text-[10px] font-semibold text-current/90 underline-offset-2 hover:bg-white/90"
                onClick={(clickEvent) => {
                  clickEvent.preventDefault();
                  clickEvent.stopPropagation();
                  handleJoinEventRoom(mapCalendarApiEventToCalendarEvent(eventInfo.event));
                }}
              >
                Vào phòng phỏng vấn
              </button>
            ) : null}
          </div>
        </div>
      );
    },
    [handleJoinEventRoom]
  );

  const loadCalendarData = useCallback((year?: number, month?: number) => {
    const now = new Date();
    fetchCalendarEvents(year ?? now.getFullYear(), (month ?? now.getMonth()) + 1);
  }, [fetchCalendarEvents]);

  useEffect(() => {
    loadCalendarData();
  }, [loadCalendarData]);

  useEffect(() => {
    replaceCalendarUrl(activeView, activeDate);
  }, [activeDate, activeView]);

  useEffect(() => {
    const completedRoundsByApplication = new Map<string, number>();
    const mapped = [...interviewEvents]
      .sort((a, b) => {
        const timeA = toDate(a.scheduledAt)?.getTime() ?? 0;
        const timeB = toDate(b.scheduledAt)?.getTime() ?? 0;
        return timeA - timeB;
      })
      .map((interview) => {
        const completedRounds = completedRoundsByApplication.get(interview.applicationId) ?? 0;
        const currentRound = interview.roundNumber ?? (completedRounds + 1);
        if (interview.interviewStatus === "COMPLETED") {
          completedRoundsByApplication.set(interview.applicationId, completedRounds + 1);
        }
        return mapInterviewToCalendarEvent(interview, currentRound);
      });

    setEvents(mapped);
  }, [interviewEvents]);

  const sortedEvents = useMemo(() => {
    return [...events].sort((a, b) => {
      const dayA = normalizeDate(a.start)?.getTime() ?? 0;
      const dayB = normalizeDate(b.start)?.getTime() ?? 0;
      if (dayA !== dayB) return dayA - dayB;

      const priorityA = Number(a.extendedProps?.priority ?? 999);
      const priorityB = Number(b.extendedProps?.priority ?? 999);
      if (priorityA !== priorityB) return priorityA - priorityB;

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
      const endTime = toDate(event.end)?.getTime() ?? toDate(event.start)?.getTime() ?? 0;
      const isExpired = Number.isFinite(endTime) && endTime < now.getTime();
      const status = String(event.extendedProps?.interviewStatus ?? "");
      const isUpcomingEligible = !UPCOMING_EXCLUDED_STATUSES.has(status);
      if (event.extendedProps?.candidate) {
        candidateTotal += 1;
      }

      if (!date) return;

      if (!isExpired && date >= start && isUpcomingEligible) {
        upcoming.push(event);
      }

      if (!isExpired && date >= start && date < tomorrow && isUpcomingEligible) {
        todayEvents.push(event);
      }

      if (!isExpired && date >= start && date <= weekAhead && isUpcomingEligible) {
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
    if (!activeEvent) {
      if (firstUpcomingEvent) {
        setActiveEvent(firstUpcomingEvent);
      }
      return;
    }

    const matched = events.find((event) => event.id === activeEvent.id);
    if (matched) {
      if (matched !== activeEvent) {
        setActiveEvent(matched);
      }
      return;
    }

    setActiveEvent(firstUpcomingEvent ?? null);
  }, [activeEvent, events, firstUpcomingEvent]);

  const handleDatesSet = (arg: DatesSetArg) => {
    setCurrentRangeTitle(arg.view.title);
    setActiveView(arg.view.type);
    const currentDate =
      "currentStart" in arg.view && arg.view.currentStart instanceof Date
        ? arg.view.currentStart
        : arg.start;
    setActiveDate(currentDate);
    const midDate = new Date((arg.start.getTime() + arg.end.getTime()) / 2);
    loadCalendarData(midDate.getFullYear(), midDate.getMonth());
  };

  const resetModalFields = () => {
    setEditingEvent(null);
    setEventTitle("");
    setEventCandidate("");
    setEventStartDate("");
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
    setEventLevel(eventData.extendedProps?.calendar ?? DEFAULT_EVENT_LEVEL);
    setEventLocation(eventData.extendedProps?.location ?? "");
    setEventNotes(eventData.extendedProps?.notes ?? "");
  };

  const handleDateSelect = (selectInfo: DateSelectArg) => {
    const selectedDate = normalizeDate(selectInfo.start);
    const today = normalizeDate(new Date());
    if (selectedDate && today && selectedDate < today) {
      toast.error("Không thể tạo lịch phỏng vấn ở ngày quá khứ.");
      selectInfo.view.calendar.unselect();
      return;
    }

    resetModalFields();
    const startInput = formatDateForInput(selectInfo.start);
    setEventStartDate(startInput);
    openModal();
    selectInfo.view.calendar.unselect();
  };

  const handleEventClick = (clickInfo: EventClickArg) => {
    const matched = events.find((event) => event.id === clickInfo.event.id);

    const eventData: CalendarEvent =
      matched ?? mapCalendarApiEventToCalendarEvent(clickInfo.event);

    populateModalFields(eventData);
    setActiveEvent(matched ?? eventData);
    setHoveredEvent(null);
    setHoveredEventPosition(null);
    openModal();
  };

  const handleEventMouseEnter = (hoverInfo: EventHoveringArg) => {
    if (isMobile) return;

    const matched = events.find((event) => event.id === hoverInfo.event.id);
    const rect = hoverInfo.el.getBoundingClientRect();

    setHoveredEvent(matched ?? mapCalendarApiEventToCalendarEvent(hoverInfo.event));
    setHoveredEventPosition({
      top: rect.top,
      bottom: rect.bottom,
      left: rect.left,
      right: rect.right,
      cursorX: hoverInfo.jsEvent.clientX,
      cursorY: hoverInfo.jsEvent.clientY,
    });
  };

  const handleEventMouseLeave = () => {
    setHoveredEvent(null);
    setHoveredEventPosition(null);
  };

  const handleViewChange = (view: string) => {
    const api = calendarRef.current?.getApi();
    if (!api || api.view.type === view) return;
    api.changeView(view, activeDate);
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

  const handlePeriodChange = (value: string) => {
    const api = calendarRef.current?.getApi();
    if (!api || !value) return;

    if (activeView === "dayGridMonth") {
      const parsed = parseDateParam(`${value}-01`);
      if (parsed) api.gotoDate(parsed);
      return;
    }

    if (activeView === "timeGridWeek" || activeView === "listWeek") {
      const parsed = parseWeekInputValue(value);
      if (parsed) api.gotoDate(parsed);
      return;
    }

    const parsed = parseDateParam(value);
    if (parsed) {
      api.gotoDate(parsed);
    }
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
        <div className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
          <PageBreadcrumb pageTitle="Lịch phỏng vấn" />
          <div className="mt-8 space-y-6">
            <CalendarHero
              statCards={statCards}
              onCreate={handleOpenCreateModal}
              onToday={handleToday}
            />

            <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
              <CalendarBoard
                calendarRef={calendarRef}
                currentRangeTitle={currentRangeTitle}
                activeView={activeView}
                onChangeView={handleViewChange}
                onNavigate={handleNavigate}
                onToday={handleToday}
                periodValue={getPeriodInputValue(activeView, activeDate)}
                onPeriodChange={handlePeriodChange}
                onSelectDate={handleDateSelect}
                onEventClick={handleEventClick}
                onEventMouseEnter={handleEventMouseEnter}
                onEventMouseLeave={handleEventMouseLeave}
                onDatesSet={handleDatesSet}
                events={sortedEvents}
                renderEventContent={renderEventContent}
                initialView={initialCalendarStateRef.current.view}
                initialDate={initialCalendarStateRef.current.date}
                headerToolbar={
                  isMobile
                    ? { left: "prev,next", center: "title", right: "listWeek,timeGridDay" }
                    : undefined
                }
              />

              {!isMobile && (
                <CalendarSidebar
                  variant="detail"
                  calendarCounts={calendarCounts}
                  activeEvent={activeEvent}
                  onSelectEvent={setActiveEvent}
                  onEditEvent={handleEditEvent}
                  onJoinEventRoom={handleJoinEventRoom}
                  upcomingEvents={upcomingEvents}
                />
              )}
            </div>

            {!isMobile ? (
              <CalendarSidebar
                variant="status"
                calendarCounts={calendarCounts}
                activeEvent={activeEvent}
                onSelectEvent={setActiveEvent}
                onEditEvent={handleEditEvent}
                onJoinEventRoom={handleJoinEventRoom}
                upcomingEvents={upcomingEvents}
              />
            ) : null}
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
        eventLocation={eventLocation}
        eventNotes={eventNotes}
        onClose={handleCloseModal}
        onTitleChange={setEventTitle}
        onCandidateChange={setEventCandidate}
        onLevelChange={setEventLevel}
        onStartDateChange={setEventStartDate}
        onLocationChange={setEventLocation}
        onNotesChange={setEventNotes}
        onInterviewCreated={() => loadCalendarData()}
      />
      <CalendarEventHoverModal event={hoveredEvent} position={hoveredEventPosition} />
    </>
  );
};

export default Calendar;
