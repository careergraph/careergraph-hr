# Phase 1: Foundation — Navigation, Layout Shell, Responsive Tokens

> **Thời gian:** 3 ngày  
> **Phụ thuộc:** Không  
> **Branch:** `responsive`  

---

## Mục tiêu

Thiết lập nền tảng responsive cho toàn bộ app: sidebar collapse trên tablet, bottom navigation trên mobile, responsive tokens trong CSS, và layout shell hoạt động mượt ở mọi breakpoint.

---

## Files in scope

| # | File | Thay đổi |
|---|------|----------|
| 1 | `src/index.css` | Thêm global responsive utilities |
| 2 | `src/context/SidebarContext.tsx` | Thêm `isTablet` detection, refactor breakpoints |
| 3 | `src/layout/AppSidebar.tsx` | Tablet collapsed mode (64px icon-only) |
| 4 | `src/layout/AppLayout.tsx` | Responsive margins cho 3 sidebar states |
| 5 | `src/layout/AppHeader.tsx` | Mobile search, responsive greeting |
| 6 | *(mới)* `src/components/layout/BottomNav.tsx` | Bottom navigation bar cho mobile |

## Không làm

- Không touch bất kỳ page-level code nào (Dashboard, Kanban, etc.)
- Không thay đổi routing hoặc navigation paths
- Không refactor component API (Button, Modal, Form...)
- Không đổi sidebar nav items — chỉ thay đổi cách hiển thị

---

## Design Spec chi tiết

### 1. `src/index.css` — Responsive Tokens

Thêm vào cuối file (sau `@theme` block):

```css
/* ── Responsive Typography ── */
@layer base {
  h1 { font-size: clamp(1.25rem, 4vw, 1.875rem); }   /* 20px → 30px */
  h2 { font-size: clamp(1.125rem, 3vw, 1.5rem); }     /* 18px → 24px */
  h3 { font-size: clamp(1rem, 2.5vw, 1.25rem); }       /* 16px → 20px */
}

/* ── Touch Target Minimum ── */
@layer utilities {
  .touch-target {
    min-height: 44px;
    min-width: 44px;
  }
}

/* ── Safe Area for Bottom Nav ── */
@layer base {
  :root {
    --safe-area-bottom: env(safe-area-inset-bottom, 0px);
    --bottom-nav-height: calc(3.5rem + var(--safe-area-bottom));
  }
}
```

### 2. `src/context/SidebarContext.tsx` — Thêm tablet detection

**Hiện tại:**
```typescript
const mobile = window.innerWidth < 768;
```

**Cần thêm:**
```typescript
type SidebarContextType = {
  // ... existing
  isMobile: boolean;     // < 768px
  isTablet: boolean;     // 768–1023px
  isDesktop: boolean;    // ≥ 1024px
};

// Trong useEffect handleResize:
const handleResize = () => {
  const w = window.innerWidth;
  const mobile = w < 768;
  const tablet = w >= 768 && w < 1024;
  
  setIsMobile(mobile);
  setIsTablet(tablet);
  
  if (!mobile) setIsMobileOpen(false);
  // Tablet: auto-collapse sidebar
  if (tablet) setIsExpanded(false);
};
```

**Export thêm:** `isMobile`, `isTablet`, `isDesktop` (computed: `!isMobile && !isTablet`)

### 3. `src/layout/AppSidebar.tsx` — Tablet Collapsed Mode

**Desktop (≥ 1024px):** Giữ nguyên — sidebar 290px expanded / 100px collapsed với hover

**Tablet (768–1023px):** Sidebar luôn collapsed 64px, chỉ icon, hover tooltip hiện label
```
Sidebar width: w-16 (64px)
Items: chỉ hiện icon, center-aligned
Hover: tooltip bên phải hiện label (dùng title attr hoặc custom tooltip)
Logo: chỉ hiện icon logo, ẩn text "CareerGraph"
Section headers ("Menu"): ẩn, thay bằng horizontal divider
```

**Mobile (< 768px):** Sidebar ẩn hoàn toàn, chỉ hiện qua drawer (giữ nguyên behavior hiện tại)

**Code thay đổi chính trong `<aside>`:**
```typescript
// Width logic:
const sidebarWidth = useMemo(() => {
  if (isMobile) return 'w-[290px]';           // drawer full-width
  if (isTablet) return 'w-16';                 // 64px icon-only
  return isExpanded || isHovered ? 'w-[290px]' : 'w-[100px]'; // desktop toggle
}, [isMobile, isTablet, isExpanded, isHovered]);

// Visibility:
// Mobile: translate-x controlled by isMobileOpen (giữ nguyên)
// Tablet: always visible, no translate
// Desktop: always visible (giữ nguyên)
```

**Nav item rendering cho tablet:**
```typescript
// Khi isTablet && !isHovered:
// - Chỉ render icon, center aligned
// - Thêm title={nav.name} cho native tooltip
// - ẩn <span className="menu-item-text">
// - ẩn submenu arrows
// - ẩn badge text (chỉ hiện dot indicator)
```

### 4. `src/layout/AppLayout.tsx` — Responsive Margins

**Hiện tại:**
```typescript
className={`flex-1 min-w-0 transition-all duration-300 ease-in-out ${
  isExpanded || isHovered ? "lg:ml-[290px]" : "lg:ml-[110px]"
} ${isMobileOpen ? "ml-0" : ""}`}
```

