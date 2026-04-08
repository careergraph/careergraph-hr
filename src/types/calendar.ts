import { EventInput } from "@fullcalendar/core";

import { CalendarLevel } from "@/lib/calendar-utils";

export interface CalendarEvent extends EventInput {
  extendedProps: {
    calendar: CalendarLevel;
    priority?: number;
    candidate?: string;
    location?: string;
    notes?: string;
    jobTitle?: string;
    interviewStatus?: string;
  };
}
