# RESPONSIVE PHASE PLAN — HR Frontend

> **Ngày tạo:** 2025  
> **Scope:** `careergraph-hr` (React 19 + TypeScript 5.9 + Tailwind v4)  
> **Tiêu chuẩn:** Production-grade, ngang tầm Linear / GitHub / Figma  
> **Triết lý:** Mobile là trải nghiệm riêng biệt — KHÔNG phải "shrink desktop"

---

## 1. Tech Stack Summary

| Mục | Giá trị |
|-----|---------|
| Framework | React 19.0.0 + TypeScript 5.9.3 |
| CSS | Tailwind CSS v4.0.8 (`@theme` tokens, `@custom-variant dark`) |
| Component Library | Radix UI primitives + custom components (Button, Modal, Badge, Table) |
| UI Primitives | Shadcn-style (`src/components/ui/`) — button, input, dialog, card, sheet, scroll-area |
| Icons | lucide-react 0.462 + vite-plugin-svgr |
| Router | react-router v7.1.5 (BrowserRouter) |
| State | Zustand 5.0.8 (authStore with persist) |
| Charts | ApexCharts 4.1 + Recharts 2.15 |
| Calendar | FullCalendar 6.1.15 |
| DnD | @dnd-kit/core 6.3.1 |
| Messaging | socket.io-client 4.8.3 |
| Build | Vite 6.1.0, PostCSS 8.5.2 |
| Font | Google Fonts Roboto (base 18px desktop, 17px mobile ≤640px) |

### Breakpoints hiện tại (index.css `@theme`)

| Token | Giá trị | Dùng cho |
|-------|---------|----------|
| `2xsm` | 375px | iPhone SE / small phones |
| `xsm` | 425px | Large phones |
| `sm` | 640px | Small tablets / landscape phones |
| `md` | 768px | Tablets (iPad mini) |
| `lg` | 1024px | Small laptops / iPad Pro |
| `xl` | 1280px | Standard laptops |
| `2xl` | 1536px | Large monitors |
| `3xl` | 2000px | Ultra-wide |

### Breakpoint Strategy cho responsive redesign

```
Mobile:   < 768px    → design cho 375px (iPhone standard)
Tablet:   768–1023px → design cho 834px (iPad)
Desktop:  ≥ 1024px   → design cho 1440px (standard laptop)
```

---

## 2. Layout Shell — Hiện trạng

### AppLayout.tsx
- Wrapper: `min-h-screen xl:flex`
- Sidebar: fixed left, toggle `w-[290px]` (expanded) ↔ `w-[100px]` (collapsed)
- Main content: `flex-1 min-w-0`, margin `lg:ml-[290px]` / `lg:ml-[110px]`
- Content padding: `p-4 md:p-6`

### SidebarContext.tsx
- Mobile detection: `window.innerWidth < 768`
- States: `isExpanded`, `isMobileOpen`, `isHovered`
- Mobile overlay: backdrop + slide-in

### Vấn đề chính
| # | Vấn đề | Ảnh hưởng |
|---|--------|-----------|
| L1 | **Không có tablet collapsed mode** — Sidebar 290px hoặc ẩn, không có icon-only 64px cho tablet | Tablet (768–1023px) bị sidebar chiếm quá nhiều |
| L2 | **Không có bottom navigation** cho mobile | Mobile không có persistent nav, phải mở drawer |
| L3 | **Search bar ẩn hoàn toàn trên mobile** (`hidden md:flex`) | Mobile user không tìm kiếm được |
| L4 | **`lg:ml-[290px]`** hardcoded — không có breakpoint trung gian | 768–1023px content bị đẩy nhưng sidebar vẫn fixed |
| L5 | Header greeting + notifications không responsive | Overflow trên mobile nhỏ |

---

## 3. Full Inventory — Pages

### 3.1 Dashboard

| Page | File | Issues | Priority | Effort | Pattern |
|------|------|--------|----------|--------|---------|
| Dashboard Home | `src/pages/Dashboard/Home.tsx` | Không có breakpoint cho grid/charts; date picker không mobile-friendly; KPI cards không scale | P0 | L | 3d (Form), 3f (Typography), 3g (Spacing) |

