# Phase 9: Remaining Pages & Polish

> **Thời gian:** 2 ngày  
> **Phụ thuộc:** Phase 1–8  
> **Branch:** `responsive`  

---

## Mục tiêu

Fix các trang P2 còn lại và polish UX: Profile, Settings, SuggestionCandidate, EmployeesTable (leverage Phase 4 card view), TalentSourceCard.

---

## Files in scope

| # | File | Thay đổi |
|---|------|----------|
| 1 | `src/pages/Profile/UserProfiles.tsx` | Responsive card stacking, padding |
| 2 | `src/pages/Profile/AccountSettings.tsx` | Modal responsive, form layout |
| 3 | `src/pages/SuggestionCandidate/SuggestionCandidate.tsx` | Fix `px-6` → responsive, horizontal list |
| 4 | `src/pages/Employees/EmployeesTable.tsx` | Provide mobileCardRenderer cho BasicTableOne |
| 5 | `src/components/recruitment/TalentSourceCard.tsx` | Responsive padding, font sizes |

## Không làm

- Không touch Auth pages (SignIn/SignUp — đã mobile-friendly)
- Không touch Landing page (đã có responsive tốt)
- Không touch NotFound (excellent responsive — reference)
- Không refactor components đã fix ở Phase 1–8
- Không thêm features mới

---

## Design Spec chi tiết

### 1. `UserProfiles.tsx` — Responsive Card Stack

**Hiện tại:**
```
Container: space-y-6
Cards: UserMetaCard, UserInfoCard, UserAddressCard stacked vertically
```

**Thay đổi (nhỏ):**
```typescript
<div className="space-y-4 md:space-y-6">
  <UserMetaCard />
  <UserInfoCard />
  <UserAddressCard />
</div>
```

**Child card components (UserMetaCard, UserInfoCard, UserAddressCard):**
- Cần verify padding. Nếu `p-6`:  
  → thay đổi: `p-4 md:p-6`
- Form fields bên trong: đã inherit Phase 2/3 responsive
- Avatar upload area: `h-24 w-24 md:h-28 md:w-28` (nếu applicable)
- Form grid: nếu 2 columns → `grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6`

### 2. `AccountSettings.tsx` — Modal & Form

**Hiện tại:**
- Change email/password modals
- `sm:flex-row` cho button groups (đã có)

**Thay đổi:**
```typescript
// Modals: inherit Phase 4 bottom sheet trên mobile — kiểm tra hoạt động đúng

// Form sections:
<div className="space-y-4 md:space-y-6">
  {/* Email section */}
  <div className="rounded-2xl border p-4 md:p-6 dark:border-gray-700">
    <h3 className="text-base font-semibold md:text-lg">Email</h3>
    {/* ... */}
  </div>
  
  {/* Password section */}
  <div className="rounded-2xl border p-4 md:p-6 dark:border-gray-700">
    <h3 className="text-base font-semibold md:text-lg">Mật khẩu</h3>
    {/* ... */}
  </div>
</div>

// Button group (đã có sm:flex-row — giữ nguyên):
className="flex flex-col gap-3 sm:flex-row"
```

### 3. `SuggestionCandidate.tsx` — Fix Padding & Horizontal List

**Vấn đề:**
```
Container: px-6 py-6 → quá lớn trên 375px (24px mỗi bên = 48px lost)
CandidateHorizontalList: min-w-[200px] × 3 cards = 600px → overflow trên mobile
```

**Container fix:**
```typescript
<div className="min-h-screen bg-background px-4 py-4 md:px-6 md:py-6">
```

**CandidateHorizontalList responsive:**
```typescript
// Hiện tại: PAGE_SIZE = 3, cards min-w-[200px]
// Thay đổi:
const isMobile = useMediaQuery('(max-width: 767px)');
const PAGE_SIZE = isMobile ? 1 : 3;  // Hiện 1 card trên mobile, 3 desktop

// Card width:
className={`flex flex-col justify-between rounded-xl p-3 
  ${isMobile ? 'w-full' : 'min-w-[200px] flex-1'}
  border border-gray-200 dark:border-gray-700
