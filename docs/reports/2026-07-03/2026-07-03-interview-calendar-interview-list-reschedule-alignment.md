# Interview calendar/interview list reschedule alignment

- Date: 2026-07-03
- Scope: `careergraph-hr`
- Related areas:
  - `src/pages/Calendar/Calendar.tsx`
  - `src/pages/Calendar/CalendarModalForm.tsx`
  - `src/pages/Interview/InterviewList.tsx`
  - `src/lib/interviewDisplay.ts`

## Problem summary

`/calendar` and `/interviews` were not using the same rule to decide which interview record is the "current" record after same-day reschedule operations.

Current backend behavior still follows:

1. Cancel old interview record
2. Create a new interview record
3. Link the new record with `rescheduledFromId`

Because of that, the frontend must decide which record should represent the candidate in operational views.

Observed mismatch:

- `/calendar` showed historical cancelled records together with the effective new slot
- `/interviews` grouped online rooms by `meetingLink`, then picked the latest record by `scheduledAt` for each `applicationId`
- In a chain like `09:00 cancelled -> 20:00 active -> 21:00 cancelled`, the grouped room card could incorrectly choose the `21:00 cancelled` record as the representative record and hide the valid `20:00` interview

## Production decision taken

To keep risk low and avoid changing persistence/business workflow in API right now, the frontend now uses two display rules:

- `calendar` and tab `Tất cả` must still show cancelled interview records
- grouped online room cards must choose the correct representative record for each reschedule chain so a later cancelled copy does not hide the currently effective interview

This is the smallest safe change because it preserves:

- existing backend audit/history
- visibility of cancelled records in overview screens
- existing room creation flow
- existing reschedule notifications

## Code changes

### 1. Added representative-chain resolver

New helper: `src/lib/interviewDisplay.ts`

- Resolves interview chains using `rescheduledFromId`
- Picks one representative interview per chain
- Prefers non-cancelled records over cancelled/no-show records
- Falls back to newest record when needed

### 2. Calendar keeps cancelled records visible

File: `src/pages/Calendar/Calendar.tsx`

- Calendar mapping now uses raw interview rows again
- Cancelled schedules remain visible in the monthly/day views

### 3. Interview room grouping uses representative records without hiding cancelled history

File: `src/pages/Interview/InterviewList.tsx`

- Grouped online room cards read raw room interviews
- Each reschedule chain still resolves one representative record for operational actions
- Cancelled history inside the room remains visible in tab `Tất cả`
- Prevents a later cancelled record from hiding an earlier still-valid same-day record in the same chain

### 4. Fixed edit modal reschedule/status bug

File: `src/pages/Calendar/CalendarModalForm.tsx`

- When changing time and status in the same edit flow, the status update now targets the newly created rescheduled interview record
- Previously the code could update the old record after reschedule, which risked reviving or misclassifying a cancelled record

### 5. Fixed calendar sidebar "Sắp diễn ra" and deep-link navigation

Files:

- `src/pages/Calendar/Calendar.tsx`
- `src/pages/Calendar/CalendarBoard.tsx`

Changes:

- `Sắp diễn ra` now excludes `CANCELLED`, `NO_SHOW`, and `COMPLETED`
- Sidebar detail now resets to an event in the currently loaded dataset instead of keeping stale detail from the previous month
- Calendar state is synced to URL query params:
  - `view`
  - `date`
- Added direct period jumping controls:
  - month picker in month view
  - week picker in week view
  - date picker in day view

### 6. Fixed FE infinite render loop after calendar URL sync

File:

- `src/pages/Calendar/Calendar.tsx`

Root cause:

- After adding `view/date` query param sync, `datesSet()` always called `setSearchParams()`
- Even when URL values were already identical, the calendar still pushed another location update
- That caused repeated rerenders and eventually `Maximum update depth exceeded`
- The stack surfaced inside Radix `ScrollArea`, but `ScrollArea` was only the place where React finally failed, not the true cause

Fix:

- Guarded `setSearchParams()` so it only updates when `view/date` actually change
- Guarded `setActiveView()` and `setActiveDate()` to avoid redundant state writes from the search param effect
- Locked `FullCalendar` `initialView` and `initialDate` to first mount only
- Added a ref-based guard so URL-driven `changeView()/gotoDate()` does not immediately bounce back through `datesSet()` into another URL write

Example:

- `/calendar?view=dayGridMonth&date=2026-08-01`
- `/calendar?view=timeGridWeek&date=2026-07-06`
- `/calendar?view=timeGridDay&date=2026-07-03`

## QA performed

### Static checks

- `npx eslint src/lib/interviewDisplay.ts src/pages/Calendar/Calendar.tsx src/pages/Calendar/CalendarModalForm.tsx src/pages/Interview/InterviewList.tsx`
  - Passed
- `npx eslint src/pages/Calendar/Calendar.tsx src/pages/Calendar/CalendarBoard.tsx src/pages/Calendar/CalendarSidebar.tsx`
  - Passed

### Full project checks

- `npm run build`
  - Blocked by pre-existing unrelated TypeScript errors in:
    - `src/pages/Landing/HeroSection.tsx`
    - `src/pages/Landing/LandingPage.tsx`
- `npm run lint`
  - Blocked by many pre-existing unrelated lint issues outside interview scheduling scope

### Logic review checklist

- Same candidate with multiple same-day records in one reschedule chain
  - representative record chosen correctly
- Online room grouped view
  - no longer collapses to the wrong cancelled record just because it has a later time
- Calendar operational view
  - keeps cancelled copies visible
- Edit modal
  - no longer sends status update to old interview id after reschedule

## UX review

### Good after this fix

- HR sees a cleaner operational view
- Room cards better match what recruiters expect to act on
- Candidate counts are easier to trust

### Still worth improving later

- `/interviews` should eventually expose an optional "view history" action for a room/candidate chain if the business wants audit visibility without cluttering the main list
- `/calendar` could later add a small badge or tooltip for "rescheduled from earlier slot" if users still need visibility into same-day changes
- The API model would be cleaner long-term if simple same-day time edits could mutate one operational record while preserving audit in a dedicated history table instead of duplicating interview rows

## Recommendation

For now, keep the backend workflow unchanged and standardize operational display around representative records.

If the team later wants a more enterprise-grade audit model, do it as a separate backend refactor with:

- interview master record
- interview schedule history table
- explicit audit events for reschedule/cancel/confirm

That would be a larger change and was intentionally avoided in this patch to minimize blast radius.
