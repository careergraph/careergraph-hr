# HR Socket QA and UIUX Report - 2026-06-20

## Scope

- Reviewed HR notification socket usage.
- Reviewed HR messaging socket usage.
- Reviewed HR WebRTC interview room connection usage.
- Performed UI/UX review of the notification experience from a production perspective.

## Fix Applied

Updated HR socket clients to stop forcing `websocket` only.

Changed areas:

- notification socket hook
- chat socket hook
- WebRTC room socket hook

New client behavior:

- `transports: ["websocket", "polling"]`
- `tryAllTransports: true`
- reconnect retained
- connection timeout added

## Why This Matters

This is the most important production hardening for the HR frontend because the app is accessed through a proxy/CDN chain. If websocket upgrade fails in production, Socket.IO can now degrade to polling instead of failing outright.

## Senior Test Review

Positive findings:

- Notification dropdown logic is coherent.
- Notification click-through mapping is structured and production-usable.
- Messaging hook already uses a shared socket pattern, which is good for one-tab and multi-consumer stability.
- HR interview room logic is reasonably defensive around join requests and room state changes.

Risks still present:

- I could not run a frontend build in this environment because `node` is not available in the shell PATH on 2026-06-20.
- No automated browser-level smoke test confirms the public-domain handshake through CloudFront/Traefik.
- WebRTC media connectivity still depends on browser network conditions; only signaling resilience was improved here.

## Customer-Lens UI/UX Review

What is already good:

- Notification dropdown is readable and structured.
- Unread state is visually clear.
- Notification actions route users to relevant screens.
- Real-time update expectation is communicated in the UI.

What still feels below strict production polish:

- Notification text contains mojibake/encoding corruption in multiple Vietnamese labels, for example button and heading text.
- Dropdown width and right alignment may feel cramped on smaller laptop widths.
- There is no visible socket/offline status, so HR users cannot distinguish "no new data" from "socket disconnected".
- Bulk action wording is slightly inconsistent between states.

## Recommended Next UI/UX Improvements

- Fix UTF-8 encoding corruption in HR notification labels immediately.
- Add a subtle realtime status indicator:
  - connected
  - reconnecting
  - offline
- Add retry/help text when socket reconnection is failing.
- Consider a compact empty-state CTA that routes HR to inbox/interviews/jobs depending on role context.

## Recommendation

From a production standpoint, the transport fix is necessary and correct. The next highest-value HR improvement is fixing text encoding and exposing connection state to the user.
