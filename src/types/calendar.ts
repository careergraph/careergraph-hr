import { EventInput } from "@fullcalendar/core";

import { CalendarLevel } from "@/lib/calendar-utils";

export interface CalendarEvent extends EventInput {
  extendedProps: {
    calendar: CalendarLevel;
    candidate?: string;
    location?: string;
    notes?: string;
  };
}
