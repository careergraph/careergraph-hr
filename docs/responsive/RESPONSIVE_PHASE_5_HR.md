# Phase 5: Dashboard & Recruitment Charts

> **Thời gian:** 3 ngày  
> **Phụ thuộc:** Phase 1 (layout tokens), Phase 4 (modal/table patterns)  
> **Branch:** `responsive`  

---

## Mục tiêu

Dashboard Home — trang đầu tiên HR thấy — hiển thị hoàn hảo trên mobile. KPI cards, charts, date picker đều usable trên 375px.

---

## Files in scope

| # | File | Thay đổi |
|---|------|----------|
| 1 | `src/pages/Dashboard/Home.tsx` | Responsive grid, date picker UX, spacing |
| 2 | `src/components/recruitment/RecruitmentKpiCards.tsx` | Thêm `md:` breakpoint, responsive text |
| 3 | `src/components/recruitment/FunnelConversionChart.tsx` | Fix `min-w-250` → proper unit, responsive wrapper |
| 4 | `src/components/recruitment/PipelineVelocityChart.tsx` | Fix `min-w-162.5`, responsive title |
| 5 | `src/components/recruitment/HiringTargetProgress.tsx` | Responsive padding, chart height |

## Không làm

- Không touch TalentSourceCard, RecentCandidateActivity (Phase 9)
- Không touch Kanban page
- Không thay đổi chart library (ApexCharts/Recharts)
- Không thay đổi API calls hoặc data fetching logic
- Không thay đổi date filtering logic (chỉ UI)

---

## Design Spec chi tiết

### 1. `Home.tsx` — Dashboard Page Responsive

**Layout hiện tại (dự kiến):**
```
[Date Range Picker]
[KPI Cards Row]
[Chart Row: 2–3 charts side by side]
```

**Mobile layout (< 768px):**
```
[Date Range: stacked, full-width inputs]
[KPI Cards: 1 column]
[Charts: single column, full-width, scroll horizontal if needed]
```

**Date range picker responsive:**
```typescript
// Hiện tại: 2 date inputs inline
// Mobile: stack vertically
<div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:gap-4">
  <div className="w-full sm:w-auto">
    <Label>Từ ngày</Label>
    <Input type="date" className="w-full" />
  </div>
  <div className="w-full sm:w-auto">
    <Label>Đến ngày</Label>
    <Input type="date" className="w-full" />
  </div>
  <div className="flex gap-2">
    {/* Action buttons */}
  </div>
</div>
```

**Chart grid responsive:**
```typescript
// Hiện tại: charts side by side (implied flex/grid)
// Thay đổi:
<div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-6">
  <FunnelConversionChart />
  <PipelineVelocityChart />
</div>
<div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-6">
  <HiringTargetProgress />
  {/* Thêm chart nếu có */}
</div>
```

**Page spacing:**
```typescript
// Wrapper: space-y-4 md:space-y-6
// Sections: gap-4 md:gap-6
```

### 2. `RecruitmentKpiCards.tsx` — Grid Breakpoints

**Hiện tại:**
```
grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 xl:gap-5
```

**Thay đổi:**
```
grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 md:gap-4 xl:gap-5
```

**Thêm `md:grid-cols-3`** — trên tablet (768px) hiện 3 cột thay vì chờ tới xl (1280px).

**Card nội dung responsive:**
```typescript
// Padding:
className="rounded-2xl border bg-white p-4 md:p-5 dark:..."

// Text sizing:
// Value (metric number): text-xl md:text-2xl
// Label: text-xs md:text-sm
// Icon container: h-10 w-10 md:h-12 md:w-12
```

### 3. `FunnelConversionChart.tsx` — Fix Hardcoded Width

**Vấn đề:**
```
min-w-250 → non-standard (pixel value raw, not Tailwind)
-ml-5 overflow-x-auto xl:ml-0
```

**Thay đổi:**

**Chart wrapper:**
```typescript
// Hiện tại: min-w-250 (bad)
// Thay đổi:
<div className="custom-scrollbar -ml-3 overflow-x-auto md:-ml-5 xl:ml-0">
  <div className="min-w-[400px] md:min-w-[500px] xl:min-w-full">
    <ReactApexChart ... />
  </div>
</div>
```