**Chi tiết:**
- RecruitmentKpiCards: `grid-cols-1 sm:grid-cols-2 xl:grid-cols-3` — thiếu `md:` breakpoint
- FunnelConversionChart: `min-w-250` hardcoded pixel, chart overflow
- PipelineVelocityChart: `min-w-162.5` non-standard unit
- HiringTargetProgress: `pb-10` fixed, chart height 330px hardcoded
- Date inputs: native HTML, không touch-optimized

### 3.2 Job Management

| Page | File | Issues | Priority | Effort | Pattern |
|------|------|--------|----------|--------|---------|
| Jobs Grid | `src/pages/Job/JobsGrid.tsx` | Filter bar không collapse; grid không responsive | P1 | M | 3b (Table→Card), 3g (Spacing) |
| Job Filters | `src/pages/Job/JobFilters.tsx` | Không mobile breakpoint; accordion cần drawer trên mobile | P1 | M | 3c (Modal→Sheet) |
| Add Job | `src/pages/Job/AddJob.tsx` | Multi-step form `max-w-4xl` fixed; form fields không stack | P1 | M | 3d (Form), 3e (Touch) |

### 3.3 Kanban / Recruitment

| Page | File | Issues | Priority | Effort | Pattern |
|------|------|--------|----------|--------|---------|
| KanbanBoard | `src/pages/Kanban/KanbanBoard.tsx` | **CRITICAL:** Desktop-only horizontal scroll; `min-w-[280px]` columns; DnD không work trên touch | P0 | XL | Custom (single-column mobile) |
| Column | `src/pages/Kanban/Column.tsx` | `min-w-[280px]` fixed; padding `px-5` quá lớn cho mobile | P0 | M | 3g (Spacing) |
| CandidateCard | `src/pages/Kanban/CandidateCard.tsx` | Fixed padding `p-5`; không responsive gap | P1 | S | 3e (Touch), 3g (Spacing) |
| CandidateDetail | `src/pages/Kanban/CandidateDetail.tsx` | Đã có `sm:max-w-[90vw] lg:max-w-[70vw]` — **tương đối tốt** | P2 | S | 3c (Modal→Sheet) |

### 3.4 Interview

| Page | File | Issues | Priority | Effort | Pattern |
|------|------|--------|----------|--------|---------|
| InterviewList | `src/pages/Interview/InterviewList.tsx` | Tabs overflow; card layout không adaptive | P1 | M | 3b (Table→Card) |
| InterviewCard | `src/pages/Interview/InterviewCard.tsx` | Fixed padding `p-4`; badge squeeze trên mobile | P1 | S | 3e (Touch), 3g (Spacing) |
| InterviewRoom | `src/pages/Interview/InterviewRoom.tsx` | **CRITICAL:** WebRTC video layout không mobile-ready; controls overlap | P0 | XL | Custom (mobile video layout) |

### 3.5 Messaging

| Page | File | Issues | Priority | Effort | Pattern |
|------|------|--------|----------|--------|---------|
| MessagesPage | `src/features/messaging/pages/MessagesPage.tsx` | Sidebar `md:w-65 xl:w-80` hardcoded; toggle logic cần rework | P0 | L | Custom (chat mobile UX) |
| ChatWindow | `src/features/messaging/components/ChatWindow.tsx` | Message bubble `max-w-[85%]` OK; cần thêm breakpoints | P1 | M | 3g (Spacing) |
| InboxSidebar | `src/features/messaging/components/InboxSidebar.tsx` | Không responsive padding/sizing | P1 | S | 3g (Spacing) |
| MessageInput | `src/features/messaging/components/MessageInput.tsx` | `px-3 sm:px-4` **tốt**; cần minor tweaks | P2 | S | — |

### 3.6 Employees

| Page | File | Issues | Priority | Effort | Pattern |
|------|------|--------|----------|--------|---------|
| EmployeesTable | `src/pages/Employees/EmployeesTable.tsx` | Dùng BasicTableOne — horizontal scroll, không card view | P1 | L | 3b (Table→Card) |

### 3.7 Calendar

| Page | File | Issues | Priority | Effort | Pattern |
|------|------|--------|----------|--------|---------|
| Calendar | `src/pages/Calendar/Calendar.tsx` | FullCalendar mobile view limited; sidebar overlap; stats cards không responsive | P1 | L | 3g (Spacing) |

### 3.8 Profile & Settings

