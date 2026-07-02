# Kanban next stage and contact sync report

## Scope

- Added a primary action in candidate detail to move the candidate to the next active pipeline stage.
- Kept the existing interview scheduling flow intact when the next stage is the interview stage.
- Synced FE state with BE immediately after HR sends a message so candidates auto-moved to `HR_CONTACTED` appear in the correct column without `F5`.

## Files changed

- `src/pages/Kanban/KanbanBoard.tsx`
- `src/pages/Kanban/CandidateDetail.tsx`
- `src/pages/Kanban/CandidateTab/MessagesTab.tsx`
- `src/features/messaging/components/CandidateMessageTab.tsx`
- `src/features/messaging/components/ChatWindow.tsx`
- `src/services/applicationService.ts`

## Implementation notes

- The new button is placed in the right-side action card of the candidate detail sheet.
- Button label follows the current pipeline order, for example `Chuyển sang Liên hệ`, `Chuyển sang Phỏng vấn`.
- The button uses a solid dark CTA to separate it from the destructive reject action.
- For interview transition, the button still routes HR into the existing interview scheduling modal instead of bypassing business logic.
- After a successful send message action, FE re-fetches the current application from BE and compares the real stage. If BE changed it to `HR_CONTACTED`, the card and detail sheet update immediately.

## Verification

- `npm run build` in `careergraph-hr`: passed.
- Manual logic review:
  - Drag-drop still only allows moving to the next stage or reject.
  - Direct next-stage button follows the same restrictions.
  - Interview completion guard before moving to `INTERVIEW_COMPLETED` remains intact.
  - Existing scheduling path to `INTERVIEW_SCHEDULED` remains intact.
  - Candidate detail status badge now shows stage label instead of raw status code.

## UX review

- Good:
  - HR now has a fast production-friendly action inside the detail modal, reducing drag-drop dependency.
  - The main CTA is close to stage context, which is where HR decides the next action.
  - Auto-sync after messaging removes confusion caused by backend success but stale UI.
- Residual concern:
  - The action card is now denser because it contains both `next stage` and `reject`. It is still acceptable, but if more quick actions are added later, this area should be split into a dedicated action row.

## Test review as senior QA

- High confidence that the reported bugs are addressed.
- No regression found in the implemented transition rules by static review and production build.
- Project-wide `npm run lint` is still failing because of pre-existing unrelated issues outside the Kanban files touched in this change.

## Customer-style acceptance

- The flow is notably more convenient for HR.
- The UI now better reflects actual system state after contact actions.
- This is closer to production readiness, with the remaining gap mainly being unrelated lint debt in the HR app.
