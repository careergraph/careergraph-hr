# HR Sign-In Unverified Email OTP Redirect Fix

## Thông tin chung

- Ngày: 2026-07-02
- Phạm vi thay đổi: `careergraph-hr`
- File code thay đổi: `src/components/auth/SignInForm.tsx`
- Mục tiêu: Khi HR đã đăng ký nhưng chưa xác thực email, nếu thoát ra và đăng nhập lại thì phải được chuyển về form OTP thay vì chỉ hiện lỗi `Email not verified`.

## Hiện trạng lỗi

Luồng đăng nhập HR đã có ý định điều hướng sang `/verify-otp`, nhưng điều kiện nhận diện lỗi chưa khớp với payload thực tế từ backend.

- Backend login trả `403` với message `Email not verified`.
- Frontend HR lại kiểm tra `errorCode === "UNVERIFIED"`.
- Trong payload lỗi hiện tại, field được frontend đọc không luôn chứa giá trị `UNVERIFIED`.
- Kết quả là case email chưa xác thực không được nhận diện đúng, người dùng chỉ thấy toast lỗi.

## Sửa đổi đã thực hiện

Thực hiện sửa tối thiểu trong `SignInForm.tsx`:

- Bổ sung hàm nhận diện riêng cho lỗi email chưa xác thực dựa trên:
  - HTTP status `403`
  - Hoặc message `Email not verified`
- Chuẩn hóa email sang lowercase trước khi lưu OTP context.
- `return` ngay sau `navigate("/verify-otp")` để không rơi xuống nhánh toast lỗi chung.
- Bổ sung message tiếng Việt rõ hơn cho case `Email not verified`.

Không thay đổi API, không thay đổi store, không đổi flow OTP hiện có của đăng ký hoặc quên mật khẩu.

## Kiểm tra kỹ thuật

Đã chạy:

```bash
npm run build
```

Kết quả:

- Build `careergraph-hr` thành công.
- Có cảnh báo chunk lớn từ Vite, nhưng không liên quan đến fix này.

## Checklist kiểm thử chức năng

### Đã xác nhận theo logic code

- HR đăng ký mới vẫn lưu OTP context và chuyển sang `/verify-otp`.
- HR đăng nhập bằng tài khoản chưa verify giờ sẽ:
  - lưu lại OTP context
  - chuyển sang `/verify-otp`
  - không còn chỉ dừng ở toast lỗi
- Các case lỗi khác vẫn đi qua nhánh xử lý lỗi cũ.
- Luồng account/company bị block không bị ảnh hưởng.

### Nên test manual thêm trên môi trường chạy app

1. Đăng ký HR mới, không nhập OTP, thoát ra ngoài.
2. Vào lại trang đăng nhập HR.
3. Đăng nhập bằng email chưa verify.
4. Xác nhận hệ thống chuyển sang trang OTP.
5. Bấm gửi lại OTP.
6. Nhập OTP đúng.
7. Xác nhận quay về `/signin`.
8. Đăng nhập lại sau khi verify thành công.
9. Xác nhận vào dashboard bình thường.

## Đánh giá UI/UX

Ở mức production cho lỗi hiện tại, flow sau fix là hợp lý hơn rõ rệt vì:

- Người dùng không bị kẹt ở lỗi kỹ thuật mơ hồ.
- Hệ thống tự đưa họ đến đúng bước còn thiếu.
- Email được giữ lại qua OTP context nên giảm thao tác nhập lại.

Điểm còn có thể cải thiện sau này, nhưng chưa cần sửa trong fix tối thiểu này:

- Khi điều hướng sang OTP từ login, có thể hiển thị thêm một thông báo ngữ cảnh như `Tài khoản của bạn chưa xác thực, vui lòng nhập OTP vừa được gửi lại`.
- Trang OTP cho case `verify_email` hiện chưa có lối quay lại đăng nhập rõ ràng bằng CTA chính, chỉ đang đủ dùng chứ chưa thật sự tối ưu UX.

## Kết luận

Fix hiện tại bám đúng logic hệ thống đang có, thay đổi nhỏ, phạm vi hẹp, ít rủi ro, và giải quyết đúng lỗi người dùng đang gặp ở production flow của HR sign-in.
