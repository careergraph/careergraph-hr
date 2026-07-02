# Báo cáo đồng bộ OTP và copy Kanban phía HR

Ngày: `2026-07-02`
Phạm vi: `careergraph-hr`

## Thay đổi chính

1. Sửa form OTP HR:
   - Đọc đúng TTL OTP từ response envelope.
   - Gửi lại OTP cập nhật lại countdown đúng số giây backend trả về.
   - Hiển thị lỗi form nhất quán khi xác thực/gửi lại OTP thất bại.
2. Chuẩn hóa email nhập ở quên mật khẩu và đăng ký HR về `trim + lowercase` trước khi gọi API và lưu context OTP.
3. Chỉnh copy nhỏ trong Kanban detail:
   - Bỏ chữ `years` tiếng Anh ở phần kinh nghiệm để giữ tiếng Việt thống nhất.

## QA đã kiểm tra

1. Build HR thành công bằng `npm run build`.
2. Kiểm tra logic countdown:
   - Lấy TTL ban đầu đúng từ `res.data`.
   - Resend không còn truyền cả object response vào `startOrSync`.
3. Kiểm tra UX lỗi:
   - Lỗi OTP sai/hết hạn giờ hiển thị cả toast và message trong form.

## Góc nhìn khách hàng khó tính

1. OTP là điểm rất nhạy cảm trong onboarding. Nếu countdown sai hoặc resend không reset đúng thời gian thì người dùng sẽ mất niềm tin rất nhanh. Phần này đã được vá đúng logic thực tế.
2. Kanban detail trước đó vẫn còn dấu vết tiếng Anh nhỏ, nhìn không “sạch” production. Đã chỉnh tối thiểu để đồng bộ hơn mà không thay đổi layout.

## Rủi ro còn lại

1. Chưa thêm test UI tự động cho OTP countdown/resend.
2. Một số copy khác ngoài phạm vi yêu cầu vẫn có thể còn rải rác ở module HR, nhưng các điểm chạm trực tiếp của luồng vừa sửa đã được đồng bộ.
