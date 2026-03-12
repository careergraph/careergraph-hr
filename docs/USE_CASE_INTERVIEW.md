# Đặc tả Use Case — Nghiệp vụ Phỏng vấn Trực tuyến

## 1. Tổng quan hệ thống

Hệ thống phỏng vấn trực tuyến CareerGraph cho phép HR (nhà tuyển dụng) và Candidate (ứng viên) thực hiện buổi phỏng vấn video qua WebRTC, với đầy đủ tính năng quản lý phòng họp: duyệt vào phòng, ghi hình thủ công, và quản lý người tham gia.

### Actors (Tác nhân)

| Actor | Vai trò | Hệ thống |
|-------|---------|----------|
| **HR** | Host phỏng vấn, có toàn quyền quản lý phòng | careergraph-hr (port 3000) |
| **Candidate** | Ứng viên tham gia phỏng vấn | careergraph-client (port 5000) |
| **System** | Backend API + RTC Signaling Server | careergraph-api (8010) + careergraph-rtc (4000) |

---

## 2. Use Case Diagram

```
┌──────────────────────────────────────────────────────────┐
│                   Interview System                        │
│                                                          │
│  ┌──────────────┐    ┌──────────────────────────────┐    │
│  │ UC-01        │    │ UC-02                        │    │
│  │ Lên lịch     │───>│ Vào phòng chờ (Lobby)        │    │
│  │ phỏng vấn    │    │                              │    │
│  └──────────────┘    └──────────┬───────────────────┘    │
│                                 │                        │
│                     ┌───────────▼──────────────┐         │
│                     │ UC-03                    │         │
│                     │ Yêu cầu tham gia &      │         │
│                     │ Duyệt vào phòng         │         │
│                     └───────────┬──────────────┘         │
│                                 │                        │
│              ┌──────────────────▼────────────────┐       │
│              │ UC-04                             │       │
│              │ Cuộc gọi phỏng vấn (In-call)     │       │
│              │                                   │       │
│              │  ┌─────────┐  ┌────────────┐     │       │
│              │  │ UC-05   │  │ UC-06      │     │       │
│              │  │ Ghi hình│  │ Chia sẻ    │     │       │
│              │  │ thủ công│  │ màn hình   │     │       │
│              │  └─────────┘  └────────────┘     │       │
│              │  ┌─────────┐  ┌────────────┐     │       │
│              │  │ UC-07   │  │ UC-08      │     │       │
│              │  │ Kick    │  │ Kết thúc   │     │       │
│              │  │ ứng viên│  │ phỏng vấn  │     │       │
│              │  └─────────┘  └────────────┘     │       │
│              └──────────────────────────────────┘       │
└──────────────────────────────────────────────────────────┘
```

---

## 3. Chi tiết Use Case

### UC-01: Lên lịch phỏng vấn

| Thuộc tính | Mô tả |
|------------|--------|
| **Actor** | HR |
| **Tiền điều kiện** | HR đã đăng nhập, có ứng viên đã apply vào job posting |
| **Mô tả** | HR tạo lịch phỏng vấn cho ứng viên |

**Luồng chính:**

1. HR mở trang Kanban hoặc Calendar trên hệ thống HR
2. HR chọn ứng viên cần phỏng vấn
3. HR nhấn nút **"Lên lịch phỏng vấn"** → Mở `CalendarModalForm`
4. HR điền thông tin:
   - Ngày/giờ phỏng vấn (`scheduledAt`)
   - Loại phỏng vấn: **ONLINE** hoặc **OFFLINE**
   - Ghi chú (tùy chọn)
5. HR nhấn **"Lưu"**
6. System tạo interview record:
   - Tự động sinh `meetingLink` (12 ký tự alphanumeric) cho phỏng vấn ONLINE
   - Trạng thái mặc định: `SCHEDULED`
7. System gửi email thông báo cho ứng viên (nếu có tích hợp)

**Luồng thay thế:**
- **4a.** HR chọn loại **OFFLINE** → Không sinh meetingLink, ứng viên nhận địa chỉ phỏng vấn offline
- **5a.** Thông tin thiếu → Hiển thị lỗi validation, không lưu