| Page | File | Issues | Priority | Effort | Pattern |
|------|------|--------|----------|--------|---------|
| UserProfiles | `src/pages/Profile/UserProfiles.tsx` | Phụ thuộc child components; vertical stack OK | P2 | S | 3d (Form) |
| AccountSettings | `src/pages/Profile/AccountSettings.tsx` | Modal width; form layout | P2 | S | 3c (Modal→Sheet), 3d (Form) |

### 3.9 Suggestion Candidate

| Page | File | Issues | Priority | Effort | Pattern |
|------|------|--------|----------|--------|---------|
| SuggestionCandidate | `src/pages/SuggestionCandidate/SuggestionCandidate.tsx` | `px-6` fixed; horizontal list `min-w-[200px]` x 3 = 600px overflow | P1 | M | 3g (Spacing) |

### 3.10 Auth & Landing

| Page | File | Issues | Priority | Effort | Pattern |
|------|------|--------|----------|--------|---------|
| SignIn / SignUp | `src/pages/AuthPages/` | Phụ thuộc AuthLayout; thường đã mobile-friendly | P2 | S | 3d (Form) |
| Landing / Hero | `src/pages/Landing/` | **Đã có responsive tốt:** `md:grid-cols-[1.05fr_0.95fr]`, `sm:flex-row` | P2 | S | — |
| NotFound | `src/pages/Common/NotFound.tsx` | **Excellent responsive** — giữ nguyên làm reference | — | — | — |

---

## 4. Full Inventory — Shared Components

### 4.1 Custom Components (`src/components/custom/`)

| Component | File | Issues | Priority | Effort | Pattern |
|-----------|------|--------|----------|--------|---------|
| Button | `custom/button/Button.tsx` | Chỉ 2 size (sm/md) hardcoded; không touch optimization | P1 | S | 3e (Touch) |
| Modal | `custom/modal/index.tsx` | Close button chỉ có `sm:` breakpoint; không bottom-sheet pattern | P0 | L | 3c (Modal→Sheet) |
| Dropdown | `custom/dropdown/Dropdown.tsx` | Không responsive; không max-height; positioning breaks trên mobile | P1 | M | 3c (Modal→Sheet) |
| Badge | `custom/badge/Badge.tsx` | Fixed padding; không text truncation | P2 | S | — |

### 4.2 Form Components (`src/components/form/`)

| Component | File | Issues | Priority | Effort | Pattern |
|-----------|------|--------|----------|--------|---------|
| InputField | `form/input/InputField.tsx` | `h-11` fixed; `px-4 py-2.5` fixed; không touch target 44px | P0 | M | 3d (Form), 3e (Touch) |
| Select | `form/Select.tsx` | `h-11` fixed; `pr-11` hardcoded | P0 | S | 3d (Form) |
| MultiSelect | `form/MultiSelect.tsx` | Dropdown không max-height; tag sizing fixed; close button khó tap | P1 | M | 3d (Form), 3e (Touch) |
| DatePicker | `form/date-picker.tsx` | `h-11` fixed; Flatpickr không mobile-optimized | P1 | M | 3d (Form) |
| PhoneInput | `form/group-input/PhoneInput.tsx` | **CRITICAL:** `pl-[84px]` / `pr-[84px]` hardcoded — vỡ trên mobile | P0 | M | 3d (Form) |
| TextArea | `form/input/TextArea.tsx` | Fixed padding; rows không adaptive | P2 | S | 3d (Form) |
| Checkbox | `form/input/Checkbox.tsx` | `w-5 h-5` — dưới 44px touch target | P1 | S | 3e (Touch) |
| Switch | `form/switch/Switch.tsx` | `h-6 w-11` knob `h-5 w-5` — dưới 44px touch target | P1 | S | 3e (Touch) |
| Label | `form/Label.tsx` | `mb-1.5 text-sm` fixed | P2 | S | 3f (Typography) |

### 4.3 Table Components

| Component | File | Issues | Priority | Effort | Pattern |
|-----------|------|--------|----------|--------|---------|
| BasicTableOne | `tables/BasicTables/BasicTableOne.tsx` | **CRITICAL:** Không column hiding; không card view; padding không responsive (chỉ 1 cell có `sm:`) | P0 | L | 3b (Table→Card) |

### 4.4 Recruitment Components (`src/components/recruitment/`)

