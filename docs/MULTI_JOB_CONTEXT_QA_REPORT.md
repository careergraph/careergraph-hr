# HR FE Multi-Job Context QA Report

Date: 2026-04-16
Owner: Copilot (GPT-5.3-Codex)
Scope: `careergraph-hr` messaging UI layer

## 1) Implemented

- Extended messaging types:
  - `ThreadJob`, `MessageJobContext`
  - `ThreadSummary.jobs`, `ThreadSummary.primaryJob`
  - `Message.jobContext`
- API layer updates:
  - `getThreadJobs(threadId)`
  - `getMessages(threadId, jobId?, page, size)`
  - `sendMessage(..., jobContextId?)`
- Chat window enhancements:
  - Job Filter Bar in header area.
  - Job Context Selector above message input.
  - Message grouping by consecutive `jobContextId` with `JobDivider`.
  - Context-aware input placeholder (`Nhắn về {jobTitle}...`).
- Message bubble:
  - Added small job tag for contextual messages.
- Inbox thread item:
  - Replaced single-focus job display with multi-job chips (up to 2 chips).
- Added stable per-job color helper for consistent visual mapping.

## 2) Compatibility

- Existing messaging logic preserved:
  - same thread model,
  - same realtime flow,
  - same archive/block/unsend actions.
- Multi-job context added as optional UI/data layer.
- Backward compatibility retained when backend returns no `jobs`/`jobContext`.

## 3) Build Validation

Command:

```bash
cd careergraph-hr
npm run build
```

Result:

- PASS

Notes:

- Vite chunk-size warning remains (pre-existing/non-blocking).

## 4) Checklist Mapping (Phase 3 style)

- [x] Messaging types updated for job context.
- [x] Job switcher in compose area.
- [x] Job filter tabs in chat header area.
- [x] Job divider inserted between grouped message blocks.
- [x] Message bubble displays job context tag.
- [x] Thread list shows job chips for multi-job threads.
- [x] Build passed.
- [ ] Manual realtime E2E for new filter/send-context combinations (pending runtime QA).

## 5) Risks / Follow-up

- Filtering currently calls backend per selected job; behavior depends on API response latency.
- Recommended follow-up:
  - add UI tests for filter + compose context combinations,
  - add socket regression test that incoming messages with job context appear in correct grouped section.
