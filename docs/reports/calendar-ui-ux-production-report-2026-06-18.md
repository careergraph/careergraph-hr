# Calendar UI/UX Production Report

Date: 2026-06-18
Scope: `careergraph-hr` calendar page, calendar modal, interview edit duration flow

## 1. Summary

The calendar screen was upgraded toward a more production-ready enterprise UX:

- Past dates are visually softened to reduce noise.
- Today is highlighted more consistently across calendar views.
- Interview event cards now have stronger contrast and better readability.
- Event titles support tooltip disclosure for truncated text.
- Edit interview flow now uses duration as the canonical editable field instead of exposing end date.
- The modal layout was restructured to feel cleaner, denser, and easier to scan.

## 2. Implemented Changes

### Calendar grid and event presentation

Files:

- `careergraph-hr/src/pages/Calendar/Calendar.tsx`
- `careergraph-hr/src/pages/Calendar/CalendarBoard.tsx`
- `careergraph-hr/src/index.css`

Changes:

- Added richer custom event cards with:
  - start time label
  - stronger text/background contrast
  - better spacing and rounded enterprise card styling
- Added tooltip support so full interview titles remain visible even when the card is truncated.
- Added custom `+N lịch khác` overflow label in month view.
- Scoped a dedicated `calendar-enterprise` skin for FullCalendar so the page can be tuned without affecting other screens.
- Softened past-day cells and out-of-month days.
- Improved today highlight using a persistent badge-like day number and a clearer background state.
- Improved list/week/day readability with cleaner surfaces and hover feedback.

### Modal UX and duration editing

File:

- `careergraph-hr/src/pages/Calendar/CalendarModalForm.tsx`

Changes:

- Removed editable end-date flow from edit mode.
- Added duration as the main editable scheduling control.
- Added duration preset chips: `30`, `45`, `60`, `90` minutes.
- Added numeric duration input with validation from `15` to `480` minutes.
- Added computed “Kết thúc dự kiến” panel based on start date + start time + duration.
- Updated edit submit logic so duration changes are actually persisted:
  - `rescheduleInterview(... durationMinutes)`
  - `updateInterview(... durationMinutes)`
- Preserved status update flow when time/duration changes.
- Made title and candidate fields read-only in edit mode to align with a stricter scheduling-focused UX.

## 3. Functional Verification

### Build / static validation

Executed:

- `npm run build` in `careergraph-hr`

Result:

- Passed successfully.

Notes:

- Vite reported large bundle warnings only. No build failure.

### Lint

Executed:

- `npm run lint` in `careergraph-hr`

Result:

- Fails because of pre-existing unrelated issues outside the calendar scope.

Unrelated lint error locations observed:

- `src/components/UserProfile/UserMetaCard.tsx`
- `src/pages/Dashboard/Home.tsx`
- `src/pages/Job/JobCard.tsx`
- `src/pages/SuggestionCandidate/CandidateHorizontalList.tsx`

There are also unrelated warnings in other files.

## 4. Difficult Client Review

Role-play verdict: **close to production-ready, and clearly improved**

What feels good:

- The month grid is calmer because past days are less aggressive.
- Today now reads clearly at a glance instead of blending inconsistently.
- Event chips feel more premium and easier to scan.
- Tooltip support solves the “ellipsis hides too much information” complaint.
- Editing duration is much more natural than exposing end date directly for interview scheduling.

What would still make it stronger in a later iteration:

- Add hover popover with candidate, round, status, and location for even faster review.
- Add explicit status legend near the board for new HR users.
- Consider code-splitting the HR app because bundle size is still large.

Customer satisfaction assessment:

- Likely satisfied for this release if the goal is improving usability and visual polish without redesigning the whole module.

## 5. Tester Review

### Scenarios checked logically in code

1. Create interview
- Can set date, start time, duration, notes, and interview type.
- Duration is validated before submission.

2. Edit future interview
- Can update start date.
- Can update start time.
- Can update duration.
- Can update notes.
- Can update status via calendar group selection.

3. No-change submit protection
- Save button remains guarded by `isEditFormChanged`.

4. Past scheduling protection
- Creating on past date is blocked.
- Editing into a past timestamp is blocked.

5. Read-only historical states
- `COMPLETED`, `CANCELLED`, `NO_SHOW`, `IN_PROGRESS` remain protected from invalid edits.

6. Overflow interview names
- Tooltip shows full text when event title is truncated.

### Risks not fully E2E-tested here

- No browser-driven visual regression test was run.
- No backend contract test was run against live API responses.
- FullCalendar tooltip behavior was validated by successful build, but still deserves quick manual browser QA across month/week/day views.

## 6. Recommended Manual QA Checklist

1. Open month view with both past and future interviews.
2. Confirm today is always visibly highlighted.
3. Hover long event titles and confirm tooltip appears.
4. Open a future interview and change only duration, then save.
5. Open a future interview and change time + duration together, then save.
6. Open a completed or cancelled interview and confirm fields are read-only.
7. Check mobile/tablet layouts for modal scroll and action button visibility.

## 7. Final Assessment

For the requested scope, the result is production-leaning and materially better than before.

The main functional improvement is that duration editing now behaves like a real scheduling system.
The main UX improvement is that the calendar is easier to read under dense historical data, while today and active events stand out clearly.
