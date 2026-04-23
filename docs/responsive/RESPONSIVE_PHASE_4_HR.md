# Phase 4: Modal → Bottom Sheet & Table → Card System

> **Thời gian:** 3 ngày  
> **Phụ thuộc:** Phase 2 (form responsive), Phase 3 (complex controls)  
> **Branch:** `responsive`  

---

## Mục tiêu

Implement hai pattern cốt lõi nhất của responsive UX: Modals chuyển thành bottom sheet trên mobile, và data tables chuyển thành card list. Hai pattern này sẽ được reuse ở hầu hết mọi page.

---

## Files in scope

| # | File | Thay đổi |
|---|------|----------|
| 1 | `src/components/custom/modal/index.tsx` | Bottom sheet pattern trên mobile |
| 2 | `src/components/tables/BasicTables/BasicTableOne.tsx` | Mobile card view + column hiding |
| 3 | `src/components/custom/dropdown/Dropdown.tsx` | Mobile max-height, positioning |
| 4 | `src/components/custom/badge/Badge.tsx` | Responsive padding, text truncation |

## Không làm

- Không touch page-specific table data/columns (EmployeesTable, RecentCandidateActivity — chỉ fix shared component)
- Không touch Kanban DnD
- Không touch recruitment chart components
- Không tạo generic `TableOrCards` wrapper — để page tự decide render mode

---

## Design Spec chi tiết

### 1. `Modal (index.tsx)` — Bottom Sheet trên Mobile

**Hiện tại:**
```
Modal luôn hiện center screen, fullscreen mode = w-full h-full
Close button: sm:right-6 sm:top-6 sm:h-11 sm:w-11
```

**Behavior thay đổi theo breakpoint:**

| Breakpoint | Behavior |
|------------|----------|
| Desktop (≥ 768px) | Giữ nguyên — center modal, backdrop blur |
| Mobile (< 768px) | Bottom sheet — slide up from bottom |

**Bottom Sheet Design:**
```
Container:
  - position: fixed inset-x-0 bottom-0
  - max-height: 90vh (hoặc 90dvh)
  - border-radius: rounded-t-2xl (chỉ top corners)
  - overflow-y: auto
  - animation: translateY(100%) → translateY(0) (slide up)
  - z-index: z-50

Drag handle:
  - w-10 h-1 rounded-full bg-gray-300 mx-auto mt-3 mb-2
  - Visual indicator "kéo xuống để đóng"

Backdrop:
  - Giữ nguyên bg-black/40 backdrop-blur
  - Click backdrop → close

Close button (mobile):
  - Ẩn close button X trên mobile (dùng drag down hoặc backdrop click)
  - Hoặc: hiện close button nhỏ hơn ở top-right

Content:
  - padding: px-4 pb-[calc(1rem+var(--safe-area-bottom))]
  - Thêm safe-area cho iPhone notch bar
```

**Implementation approach:**
```typescript
const Modal = ({ isOpen, onClose, children, className, showCloseButton, isFullscreen }) => {
  const isMobile = useMediaQuery('(max-width: 767px)');
  // Hoặc dùng isMobile từ SidebarContext (nếu đã export từ Phase 1)
  
  if (!isOpen) return null;
  
  if (isMobile && !isFullscreen) {
    return createPortal(
      <>
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm" onClick={onClose} />
        <div className="fixed inset-x-0 bottom-0 z-50 max-h-[90dvh] overflow-y-auto 
          rounded-t-2xl bg-white dark:bg-gray-900 shadow-2xl
          animate-slide-up">
          {/* Drag handle */}
          <div className="sticky top-0 z-10 flex justify-center bg-inherit pt-3 pb-2">
            <div className="h-1 w-10 rounded-full bg-gray-300 dark:bg-gray-600" />
          </div>
          <div className="px-4 pb-[calc(1rem+var(--safe-area-bottom))]">
            {children}
          </div>
        </div>
      </>,
      document.body
    );
  }
  
  // Desktop: giữ nguyên current modal implementation
  return (/* existing modal code */);
};
```

**Animation CSS (thêm vào index.css hoặc component):**
```css
@keyframes slide-up {
  from { transform: translateY(100%); }
  to { transform: translateY(0); }
}
.animate-slide-up {
  animation: slide-up 300ms ease-out;
}
```

### 2. `BasicTableOne.tsx` — Card View trên Mobile

**Hiện tại:**
```
max-w-full overflow-x-auto + min-w-full table
Cells: px-5 py-3 (header), px-4 py-3 (body)
Chỉ 1 cell có sm:px-6
```

**Approach: Component nhận `mobileCardRenderer` prop**