**Hậu điều kiện:** Interview record được tạo trong DB với `meetingLink` duy nhất

---

### UC-02: Vào phòng chờ (Pre-join Lobby)

| Thuộc tính | Mô tả |
|------------|--------|
| **Actor** | HR / Candidate |
| **Tiền điều kiện** | Interview đã được lên lịch, loại ONLINE, actor đã đăng nhập |
| **Mô tả** | User truy cập phòng phỏng vấn và kiểm tra thiết bị trước khi tham gia |

**Luồng chính:**

1. User truy cập URL phòng phỏng vấn:
   - HR: `http://localhost:3000/interview/room/{roomCode}`
   - Candidate: `http://localhost:5000/interview/room/{roomCode}`
2. System gọi API `GET /interviews/room/{roomCode}` để lấy thông tin interview
3. System kiểm tra thời gian:
   - Nếu **trước 15 phút** so với `scheduledAt` → Hiển thị **"Chưa đến giờ phỏng vấn"** + đồng hồ đếm ngược
   - Nếu **trong hoặc sau 15 phút** → Cho phép vào lobby
4. User thấy lobby:
   - Hiển thị thông tin interview (tên ứng viên/vị trí, thời gian)
   - Preview camera cục bộ (local video)
   - Nút bật/tắt camera + microphone để kiểm tra
5. User nhấn **"Bật camera để kiểm tra"** → Browser yêu cầu quyền camera/mic
6. User kiểm tra hình ảnh/âm thanh, tùy chỉnh bật/tắt camera/mic
7. User nhấn **"Tham gia phỏng vấn"**

**Luồng thay thế:**
- **2a.** Room code không tồn tại → Toast error "Không tìm thấy phòng phỏng vấn"
- **3a.** Còn quá sớm → Hiển thị countdown, user chờ hoặc nhấn "Quay lại"
- **5a.** Browser từ chối camera/mic → Toast error "Không thể truy cập camera/microphone"

**Hậu điều kiện:** User đã kiểm tra thiết bị, sẵn sàng kết nối WebRTC

---

### UC-03: Yêu cầu tham gia & Duyệt vào phòng (Admission Control)

| Thuộc tính | Mô tả |
|------------|--------|
| **Actor** | HR (host), Candidate (requester) |
| **Tiền điều kiện** | Cả hai đều đã vào lobby |
| **Mô tả** | Candidate gửi yêu cầu vào phòng, HR duyệt hoặc từ chối |

**Luồng chính:**

1. **HR** nhấn "Tham gia phỏng vấn" → Kết nối Socket.io → Tự động vào phòng (host role)
2. **Candidate** nhấn "Tham gia phỏng vấn" → Kết nối Socket.io → Gửi event `request-join` đến server
3. System (RTC Server) nhận `request-join`:
   - Lưu candidate vào hàng chờ (waiting list) của phòng
   - Gửi event `join-request` đến HR kèm thông tin userId
4. **HR** nhận thông báo: **"Ứng viên đang yêu cầu tham gia"**
   - Hiển thị panel phê duyệt với nút **"Cho phép"** và **"Từ chối"**
5. **HR nhấn "Cho phép"** → Gửi event `admit-user` đến server
6. System relay event `admitted` đến Candidate
7. **Candidate** nhận `admitted` → Tự động `join-room` → Bắt đầu WebRTC handshake (offer/answer/ICE)
8. Kết nối peer-to-peer được thiết lập → Hiển thị video hai chiều

**Luồng thay thế:**
- **5a.** HR nhấn **"Từ chối"** → Gửi event `reject-user` → Candidate nhận `rejected` → Hiển thị thông báo "HR đã từ chối yêu cầu tham gia" → Quay về trang trước
- **2a.** HR chưa vào phòng → Candidate thấy trạng thái "Đang chờ HR mở phòng..."
- **1a.** JWT token hết hạn → Socket.io middleware từ chối kết nối → Redirect login

**Hậu điều kiện:** Candidate được duyệt vào phòng hoặc bị từ chối

---

