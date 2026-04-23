# Phase 10: QA, Performance & Cross-browser Testing

> **Thời gian:** 2 ngày  
> **Phụ thuộc:** Phase 1–9 (tất cả phải done)  
> **Branch:** `responsive`  

---

## Mục tiêu

Validate toàn bộ responsive implementation qua systematic testing ở mọi breakpoint. Fix bugs, verify accessibility, measure performance. Không thêm features — chỉ fix issues.

---

## Scope

Tất cả files đã thay đổi trong Phase 1–9. Không sửa code mới, chỉ fix bugs phát hiện trong QA.

## Không làm

- Không thêm features mới
- Không refactor code
- Không đổi component architecture
- Chỉ fix bugs responsive / visual / accessibility

---

## Test Matrix

### Devices / Breakpoints bắt buộc test

| Device | Width | Loại test |
|--------|-------|-----------|
| iPhone SE | 320px | Edge case nhỏ nhất |
| iPhone 13/14 | 375px | Primary mobile target |
| iPhone 14 Pro Max | 430px | Large phone |
| iPad mini | 768px | Primary tablet target |
| iPad Air / Pro | 834px | Tablet landscape |
| Laptop | 1024px | Transition point |
| Desktop HD | 1440px | Primary desktop |
| Ultra-wide | 2000px+ | Edge case lớn nhất |

### Browsers bắt buộc test

| Browser | Devices | Chú ý |
|---------|---------|------|
| Chrome (mobile) | Android | DevTools emulation OK |
| Safari (mobile) | iPhone / iPad | **BẮT BUỘC real device hoặc BrowserStack** — nhiều CSS quirks |
| Chrome (desktop) | Mac/Windows | DevTools responsive mode |
| Firefox (desktop) | Mac/Windows | CSS compatibility |

---

## Test Checklist theo Category

### A. Navigation & Layout (Phase 1)

| Test | 320px | 375px | 768px | 1024px | 1440px |
|------|-------|-------|-------|--------|--------|
| Bottom nav visible (mobile only) | ☐ | ☐ | ✗ | ✗ | ✗ |
| Bottom nav 5 items readable | ☐ | ☐ | — | — | — |
| Bottom nav safe-area (iPhone) | ☐ | ☐ | — | — | — |
| Bottom nav active state | ☐ | ☐ | — | — | — |
| Bottom nav badge (unread) | ☐ | ☐ | — | — | — |
| Sidebar collapsed 64px (tablet) | — | — | ☐ | ✗ | ✗ |
| Sidebar icon tooltip (tablet hover) | — | — | ☐ | ✗ | ✗ |
| Sidebar expanded (desktop) | — | — | — | ☐ | ☐ |
| Sidebar drawer overlay (mobile) | ☐ | ☐ | — | — | — |
| Sidebar drawer backdrop click close | ☐ | ☐ | — | — | — |
| Mobile search expand/collapse | ☐ | ☐ | — | — | — |
| Header greeting truncate | ☐ | ☐ | ☐ | ☐ | ☐ |
| Content padding balanced | ☐ | ☐ | ☐ | ☐ | ☐ |
| Content not cut by bottom nav | ☐ | ☐ | — | — | — |

### B. Forms (Phase 2–3)

| Test | 375px | 768px | 1440px |
|------|-------|-------|--------|
| InputField: 16px font (no iOS zoom) | ☐ | ☐ | ☐ |
| InputField: 44px min-height | ☐ | ☐ | ☐ |
| Select: 16px font, 44px height | ☐ | ☐ | ☐ |
| PhoneInput: fits viewport | ☐ | ☐ | ☐ |
| Checkbox: 44px tap area | ☐ | — | — |
| Switch: 44px tap area | ☐ | — | — |
| MultiSelect: dropdown max-height | ☐ | ☐ | ☐ |
| MultiSelect: tag remove tap | ☐ | — | — |
| DatePicker: calendar fits viewport | ☐ | ☐ | ☐ |
| TextArea: 16px font mobile | ☐ | ☐ | ☐ |
| UserDropdown: fits viewport | ☐ | ☐ | ☐ |