```typescript
interface BasicTableOneProps {
  // ... existing
  mobileCardRenderer?: (row: any, index: number) => React.ReactNode;
  mobileBreakpoint?: number; // default 768
}

const BasicTableOne = ({ ..., mobileCardRenderer, mobileBreakpoint = 768 }) => {
  const [isMobileView, setIsMobileView] = useState(false);
  
  useEffect(() => {
    const check = () => setIsMobileView(window.innerWidth < mobileBreakpoint);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, [mobileBreakpoint]);
  
  if (isMobileView && mobileCardRenderer) {
    return (
      <div className="space-y-3">
        {data.map((row, i) => mobileCardRenderer(row, i))}
      </div>
    );
  }
  
  // Desktop: existing table code
  // Thêm responsive padding:
  // Header cells: px-3 py-2.5 sm:px-5 sm:py-3
  // Body cells: px-3 py-2.5 sm:px-4 sm:py-3
  return (/* existing table with responsive padding */);
};
```

**Khi KHÔNG có `mobileCardRenderer`:** fallback = responsive table với padding thu nhỏ (vẫn horizontal scroll).

**Default mobile card template (utility export):**
```typescript
// Export helper cho pages muốn dùng default card layout:
export const defaultMobileCard = (row: TableRow) => (
  <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
    <div className="flex items-start gap-3">
      {row.avatar && (
        <img src={row.avatar} className="h-10 w-10 rounded-full" alt="" />
      )}
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium text-gray-900 dark:text-white">
          {row.primaryText}
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {row.secondaryText}
        </p>
      </div>
      {row.status && <Badge variant={row.statusVariant}>{row.status}</Badge>}
    </div>
    {row.metadata && (
      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
        {row.metadata.map((m, i) => <span key={i}>{m}</span>)}
      </div>
    )}
  </div>
);
```

### 3. `Dropdown.tsx` — Mobile Safe

**Hiện tại:**
```
absolute z-40 right-0 mt-2
Không max-height → có thể vượt viewport
```

**Thay đổi:**

```typescript
// Dropdown container:
className={`absolute z-40 mt-2 rounded-xl border ... shadow-lg
  max-h-[70vh] md:max-h-96 overflow-y-auto
  ${alignRight ? 'right-0' : 'left-0'}
  w-[calc(100vw-2rem)] max-w-xs md:w-auto md:max-w-none md:min-w-[200px]
`}
```

**Giải thích:**
| Property | Mobile | Desktop |
|----------|--------|---------|
| max-height | `70vh` (scroll nếu nhiều items) | `max-h-96` (384px) |
| width | `calc(100vw-2rem)` để fit viewport | `auto` / `min-w-[200px]` |
| max-width | `max-w-xs` (320px) | none |
| positioning | `right-0` OK vì parent có padding | `right-0` |

**DropdownItem padding:**
```
// Hiện tại: px-4 py-2
// Thay đổi: px-3 py-2.5 md:px-4 md:py-2
// Trên mobile: padding-y lớn hơn cho touch, padding-x nhỏ hơn tiết kiệm space
```

### 4. `Badge.tsx` — Responsive Padding & Truncation

**Hiện tại:**
```
inline-flex items-center px-2.5 py-0.5 gap-1 rounded-full
Size variants: sm (text-xs px-2), md (px-2.5 py-0.5)
```

**Thay đổi nhỏ:**
```typescript
// Thêm truncation cho text dài:
<span className="... max-w-[200px] truncate">
  {children}
</span>

// Size sm padding đủ cho mobile — giữ nguyên
// Thêm md:max-w-none cho desktop (không truncate)
className="... max-w-[150px] md:max-w-[200px] truncate"
```

**Không thay đổi lớn** — Badge đã compact, chỉ cần truncation cho edge case text dài.

---

## Patterns áp dụng

| Pattern | Spec Reference | Áp dụng |
|---------|---------------|---------|
| 3b Table→Card | KHÔNG horizontal scroll cho data tables trên mobile | BasicTableOne |
| 3c Modal→Sheet | Bottom sheet mobile, drag handle, max-height 90vh | Modal |
| 3g Spacing | Responsive padding cho dropdown items | Dropdown, DropdownItem |

---

## QA Checklist

### 375px (iPhone)
- [ ] Modal hiện dạng bottom sheet, slide up animation
- [ ] Modal bottom sheet có drag handle visible
- [ ] Modal backdrop click → close
- [ ] Modal content scroll nếu vượt 90vh
- [ ] Modal có safe-area-inset-bottom padding
- [ ] Table (khi có mobileCardRenderer): hiện card list, không horizontal scroll
- [ ] Table (khi KHÔNG có mobileCardRenderer): responsive padding, horizontal scroll
- [ ] Dropdown không vượt viewport, scroll nếu nhiều items
- [ ] Dropdown items tap target đủ lớn (py-2.5)
- [ ] Badge text truncate khi quá dài

### 768px (iPad)
- [ ] Modal hiện center (desktop mode), KHÔNG bottom sheet
- [ ] Table hiện table layout (desktop mode)
- [ ] Dropdown max-height = 384px
- [ ] Badge max-width wider

### 1440px (Desktop)
- [ ] **Không visual change** cho modal, table, dropdown, badge
- [ ] Animation, transitions giữ nguyên

### Cross-cutting
- [ ] Dark mode cho bottom sheet background, card border
- [ ] Focus trap trong modal (keyboard Tab cycle)
- [ ] ESC key close modal/dropdown hoạt động
- [ ] Bottom sheet không bị keyboard che trên mobile (nếu có form bên trong)
