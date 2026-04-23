# Phase 6: Kanban Board — Mobile Experience

> **Thời gian:** 3 ngày  
> **Phụ thuộc:** Phase 1 (layout), Phase 4 (modal/card patterns)  
> **Branch:** `responsive`  

---

## Mục tiêu

Kanban board — hiện tại desktop-only horizontal scroll — cần mobile experience riêng biệt. Mobile hiện 1 stage tại 1 thời điểm, chọn stage qua tabs/dropdown. Tablet vẫn giữ multi-column.

---

## Files in scope

| # | File | Thay đổi |
|---|------|----------|
| 1 | `src/pages/Kanban/KanbanBoard.tsx` | Mobile single-column với stage selector |
| 2 | `src/pages/Kanban/Column.tsx` | Responsive min-width, padding |
| 3 | `src/pages/Kanban/CandidateCard.tsx` | Responsive padding, gap, touch targets |
| 4 | `src/pages/Kanban/Candidates.tsx` | Heading responsive, back button touch target |

## Không làm

- Không refactor @dnd-kit library — giữ nguyên DnD core
- Không thay đổi API calls hoặc data mapping
- Không touch CandidateDetail.tsx (đã có responsive tốt: `sm:max-w-[90vw] lg:max-w-[70vw]`)
- Không touch ScheduleInterviewKanbanModal (sẽ inherit Phase 4 modal responsive)
- Không implement swipe between stages (nice-to-have, out of scope)

---

## Design Spec chi tiết

### 1. `KanbanBoard.tsx` — Mobile Single-Column View

**Hiện tại:**
```
Tất cả columns horizontal flex, overflow-x-auto
DnD context bao bọc toàn bộ
```

**Mobile (< 768px) — Single Column:**

```typescript
const KanbanBoard = ({ stages, candidates, ... }) => {
  const isMobile = useMediaQuery('(max-width: 767px)');
  const [activeStage, setActiveStage] = useState(stages[0]?.id);
  
  if (isMobile) {
    return (
      <div className="flex flex-col gap-3">
        {/* Stage Selector */}
        <div className="sticky top-0 z-10 -mx-4 bg-white/95 px-4 pb-3 pt-1 
          backdrop-blur dark:bg-gray-900/95">
          <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
            {stages.map(stage => (
              <button
                key={stage.id}
                onClick={() => setActiveStage(stage.id)}
                className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium 
                  transition-colors
                  ${activeStage === stage.id 
                    ? 'bg-brand-500 text-white' 
                    : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300'
                  }`}
              >
                {stage.name}
                <span className="ml-1.5 text-xs opacity-75">
                  {stage.candidates.length}
                </span>
              </button>
            ))}
          </div>
        </div>
        
        {/* Single Column Content */}
        <DndContext ...>
          <Column
            stage={stages.find(s => s.id === activeStage)}
            candidates={candidates.filter(c => c.stageId === activeStage)}
            isMobileView
          />
        </DndContext>
      </div>
    );
  }
  
  // Desktop/Tablet: giữ nguyên horizontal layout
  return (
    <DndContext ...>
      <div className="flex gap-3 overflow-x-auto md:gap-4 pb-4">
        {stages.map(stage => (
          <Column key={stage.id} stage={stage} ... />
        ))}
      </div>
    </DndContext>
  );
};
```

**Stage selector design:**
```
┌─────────────────────────────────────┐
│ [Mới] [Sàng lọc ✓] [PV] [Offer]   │  ← horizontal scroll tabs
├─────────────────────────────────────┤
│                                     │
│  CandidateCard 1                    │
│  CandidateCard 2                    │
│  CandidateCard 3                    │
│  ...                                │
│                                     │
└─────────────────────────────────────┘
```

**DnD trên mobile:**
- Giữ DnD context nhưng `sensors` config cần `activationConstraint` cho touch:
```typescript
const sensors = useSensors(
  useSensor(PointerSensor, {
    activationConstraint: {
      distance: 8,  // desktop: 8px drag threshold
    },
  }),
  useSensor(TouchSensor, {
    activationConstraint: {
      delay: 200,    // long-press 200ms trước khi drag
      tolerance: 5,  // cho phép 5px movement trong delay
    },
  })
);
```

**Alternative cho mobile DnD (nếu touch DnD gây UX kém):**
- Thêm "Move to..." dropdown trong CandidateCard trên mobile
- User chọn stage target thay vì drag

### 2. `Column.tsx` — Responsive Width & Padding

**Hiện tại:**
```
min-w-[280px] flex-1 flex-col rounded-3xl
Header: px-5 pb-4 pt-5
Content: px-3 pb-4 pt-2
```

**Thay đổi:**

**Width:**
```typescript
// Hiện tại: min-w-[280px]
// Thay đổi:
className={`
  ${isMobileView 
    ? 'w-full'  // mobile: full-width single column
    : 'min-w-[220px] md:min-w-[250px] lg:min-w-[280px] flex-1'
  } flex-col rounded-2xl md:rounded-3xl
`}
```

**Padding:**
```typescript
// Header:
className="flex items-center justify-between rounded-t-2xl md:rounded-t-3xl 
  px-3 pb-3 pt-3.5 md:px-5 md:pb-4 md:pt-5"