**Scroll indicator (optional UX):**
```typescript
// Trên mobile, thêm subtle gradient overlay bên phải khi chart scrollable:
{isMobile && (
  <div className="pointer-events-none absolute right-0 top-0 h-full w-8 
    bg-gradient-to-l from-white dark:from-gray-900" />
)}
```

**Card padding responsive:**
```typescript
// Hiện tại: px-5 pb-6 pt-5 ... sm:px-6 sm:pt-6
// Thay đổi: px-4 pb-5 pt-4 md:px-5 md:pb-6 md:pt-5 lg:px-6 lg:pt-6
```

**Title responsive:**
```typescript
// Hiện tại: text-lg
// Thay đổi: text-base md:text-lg
```

### 4. `PipelineVelocityChart.tsx` — Fix Non-standard Width

**Vấn đề:**
```
min-w-162.5 → non-standard unit
```

**Thay đổi tương tự FunnelConversionChart:**
```typescript
<div className="custom-scrollbar -ml-3 mt-4 overflow-x-auto md:-ml-5 xl:ml-0">
  <div className="min-w-[350px] md:min-w-[450px] xl:min-w-full pl-1 md:pl-2">
    <ReactApexChart ... />
  </div>
</div>
```

**Card padding + title:** Tương tự FunnelConversionChart.

**Dropdown (chart type selector):**
```typescript
// Hiện tại: self-end sm:self-auto
// Giữ nguyên — đã OK
```

### 5. `HiringTargetProgress.tsx` — Responsive Padding & Chart

**Vấn đề:**
```
pb-10 fixed → quá nhiều padding trên mobile
Chart height: 330 hardcoded trong ApexOptions
```

**Thay đổi:**

**Padding:**
```typescript
// Hiện tại: px-5 pb-10 pt-5 ... sm:px-6 sm:pt-6
// Thay đổi: px-4 pb-5 pt-4 md:px-5 md:pb-10 md:pt-5 lg:px-6 lg:pt-6
```

**Chart height responsive:**
```typescript
const chartHeight = useMemo(() => {
  if (typeof window !== 'undefined' && window.innerWidth < 768) return 260;
  return 330;
}, []);

// Trong ApexOptions:
chart: {
  height: chartHeight,
  // ...
}
```

**Title:**
```typescript
// text-base md:text-lg
```

---

## Patterns áp dụng

| Pattern | Spec Reference | Áp dụng |
|---------|---------------|---------|
| 3d Form | Date inputs touch-friendly, 16px font | Home.tsx date picker |
| 3f Typography | Responsive chart titles | All chart components |
| 3g Spacing | Dashboard grid padding, KPI card padding | Home.tsx, KpiCards |

---

## QA Checklist

### 375px (iPhone)
- [ ] KPI cards: 1 column, full width, readable values
- [ ] Date range: stacked vertically, inputs usable
- [ ] FunnelChart: horizontal scroll indicator, chart readable
- [ ] PipelineChart: horizontal scroll, title readable
- [ ] HiringTarget: radial chart fits, padding balanced
- [ ] Tổng page: single column flow, no horizontal page scroll
- [ ] Space between sections balanced (không quá cramped)

### 768px (iPad)
- [ ] KPI cards: 3 columns
- [ ] Date range: inline (row)
- [ ] Charts: 1 column (lg:grid-cols-2 ở 1024px+)
- [ ] Chart padding transitions smooth

### 1024px (Desktop)
- [ ] Charts: 2 columns side by side
- [ ] KPI cards: 3 columns
- [ ] Layout giống hiện tại

### 1440px (Desktop wide)
- [ ] **Không visual change** — giữ nguyên

### Cross-cutting
- [ ] Dark mode cho tất cả charts background, borders
- [ ] Chart tooltips hiển thị đúng trên mobile (touch hover)
- [ ] ApexCharts / Recharts không bị clip khi resize
- [ ] Loading skeletons match responsive sizes
