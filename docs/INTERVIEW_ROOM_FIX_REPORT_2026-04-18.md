# Interview Room and HR Src Fix Report
Generated: 2026-04-18

## 1) Scope
This report covers:
- Fixing current diagnostics in HR src (a11y + Tailwind class normalization + inline-style rule).
- Reviewing and fixing HR/Candidate interview room signaling reliability (join-request visibility, rejoin/reload flows).
- Running validation/build checks and multi-scenario socket tests.

## 2) HR Src Diagnostics - Findings and Fixes
### Main diagnostics fixed
- ARIA value warning on UserDropdown toggle.
- Multiple Tailwind canonical class warnings in dashboard/recruitment components.
- Inline-style warnings in LoadingSpinner.
- Gradient utility warning in Jobs grid.

### Files updated in HR
- src/components/header/UserDropdown.tsx
- src/components/recruitment/RecruitmentKpiCards.tsx
- src/components/recruitment/PipelineVelocityChart.tsx
- src/components/recruitment/HiringTargetProgress.tsx
- src/components/recruitment/FunnelConversionChart.tsx
- src/components/recruitment/TalentSourceCard.tsx
- src/components/recruitment/RecentCandidateActivity.tsx
- src/components/tables/BasicTables/BasicTableOne.tsx
- src/components/ui/LoadingSpinner.tsx
- src/pages/Job/JobsGrid.tsx
- src/hooks/useWebRTC.ts

### Result
- get_errors on d:/DaiHoc/DoAn/careergraph-hr/src -> No errors found.

## 3) Interview Room Logic Review - Root Cause and Fixes
### Symptom reported
"HR does not always see candidate join-request notifications" in some join/rejoin/reload flows.

### Root cause identified
Socket race condition risk in both FE hooks:
- Socket could connect and emit join-room before all event listeners were fully registered (join-request/admission lifecycle listeners).
- This could cause intermittent missed events on fast connections.

### FE hook reliability fixes
- HR hook: src/hooks/useWebRTC.ts
  - Reset room-related state when room/token changes.
  - Use socket.io with autoConnect: false.
  - Register listeners first, then call socket.connect().
- Candidate hook: careergraph-client/src/hooks/useWebRTC.js
  - Same listener-first strategy with autoConnect: false.
  - Reset admission/peer state before connecting.

### RTC signaling alignment fixes
File: careergraph-rtc/src/index.js
- Added room lifecycle state support:
  - open-room, close-room (5-minute grace), end-room
  - room-status-changed, room-closing, room-ended broadcasts
- Added waiting queue visibility support:
  - waiting-count emissions for host
- Added peer media synchronization support:
  - media-state-changed
  - peer-media-changed
  - disable-peer-media -> media-disabled-by-host
- Improved cleanup on kick/disconnect:
  - remove peer media state
  - clear room close timers and room state when room fully empties
- Preserved and improved join/rejoin behavior:
  - waiting candidates still trigger join-request when host (re)joins
  - admitted candidates can rejoin directly

## 4) Validation and Test Execution
### Build/validation
- HR frontend build: npm run build -> PASS
- Client frontend build: npm run build -> PASS
- HR src diagnostics: get_errors -> PASS (no errors)

### Socket integration suites
Against patched RTC server on port 4100:
- scripts/verify-socket-events.js -> PASS
  - root-rtc suite: PASS
  - chat suite: PASS
  - notify suite: PASS

### Additional room-flow scenarios tested
All PASS:
1. First entry flow: host joins, candidate requests, host receives join-request.
2. Candidate leave and rejoin after admit: candidate re-admitted and host receives user-joined.
3. Host reload while candidate waiting: host reconnect still receives join-request for waiting candidate.
4. Candidate reload while waiting: host receives waiting-user-left for old socket and new join-request for new socket.

## 5) Notes / Remaining Risks
- Existing process was already bound to port 4000 in local environment; isolated tests were run on port 4100 to validate patched server behavior.
- Home dashboard currently references older static widgets on this branch; not part of this fix scope.

## 6) Conclusion
- Current HR src diagnostics reported in this task were fixed.
- Interview room signaling reliability was hardened across HR FE, Candidate FE, and RTC server.
- Required multi-case join/rejoin/reload behavior was validated with passing test runs.