| Component | File | Issues | Priority | Effort | Pattern |
|-----------|------|--------|----------|--------|---------|
| RecruitmentKpiCards | `recruitment/RecruitmentKpiCards.tsx` | Grid OK (`sm:grid-cols-2 xl:grid-cols-3`); thiếu `md:` breakpoint; text sizing fixed | P1 | S | 3f (Typography), 3g (Spacing) |
| FunnelConversionChart | `recruitment/FunnelConversionChart.tsx` | `min-w-250` hardcoded pixel; chart overflow | P1 | M | 3g (Spacing) |
| PipelineVelocityChart | `recruitment/PipelineVelocityChart.tsx` | `min-w-162.5` non-standard; title không responsive | P1 | M | 3g (Spacing) |
| HiringTargetProgress | `recruitment/HiringTargetProgress.tsx` | `pb-10` fixed; chart height 330px hardcoded | P1 | S | 3g (Spacing) |
| TalentSourceCard | `recruitment/TalentSourceCard.tsx` | Percentage widths `w-[46%]` OK; padding fixed | P2 | S | 3g (Spacing) |
| RecentCandidateActivity | `recruitment/RecentCandidateActivity.tsx` | Table cells không responsive padding; avatar size fixed | P1 | M | 3b (Table→Card) |

### 4.5 Header Components

| Component | File | Issues | Priority | Effort | Pattern |
|-----------|------|--------|----------|--------|---------|
| UserDropdown | `header/UserDropdown.tsx` | **CRITICAL:** `w-65` (260px) vượt mobile viewport; avatar fixed `h-11 w-11`; positioning breaks | P0 | M | 3c (Modal→Sheet) |
| NotificationDropdown | `header/NotificationDropdown.tsx` | Delegates to feature component — cần verify | P1 | S | — |

### 4.6 UI Primitives (`src/components/ui/`)

| Component | File | Issues | Priority | Effort | Pattern |
|-----------|------|--------|----------|--------|---------|
| dialog.tsx | `ui/dialog.tsx` | `max-w-lg` OK; padding fixed `p-6` | P2 | S | — |
| input.tsx | `ui/input.tsx` | `h-10` fixed; `px-3 py-2` fixed | P1 | S | 3d (Form) |
| sheet.tsx | `ui/sheet.tsx` | **Tốt:** `sm:rounded-none`, side-aware | — | — | — |
| button.tsx | `ui/button.tsx` | **Tốt:** variant system responsive-ready | — | — | — |
| card.tsx | `ui/card.tsx` | Accepts className — flexible | P2 | S | — |
| scroll-area.tsx | `ui/scroll-area.tsx` | **Tốt:** `w-full` responsive | — | — | — |

### 4.7 Common Components

| Component | File | Issues | Priority | Effort | Pattern |
|-----------|------|--------|----------|--------|---------|
| ComponentCard | `common/ComponentCard.tsx` | Header `px-6 py-5` fixed; body `p-4 sm:p-6` tốt partial | P2 | S | 3g (Spacing) |

---

## 5. Responsive Audit Score

| Category | Total | Mobile-Ready | Partial | Not Ready |
|----------|-------|-------------|---------|-----------|
| Custom Components | 5 | 1 | 2 | 2 |
| Form Components | 10 | 1 | 3 | 6 |
| Tables | 1 | 0 | 1 | 0 |
| Recruitment | 6 | 0 | 4 | 2 |
| Header | 2 | 0 | 0 | 2 |
| UI Primitives | 6 | 5 | 1 | 0 |
| Common | 1 | 0 | 1 | 0 |
| **TOTAL** | **31** | **7 (23%)** | **12 (39%)** | **12 (39%)** |

### Good Patterns (giữ nguyên làm reference)
- `NotFound.tsx` — multi-breakpoint design, `sm:text-4xl`, `sm:flex-row`, `sm:grid-cols-2`
- `HeroSection.tsx` — `md:grid-cols-[1.05fr_0.95fr]`, `md:text-5xl`, `sm:flex-row`
- `MessageInput.tsx` — `px-3 sm:px-4` padding scaling
- `CandidateDetail sheet` — `sm:max-w-[90vw] lg:max-w-[70vw] xl:max-w-[65rem]`
- `ui/sheet.tsx` — side-aware, `sm:rounded-none`
- `ui/button.tsx` — variant system responsive-ready

---

## 6. Phase Breakdown

### Phase 1: Foundation — Navigation, Layout Shell, Responsive Tokens
**Thời gian:** 3 ngày  
**Phụ thuộc:** Không  

