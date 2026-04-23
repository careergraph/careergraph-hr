# Phase 8: Interview, Calendar & Secondary Pages

> **Thời gian:** 3 ngày  
> **Phụ thuộc:** Phase 4 (modal/table), Phase 5 (chart patterns)  
> **Branch:** `responsive`  

---

## Mục tiêu

Fix các trang P0/P1 còn lại: Interview Room (WebRTC mobile layout), Interview List, Calendar (FullCalendar mobile config), và RecentCandidateActivity table → cards.

---

## Files in scope

| # | File | Thay đổi |
|---|------|----------|
| 1 | `src/pages/Interview/InterviewList.tsx` | Tabs overflow scroll, card layout responsive |
| 2 | `src/pages/Interview/InterviewCard.tsx` | Responsive padding, badge positioning |
| 3 | `src/pages/Interview/InterviewRoom.tsx` | Mobile video layout (stacked), controls bottom bar |
| 4 | `src/pages/Calendar/Calendar.tsx` | FullCalendar mobile view config, sidebar collapse |
| 5 | `src/components/recruitment/RecentCandidateActivity.tsx` | Table → card trên mobile |

## Không làm

- Không rewrite FullCalendar — chỉ config mobile view
- Không rewrite WebRTC logic — chỉ layout CSS
- Không touch TalentSourceCard (Phase 9, P2)
- Không touch CalendarModalForm (sẽ inherit Phase 4 modal responsive)
- Không thay đổi video/audio handling code

---

## Design Spec chi tiết

### 1. `InterviewList.tsx` — Responsive Tabs & Cards

**Vấn đề:**
- Tabs overflow trên mobile (nhiều status tabs)
- Interview cards không adaptive layout

**Tabs responsive:**
```typescript
// TabsList wrapper:
<div className="overflow-x-auto no-scrollbar -mx-4 px-4 md:mx-0 md:px-0">
  <TabsList className="inline-flex w-max gap-1 md:w-auto md:gap-2">
    {statuses.map(status => (
      <TabsTrigger 
        key={status}
        className="shrink-0 whitespace-nowrap px-3 py-2 text-sm md:px-4"
      >
        {status}
      </TabsTrigger>
    ))}
  </TabsList>
</div>
```

**Horizontal scroll tabs:** `-mx-4 px-4` mở rộng scroll area full-width, `no-scrollbar` ẩn scrollbar.

**Card grid responsive:**
```typescript
// Grid:
<div className="grid grid-cols-1 gap-3 md:grid-cols-2 md:gap-4 xl:grid-cols-3">
  {interviews.map(interview => (
    <InterviewCard key={interview.id} interview={interview} />
  ))}
</div>
```

### 2. `InterviewCard.tsx` — Responsive Design

**Hiện tại:**
```
rounded-xl border ... p-4 shadow-sm
flex items-start justify-between
```

**Thay đổi:**
```typescript
<div className="rounded-xl border border-gray-200 bg-white 
  p-3 shadow-sm md:p-4 dark:border-gray-700 dark:bg-gray-900">
  
  {/* Header: title + badge */}
  <div className="flex items-start justify-between gap-2">
    <div className="min-w-0 flex-1">
      <h3 className="truncate text-sm font-semibold md:text-base">
        {interview.title}
      </h3>
      <p className="truncate text-xs text-gray-500 md:text-sm">
        {interview.jobTitle}
      </p>
    </div>
    <Badge size="sm" className="shrink-0">{interview.status}</Badge>
  </div>
  
  {/* Details */}
  <div className="mt-2.5 space-y-1.5 text-xs text-gray-600 md:mt-3 md:text-sm">
    <div className="flex items-center gap-2">
      <Clock className="h-3.5 w-3.5 shrink-0" />
      <span className="truncate">{formattedDateTime}</span>
    </div>
    <div className="flex items-center gap-2">
      <User className="h-3.5 w-3.5 shrink-0" />
      <span className="truncate">{candidateName}</span>
    </div>
  </div>
  
  {/* Actions */}
  <div className="mt-3 flex items-center justify-end gap-2">
    {/* Buttons inherit from Phase 2 responsive sizing */}
  </div>
</div>
```

### 3. `InterviewRoom.tsx` — Mobile Video Layout

**Hiện tại:** Video layout designed for desktop (side-by-side hoặc main + PiP)

**Mobile layout:**
```
┌─────────────────────────────────────┐
│                                     │
│         Remote Video                │
│         (full-width, 16:9)          │
│                                     │
├─────────────────────────────────────┤
│ [Local PiP]  Candidate Name         │  ← info bar
├─────────────────────────────────────┤
│  🎤  📹  🖥️  📞                     │  ← controls (fixed bottom)
└─────────────────────────────────────┘
```

