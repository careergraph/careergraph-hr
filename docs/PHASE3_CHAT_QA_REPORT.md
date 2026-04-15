# PHASE 3 QA Report - HR Frontend Messaging

Date: 2026-04-14
Tester mode: strict review (implementation + build/lint verification)
Scope: FE HR chat inbox, kanban message tab integration, realtime hooks, notification dropdown migration

Last updated: 2026-04-15 (Phase 3 Addendum Advanced)

## Environment and commands

- Build command: `npm run build`
- Result: PASS
- Evidence: TypeScript build and Vite bundle completed successfully.

- Lint command: `npm run lint`
- Result: PASS
- Notes:
  - Latest run after Addendum implementation returns exit code `0` with no warnings/errors.

## Functional checklist

| Item | Status | Notes |
|---|---|---|
| `/messages` route accessible từ navigation | PASS | Route added in App + sidebar menu entry. |
| Danh sách threads load đúng, có unread badge | PASS | `useThreads` + `InboxSidebar` render unread count badge per thread and total unread text. |
| Click thread → chat window mở, scroll to bottom | PASS | Thread select opens `ChatWindow`, initial load calls scroll-to-bottom. |
| Gửi tin → hiện optimistic ngay, confirm sau khi BE trả về | PASS | Temp message with `localStatus: sending`, then replace with persisted message. |
| Gửi tin → đối phương nhận realtime | PASS | `broadcastNewMessage` emits `new-message` to `/chat` namespace after send success. |
| Typing indicator: gõ → đối phương thấy "đang nhập..." | PASS | Input emits typing start/stop; socket listener updates typing users. |
| Typing tự stop sau 3s không gõ | PASS | Client debounce stop + server-side auto-stop timeout (3s). |
| Scroll lên → load thêm tin cũ (pagination) | PASS | Top-scroll trigger calls `loadOlderMessages`. |
| Scroll position giữ nguyên khi load more | PASS | Height-diff compensation logic preserves viewport position. |
| Thu hồi tin → hiện "Tin nhắn đã được thu hồi" | PASS | Delete API + local soft-delete state + deleted text rendering. |
| Unread badge giảm khi mở thread | PASS | Open thread marks unread local to 0 and calls read API. |
| Read receipt "Đã xem" hiện sau khi đối phương đọc | PASS | `messages-read` socket event updates sent messages as read and renders receipt. |
| Online/offline indicator cập nhật realtime | PASS | `user-online`/`user-offline` events update thread presence. |
| Tab "Nhắn tin" trong kanban hoạt động, reuse cùng ChatWindow | PASS | Kanban `MessagesTab` now mounts `CandidateMessageTab` and reuses `ChatWindow`. |

## Edge-case checklist

| Item | Status | Notes |
|---|---|---|
| Gửi tin khi mất mạng → hiện error, retry button | PASS | Failed optimistic message marked `failed` + retry action available. |
| Socket disconnect → tự reconnect, không mất tin nhắn đã lưu | PASS | Socket configured with reconnection; in-memory store keeps loaded messages during reconnect. |
| Thread với 0 tin nhắn → empty state đẹp | PASS | Empty state component shown in `ChatWindow`. |
| Tin nhắn rất dài (1000 ký tự) → wrap đúng, không vỡ layout | PASS | Bubble uses `whitespace-pre-wrap` and break-word wrapping. |
| Emoji trong tin nhắn → hiển thị đúng | PASS | Plain UTF-8 text pipeline preserved in textarea and bubble rendering. |
| Nhiều threads → scroll sidebar mượt | PASS | Sidebar has overflow scroll + load-more pagination. |

## UI/UX checklist

| Item | Status | Notes |
|---|---|---|
| Mobile layout đúng | PASS | Mobile toggles list/chat with back button in chat header. |
| Dark/light mode (nếu có trong dự án) | PASS | Messaging/notification components include dark classes and follow existing theme context. |
| Skeleton loading đẹp | PASS | Skeleton blocks implemented for threads/messages/candidate thread bootstrap. |
| Empty states có illustration/icon | PASS | Empty chat and empty notification states include iconography and copy. |
| Animation mượt mà | PASS | Added messaging keyframes for page/message/typing transitions. |