### C. Modals & Tables (Phase 4)

| Test | 375px | 768px | 1440px |
|------|-------|-------|--------|
| Modal → bottom sheet mobile | ☐ | ✗ | ✗ |
| Bottom sheet: drag handle visible | ☐ | — | — |
| Bottom sheet: max-height 90vh | ☐ | — | — |
| Bottom sheet: backdrop close | ☐ | — | — |
| Bottom sheet: safe-area bottom | ☐ | — | — |
| Modal: center desktop | — | ☐ | ☐ |
| Table → cards mobile | ☐ | ✗ | ✗ |
| Table: responsive padding | — | ☐ | ☐ |
| Dropdown: max-height scroll | ☐ | ☐ | ☐ |
| Dropdown: fits viewport | ☐ | ☐ | ☐ |
| Badge: text truncate | ☐ | ☐ | ☐ |

### D. Dashboard (Phase 5)

| Test | 375px | 768px | 1440px |
|------|-------|-------|--------|
| KPI cards: 1 col | ☐ | — | — |
| KPI cards: 3 cols | — | ☐ | ☐ |
| Charts: scroll horizontal | ☐ | ☐ | ✗ |
| Charts: no horizontal page scroll | ☐ | ☐ | ☐ |
| Date range: stacked mobile | ☐ | ✗ | ✗ |
| Date range: inline desktop | — | ☐ | ☐ |
| Chart titles readable | ☐ | ☐ | ☐ |

### E. Kanban (Phase 6)

| Test | 375px | 768px | 1440px |
|------|-------|-------|--------|
| Single column + stage tabs | ☐ | ✗ | ✗ |
| Stage tabs horizontal scroll | ☐ | — | — |
| Stage switch → content update | ☐ | — | — |
| Multi-column horizontal | — | ☐ | ☐ |
| Card padding responsive | ☐ | ☐ | ☐ |
| Card tap → detail sheet | ☐ | ☐ | ☐ |
| DnD mobile (long-press) | ☐ | — | — |
| DnD desktop (click-drag) | — | ☐ | ☐ |
| Back button touch target | ☐ | ☐ | ☐ |

### F. Messaging (Phase 7)

| Test | 375px | 768px | 1440px |
|------|-------|-------|--------|
| Inbox full-screen mobile | ☐ | ✗ | ✗ |
| Chat full-screen mobile | ☐ | ✗ | ✗ |
| Inbox ↔ Chat toggle | ☐ | ✗ | ✗ |
| Back button → inbox | ☐ | ✗ | ✗ |
| Side-by-side layout | — | ☐ | ☐ |
| Sidebar width proportional | — | ☐ | — |
| Sidebar width fixed | — | — | ☐ |
| Bubble max-width per breakpoint | ☐ | ☐ | ☐ |
| Keyboard doesn't cover input | ☐ | — | — |
| Real-time message appears | ☐ | ☐ | ☐ |

### G. Interview & Calendar (Phase 8)

| Test | 375px | 768px | 1440px |
|------|-------|-------|--------|
| Interview tabs scroll | ☐ | ☐ | ☐ |
| Interview cards grid | ☐ | ☐ | ☐ |
| Video room: stacked mobile | ☐ | ✗ | ✗ |
| Video room: PiP local | ☐ | ☐ | ☐ |
| Video room: controls safe-area | ☐ | — | — |
| Video room: playsInline iOS | ☐ | — | — |
| Calendar: list view mobile | ☐ | ✗ | ✗ |
| Calendar: week view tablet | — | ☐ | ✗ |
| Calendar: month view desktop | — | — | ☐ |
| Activity table → cards | ☐ | ✗ | ✗ |

### H. Secondary Pages (Phase 9)

| Test | 375px | 768px | 1440px |
|------|-------|-------|--------|
| Profile cards stacked | ☐ | ☐ | ☐ |
| Settings modals responsive | ☐ | ☐ | ☐ |
| Suggestion: padding balanced | ☐ | ☐ | ☐ |
| Suggestion: card list mobile | ☐ | — | — |
| Employees: card view mobile | ☐ | ✗ | ✗ |
| TalentSource: readable | ☐ | ☐ | ☐ |