`}

// Navigation arrows:
// Giữ prev/next buttons, touch-target class
className="touch-target ..."
```

**Alternative (nếu hiện 1 card quá ít):**
```typescript
// Mobile: horizontal scroll container thay vì pagination
<div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar snap-x snap-mandatory">
  {candidates.map(c => (
    <div key={c.id} className="w-[280px] shrink-0 snap-start">
      <CandidateCard candidate={c} />
    </div>
  ))}
</div>
// CSS scroll snapping cho smooth mobile scroll
```

### 4. `EmployeesTable.tsx` — Mobile Card View

**Leverage Phase 4 BasicTableOne `mobileCardRenderer`:**

```typescript
const EmployeesTable = () => {
  return (
    <div className="space-y-4 md:space-y-6">
      <PageBreadcrumb ... />
      <BasicTableOne
        data={employees}
        columns={columns}
        mobileCardRenderer={(employee) => (
          <div className="rounded-xl border border-gray-200 bg-white p-3 
            dark:border-gray-700 dark:bg-gray-900">
            <div className="flex items-center gap-3">
              <img 
                src={employee.avatar} 
                className="h-10 w-10 rounded-full" 
                alt={employee.name} 
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-gray-900 dark:text-white">
                  {employee.name}
                </p>
                <p className="text-xs text-gray-500">{employee.role}</p>
              </div>
              <Badge size="sm">{employee.status}</Badge>
            </div>
            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
              <span>{employee.email}</span>
              <span>{employee.department}</span>
            </div>
          </div>
        )}
      />
    </div>
  );
};
```

### 5. `TalentSourceCard.tsx` — Responsive Padding & Fonts

**Hiện tại:**
```
Card: p-5 sm:p-6
Header: flex-col gap-4 sm:flex-row
Source items: space-y-5
Dynamic widths: w-[46%] w-[33%] w-[21%]
```

**Thay đổi (nhỏ):**
```typescript
// Card padding: đã OK (p-5 sm:p-6)
// Thêm:
className="rounded-2xl border bg-white p-4 md:p-5 lg:p-6 dark:..."

// Source metric labels:
className="text-xs md:text-sm"

// Source metric values:
className="text-sm font-semibold md:text-base"

// Progress bar height:
className="h-1.5 md:h-2 rounded-full overflow-hidden"

// Percentage badge:
className="rounded-full px-2 py-0.5 text-xs md:px-3 md:py-1"
```

---

## Patterns áp dụng

| Pattern | Spec Reference | Áp dụng |
|---------|---------------|---------|
| 3b Table→Card | BasicTableOne mobileCardRenderer | EmployeesTable |
| 3d Form | Profile forms responsive | UserProfiles, AccountSettings |
| 3g Spacing | Page padding, card padding | SuggestionCandidate, TalentSourceCard |

---

## QA Checklist

### 375px (iPhone)
- [ ] UserProfiles: cards full-width, form fields stacked, avatar responsive
- [ ] AccountSettings: modals → bottom sheet, button group stacked
- [ ] SuggestionCandidate: `px-4`, horizontal list 1 card hoặc scroll snap
- [ ] EmployeesTable: card view, avatar + name + role + status
- [ ] TalentSourceCard: readable metrics, progress bars visible

### 768px (iPad)
- [ ] UserProfiles: form fields có thể 2 columns
- [ ] SuggestionCandidate: 3 cards visible
- [ ] EmployeesTable: table view (desktop path)
- [ ] TalentSourceCard: padding = p-5

### 1440px (Desktop)
- [ ] **Không visual change** cho tất cả pages

### Cross-cutting
- [ ] Dark mode cho tất cả modified components
- [ ] Page transitions mượt (React Router)
- [ ] Loading states (skeleton) match responsive sizes