**Files in scope:**
1. `src/index.css` — thêm responsive utility classes (touch targets, typography clamp, spacing scale)
2. `src/context/SidebarContext.tsx` — thêm tablet detection (768–1023px), refactor breakpoint logic
3. `src/layout/AppSidebar.tsx` — tablet collapsed mode (64px, icon-only), mobile bottom nav
4. `src/layout/AppLayout.tsx` — responsive margin cho sidebar states, safe-area insets
5. `src/layout/AppHeader.tsx` — mobile search alternative, responsive greeting/notification area

**Không làm:**
- Không touch page-level code
- Không thay đổi routing
- Không refactor component API

**Design Patterns áp dụng:**
- **3a (Navigation):** Desktop sidebar → Tablet collapsed (64px icon-only) → Mobile bottom nav + drawer
- **3e (Touch):** Global touch target CSS rules ≥ 44×44px
- **3f (Typography):** `clamp()` cho headings
- **3g (Spacing):** Page container padding responsive (`p-4 md:p-6 lg:p-8`)

**DoD:**
- [ ] Sidebar collapse tự động sang icon-only ở 768–1023px
- [ ] Bottom navigation bar hiển thị trên mobile (<768px) với ≤5 items
- [ ] Hamburger → drawer cho secondary nav items trên mobile
- [ ] Mobile search accessible (icon trigger hoặc expandable bar)
- [ ] `safe-area-inset-bottom` cho bottom nav
- [ ] Layout hoạt động mượt ở 375px, 768px, 1024px, 1440px
- [ ] Không regression trên desktop

---

### Phase 2: Form System — Inputs, Selects, Touch Targets
**Thời gian:** 2 ngày  
**Phụ thuộc:** Phase 1 (responsive tokens đã có)  

**Files in scope:**
1. `src/components/form/input/InputField.tsx` — responsive height, padding, font-size 16px mobile
2. `src/components/form/Select.tsx` — responsive height, padding
3. `src/components/form/group-input/PhoneInput.tsx` — fix `pl-[84px]` hardcoded → responsive
4. `src/components/form/input/Checkbox.tsx` — touch target ≥ 44px
5. `src/components/form/switch/Switch.tsx` — touch target ≥ 44px

**Không làm:**
- Không đổi form layout (grid 2-col → 1-col là việc của page-level)
- Không đổi validation logic
- Không touch MultiSelect, DatePicker (Phase 3)

**Design Patterns áp dụng:**
- **3d (Form):** min-height 44px, font-size ≥ 16px trên mobile (tránh iOS auto-zoom)
- **3e (Touch):** Interactive elements ≥ 44×44px

**DoD:**
- [ ] Tất cả form inputs có min-height 44px trên mobile
- [ ] Font-size ≥ 16px cho inputs trên mobile (no iOS zoom)
- [ ] PhoneInput padding responsive — không vỡ layout trên 375px
- [ ] Checkbox/Switch tap area ≥ 44×44px
- [ ] Visual regression test: desktop forms không thay đổi

---

### Phase 3: Complex Form Controls & Header
**Thời gian:** 2 ngày  
**Phụ thuộc:** Phase 2  

**Files in scope:**
1. `src/components/form/MultiSelect.tsx` — mobile dropdown max-height, tag sizing responsive, close button touch target
2. `src/components/form/date-picker.tsx` — mobile-friendly Flatpickr config, input height responsive
3. `src/components/form/input/TextArea.tsx` — responsive padding, adaptive rows
4. `src/components/header/UserDropdown.tsx` — fix `w-65` overflow, responsive positioning
5. `src/components/form/Label.tsx` — responsive spacing, font size

**Không làm:**
- Không touch table components
- Không touch page-level code
- Không touch recruitment charts

**Design Patterns áp dụng:**
- **3d (Form):** Vertical stacking, responsive sizing
- **3e (Touch):** Close buttons, tag removal ≥ 44px
- **3c (Modal→Sheet):** UserDropdown → bottom sheet on mobile (optional)

**DoD:**
- [ ] MultiSelect dropdown không vượt viewport trên mobile
- [ ] DatePicker usable trên 375px touch device
- [ ] UserDropdown không overflow — `max-w-[calc(100vw-2rem)]` hoặc tương đương
- [ ] TextArea adaptive rows trên mobile (giảm default rows nếu cần)
- [ ] Label margin và font-size responsive