### UC-04: Cuộc gọi phỏng vấn (In-call)

| Thuộc tính | Mô tả |
|------------|--------|
| **Actor** | HR, Candidate |
| **Tiền điều kiện** | Candidate đã được HR duyệt, WebRTC P2P đã kết nối |
| **Mô tả** | Hai bên thực hiện phỏng vấn qua video/audio |

**Luồng chính:**

1. Cả hai thấy giao diện In-call:
   - Video grid 2 cột: local (Bạn) | remote (đối phương)
   - Thanh thông tin: đồng hồ đếm thời gian, mã phòng, số người tham gia, trạng thái kết nối
   - Thanh điều khiển dưới cùng: Camera | Mic | Screen Share | End Call
2. Timer bắt đầu đếm từ 00:00
3. Cả hai có thể bật/tắt camera, mic trong suốt cuộc gọi
4. Video và audio truyền real-time qua WebRTC

**Luồng thay thế:**
- **4a.** Mất kết nối Internet → ICE state chuyển "disconnected" → Badge "Đã kết nối" biến mất → Tự động thử reconnect
- **4b.** Đối phương tắt camera → Hiển thị avatar placeholder thay vì video đen

---

### UC-05: Ghi hình thủ công (Manual Recording)

| Thuộc tính | Mô tả |
|------------|--------|
| **Actor** | HR |
| **Tiền điều kiện** | Đang trong cuộc gọi (In-call), có stream video/audio |
| **Mô tả** | HR bấm nút ghi hình để lưu lại buổi phỏng vấn |

**Luồng chính:**

1. HR nhấn nút **🔴 Record** trên thanh điều khiển
2. System bắt đầu ghi hình:
   - Sử dụng MediaRecorder API ghi cả local + remote stream
   - Badge **"REC"** hiển thị (animate pulse) trên thanh thông tin
   - Gửi event `recording-started` đến Candidate qua Socket.io
3. **Candidate** nhận thông báo → Hiển thị badge **"REC"** trên UI (để biết đang bị ghi hình)
4. HR tiếp tục phỏng vấn bình thường
5. HR nhấn lại nút **⏹ Stop Record** → Dừng ghi
   - Badge REC biến mất trên cả hai phía
   - Gửi event `recording-stopped` đến Candidate
   - File recording được download tự động về máy HR (format WebM)

**Luồng thay thế:**
- **1a.** Chưa có remote stream → Vẫn ghi được (chỉ local stream)
- **5a.** Cuộc gọi kết thúc khi đang ghi → Tự động dừng recording + tải file

**Hậu điều kiện:** File ghi hình được lưu trên máy HR

---

### UC-06: Chia sẻ màn hình (Screen Sharing)

| Thuộc tính | Mô tả |
|------------|--------|
| **Actor** | HR / Candidate |
| **Tiền điều kiện** | Đang trong cuộc gọi |
| **Mô tả** | User chia sẻ màn hình cho đối phương xem |

**Luồng chính:**

1. User nhấn nút **Screen Share** (icon Monitor)
2. Browser hiển thị dialog chọn nguồn chia sẻ (tab/window/screen)
3. User chọn nguồn → Video track được thay thế bằng screen track (replaceTrack)
4. Đối phương thấy màn hình chia sẻ thay vì camera
5. Nút Screen Share đổi thành **Stop Share** (icon MonitorOff, màu đỏ)
6. User nhấn **Stop Share** hoặc nhấn nút "Stop sharing" của browser
7. Video track khôi phục về camera gốc

**Luồng thay thế:**
- **2a.** User hủy dialog chọn nguồn → Không thay đổi gì

---

### UC-07: Kick ứng viên ra khỏi phòng

| Thuộc tính | Mô tả |
|------------|--------|
| **Actor** | HR |
| **Tiền điều kiện** | Đang trong cuộc gọi, Candidate đã kết nối |
| **Mô tả** | HR buộc ứng viên rời phòng phỏng vấn |

**Luồng chính:**

