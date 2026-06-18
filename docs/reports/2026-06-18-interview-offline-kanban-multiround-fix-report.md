# Interview Offline, Kanban, Multi-Round Fix Report - 2026-06-18

## Pham vi

- Bo sung nut `Them danh gia` trong luong HR de thao tac nhanh hon:
  - `careergraph-hr/src/pages/Interview/InterviewDetail.tsx`
  - `careergraph-hr/src/pages/Kanban/CandidateTab/InterviewReviewTab.tsx`
  - `careergraph-hr/src/pages/Interview/InterviewCard.tsx`
- Sua nghiep vu offline interview, kanban transition, va multi-round scheduling:
  - `careergraph-api/src/main/java/com/hcmute/careergraph/services/impl/InterviewServiceImpl.java`
  - `careergraph-hr/src/pages/Calendar/CalendarModalForm.tsx`
  - `careergraph-hr/src/pages/Kanban/ScheduleInterviewKanbanModal.tsx`
  - `careergraph-hr/src/pages/Kanban/KanbanBoard.tsx`
- Sua crash candidate-side khi co lich phong van offline:
  - `careergraph-client/src/pages/MyInterviews.jsx`

## Root Cause da xac dinh

1. Candidate-side `MyInterviews.jsx` dang render `InterviewCard` va goi cac handler khong ton tai trong nhom `standaloneInterviews`.
   - Case nay xay ra ro nhat voi interview offline vi offline khong vao nhom room online.
   - Hieu ung thuc te: ung vien vao trang `Lich phong van cua toi` co the bi loi ngay khi co interview offline.

2. Backend dang rang buoc qua chat cho interview completion/feedback.
   - `completeInterview()` yeu cau candidate joined room.
   - `addFeedback()` cung rang buoc joined room va chan ca interview offline.
   - Hieu ung thuc te: HR khong the hoan tat hoac danh gia interview offline du da qua gio bat dau.

3. Frontend HR dang chan feedback qua muc.
   - Nut danh gia chi hien khi `COMPLETED` va `khong co feedback`.
   - `FeedbackModal` lai chan theo "interview da co feedback hay chua", trong khi backend chan theo reviewer, khong phai chan theo interview.

4. Luong schedule next round chua coi `INTERVIEW_COMPLETED` la stage hop le de tao lich moi.
   - Hieu ung thuc te: sau khi hoan tat interview, ung vien co the van khong len duoc lich tiep theo trong ngay du khong con interview active.

## Thay doi da ap dung

### 1. Offline/online scheduling va feedback

- Backend cho phep `completeInterview` tu `SCHEDULED`, `CONFIRMED`, `IN_PROGRESS` neu da qua `scheduledAt`.
- Rangs buoc `candidate joined room` chi ap dung cho interview `ONLINE`.
- Backend cho phep `addFeedback` khi interview da qua gio bat dau va status nam trong:
  - `SCHEDULED`
  - `CONFIRMED`
  - `IN_PROGRESS`
  - `COMPLETED`
- Rule feedback duoc tach rieng theo `type`:
  - `OFFLINE`: chi can qua gio bat dau la duoc them danh gia
  - `ONLINE`: van phai giu dieu kien cu, ung vien da vao phong phong van moi duoc them danh gia
- Feedback offline la optional, khong bi ep phai vao room.

### 2. UX cho HR o Interview va Kanban

- Nut `Them danh gia`/`Them danh gia bo sung` hien ngay khi interview du dieu kien theo thoi gian.
- Tab `Danh gia phong van` trong Candidate Detail da co nut `Them danh gia` tren tung interview hop le.
- Sau khi submit feedback trong tab Kanban, danh sach interview duoc refresh lai ngay.
- `FeedbackModal` khong con tu chan interview chi vi da ton tai feedback tu nguoi khac.

### 3. Candidate-side offline interview

- Thay render loi bang `StandaloneInterviewCard` an toan cho:
  - offline interviews
  - online interviews khong nam trong room-group
- Card nay xu ly dung:
  - xac nhan
  - tu choi
  - de xuat gio khac
  - vao phong neu la online
  - hien dia diem neu la offline

### 4. Multi-round trong cung ngay

- Backend bo sung `INTERVIEW_COMPLETED` vao nhom stage co the schedule.
- Frontend modal schedule (Calendar va Kanban) cung coi `INTERVIEW_COMPLETED` la stage hop le.
- Logic cu van duoc giu:
  - van chan neu con interview active
  - van chan overwrite neu interview dang active ma chua xac nhan overwrite
  - van chan round khong hop le
- Khac biet moi:
  - neu interview truoc da hoan thanh thi co the tao lich round tiep theo trong cung ngay.

## Ket qua kiem tra

### Build/compile

- `careergraph-hr`: `npm run build` - PASS
- `careergraph-client`: `npm run build` - PASS
- `careergraph-api`: `./mvnw -q -DskipTests compile` - PASS

### Checklist nghiep vu da cover

1. HR mo chi tiet interview offline du dieu kien va thay duoc nut `Them danh gia`.
2. HR vao Candidate Detail > tab interview review va co the them danh gia ngay tai day cho interview offline, hoac interview online da co joined participant.
3. Interview offline qua gio bat dau:
   - co the complete
   - co the them feedback
   - khong bi phu thuoc room participant
4. Interview online:
   - van phai giu dieu kien joined room truoc khi them feedback
   - khong bi nói long sai nghiep vu
5. Candidate vao `My Interviews` khi co offline interview:
   - khong con crash
   - hien dung dia diem/thong tin offline
6. Candidate co online interview van giu hanh vi join room cu.
7. Kanban co the chuyen sang `interviewed` khi co offline interview da qua gio bat dau, ngay ca khi feedback la optional.
8. Sau khi interview da completed, co the schedule them round tiep theo trong cung ngay neu khong con interview active.

## Danh gia UI/UX theo goc nhin khach hang kho tinh

### Diem on hon truoc

- Nut thao tac feedback duoc dat gan context su dung, khong bat HR phai di vong qua qua nhieu man hinh.
- Offline va online da co hanh vi hien thi tach bach, de hieu hon cho nguoi dung.
- Candidate-side khong con "silent break" khi co interview offline.

### Van de con lai / de xuat production hardening

1. `MyInterviews` va `careergraph-hr` deu co JS bundle lon.
   - Build dang canh bao chunk > 500 kB.
   - Nen tach code man hinh interview, kanban detail, modal feedback, va room UI.

2. Rule feedback hien tai da hop nghiep vu hon, nhung UI chua hien ro:
   - interviewer hien tai da submit feedback chua
   - interview co bao nhieu feedback
   - ai da danh gia

3. Kanban transition `interview -> interviewed` van la business-sensitive action.
   - Nen can nhac hien mot ly do ro hon tren dialog neu block.
   - Nen co badge/phu de thong bao "Da qua gio bat dau - co the hoan tat".

4. Nen bo sung integration tests cho 3 case:
   - offline interview completed after start time
   - candidate my interviews with standalone offline data
   - schedule next round when current stage = `INTERVIEW_COMPLETED`

## Ket luan

Ban fix hien tai da giai quyet dung cac van de nghiep vu user neu:

- offline interview khong con lam vo candidate-side
- HR co the feedback/completion linh hoat hon theo thoi gian bat dau ma van giu dung rule joined-room cho interview online
- kanban review co them entry point thao tac
- multi-round trong cung ngay da mo cho case interview truoc da completed

Muc do san sang production: dat cho scope fix nay, nhung van nen them integration tests va giam bundle size truoc khi mo rong them cac luong interview phuc tap hon.
