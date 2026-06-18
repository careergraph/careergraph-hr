# HR Interview QA + UX Production Review Report

- Date: 2026-06-18
- Scope: `careergraph-hr`

## Senior QA Review

### Fixed alignment gaps

1. Completion action in HR UI previously treated `PENDING_RESCHEDULE` as completable while backend rejected it.
   - Fixed by removing `PENDING_RESCHEDULE` from completion-eligible statuses in `interviewCompletionRules.ts`.
2. Online interview feedback UI previously depended on scheduled time.
   - Fixed so online feedback eligibility now follows real room participation (`joinedAt`) instead of wall clock.
3. Kanban schedule modal used `window.confirm` for overwrite flow.
   - Replaced with production-grade `AlertDialog` to match Calendar modal behavior.

### UX Findings From “Demanding Client” View

- Good:
  - overwrite confirmation is now consistent across Calendar and Kanban
  - system no longer exposes a misleading “Hoàn thành” action for `PENDING_RESCHEDULE`
  - online flow feels more natural when interview starts early inside the allowed 15-minute window
- Previously weak:
  - browser-native confirm felt inconsistent, abrupt, and non-brand
  - UI suggested impossible actions in at least one interview state

## Manual Regression Checklist

1. Online interview:
   - candidate joins room 10-15 minutes early
   - HR can complete interview immediately after real join
   - HR can add feedback immediately after real join
2. Offline interview:
   - before `scheduledAt`, complete/feedback stays blocked
3. Candidate overlap:
   - same company, two different jobs, same time: create should succeed
   - different company, same time: create should show privacy-blocking error
4. Cancel interview from Calendar modal:
   - confirm dialog opens
   - backend should no longer fail because of `INTERVIEW_CANCELLED` after SQL hotfix is applied
5. Kanban overwrite:
   - `AlertDialog` appears instead of browser confirm
   - confirm overwrite should proceed cleanly

## Production Readiness Verdict

- Verdict: much closer to production-ready after this pass
- Remaining recommendation:
  - add a small frontend integration test around Kanban overwrite dialog and interview completion rules if the HR app already has a test harness