1. HR nhấn nút **"Kick"** (icon UserX) trên remote video hoặc thanh điều khiển
2. System xác nhận: Dialog **"Bạn có chắc muốn mời ứng viên rời phòng?"**
3. HR nhấn **"Xác nhận"**
4. System gửi event `kick-user` qua Socket.io đến server
5. Server relay event `kicked` đến Candidate socket
6. **Candidate** nhận `kicked`:
   - Đóng RTCPeerConnection
   - Dừng local stream
   - Hiển thị thông báo **"Bạn đã bị mời rời phòng phỏng vấn"**
   - Tự động chuyển về trang danh sách phỏng vấn sau 3 giây
7. **HR** thấy remote video biến mất, badge peer count giảm

**Luồng thay thế:**
- **2a.** HR nhấn "Hủy" → Không có gì xảy ra

**Hậu điều kiện:** Candidate bị ngắt kết nối, HR vẫn ở trong phòng

---

### UC-08: Kết thúc phỏng vấn

| Thuộc tính | Mô tả |
|------------|--------|
| **Actor** | HR / Candidate |
| **Tiền điều kiện** | Đang trong cuộc gọi |
| **Mô tả** | User kết thúc cuộc gọi và rời phòng |

**Luồng chính:**

1. User nhấn nút **End Call** (icon PhoneOff, màu đỏ)
2. System:
   - Dừng recording nếu đang ghi
   - Đóng RTCPeerConnection
   - Dừng tất cả local stream tracks (camera + mic)
   - Ngắt Socket.io connection
3. User được chuyển về trang danh sách phỏng vấn (`/interviews`)
4. Đối phương nhận event `user-left` → Remote video biến mất

---

## 4. Trình tự thao tác trên giao diện (UI Flow)

### 4.1. Luồng HR (Host)

```
[Kanban/Calendar] ──"Lên lịch"──> [CalendarModalForm]
    │                                     │
    │                               Chọn ONLINE + thời gian
    │                                     │ Lưu
    │                                     ▼
    │                          [Interview được tạo]
    │                          meetingLink = "m7a7ylk2kzoa"
    │
    │──15 phút trước──> [Nút "Tham gia" bật sáng trên Kanban card]
    │                        │ Click
    │                        ▼
    │               [InterviewRoom - Lobby]
    │                ┌─────────────────────┐
    │                │  📹 Preview camera  │
    │                │  🎤 Test micro      │
    │                │                     │
    │                │ [Tham gia phỏng vấn]│
    │                └─────────────────────┘
    │                        │ Click "Tham gia"
    │                        ▼
    │               [InterviewRoom - In-call]
    │                ┌──────────────────────────────────┐
    │                │ ⏱ 00:00    Phòng phỏng vấn   👥2│
    │                │                                  │
    │                │  ┌─────────┐  ┌─────────┐       │
    │                │  │  Bạn    │  │ Ứng viên│       │
    │                │  │  (HR)   │  │ (Remote)│       │
    │                │  └─────────┘  └─────────┘       │
    │                │                                  │
    │                │  [📹] [🎤] [🖥] [🔴REC] [👢Kick] [📞End]│
    │                └──────────────────────────────────┘
    │
    │── Khi Candidate yêu cầu vào ──>
    │                ┌──────────────────────────────────┐
    │                │ 🔔 Ứng viên yêu cầu tham gia    │
    │                │                                  │
    │                │  [✅ Cho phép]  [❌ Từ chối]     │
    │                └──────────────────────────────────┘
```

### 4.2. Luồng Candidate

```
[Danh sách phỏng vấn] ──"Tham gia"──> [InterviewRoom - Kiểm tra thời gian]
    │                                          │
    │                                   Nếu quá sớm:
    │                                   ┌──────────────────┐
    │                                   │ ⚠ Chưa đến giờ  │
    │                                   │ Countdown: 05:30 │
    │                                   │ [Quay lại]       │
    │                                   └──────────────────┘
    │                                          │
    │                                   Nếu đủ thời gian:
    │                                          ▼
    │                              [InterviewRoom - Lobby]
    │                               ┌──────────────────────┐
    │                               │  📹 Preview camera   │
    │                               │  🎤 Test micro       │
    │                               │                      │
    │                               │ [Tham gia phỏng vấn] │
    │                               └──────────────────────┘
    │                                          │ Click
    │                                          ▼
    │                              [Waiting Room - Chờ duyệt]
    │                               ┌──────────────────────┐
    │                               │  ⏳ Đang chờ HR     │
    │                               │  cho phép tham gia...│
    │                               │                      │
    │                               │  [Hủy]              │
    │                               └──────────────────────┘
    │                                          │
    │                               HR cho phép │ HR từ chối
    │                                    ▼            ▼
    │                            [In-call]    [Thông báo bị từ chối]
    │                                         [Quay về trang trước]
```