**Cần thay đổi:**
```typescript
const mainMargin = useMemo(() => {
  if (isMobile) return '';                                    // no margin, full width
  if (isTablet) return 'ml-16';                               // 64px sidebar
  return isExpanded || isHovered ? 'lg:ml-[290px]' : 'lg:ml-[110px]'; // desktop
}, [isMobile, isTablet, isExpanded, isHovered]);
```

**Content padding thêm bottom cho mobile (bottom nav):**
```typescript
// Wrapper div cho <Outlet>:
className={`... ${isMobile ? 'pb-[var(--bottom-nav-height)]' : ''}`}
```

### 5. `src/layout/AppHeader.tsx` — Mobile Search & Responsive

**Search bar hiện tại:** `hidden md:flex` → ẩn hoàn toàn trên mobile

**Cần thêm mobile search trigger:**
```typescript
// Trên mobile: hiện search icon button bên cạnh hamburger
// Click → expand search bar full-width (overlay dưới header)
// Hoặc: navigate to /search page

// Trong flex items-center gap bên trái:
{isMobile && (
  <button
    type="button"
    className="flex h-10 w-10 items-center justify-center rounded-lg ..."
    aria-label="Tìm kiếm"
    onClick={() => setSearchOpen(true)}
  >
    <SearchIcon className="h-5 w-5" />
  </button>
)}

// Expanded search (overlay):
{searchOpen && isMobile && (
  <div className="absolute inset-x-0 top-0 z-50 bg-white px-3 py-2 dark:bg-gray-900">
    <form className="flex items-center gap-2">
      <input ... autoFocus className="h-11 flex-1 ..." />
      <button onClick={() => setSearchOpen(false)}>✕</button>
    </form>
  </div>
)}
```

**Greeting responsive:**
```typescript
// Hiện tại: luôn hiện greeting + company name + location
// Mobile: chỉ hiện company name (1 dòng), ẩn greeting và location
// Tablet: hiện greeting + company name, ẩn location
```

### 6. *(mới)* `src/components/layout/BottomNav.tsx` — Mobile Bottom Navigation

**Chỉ hiện khi `isMobile === true`** (< 768px)

**Max 5 items:**
```typescript
const BOTTOM_NAV_ITEMS = [
  { icon: GridIcon,    label: 'Dashboard',  path: '/dashboard' },
  { icon: TableIcon,   label: 'Jobs',       path: '/jobs' },
  { icon: ChatIcon,    label: 'Tin nhắn',   path: '/messages', badge: totalUnread },
  { icon: VideoIcon,   label: 'Phỏng vấn',  path: '/interviews' },
  { icon: MenuIcon,    label: 'Thêm',       action: toggleMobileSidebar }, // mở drawer
];
```

**Layout:**
```
Position: fixed bottom-0 left-0 right-0
Height: 56px + safe-area-inset-bottom
Z-index: z-50 (trên content, dưới modals)
Background: bg-white/95 backdrop-blur border-t dark:bg-gray-900/95
```

**Item style:**
```
Flex: flex-1, flex-col, items-center, justify-center
Icon: h-5 w-5
Label: text-[10px] mt-0.5
Active: text-brand-500, indicator dot
Inactive: text-gray-500
Badge: absolute -top-1 -right-1, min-w-4 h-4 text-[10px] bg-red-500 text-white rounded-full
```

**Render trong AppLayout.tsx:**
```typescript
{isMobile && <BottomNav />}
```

---

## Patterns áp dụng

| Pattern | Reference | Áp dụng |
|---------|-----------|---------|
| 3a Navigation | Desktop sidebar → Tablet collapsed → Mobile bottom nav + drawer | AppSidebar, BottomNav, AppLayout |
| 3e Touch | Min 44×44px interactive elements | BottomNav items, header buttons |
| 3f Typography | `clamp()` headings | index.css base styles |
| 3g Spacing | Page container padding responsive | AppLayout content wrapper |

---

## QA Checklist

### 375px (iPhone SE / iPhone 13 mini)
- [ ] Bottom nav hiển thị 5 items, không bị cắt
- [ ] Hamburger menu mở sidebar drawer overlay
- [ ] Sidebar drawer có backdrop, swipe-to-close hoặc click backdrop đóng
- [ ] Search icon hiện, expand search bar hoạt động
- [ ] Header không overflow — company name truncate nếu dài
- [ ] Content có `pb` đủ cho bottom nav không che

### 768px (iPad mini / vertical)
- [ ] Sidebar collapsed 64px, chỉ icon
- [ ] Hover icon hiện tooltip label
- [ ] Bottom nav KHÔNG hiện
- [ ] Search bar hiện full (giữ nguyên `md:flex`)
- [ ] Main content margin-left = 64px

### 1024px (iPad Pro / laptop)
- [ ] Sidebar behavior giữ nguyên (expanded/collapsed toggle)
- [ ] Không regression — layout giống hiện tại
- [ ] Hover expand hoạt động

### 1440px (standard desktop)
- [ ] Hoàn toàn giữ nguyên, không thay đổi gì

### Cross-cutting
- [ ] Dark mode hoạt động ở cả 3 breakpoints
- [ ] Transition mượt khi resize window qua breakpoints
- [ ] Z-index: bottom nav (50) < sidebar drawer (50) < backdrop (40) — kiểm tra stacking
- [ ] `safe-area-inset-bottom` hoạt động trên iOS Safari