---

### Phase 4: Modal & Table → Card System
**Thời gian:** 3 ngày  
**Phụ thuộc:** Phase 2, Phase 3  

**Files in scope:**
1. `src/components/custom/modal/index.tsx` — bottom-sheet pattern trên mobile, responsive close button
2. `src/components/tables/BasicTables/BasicTableOne.tsx` — mobile card view, column hiding
3. `src/components/custom/dropdown/Dropdown.tsx` — mobile max-height, positioning
4. `src/components/custom/badge/Badge.tsx` — responsive padding, text truncation

**Không làm:**
- Không touch page-specific tables (EmployeesTable page logic — chỉ fix shared component)
- Không touch Kanban
- Không touch recruitment components

**Design Patterns áp dụng:**
- **3b (Table→Card):** BasicTableOne → card list trên mobile, KHÔNG horizontal scroll cho data tables
- **3c (Modal→Sheet):** Modal center desktop → bottom sheet mobile (drag handle, max-height 90vh)

**DoD:**
- [ ] Modal chuyển thành bottom sheet trên mobile (<768px) với drag handle
- [ ] BasicTableOne hiển thị card view trên mobile — primary info lớn, secondary nhỏ, actions
- [ ] Dropdown có max-height và scroll trên mobile
- [ ] Badge text truncation khi content quá dài
- [ ] Test ở 375px: modal, table, dropdown hoạt động đúng

---

### Phase 5: Dashboard & Recruitment Charts
**Thời gian:** 3 ngày  
**Phụ thuộc:** Phase 1, Phase 4  

**Files in scope:**
1. `src/pages/Dashboard/Home.tsx` — responsive grid, date picker UX, spacing
2. `src/components/recruitment/RecruitmentKpiCards.tsx` — thêm `md:` breakpoint, responsive text
3. `src/components/recruitment/FunnelConversionChart.tsx` — fix `min-w-250` → Tailwind unit, responsive chart wrapper
4. `src/components/recruitment/PipelineVelocityChart.tsx` — fix `min-w-162.5`, responsive title
5. `src/components/recruitment/HiringTargetProgress.tsx` — responsive padding, chart height

**Không làm:**
- Không touch TalentSourceCard, RecentCandidateActivity (Phase 6)
- Không touch Kanban
- Không thay đổi chart library

**Design Patterns áp dụng:**
- **3f (Typography):** Chart titles responsive
- **3g (Spacing):** Dashboard grid padding responsive, KPI card padding
- **3d (Form):** Date picker inputs touch-friendly

**DoD:**
- [ ] Dashboard Home single-column layout trên mobile, 2-col trên tablet
- [ ] KPI cards: 1 col (mobile) → 2 col (sm) → 3 col (md+)
- [ ] Charts scroll ngang mượt với indicator, không bị clip
- [ ] Chart titles + subtitles responsive font size
- [ ] Date picker inputs usable trên mobile (touch calendars)

---

### Phase 6: Kanban Board — Mobile Experience
**Thời gian:** 3 ngày  
**Phụ thuộc:** Phase 1, Phase 4  

**Files in scope:**
1. `src/pages/Kanban/KanbanBoard.tsx` — mobile: single-column view với stage tabs/dropdown thay vì horizontal scroll
2. `src/pages/Kanban/Column.tsx` — responsive `min-w`, padding, header
3. `src/pages/Kanban/CandidateCard.tsx` — responsive padding, gap, touch DnD
4. `src/pages/Kanban/Candidates.tsx` — heading responsive, back button touch target

**Không làm:**
- Không refactor DnD library
- Không thay đổi API calls
- Không touch CandidateDetail (đã OK)

**Design Patterns áp dụng:**
- **Custom:** Mobile single-column Kanban — dropdown chọn stage, swipe giữa stages (option)
- **3e (Touch):** Card tap targets, drag handle
- **3g (Spacing):** Card padding responsive

**DoD:**
- [ ] Mobile (<768px): hiển thị 1 column, dropdown/tabs chọn stage
- [ ] Tablet (768–1023px): 2–3 columns với reduced min-width
- [ ] Desktop: giữ nguyên horizontal scroll + full columns
- [ ] CandidateCard padding `p-3 sm:p-4 lg:p-5`
- [ ] Column header không bị overflow text trên mobile
- [ ] DnD vẫn functional trên touch (hoặc fallback long-press)

