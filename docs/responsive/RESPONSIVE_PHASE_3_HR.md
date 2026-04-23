# Phase 3: Complex Form Controls & Header Dropdown

> **Thời gian:** 2 ngày  
> **Phụ thuộc:** Phase 2 (form input responsive patterns)  
> **Branch:** `responsive`  

---

## Mục tiêu

Fix các form controls phức tạp hơn (MultiSelect, DatePicker, TextArea) và header UserDropdown overflow. Sau phase này, toàn bộ form hệ thống sẵn sàng cho mobile.

---

## Files in scope

| # | File | Thay đổi |
|---|------|----------|
| 1 | `src/components/form/MultiSelect.tsx` | Mobile dropdown max-height, tag sizing, close button touch target |
| 2 | `src/components/form/date-picker.tsx` | Mobile Flatpickr config, input height responsive |
| 3 | `src/components/form/input/TextArea.tsx` | Responsive padding, font-size 16px mobile |
| 4 | `src/components/header/UserDropdown.tsx` | Fix `w-65` overflow, responsive positioning |
| 5 | `src/components/form/Label.tsx` | Responsive margin/spacing |

## Không làm

- Không touch table components (Phase 4)
- Không touch page-level forms (Dashboard, AddJob, etc.)
- Không touch recruitment chart components
- Không thay đổi component API / props interface
- Không thay thế Flatpickr library (chỉ config)

---

## Design Spec chi tiết

### 1. `MultiSelect.tsx` — Mobile-safe Dropdown

**Vấn đề hiện tại:**
- Dropdown không có max-height → vượt viewport trên mobile
- Selected tags có close button quá nhỏ cho touch
- Tag wrapping `gap-2` fixed

**Thay đổi:**

**Dropdown container:**
```typescript
// Thêm max-height và scroll
className="... max-h-60 md:max-h-80 overflow-y-auto"
// 60 = 15rem = 240px (mobile), 80 = 20rem = 320px (desktop)
```

**Selected tags — close button touch target:**
```typescript
// Hiện tại: SVG close button nhỏ
// Thay đổi: mở rộng tap area
<button
  onClick={() => removeOption(option)}
  className="ml-1 flex h-5 w-5 items-center justify-center rounded-full 
    hover:bg-gray-200 dark:hover:bg-gray-600
    touch-target"  // sử dụng utility từ Phase 1 CSS
  aria-label={`Xoá ${option.label}`}
>
  <XIcon className="h-3 w-3" />
</button>
```

**Input text sizing:**
```
text-base md:text-sm  // 16px mobile, 14px desktop
```

### 2. `date-picker.tsx` — Mobile Flatpickr

**Vấn đề hiện tại:**
- Input `h-11` fixed (OK cho touch)
- Flatpickr calendar popup fixed width, không mobile-optimized

**Thay đổi:**

**Input:**
```
// Thêm text-base mobile:
text-base md:text-sm
// Padding responsive:
px-3 md:px-4
```

**Flatpickr config — thêm mobile detection:**
```typescript
// Trong flatpickr init options:
{
  // ... existing options
  static: true,                    // không reposition (tránh jank)
  disableMobile: false,            // cho phép native date picker trên mobile
  // HOẶC nếu muốn giữ Flatpickr UI:
  onReady: (_, __, fp) => {
    // Mobile: full-width calendar
    if (window.innerWidth < 768) {
      fp.calendarContainer.classList.add('flatpickr-mobile-full');
    }
  }
}
```

**CSS cho Flatpickr mobile (thêm vào index.css hoặc component CSS):**
```css
@media (max-width: 767px) {
  .flatpickr-calendar {
    width: calc(100vw - 2rem) !important;
    max-width: 320px;
    left: 50% !important;
    transform: translateX(-50%);
  }
  .flatpickr-day {
    height: 40px;
    line-height: 40px;
    /* Larger tap targets for calendar days */
  }
}
```

**Option thay thế:** Nếu `disableMobile: false` → iOS/Android sẽ dùng native date picker (tốt hơn cho UX). Ưu tiên option này.

