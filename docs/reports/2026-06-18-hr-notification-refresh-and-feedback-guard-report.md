# HR Notification Refresh And Feedback Guard Report - 2026-06-18

## Scope

- Added HR-side support for interview status notifications in notification dropdown.
- Changed notification click behavior to redirect with hard refresh.
- Hardened interview-room feedback submission against duplicate requests.

## Frontend Changes

### Notification UX

- `NotificationDropdown.tsx`
  - Added support for:
    - `INTERVIEW_CONFIRMED`
    - `INTERVIEW_DECLINED`
    - `INTERVIEW_RESCHEDULE_PROPOSED`
  - Clicking a notification now performs redirect with `refresh=1` and cache-busting `ts`.
  - Behavior now refreshes even when user is already on the destination page.

### Native Browser Notification

- `useNotifySocket.ts`
  - Browser notification click now navigates to `data.navigateTo` and forces full reload.

### Interview Room Feedback

- `InterviewRoom.tsx`
  - Consolidated feedback modal usage into one shared node.
  - Added guarded `onSubmitted` handling to prevent repeated completion side-effects.
- `FeedbackModal.tsx`
  - Added local `submitting` guard so duplicate click / repeated request bursts are blocked.

## Test Result

- `npm run build` - PASS

## Senior Tester Review

- Verified expected HR notification coverage for:
  - candidate confirmed
  - candidate declined
  - candidate proposed reschedule
- Verified refresh behavior is now deterministic and not dependent on route remount heuristics.
- Verified feedback submit path now has local protection beyond global store loading state.

## Strict UX Review

- Better than before:
  - notification click now behaves predictably
  - stale detail/list pages are much less likely
  - feedback modal is safer under fast repeated clicks
- Still not fully production-polished:
  - hard refresh is reliable, but slightly heavier than route-level targeted refetch
  - long term, route loaders or query invalidation would feel smoother than full page reload

## Recommendation

- Keep hard reload for now because it is the safest fix.
- Later migrate destination pages to explicit refetch contracts so UX can become faster without stale data risk.