---

### Phase 7: Messaging — Chat Mobile UX
**Thời gian:** 3 ngày  
**Phụ thuộc:** Phase 1  

**Files in scope:**
1. `src/features/messaging/pages/MessagesPage.tsx` — mobile: full-screen toggle inbox ↔ chat (không side-by-side)
2. `src/features/messaging/components/InboxSidebar.tsx` — full-width trên mobile, responsive thread items
3. `src/features/messaging/components/ChatWindow.tsx` — full-width trên mobile, responsive bubble widths
4. `src/features/messaging/components/MessageBubble.tsx` — thêm breakpoints `max-w-[90%] sm:max-w-[85%] md:max-w-[75%]`

**Không làm:**
- Không touch MessageInput (đã tốt)
- Không thay đổi socket logic
- Không touch JobContextSelector CSS

**Design Patterns áp dụng:**
- **Custom (Chat):** Mobile = full-screen switch inbox ↔ chat với back button; Tablet+ = side-by-side
- **3g (Spacing):** Bubble padding responsive

**DoD:**
- [ ] Mobile: inbox list full-screen; tap thread → full-screen chat; back button → inbox
- [ ] Sidebar widths: `w-full md:w-1/3 lg:w-80` thay vì hardcoded `md:w-65 xl:w-80`
- [ ] Message bubbles responsive max-width per breakpoint
- [ ] Keyboard không đẩy layout sai trên mobile (test iOS + Android)
- [ ] Transition mượt giữa inbox ↔ chat

---

### Phase 8: Interview, Calendar, Secondary Pages
**Thời gian:** 3 ngày  
**Phụ thuộc:** Phase 4, Phase 5  

**Files in scope:**
1. `src/pages/Interview/InterviewList.tsx` — tabs overflow scroll, card layout responsive
2. `src/pages/Interview/InterviewCard.tsx` — responsive padding, badge positioning
3. `src/pages/Interview/InterviewRoom.tsx` — mobile video layout (stacked), controls bottom bar
4. `src/pages/Calendar/Calendar.tsx` — FullCalendar mobile view config, sidebar collapse
5. `src/components/recruitment/RecentCandidateActivity.tsx` — table → card trên mobile

**Không làm:**
- Không rewrite FullCalendar — chỉ config mobile view
- Không rewrite WebRTC logic — chỉ layout
- Không touch TalentSourceCard (P2)

**Design Patterns áp dụng:**
- **3b (Table→Card):** RecentCandidateActivity → cards trên mobile
- **Custom (Video):** Stacked video layout mobile (remote full, local PiP corner)
- **3g (Spacing):** Interview cards responsive padding

**DoD:**
- [ ] InterviewList tabs scrollable trên mobile, không bị clip
- [ ] InterviewRoom video: remote full-width, local PiP (floating corner) trên mobile
- [ ] Calendar: FullCalendar `initialView` = `listWeek` hoặc `timeGridDay` trên mobile
- [ ] RecentCandidateActivity card view trên mobile
- [ ] InterviewCard không bị badge squeeze trên 375px

---

### Phase 9: Remaining Pages & Polish
**Thời gian:** 2 ngày  
**Phụ thuộc:** Phase 1–8  

**Files in scope:**
1. `src/pages/Profile/UserProfiles.tsx` — responsive card stacking (minor adjustments)
2. `src/pages/Profile/AccountSettings.tsx` — modal width, form responsive
3. `src/pages/SuggestionCandidate/SuggestionCandidate.tsx` — fix `px-6` → responsive, horizontal list adaptive
4. `src/pages/Employees/EmployeesTable.tsx` — leverage BasicTableOne card view from Phase 4
5. `src/components/recruitment/TalentSourceCard.tsx` — responsive padding, font sizes

**Không làm:**
- Auth pages (SignIn/SignUp) — assume đã mobile-friendly
- Landing page — đã có responsive tốt
- NotFound — đã excellent

**Design Patterns áp dụng:**
- **3d (Form):** Profile/Settings forms responsive
- **3g (Spacing):** Page padding responsive

**DoD:**
- [ ] SuggestionCandidate: horizontal list hiện 1–2 cards trên mobile thay vì 3
- [ ] EmployeesTable sử dụng card view từ BasicTableOne trên mobile
- [ ] UserProfiles cards full-width trên mobile
- [ ] AccountSettings modals usable trên mobile
- [ ] TalentSourceCard readable trên 375px

