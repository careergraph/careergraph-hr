# Interview Scheduling Enterprise Update Report

Date: 2026-05-11
Scope: Kanban + Calendar + Interview API

## 1) Business Changes Implemented

### A. Kanban - Guard move to "Interview Completed"
- File: `careergraph-hr/src/pages/Kanban/KanbanBoard.tsx`
- Change:
  - Before moving a candidate from `interview` to `interviewed`, system now validates interview participation evidence.
  - Allowed only if application has at least one `COMPLETED` interview OR at least one feedback record.
  - If not satisfied, action is blocked with user-facing error toast.
- Production impact:
  - Prevents invalid workflow transitions.
  - Aligns stage transition with real interview outcomes.

### B. Calendar - Exclude applications already in Interview Completed stage
- File: `careergraph-api/src/main/java/com/hcmute/careergraph/services/impl/InterviewServiceImpl.java`
- Change:
  - Removed `ApplicationStage.INTERVIEW_COMPLETED` from `SCHEDULABLE_STAGES`.
- Production impact:
  - Candidate at `INTERVIEW_COMPLETED` will not appear in interview scheduling pool.
  - Eliminates accidental re-scheduling from completed pipeline state.

### C. Calendar Modal - Round-first scheduling flow
- Files:
  - `careergraph-hr/src/pages/Calendar/CalendarModalForm.tsx`
  - `careergraph-api/src/main/java/com/hcmute/careergraph/controllers/InterviewController.java`
  - `careergraph-hr/src/services/interviewService.ts`
- Change:
  - Added "Vòng dánh giá" selector on same row as "Ch?n ?ng viên".
  - New API behavior: `GET /interviews/job/{jobId}/unscheduled?round={n}` supports round-based filtering.
  - API returns:
    - `availableRounds`: available round options for selected job.
    - `applications`: candidate list valid for chosen round.
  - Eligibility for round > 1:
    - candidate must have prior participation signal (`COMPLETED`) or feedback data.
  - Removed old standalone round selector block and replaced by new round-first UX.
- Production impact:
  - Deterministic multi-round scheduling.
  - Better HR flow: select round first, then pick valid candidates only.

### D. Startup hardening cleanup
- File: `careergraph-api/src/main/java/com/hcmute/careergraph/CareerGraphApplication.java`
- Change:
  - Removed console debug enum dumps in application startup.
- Production impact:
  - Cleaner startup logs.
  - Avoids noisy non-structured logs in production.

### E. Compatibility update
- File: `careergraph-hr/src/pages/Kanban/ScheduleInterviewKanbanModal.tsx`
- Change:
  - Added fallback parse logic to support new unscheduled API payload shape.

## 2) API Contract Update

### Endpoint
`GET /interviews/job/{jobId}/unscheduled?round={optionalInt}`

### Response data shape
```json
{
  "applications": [ ... ],
  "availableRounds": [1,2,...]
}
```

### Notes
- `nextRound` is now derived from completed rounds (`maxCompletedRound + 1`) to enforce progression integrity.
- For round > 1, applications must satisfy participation/feedback criteria.

## 3) Test Execution Report (Tester Role)

### Automated checks executed
- Backend compile:
  - Command: `mvn -q -DskipTests compile`
  - Result: PASS

### Environment limitations
- Frontend automated build/test could not run in this terminal environment because `node`, `npm`, `yarn` are unavailable in PATH.

### Manual functional test checklist (recommended)
1. Kanban transition validation
- Given candidate in `Ph?ng v?n` with no completed interview and no feedback.
- When drag to `Ph?ng v?n hoàn thành`.
- Then transition must be blocked with error toast.

2. Calendar candidate source filtering
- Given candidate stage is `INTERVIEW_COMPLETED`.
- When open calendar modal and select job.
- Then candidate must not appear in selectable list.

3. Round selector behavior
- Given job has:
  - Candidate A not yet interviewed.
  - Candidate B completed round 1 (or has feedback).
- When open modal.
- Then `Vòng dánh giá` shows `Vòng 1`, `Vòng 2`.
- Selecting `Vòng 1` should list candidate A only.
- Selecting `Vòng 2` should list candidate B only.

4. Backward compatibility
- Kanban interview scheduling modal still loads unscheduled candidates correctly.

## 4) Production Readiness Assessment

Status: Conditionally Ready
- Backend logic and compile are stable.
- Frontend runtime behavior is implemented; final readiness requires FE build + regression test in environment with Node toolchain.

## 5) Suggested Commit Message

```text
feat(interview): enforce valid interview-completed transition and round-based scheduling

- block Kanban move to INTERVIEW_COMPLETED unless candidate has completed interview or feedback
- exclude INTERVIEW_COMPLETED applications from schedulable pool
- add round-first scheduling flow in Calendar modal (Vòng dánh giá + candidate filtering)
- extend unscheduled API with round filter and availableRounds payload
- update Kanban scheduling modal compatibility for new API response
- remove startup debug enum logs from CareerGraphApplication
```