**Implementation:**
```typescript
const InterviewRoom = () => {
  const isMobile = useMediaQuery('(max-width: 767px)');
  
  return (
    <div className="relative flex h-full flex-col bg-gray-950">
      {/* Remote Video */}
      <div className="relative flex-1">
        <video
          ref={remoteVideoRef}
          className={isMobile
            ? "h-full w-full object-cover"
            : "h-full w-full object-contain"
          }
          autoPlay
          playsInline  // QUAN TRỌNG cho iOS Safari
        />
        
        {/* Local Video PiP (floating) */}
        <div className={`absolute z-10 overflow-hidden rounded-xl border-2 border-white/20 shadow-lg
          ${isMobile 
            ? 'right-3 top-3 h-28 w-20'           // mobile: nhỏ, góc phải trên
            : 'right-6 top-6 h-48 w-64'            // desktop: lớn hơn
          }`}
        >
          <video
            ref={localVideoRef}
            className="h-full w-full object-cover"
            autoPlay
            muted
            playsInline
          />
        </div>
      </div>
      
      {/* Info Bar (mobile only) */}
      {isMobile && (
        <div className="flex items-center gap-3 bg-gray-900 px-4 py-2">
          <span className="truncate text-sm font-medium text-white">
            {candidateName}
          </span>
          <span className="text-xs text-gray-400">{duration}</span>
        </div>
      )}
      
      {/* Controls */}
      <div className={`flex items-center justify-center gap-3 bg-gray-900/95 backdrop-blur
        ${isMobile 
          ? 'px-4 py-3 pb-[calc(0.75rem+var(--safe-area-bottom))]'  // safe area
          : 'px-6 py-4'
        }`}
      >
        <ControlButton icon={Mic} label="Mic" />
        <ControlButton icon={Video} label="Camera" />
        {!isMobile && <ControlButton icon={Monitor} label="Chia sẻ màn hình" />}
        <ControlButton icon={PhoneOff} label="Kết thúc" variant="destructive" />
      </div>
    </div>
  );
};
```

**Quan trọng cho mobile video:**
- `playsInline` attribute — bắt buộc cho iOS Safari
- Screen sharing button ẩn trên mobile (không hỗ trợ)
- Controls có `safe-area-inset-bottom`
- Local video PiP nhỏ (80×112px) trên mobile

### 4. `Calendar.tsx` — FullCalendar Mobile Config

**Hiện tại:** FullCalendar default view, sidebar for event summary

**Thay đổi:**

**FullCalendar initial view responsive:**
```typescript
const isMobile = useMediaQuery('(max-width: 767px)');
const isTablet = useMediaQuery('(min-width: 768px) and (max-width: 1023px)');

const calendarOptions = {
  initialView: isMobile ? 'listWeek' : isTablet ? 'timeGridWeek' : 'dayGridMonth',
  headerToolbar: isMobile 
    ? { left: 'prev,next', center: 'title', right: 'listWeek,timeGridDay' }
    : { left: 'prev,next today', center: 'title', right: 'dayGridMonth,timeGridWeek,timeGridDay' },
  // ...
};
```

**Sidebar responsive:**
```typescript
// Desktop: sidebar bên phải (fixed width 300px)
// Tablet: sidebar collapse, toggle button
// Mobile: sidebar ẩn, event tap → bottom sheet (inherit Phase 4 Modal)

<div className="flex flex-col gap-4 lg:flex-row">
  <div className="w-full lg:flex-1">
    <FullCalendar {...calendarOptions} />
  </div>
  {!isMobile && (
    <aside className="w-full shrink-0 lg:w-72 xl:w-80">
      <CalendarSidebar />
    </aside>
  )}
</div>
```

**CalendarHero (stats) responsive:**
```typescript
// Grid tương tự KpiCards:
className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4"
```

### 5. `RecentCandidateActivity.tsx` — Table → Cards

**Hiện tại:** Table layout với overflow-x-auto

**Thay đổi — dùng mobileCardRenderer pattern từ Phase 4:**

```typescript
const isMobile = useMediaQuery('(max-width: 767px)');

if (isMobile) {
  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h3 className="text-base font-semibold">Hoạt động gần đây</h3>
        {/* Date badge */}
      </div>
      {activities.map(activity => (
        <div key={activity.id} className="rounded-xl border border-gray-200 bg-white p-3 
          dark:border-gray-700 dark:bg-gray-900">
          <div className="flex items-start gap-3">
            <img src={activity.avatar} className="h-10 w-10 rounded-full shrink-0" alt="" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                {activity.name}
              </p>
              <p className="text-xs text-gray-500 truncate">{activity.position}</p>
              <div className="mt-2 flex items-center justify-between">
                <Badge size="sm">{activity.status}</Badge>
                <span className="text-xs text-gray-400">{activity.date}</span>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// Desktop: giữ nguyên table
```

---

## Patterns áp dụng

| Pattern | Spec Reference | Áp dụng |
|---------|---------------|---------|
| 3b Table→Card | Cards trên mobile thay cho horizontal scroll | RecentCandidateActivity |
| Custom Video | Stacked video layout, PiP local, safe-area controls | InterviewRoom |
| 3g Spacing | Responsive padding cho cards, tabs | InterviewCard, InterviewList |

---

## QA Checklist

### 375px (iPhone)
- [ ] InterviewList: tabs horizontal scroll, không bị clip
- [ ] InterviewCard: padding balanced, text truncate, badge visible
- [ ] InterviewRoom: remote video full, local PiP corner, controls bottom
- [ ] InterviewRoom: `playsInline` hoạt động (iOS)
- [ ] InterviewRoom: screen share button ẩn
- [ ] Calendar: list view default, events readable
- [ ] Calendar: tap event → modal/bottom sheet
- [ ] Calendar sidebar ẩn trên mobile
- [ ] RecentCandidateActivity: card view, avatar + info + badge

### 768px (iPad)
- [ ] InterviewList: 2-column grid
- [ ] InterviewRoom: larger PiP, controls spaced
- [ ] Calendar: timeGridWeek view, header toolbar full
- [ ] Calendar sidebar visible (dưới calendar hoặc bên cạnh)
- [ ] RecentCandidateActivity: table view (desktop path)

### 1024px+ (Desktop)
- [ ] **Giữ nguyên** tất cả
- [ ] Calendar: dayGridMonth + sidebar phải

### Cross-cutting
- [ ] Dark mode cho video room background, controls, calendar
- [ ] Interview room: media permissions prompt trên mobile
- [ ] FullCalendar light/dark theme sync
- [ ] Calendar event create/edit modal responsive (inherit Phase 4)