---

### Phase 10: QA, Performance & Cross-browser
**Thời gian:** 2 ngày  
**Phụ thuộc:** Phase 1–9  

**Scope:**
1. Test toàn bộ app ở 320px, 375px, 768px, 1024px, 1440px
2. Verify 44px touch targets trên tất cả interactive elements
3. Check z-index stacking trên mobile overlays (modal, dropdown, bottom sheet, bottom nav)
4. Validate dark mode trên mobile
5. Performance audit

**Không làm:**
- Không add features mới
- Không refactor code
- Chỉ fix bugs phát hiện trong QA

**Performance Checklist:**
- [ ] Images: `srcset` + lazy loading
- [ ] Icons: tree-shaken (lucide-react đã OK)
- [ ] CSS: PurgeCSS via Tailwind (đã có)
- [ ] Font: `font-display: swap`, preload Roboto
- [ ] No layout shift: skeleton đúng size, CLS < 0.1
- [ ] Lighthouse mobile: Performance > 80, Accessibility > 90

**DoD:**
- [ ] 0 responsive bugs ở 375px (iPhone), 768px (iPad), 1024px (laptop)
- [ ] 0 touch target < 44px trên mobile
- [ ] Dark mode hoạt động đúng trên cả 3 breakpoints
- [ ] Z-index không conflict giữa bottom nav, modals, dropdowns
- [ ] Lighthouse mobile scores đạt target

---

## 7. Phase Timeline Summary

| Phase | Tên | Thời gian | Phụ thuộc | Items |
|-------|-----|-----------|-----------|-------|
| 1 | Foundation — Layout, Nav, Tokens | 3 ngày | — | 5 |
| 2 | Form Inputs & Touch Targets | 2 ngày | Phase 1 | 5 |
| 3 | Complex Form Controls & Header | 2 ngày | Phase 2 | 5 |
| 4 | Modal & Table → Card System | 3 ngày | Phase 2, 3 | 4 |
| 5 | Dashboard & Charts | 3 ngày | Phase 1, 4 | 5 |
| 6 | Kanban Board Mobile | 3 ngày | Phase 1, 4 | 4 |
| 7 | Messaging Chat Mobile UX | 3 ngày | Phase 1 | 4 |
| 8 | Interview, Calendar, Secondary | 3 ngày | Phase 4, 5 | 5 |
| 9 | Remaining Pages & Polish | 2 ngày | Phase 1–8 | 5 |
| 10 | QA, Performance, Cross-browser | 2 ngày | Phase 1–9 | 5 |
| **TOTAL** | | **~26 ngày** | | **47 items** |

### Dependency Graph

```
Phase 1 (Foundation)
├── Phase 2 (Form Inputs)
│   └── Phase 3 (Complex Forms)
│       └── Phase 4 (Modal & Table)
│           ├── Phase 5 (Dashboard)
│           ├── Phase 6 (Kanban)
│           └── Phase 8 (Interview & Calendar)
├── Phase 7 (Messaging) ← chỉ cần Phase 1
└── Phase 9 (Polish) ← cần tất cả
    └── Phase 10 (QA) ← cần tất cả
```

> **Note:** Phase 6 và Phase 7 có thể chạy song song nếu có 2 developers.  
> Phase 5 và Phase 6 cũng có thể song song sau khi Phase 4 xong.

---

## 8. Risk & Mitigation

| Risk | Impact | Mitigation |
|------|--------|------------|
| FullCalendar không support mobile view mong muốn | Phase 8 delay | Fallback: chỉ show list view trên mobile, ẩn month/week calendar |
| DnD Kit touch issues | Phase 6 phức tạp hơn | Fallback: disable drag trên mobile, dùng dropdown "Move to stage" instead |
| Flatpickr mobile UX kém | Phase 3 cần workaround | Option: thay bằng native `<input type="date">` trên mobile hoặc react-day-picker |
| WebRTC video layout phức tạp | Phase 8 delay | Prioritize stacked layout, skip PiP nếu cần |
| ApexCharts/Recharts render size cố định | Phase 5 chart overflow | Wrap trong responsive container với overflow-x-auto + scroll indicator |

---

*Document này cần được **approve** trước khi tạo các `RESPONSIVE_PHASE_N_HR.md` chi tiết.*