// Content:
className="custom-scrollbar relative space-y-2 md:space-y-3 
  rounded-b-2xl md:rounded-b-3xl px-2 pb-3 pt-1.5 md:px-3 md:pb-4 md:pt-2"
```

**Candidate count badge:**
```typescript
// Giữ nhỏ trên mobile, styling tương tự
```

### 3. `CandidateCard.tsx` — Responsive Padding & Touch

**Hiện tại:**
```
p-5 flex items-start gap-4
Avatar: h-16 w-16
```

**Thay đổi:**
```typescript
// Padding:
className="p-3 md:p-4 lg:p-5 flex items-start gap-3 md:gap-4"

// Avatar:
className="h-12 w-12 md:h-14 md:w-14 lg:h-16 lg:w-16 rounded-full shrink-0"

// Name text:
className="text-sm font-semibold md:text-base truncate"

// Secondary text:
className="text-xs text-gray-500 md:text-sm"
```

**Touch target cho card:**
```typescript
// Card toàn bộ là clickable (mở CandidateDetail)
// Đảm bảo min-height card ≥ 44px (đã đạt vì có avatar + text)
// Thêm active state cho touch feedback:
className="... active:bg-gray-50 dark:active:bg-gray-800/50 transition-colors"
```

**Mobile "Move to" action (nếu bỏ DnD trên mobile):**
```typescript
{isMobile && (
  <DropdownMenu>
    <DropdownMenuTrigger asChild>
      <button className="shrink-0 rounded-lg p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700">
        <MoreVertical className="h-4 w-4" />
      </button>
    </DropdownMenuTrigger>
    <DropdownMenuContent>
      {stages.filter(s => s.id !== currentStageId).map(stage => (
        <DropdownMenuItem key={stage.id} onClick={() => moveCandidate(stage.id)}>
          Chuyển sang: {stage.name}
        </DropdownMenuItem>
      ))}
    </DropdownMenuContent>
  </DropdownMenu>
)}
```

### 4. `Candidates.tsx` — Header Responsive

**Hiện tại:**
```
mb-6 flex items-center gap-3
Title: text-xl font-semibold — "Ứng viên — {jobTitle}"
```

**Thay đổi:**
```typescript
<div className="mb-4 flex items-center gap-2 md:mb-6 md:gap-3">
  <button className="touch-target shrink-0 ..." aria-label="Quay lại">
    <ArrowLeft className="h-5 w-5" />
  </button>
  <div className="min-w-0">
    <h1 className="truncate text-lg font-semibold md:text-xl">
      Ứng viên
    </h1>
    <p className="truncate text-sm text-gray-500">
      {jobTitle}
    </p>
  </div>
</div>
```

**Split title**: "Ứng viên" (heading) + job title (subtitle, truncate) — tránh overflow dài trên 375px.

---

## Patterns áp dụng

| Pattern | Spec Reference | Áp dụng |
|---------|---------------|---------|
| Custom | Mobile single-column Kanban với stage tabs | KanbanBoard |
| 3e Touch | Card tap targets, long-press DnD, back button 44px | CandidateCard, Candidates |
| 3g Spacing | Card padding responsive, column padding, header spacing | Column, CandidateCard, Candidates |

---

## QA Checklist

### 375px (iPhone)
- [ ] Stage tabs hiện horizontal scroll, active stage highlighted
- [ ] Chỉ 1 column visible tại 1 thời điểm
- [ ] Switch stage → smooth transition, cards update
- [ ] CandidateCard: padding balanced, avatar + text fit
- [ ] Card tap → open CandidateDetail sheet
- [ ] Back button có touch target 44px
- [ ] Title + job title không overflow (truncate)
- [ ] DnD: long-press 200ms rồi drag HOẶC "Move to" dropdown HOẶC cả hai

### 768px (iPad)
- [ ] 2–3 columns visible, horizontal scroll nếu nhiều stages
- [ ] Column min-width = 250px
- [ ] DnD drag hoạt động bình thường (pointer sensor)
- [ ] Stage tabs KHÔNG hiện (chỉ mobile feature)

### 1024px+ (Desktop)
- [ ] **Giữ nguyên** — horizontal columns, min-w-[280px]
- [ ] DnD hoạt động như cũ
- [ ] Không visual regression

### Cross-cutting
- [ ] Dark mode cho stage tabs, card active state
- [ ] DnD overlay (DragOverlay) render đúng trên mobile
- [ ] CandidateDetail sheet mở đúng khi tap card (không conflict DnD)
- [ ] Scroll trong column content mượt trên mobile (touch scroll)
