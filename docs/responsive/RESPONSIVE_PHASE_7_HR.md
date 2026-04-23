# Phase 7: Messaging — Chat Mobile UX

> **Thời gian:** 3 ngày  
> **Phụ thuộc:** Phase 1 (layout foundation)  
> **Branch:** `responsive`  

---

## Mục tiêu

Messaging trải nghiệm mobile-first: full-screen toggle giữa inbox list và chat window. Không side-by-side trên mobile. Tablet+ giữ sidebar + chat layout.

---

## Files in scope

| # | File | Thay đổi |
|---|------|----------|
| 1 | `src/features/messaging/pages/MessagesPage.tsx` | Mobile full-screen toggle, responsive sidebar widths |
| 2 | `src/features/messaging/components/InboxSidebar.tsx` | Full-width trên mobile, responsive thread items |
| 3 | `src/features/messaging/components/ChatWindow.tsx` | Full-width trên mobile, responsive bubble widths |
| 4 | `src/features/messaging/components/MessageBubble.tsx` | Thêm breakpoints cho max-width |

## Không làm

- Không touch MessageInput.tsx (đã tốt: `px-3 sm:px-4`)
- Không thay đổi socket.io logic hoặc real-time messaging
- Không touch JobContextSelector / JobFilterBar CSS
- Không thay đổi thread data fetching / state management
- Không touch CandidateMessageTab.tsx, EmptyChat.tsx (minor)

---

## Design Spec chi tiết

### 1. `MessagesPage.tsx` — Full-screen Toggle

**Hiện tại:**
```typescript
// Sidebar: w-full md:w-65 xl:w-80
// Chat: flex min-w-0 flex-1
// Mobile: sidebar visible class toggles (hidden/flex)
```

**Behavior thay đổi:**

| Breakpoint | Layout |
|------------|--------|
| Mobile (< 768px) | Full-screen: Inbox list HOẶC Chat window (toggle) |
| Tablet (768–1023px) | Sidebar 1/3 width + Chat 2/3 |
| Desktop (≥ 1024px) | Sidebar 320px + Chat remaining |

**Mobile implementation:**
```typescript
const MessagesPage = () => {
  const { isMobile } = useSidebar(); // from Phase 1 context
  const [activeView, setActiveView] = useState<'inbox' | 'chat'>('inbox');
  const [selectedThread, setSelectedThread] = useState(null);
  
  const handleSelectThread = (thread) => {
    setSelectedThread(thread);
    if (isMobile) setActiveView('chat');
  };
  
  const handleBackToInbox = () => {
    if (isMobile) setActiveView('inbox');
  };
  
  if (isMobile) {
    return (
      <div className="flex h-full min-h-0 w-full flex-col overflow-hidden rounded-2xl 
        border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
        {activeView === 'inbox' ? (
          <InboxSidebar 
            onSelectThread={handleSelectThread} 
            isMobileFullScreen 
          />
        ) : (
          <ChatWindow 
            thread={selectedThread} 
            onBack={handleBackToInbox}
            isMobileFullScreen 
          />
        )}
      </div>
    );
  }
  
  // Tablet/Desktop: side-by-side
  return (
    <div className="flex h-full min-h-0 w-full overflow-hidden rounded-3xl 
      border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
      <InboxSidebar 
        onSelectThread={handleSelectThread}
        className="w-full md:w-1/3 lg:w-80 shrink-0 border-r border-gray-200 dark:border-gray-700"
      />
      <ChatWindow 
        thread={selectedThread} 
        className="flex min-w-0 flex-1"
      />
    </div>
  );
};
```

**Sidebar width thay đổi:**
```
Hiện tại: md:w-65 xl:w-80 (hardcoded)
Thay đổi: md:w-1/3 lg:w-80 (proportional on tablet, fixed on desktop)
```

### 2. `InboxSidebar.tsx` — Full-width Mobile

**Khi `isMobileFullScreen === true`:**
```typescript
// Width: w-full, h-full
// Search bar: full-width, prominent
// Thread list: full-height scroll
```

**Thread item responsive:**
```typescript
// Padding:
className="px-3 py-3 md:px-4 md:py-3"

// Avatar: giữ size (32–40px OK cho list items)

// Thread name:
className="truncate text-sm font-medium md:text-base"

// Last message preview:
className="truncate text-xs text-gray-500 md:text-sm"

// Timestamp:
className="shrink-0 text-[10px] text-gray-400 md:text-xs"
```

