# Interview Feedback Eligibility Regression Report

Date: 2026-05-20

## Scope

- HR interview room: `/interview/room/:roomCode`
- HR interview list: `/interviews`
- HR interview detail: `/interviews/:id`
- Feedback modal used by room, list, and detail flows

## Symptoms

1. In an online interview room, the candidate had entered the room, but the HR actions `Hoan thanh` and `Danh gia` stayed disabled.
2. On `/interviews`, a grouped online room could still show `Danh gia ung vien` even when all joined candidates had already been reviewed or the remaining candidates were not eligible because they never joined the room.
3. Opening the feedback form from the list could let HR select a candidate, then fail on submit with backend error: `You have already submitted feedback for this interview`.

## Root Cause

### Room buttons disabled

The production rule is aligned with the backend source of truth: an interview can be completed from `CONFIRMED` or `IN_PROGRESS`. For online rooms, the candidate must also have a room participant record with `joinedAt`. A newly scheduled interview should show a disabled completion action until the candidate actually joins the room and the backend transitions the interview to `IN_PROGRESS`.

### Feedback button shown incorrectly

The list UI trusted `interview.feedback.length === 0` from the interview list response. That response can be stale or incomplete compared with the canonical feedback endpoint. The backend correctly rejects a duplicate submission, but the frontend was giving HR a path into an invalid action.

## Fix Summary

### Completion eligibility

File: `src/pages/Interview/interviewCompletionRules.ts`

- Completion eligibility now stays aligned with the backend: `CONFIRMED` or `IN_PROGRESS` only.
- The online-room participant guard remains in place, so an online interview also requires the candidate to have `joinedAt`.

### Detail page action safety

File: `src/pages/Interview/InterviewDetail.tsx`

- Added an explicit confirmation dialog before cancelling an interview.
- Added an `actionSubmitting` guard to prevent repeated clicks from sending duplicate complete/cancel requests.

### List feedback eligibility

File: `src/pages/Interview/InterviewList.tsx`

- Added `feedbackStatusByInterviewId` as a verified feedback cache.
- For completed online room candidates, the list now checks `/interviews/{id}/feedback`.
- The grouped room `Danh gia ung vien` button only appears when at least one candidate is:
  - `COMPLETED`
  - present in room participants with `joinedAt`
  - verified to have no feedback yet
- Clicking the button re-validates the candidate list immediately before opening the modal.

### Modal feedback eligibility

File: `src/pages/Interview/FeedbackModal.tsx`

- When opened with multiple candidate options, the modal filters candidates by calling `/interviews/{id}/feedback`.
- The candidate select only contains candidates that are still eligible.
- Submit performs one final feedback existence check before posting, preventing the duplicate-feedback backend rejection from surfacing as a poor UX.

## Regression Checklist

1. Newly scheduled online interview:
   - `Hoan thanh` is disabled before the candidate joins the room.
   - `Huy phong van` opens a confirmation dialog instead of cancelling immediately.

2. Online room, candidate joins:
   - Backend transitions the candidate's interview to `IN_PROGRESS`.
   - `Hoan thanh` becomes enabled after participant has `joinedAt` and status is `IN_PROGRESS`.
   - `Danh gia` remains disabled until completion.

3. Complete a joined candidate from the room:
   - Candidate status changes to completed.
   - `Danh gia` becomes enabled for that candidate only if no feedback exists.

4. `/interviews` grouped room with all completed joined candidates already reviewed:
   - `Danh gia ung vien` is hidden.

5. `/interviews` grouped room with mixed candidates:
   - Never-joined candidates do not appear in feedback modal.
   - Already-reviewed candidates do not appear in feedback modal.
   - Only completed, joined, unreviewed candidates appear.

6. Race condition check:
   - If feedback is submitted from another tab after the button appears, submit should show a friendly local message and remove that candidate from the modal options.

## Notes

- The backend remains the final source of truth for duplicate feedback.
- The frontend now avoids presenting invalid choices instead of relying on backend rejection as normal control flow.
- Build verification was attempted with `node_modules/.bin/tsc.cmd -b`, but the local environment could not execute it because `node` was not available in PATH.
