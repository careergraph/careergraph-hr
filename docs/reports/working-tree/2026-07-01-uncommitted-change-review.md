# Báo cáo thay đổi chưa commit - careergraph-hr

## Phạm vi rà soát
- Thời điểm rà soát: 2026-07-01
- Repo: `careergraph-hr`
- Các file thay đổi:
  - `src/hooks/useWebRTC.ts`
  - `src/pages/Interview/InterviewRoom.tsx`

## Tóm tắt nghiệp vụ cho khách hàng
Thay đổi đang hướng tới việc giúp phòng phỏng vấn online nhận diện ứng viên chính xác hơn khi tham gia cuộc gọi:
- bổ sung `email` và `displayName` từ lớp signaling,
- ưu tiên ghép ứng viên theo `candidateId`, nếu không khớp thì đối chiếu bằng email,
- cập nhật tên ứng viên đang hiển thị trong giao diện interviewer,
- sau khi feedback được gửi, giao diện chủ động phản ánh trạng thái đã hoàn tất nhanh hơn.

## Ảnh hưởng tới nghiệp vụ đang có
- Cải thiện trải nghiệm điều phối phỏng vấn khi ứng viên vào phòng nhưng định danh socket không trùng hoàn toàn với danh sách đã lập lịch.
- Giảm khả năng hiển thị sai tên ứng viên trong phòng phỏng vấn.
- Hỗ trợ quy trình chuyển trạng thái từ đang phỏng vấn sang hoàn tất mượt hơn ở giao diện HR.

## Rủi ro đã xử lý
- Đã loại bỏ nguy cơ render loop trong `InterviewRoom.tsx` bằng cách:
  - tách phần resolve ứng viên sang dữ liệu dẫn xuất (`useMemo`),
  - bỏ dependency trực tiếp của effect vào toàn bộ `roomParticipants` và `roomInterviews`,
  - chỉ cập nhật từng phần tử state khi trạng thái thực sự thay đổi.
- Logic nghiệp vụ ghép ứng viên theo `candidateId`, sau đó fallback theo `email`, vẫn được giữ nguyên.

## Kết luận
- Có thể giữ lại thay đổi nghiệp vụ của màn hình phỏng vấn HR.
- Trạng thái hiện tại đã an toàn hơn để commit cùng nhóm thay đổi interview room.

## Gợi ý lệnh commit
```bash
git add src/hooks/useWebRTC.ts src/pages/Interview/InterviewRoom.tsx docs/reports/working-tree/2026-07-01-uncommitted-change-review.md
git commit -m "hr improve interview room participant sync"
```