**Header (view selector / search):**
```typescript
// Mobile: search bar full-width, prominent
// Title "Tin nhắn" hiện trên mobile header
<div className="border-b border-gray-100 px-3 py-3 md:px-4 dark:border-gray-800">
  <h2 className="mb-2 text-lg font-semibold md:hidden">Tin nhắn</h2>
  <div className="relative">
    <input 
      placeholder="Tìm kiếm..."
      className="h-10 w-full rounded-lg border ... text-base md:text-sm"
    />
  </div>
</div>
```

### 3. `ChatWindow.tsx` — Mobile Back Button & Full-screen

**Khi `isMobileFullScreen === true`:**

**Header thêm back button:**
```typescript
<div className="flex items-center gap-2 border-b border-gray-100 px-3 py-2.5 
  dark:border-gray-800 md:px-4 md:py-3">
  {isMobileFullScreen && (
    <button 
      onClick={onBack}
      className="touch-target shrink-0 rounded-lg p-1.5 hover:bg-gray-100 
        dark:hover:bg-gray-800"
      aria-label="Quay lại danh sách"
    >
      <ArrowLeft className="h-5 w-5" />
    </button>
  )}
  {/* Thread info: avatar + name + status */}
  <div className="min-w-0 flex-1">
    <p className="truncate text-sm font-semibold">{threadName}</p>
    <p className="text-xs text-gray-500">{onlineStatus}</p>
  </div>
  {/* Action buttons */}
</div>
```

**Message container padding:**
```typescript
// Hiện tại: relative flex-1 overflow-y-auto
// Thêm: px-3 md:px-4
```

### 4. `MessageBubble.tsx` — Responsive Max-width

**Hiện tại:**
```
max-w-[85%] sm:max-w-[82%]
```

**Thay đổi:**
```
max-w-[90%] sm:max-w-[85%] md:max-w-[75%] lg:max-w-[70%]
```

**Giải thích:**
| Breakpoint | max-width | Lý do |
|------------|-----------|------|
| < 640px | 90% | Mobile: tận dụng tối đa space |
| 640–767px | 85% | Large phone landscape |
| 768–1023px | 75% | Tablet: bubbles ngắn hơn |
| ≥ 1024px | 70% | Desktop: reading comfort |

**Bubble padding:**
```
// Hiện tại: px-3.5 py-2.5
// Thay đổi: px-3 py-2 md:px-3.5 md:py-2.5
```

**Unsend menu positioning:**
```typescript
// Đảm bảo menu không vượt viewport trên mobile:
className="absolute ... right-0 md:left-full"
// Mobile: menu bên phải (align với bubble)
// Desktop: menu bên ngoài bubble (giữ nguyên)
```

---

## Patterns áp dụng

| Pattern | Spec Reference | Áp dụng |
|---------|---------------|---------|
| Custom Chat | Full-screen toggle inbox ↔ chat trên mobile | MessagesPage |
| 3e Touch | Back button 44px, thread items tap area | ChatWindow, InboxSidebar |
| 3g Spacing | Bubble padding, thread item padding | MessageBubble, InboxSidebar |

---

## QA Checklist

### 375px (iPhone)
- [ ] Vào /messages → thấy inbox list full-screen
- [ ] Tap thread → chat window full-screen, inbox ẩn
- [ ] Back button (← arrow) ở chat header → quay về inbox
- [ ] Thread items: avatar + name + preview + time đều readable
- [ ] Chat bubbles: max-width 90%, readable text
- [ ] MessageInput: keyboard mở không đẩy layout sai
- [ ] Scroll messages mượt (touch inertia)
- [ ] Unread count badge hiện đúng trên thread items

### 768px (iPad)
- [ ] Sidebar (1/3 width) + Chat (2/3) side-by-side
- [ ] Chọn thread → chat window cập nhật, KHÔNG full-screen toggle
- [ ] Back button KHÔNG hiện trên chat header
- [ ] Sidebar border-right visible

### 1024px+ (Desktop)
- [ ] Sidebar fixed 320px (w-80) + Chat remaining
- [ ] Bubbles max-width 70%
- [ ] **Giữ nguyên behavior hiện tại**

### Cross-cutting
- [ ] Real-time messages nhận qua socket hiện đúng khi đang ở chat view
- [ ] Typing indicator hiện đúng trên mobile
- [ ] Read receipts visible
- [ ] Dark mode cho sidebar, chat, bubbles
- [ ] Input keyboard (virtual keyboard mobile) không che MessageInput
- [ ] Back button transition mượt (không flicker)
- [ ] Unread badge cập nhật real-time khi ở inbox view
