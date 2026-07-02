# Kanban AI Rejected Recovery And Reject Confirm Report

## Scope

- Show recovery actions for AI-rejected candidates in the HR candidate detail panel.
- Add explicit confirmation before HR rejects a candidate from the detail panel.
- Add explicit confirmation for click-based stage changes in the candidate detail panel.
- Keep drag-drop behavior unchanged to minimize production risk.

## Frontend changes

- Updated [`KanbanBoard.tsx`](/home/theron/Desktop/careergraph/careergraph-hr/src/pages/Kanban/KanbanBoard.tsx) to detect AI-originated rejection from application history and expose restore actions only for those candidates.
- Added restore actions in [`CandidateDetail.tsx`](/home/theron/Desktop/careergraph/careergraph-hr/src/pages/Kanban/CandidateDetail.tsx) for:
  - `Khôi phục về Ứng tuyển`
  - `Khôi phục về Sàng lọc`
  - Only when the corresponding stage is available in the current pipeline
- Added a shared confirmation dialog before click-based stage changes are executed from the detail drawer:
  - `Chuyển sang ...`
  - `Khôi phục về ...`
  - `Từ chối ứng viên`
- Extended [`candidate.ts`](/home/theron/Desktop/careergraph/careergraph-hr/src/types/candidate.ts) with a lightweight `rejectedByAi` flag for UI rendering.

## Verification

- Passed: `npm run build`

## UX review

- Good:
  - Recovery is placed in the candidate detail view, which matches the high-stakes nature of reviewing an AI false negative.
  - All click-based stage changes now share a confirmation step, reducing accidental transitions in high-stakes flows.
  - The board interaction model stays familiar because drag-drop rules were not reopened.

- Remaining tradeoff:
  - Recovery is available only from the detail drawer, not directly on the card or rejected column. This is intentional for safety and minimal change, but if rejected volume grows, a future quick-action pattern may be worth considering.
