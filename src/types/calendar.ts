import { EventInput } from "@fullcalendar/core";

import { CalendarLevel } from "@/lib/calendar-utils";
import type { InterviewType } from "@/types/interview";

export interface CalendarEvent extends EventInput {
  extendedProps: {
    calendar: CalendarLevel;
    priority?: number;
    candidate?: string;
    location?: string;
    notes?: string;
    jobTitle?: string;
    interviewStatus?: string;
    meetingLink?: string;
    interviewType?: InterviewType;
  };
}