---

## 5. Ma trận quyền hạn

| Chức năng | HR (Host) | Candidate |
|-----------|:---------:|:---------:|
| Lên lịch phỏng vấn | ✅ | ❌ |
| Vào phòng trực tiếp (không cần duyệt) | ✅ | ❌ |
| Yêu cầu tham gia (cần HR duyệt) | ❌ | ✅ |
| Duyệt/Từ chối người tham gia | ✅ | ❌ |
| Bật/tắt camera & mic | ✅ | ✅ |
| Chia sẻ màn hình | ✅ | ✅ |
| Ghi hình (Record) | ✅ | ❌ |
| Kick ứng viên | ✅ | ❌ |
| Kết thúc cuộc gọi (cho bản thân) | ✅ | ✅ |

---

## 6. Socket.io Events

| Event | Sender | Receiver | Payload | Mô tả |
|-------|--------|----------|---------|--------|
| `join-room` | HR | Server | `roomCode` | HR vào phòng trực tiếp |
| `request-join` | Candidate | Server | `roomCode` | Candidate yêu cầu vào phòng |
| `join-request` | Server | HR | `{ socketId, userId }` | Thông báo HR có người muốn vào |
| `admit-user` | HR | Server | `{ socketId }` | HR cho phép Candidate vào |
| `reject-user` | HR | Server | `{ socketId }` | HR từ chối Candidate |
| `admitted` | Server | Candidate | — | Candidate được phép vào |
| `rejected` | Server | Candidate | — | Candidate bị từ chối |
| `room-peers` | Server | Joiner | `[{ socketId, userId }]` | Danh sách peers hiện tại |
| `user-joined` | Server | Others | `{ socketId, userId }` | Peer mới vào phòng |
| `user-left` | Server | Others | `{ socketId, userId }` | Peer rời phòng |
| `offer` | Peer A | Peer B | `{ from, offer }` | WebRTC SDP offer |
| `answer` | Peer B | Peer A | `{ from, answer }` | WebRTC SDP answer |
| `ice-candidate` | Peer | Peer | `{ from, candidate }` | ICE candidate |
| `kick-user` | HR | Server | `{ socketId }` | HR kick Candidate |
| `kicked` | Server | Candidate | — | Candidate bị kick |
| `recording-started` | HR | Server→Candidate | — | Bắt đầu ghi hình |
| `recording-stopped` | HR | Server→Candidate | — | Dừng ghi hình |

---

## 7. Kiến trúc kỹ thuật

```
┌─────────────┐     HTTP/REST      ┌──────────────────┐
│ HR Frontend │◄──────────────────►│ Spring Boot API  │
│ (React+TS)  │                    │ (port 8010)      │
│ port 3000   │    WebSocket       │                  │
│             │◄───────────────►┌──┴─────────────────┐│
└─────────────┘                │ RTC Signaling      ││
                               │ (Socket.io)        ││
┌─────────────┐    WebSocket   │ port 4000          ││
│ Client FE   │◄──────────────►│                    ││
│ (React+JSX) │                └────────────────────┘│
│ port 5000   │    HTTP/REST      │                  │
│             │◄──────────────────►                  │
└─────────────┘                    └──────────────────┘
                                          │
       WebRTC (P2P)                       │ JDBC
  HR ◄════════════════► Candidate         │
                                   ┌──────▼──────┐
                                   │ PostgreSQL  │
                                   │ (pgvector)  │
                                   └─────────────┘
```