### 3. `TextArea.tsx` — Responsive Padding & Font

**Hiện tại:**
```
w-full ... px-4 py-2.5 ... text-sm
```

**Thay đổi:**
```
w-full ... px-3 py-2 md:px-4 md:py-2.5 ... text-base md:text-sm
```

**Font-size 16px trên mobile** tránh iOS auto-zoom (tương tự InputField).

**Rows responsive (optional, qua className):**
- Không thay đổi default `rows` prop
- Pages có thể pass `rows={3}` cho mobile nếu cần qua props

### 4. `UserDropdown.tsx` — Fix Mobile Overflow

**Vấn đề hiện tại:**
```
Dropdown: absolute right-0 mt-4.25 flex w-65 flex-col rounded-2xl
w-65 = 260px → vượt viewport trên iPhone SE (320px)
```

**Thay đổi:**

**Dropdown width:**
```typescript
// Hiện tại: w-65
// Thay đổi:
className="absolute right-0 mt-4.25 flex w-[calc(100vw-2rem)] max-w-65 flex-col rounded-2xl ..."
// Mobile: width = viewport - 32px (padded)
// Desktop: max-width = 260px (giữ nguyên design)
```

**Positioning trên mobile:**
```typescript
// Thêm: đảm bảo dropdown không vượt phải viewport
// right-0 OK cho desktop vì header có padding
// Mobile: cần right: auto hoặc adjust qua media query
className="... right-0 md:right-0"
// Nếu vẫn overflow: thêm style={{ right: Math.max(0, ...) }}
```

**Avatar responsive:**
```typescript
// Hiện tại: mr-3 h-11 w-11
// Thay đổi: h-9 w-9 md:h-11 md:w-11 mr-2 md:mr-3
```

**Text trong dropdown:**
```typescript
// Giữ nguyên font sizes — text-theme-sm, text-theme-xs đủ readable
// Thêm truncate cho tên dài:
<span className="... truncate max-w-[180px]">{displayName}</span>
```

### 5. `Label.tsx` — Responsive Spacing

**Hiện tại:**
```
mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400
```

**Thay đổi:**
```
mb-1 md:mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400
```

**Thay đổi nhỏ:** giảm margin-bottom trên mobile từ 6px → 4px. Text-sm (14px) giữ nguyên vì label không cần 16px (không phải input).

---

## Patterns áp dụng

| Pattern | Spec Reference | Áp dụng |
|---------|---------------|---------|
| 3d Form | `font-size: 16px` mobile inputs | MultiSelect, DatePicker, TextArea |
| 3e Touch | Close button ≥ 44px tap area | MultiSelect tag remove |
| 3c Modal→Sheet | Dropdown responsive width | UserDropdown |
| 3g Spacing | Padding giảm trên mobile | TextArea, Label |

---

## QA Checklist

### 375px (iPhone)
- [ ] MultiSelect: dropdown không vượt viewport, scroll nếu nhiều items
- [ ] MultiSelect: tag close button tap dễ dàng bằng ngón cái
- [ ] DatePicker: calendar popup fit trong viewport, ngày tap dễ dàng
- [ ] DatePicker: focus input không trigger iOS zoom
- [ ] TextArea: text 16px, padding hợp lý
- [ ] UserDropdown: dropdown không bị cắt bên phải, nội dung readable
- [ ] UserDropdown: avatar size phù hợp

### 768px (iPad)
- [ ] MultiSelect dropdown max-height lớn hơn (320px)
- [ ] DatePicker calendar hiện đúng vị trí
- [ ] UserDropdown width = 260px (max-w-65)
- [ ] TextArea chuyển sang text-sm, px-4

### 1440px (Desktop)  
- [ ] **Không visual change** — tất cả giữ nguyên design hiện tại
- [ ] UserDropdown w-65 vẫn hoạt động

### Cross-cutting
- [ ] Dark mode cho MultiSelect dropdown, DatePicker calendar
- [ ] Keyboard navigation vẫn hoạt động (MultiSelect arrow keys, DatePicker)
- [ ] Focus trap trong dropdown/calendar (accessibility)