---

## Accessibility Checklist

- [ ] All interactive elements ≥ 44×44px tap area trên mobile
- [ ] Focus visible ring trên tất cả focusable elements
- [ ] Color contrast ratio ≥ 4.5:1 (text), ≥ 3:1 (large text, UI)
- [ ] `aria-label` trên icon-only buttons (hamburger, search, back, close)
- [ ] Bottom nav items có accessible names
- [ ] Modal focus trap hoạt động (Tab cycle)
- [ ] ESC key close modals, dropdowns, bottom sheets
- [ ] Screen reader: landmark regions (`nav`, `main`, `aside`) đúng
- [ ] Images có `alt` text (avatars OK có alt="")
- [ ] No horizontal scroll trên body (chỉ cho charts/tables có container)

---

## Performance Checklist

- [ ] **Images:** `srcset` + `loading="lazy"` cho avatars, logos
- [ ] **Icons:** lucide-react tree-shaken (chỉ import icon cần dùng — đã OK)
- [ ] **CSS:** Tailwind purge (đã có via PostCSS — verify no unused rules)
- [ ] **Font:** `font-display: swap` trong Google Fonts import — kiểm tra index.css
- [ ] **Font preload:** Thêm `<link rel="preload">` cho Roboto font nếu chưa có
- [ ] **No layout shift:** Skeleton loading đúng size → CLS < 0.1
- [ ] **Bundle size:** Verify không thêm library mới nào lớn

### Lighthouse Targets (Mobile)

| Metric | Target | Tool |
|--------|--------|------|
| Performance | > 80 | Lighthouse |
| Accessibility | > 90 | Lighthouse |
| Best Practices | > 90 | Lighthouse |
| First Contentful Paint | < 2s | Lighthouse |
| Largest Contentful Paint | < 3s | Lighthouse |
| Cumulative Layout Shift | < 0.1 | Lighthouse |
| Total Blocking Time | < 300ms | Lighthouse |

---

## Z-index Audit

Verify stacking order không conflict:

| Element | Z-index | Scope |
|---------|---------|-------|
| Sticky header | 40 | Global |
| Bottom nav | 50 | Mobile only |
| Sidebar (tablet/desktop) | 50 | LG+ |
| Sidebar drawer (mobile) | 50 | Mobile only |
| Mobile backdrop | 40 | Mobile only |
| Dropdown | 40 | Local |
| Modal / Bottom sheet | 50 | Global |
| Modal backdrop | 50 | Global |
| Toast (sonner) | 9999 | Global |

**Potential conflicts:**
- Bottom nav (50) vs Sidebar drawer (50) → sidebar drawer cần render later (DOM order wins)
- Modal (50) vs Bottom nav (50) → modal backdrop cần cover bottom nav → portal to body ở cuối

---

## Dark Mode Sweep

Test tất cả modified components ở dark mode:

- [ ] Bottom nav: bg, text, active state, border
- [ ] Sidebar collapsed: bg, icon colors, hover tooltip
- [ ] Bottom sheet: bg, border, drag handle
- [ ] Mobile cards (table): bg, border, text
- [ ] Stage tabs (Kanban): bg, text, active
- [ ] Chat inbox/window: bg, border
- [ ] Message bubbles: own-msg bg, other-msg bg
- [ ] Charts: background, grid lines, tooltips
- [ ] Calendar: FullCalendar theme

---

## Bug Tracking

| # | Bug | Severity | Phase | Status |
|---|-----|----------|-------|--------|
| | *(Điền khi test)* | | | |

---

## Sign-off Criteria

Phase 10 hoàn thành khi:
1. ✅ Tất cả test matrix cells checked (☐ → ✓)
2. ✅ 0 critical bugs open
3. ✅ Lighthouse mobile Performance > 80, Accessibility > 90
4. ✅ Dark mode verified ở 375px, 768px, 1440px
5. ✅ Z-index không conflict
6. ✅ No horizontal page-level scroll ở bất kỳ breakpoint nào
