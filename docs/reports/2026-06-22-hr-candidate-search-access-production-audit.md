# HR Production Audit - Candidate Search Access

## Phạm vi

- `careergraph-hr` dùng API tìm kiếm ứng viên
- kiểm tra tác động của thay đổi policy backend lên trải nghiệm HR/company

## Kết luận

- sau thay đổi backend, công ty chưa `APPROVED` hoặc không `ACTIVE` sẽ không còn dùng được tính năng tìm kiếm ứng viên
- đây là thay đổi đúng hướng production vì candidate search là quyền truy cập dữ liệu nhạy cảm của employer

## Tác động nghiệp vụ

- công ty chưa hoàn tất xác thực:
  - không nên được dùng candidate search
  - không nên được dùng như một employer fully activated
- công ty bị khóa hoặc tạm dừng:
  - cũng không nên tiếp tục truy cập tính năng này

## Góc nhìn UX

- hiện tại HR frontend chưa có màn chặn chuyên biệt cho case này
- backend đã chặn đúng policy, nhưng UX tốt hơn nếu sau này:
  - hiển thị message rõ lý do bị chặn
  - dẫn người dùng tới luồng hoàn tất xác thực doanh nghiệp

## Residual risks

- nếu frontend chỉ hiện toast lỗi chung từ API, người dùng có thể chưa hiểu ngay nguyên nhân
- nên bổ sung UI hint hoặc screen-state chuyên biệt trong phase HR UX tiếp theo
