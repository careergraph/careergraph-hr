# HR Fix Report

## Scope

- Added an in-component loading state for verification document uploads so HR sees clear progress while a file is being stored.
- Fixed notification bell/dropdown request spam by preventing repeated fetch loops on open.
- Added blocked-session handling:
  - forced logout when backend reports blocked access
  - blocked-company detection during auth hydration
  - sign-in popup with production-style guidance and support email
- Added realtime post-approval handling:
  - refresh access token
  - reload company profile
  - reload page so approved permissions behave like a fresh login
- Auto-logout on realtime `COMPANY_BLOCKED` notifications.
- Stabilized funnel conversion chart hover/tooltip behavior.
- Translated recent recruitment activity stage labels such as `Trial period` to Vietnamese display.

## Production Notes

- Session notices are persisted briefly through `sessionStorage` so users still see the reason after redirect to `/signin`.
- Support contact used in HR messaging: `support@careergraph.vn`.
- Historical verification documents continue to render from preserved request history.

## Verification

- Manual code review completed for auth guard, interceptor, realtime notification handling, upload state, and dashboard display paths.
- TypeScript build could not be executed in this environment because `node` is not available on `PATH`.

## Risks / Follow-up

- Once `node` is available locally, run `tsc -b` and `vite build` for final frontend verification.
- Consider adding a dedicated global modal/banner for forced logout events so the same UX is shared across every protected route.