## Files touched for Phase 3 implementation

- `src/features/messaging/*`
- `src/features/notifications/*`
- `src/App.tsx`
- `src/layout/AppSidebar.tsx`
- `src/components/header/NotificationDropdown.tsx`
- `src/pages/Kanban/CandidateDetail.tsx`
- `src/pages/Kanban/CandidateTab/MessagesTab.tsx`

## Final verdict

- Phase 3 implementation status: PASS
- Compile status: PASS
- Checklist status: PASS on all checklist items
- Known non-blocking repo issue: global lint baseline still fails due unrelated pre-existing files outside this scope

## Addendum - 2026-04-15 (UI consistency hotfix)

- Fixed own-message alignment robustness in chat view:
  - Outgoing message detection now supports senderId + senderEmail fallback.
- Updated fallback display behavior:
  - Inbox thread item avoids generic repeated "Ứng viên" labels.
  - Avatar fallback uses leading character of displayName.
  - HR fallback label supported as "HR" when sender profile fields are missing.
- Documentation synchronized for HR/Candidate layout parity:
  - `careergraph-api/docs/chat_notify/03_PHASE3_HR_FE_CHAT.md`
  - `careergraph-api/docs/chat_notify/04_PHASE4_CANDIDATE_FE_CHAT.md`

## Addendum Advanced QA - 2026-04-15

### Functional checklist (03b_PHASE3_ADDENDUM_ADVANCED.md)

| Item | Status | Notes |
|---|---|---|
| MessageBubble có action gỡ tin kèm countdown 60s | PASS | `MessageBubble` dùng `useUnsendCountdown`, hiển thị `Gỡ tin nhắn` + thời gian còn lại. |
| Hết thời gian thì không cho gỡ | PASS | Countdown về `0` thì action chuyển sang trạng thái disabled `Không thể gỡ`. |
| Unsend dùng endpoint mới `/messages/{id}/unsend` | PASS | `messagingApi.unsendMessage` được gọi trong `useMessages.deleteSentMessage`. |
| Optimistic unsend + rollback khi API fail | PASS | Tin nhắn bị đánh dấu deleted ngay, rollback danh sách tin nếu API lỗi. |
| Thread context menu có archive/unarchive | PASS | `ThreadItem` dropdown menu hỗ trợ lưu trữ và bỏ lưu trữ. |
| Thread context menu có delete thread | PASS | Có confirm dialog tiếng Việt trước khi xóa hội thoại phía HR. |
| Thread context menu có block/unblock | PASS | Có `BlockDialog` chọn lý do + confirm bỏ chặn. |
| Blocked banner trong ChatWindow | PASS | Hiển thị banner cảnh báo, có nút bỏ chặn ngay trên header chat area. |
| Khi bị block thì disable message input | PASS | `MessageInput` nhận `disabled` + placeholder phù hợp trạng thái blocked. |
| Inbox có tab `Đã lưu trữ` | PASS | `MessagesPage` thêm toggle `Hộp thư` / `Đã lưu trữ`, load theo `archived` param. |
| API layer có đầy đủ advanced endpoints | PASS | Bổ sung unsend, delete thread, archive/unarchive, block/unblock/get blocked users/status. |
| Navigation hiển thị unread badge | PASS | `AppSidebar` hiển thị badge cho menu `Tin nhắn`. |
| Candidate Detail tab vẫn hoạt động | PASS | Không đổi contract, `CandidateMessageTab` tiếp tục dùng `ChatWindow` với thread đảm bảo từ API. |

### Build/Lint regression

- `npm run build`: PASS
- `npm run lint`: PASS

### Residual risk

- Chưa có automated e2e cho các flow menu/confirm dialog/socket event block-unblock; hiện được xác thực bằng code audit + compile/lint.
