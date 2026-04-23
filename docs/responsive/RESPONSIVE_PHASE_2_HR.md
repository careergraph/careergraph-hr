# Phase 2: Form System — Inputs, Selects, Touch Targets

> **Thời gian:** 2 ngày  
> **Phụ thuộc:** Phase 1 (responsive tokens từ index.css)  
> **Branch:** `responsive`  

---

## Mục tiêu

Tất cả form controls cơ bản đạt mobile-ready: min-height 44px touch target, font-size ≥ 16px trên mobile (tránh iOS auto-zoom), responsive padding/height. Đây là foundation cho mọi form trên app.

---

## Files in scope

| # | File | Thay đổi |
|---|------|----------|
| 1 | `src/components/form/input/InputField.tsx` | Responsive height, padding, font-size |
| 2 | `src/components/form/Select.tsx` | Responsive height, padding |
| 3 | `src/components/form/group-input/PhoneInput.tsx` | Fix `pl-[84px]` hardcoded → responsive |
| 4 | `src/components/form/input/Checkbox.tsx` | Touch target ≥ 44px |
| 5 | `src/components/form/switch/Switch.tsx` | Touch target ≥ 44px |

## Không làm

- Không đổi form layout (grid 2-col → 1-col thuộc page-level, không phải component)
- Không đổi validation logic / error states
- Không touch MultiSelect, DatePicker, TextArea (Phase 3)
- Không thêm responsive labels (Phase 3)
- Không thay đổi component API (props interface giữ nguyên)

---

## Design Spec chi tiết

### 1. `InputField.tsx` — Responsive Input

**Hiện tại:**
```
h-11 w-full rounded-lg border appearance-none px-4 py-2.5 text-sm
```

**Thay đổi:**
```
h-11 md:h-11 w-full rounded-lg border appearance-none 
px-3 py-2 md:px-4 md:py-2.5 
text-base md:text-sm 
```

**Giải thích:**
| Property | Mobile (< 768px) | Desktop (≥ 768px) | Lý do |
|----------|------------------|-------------------|------|
| height | `h-11` (44px) | `h-11` (44px) | Đã đạt 44px touch target |
| padding-x | `px-3` (12px) | `px-4` (16px) | Tiết kiệm space trên mobile |
| padding-y | `py-2` (8px) | `py-2.5` (10px) | Compact hơn trên mobile |
| font-size | `text-base` (16px) | `text-sm` (14px) | **QUAN TRỌNG:** 16px tránh iOS auto-zoom |

**endAdornment spacing:**
```
// Hiện tại: pr-12
// Thay đổi: pr-10 md:pr-12  — thu nhỏ trên mobile
```

**Hint text:**
```
// Hiện tại: mt-1.5 text-xs
// Giữ nguyên — text-xs (12px) đủ cho hint
```

### 2. `Select.tsx` — Responsive Select

**Hiện tại:**
```
h-11 w-full appearance-none rounded-lg border ... px-4 py-2.5 pr-11 text-sm
```

**Thay đổi:**
```
h-11 w-full appearance-none rounded-lg border ... 
px-3 py-2 pr-10 md:px-4 md:py-2.5 md:pr-11 
text-base md:text-sm
```

**Tương tự InputField:** font-size 16px trên mobile, padding thu nhỏ.

### 3. `PhoneInput.tsx` — Fix Hardcoded Padding

**Vấn đề hiện tại:**
```typescript
// Input có pl-[84px] hoặc pr-[84px] hardcoded
// Country select dropdown absolute positioned, fixed width
// Trên mobile 375px, 84px chiếm ~22% viewport width → quá lớn
```

**Giải pháp:**

**Country select wrapper:**
```typescript
// Hiện tại: absolute, không width constraint
// Thay đổi:
<div className="absolute left-0 top-0 bottom-0 flex items-center">
  <select
    className="... w-[70px] md:w-[80px] pl-3 pr-6 md:pl-3.5 md:pr-8 text-base md:text-sm"
  />
</div>
```

**Input padding:**
```typescript
// Hiện tại: pl-[84px] / pr-[84px]
// Thay đổi:
selectPosition === "start" ? "pl-[74px] md:pl-[84px]" : "pr-[74px] md:pr-[84px]"
```

**Input styling thêm:**
```
text-base md:text-sm   // 16px mobile (iOS zoom prevention)
h-11                    // giữ 44px
```

### 4. `Checkbox.tsx` — Touch Target ≥ 44px

**Vấn đề hiện tại:**
```
Checkbox visual: w-5 h-5 (20px × 20px)
Touch target thực tế: 20px × 20px — quá nhỏ cho mobile
```

**Giải pháp — Extend tap area mà KHÔNG thay đổi visual:**

```typescript
// Wrapper label — thêm min-height và padding cho touch area
<label
  className={`flex items-center gap-3 group cursor-pointer
    min-h-11 py-2 -my-2  // extend vertical touch area to 44px
    ${disabled ? "cursor-not-allowed opacity-60" : ""}
  `}
>
  {/* Checkbox visual giữ nguyên w-5 h-5 */}
  <div className="relative w-5 h-5 shrink-0">
    <input ... className="w-5 h-5 ..." />
    {/* SVG checkmark giữ nguyên */}
  </div>
  {label && (
    <span className="text-sm font-medium ...">
      {label}
    </span>
  )}
</label>
```

**Giải thích:**
- Visual checkbox vẫn 20×20px (giữ design)
- Label wrapper có `min-h-11` (44px) + `py-2 -my-2` (mở rộng tap area mà không ảnh hưởng layout)
- Thay `space-x-3` thành `gap-3` (modern hơn, consistent)

### 5. `Switch.tsx` — Touch Target ≥ 44px

**Vấn đề hiện tại:**
```
Switch track: h-6 w-11 (24×44px)
Switch knob: h-5 w-5 (20×20px)
Touch target vertical chỉ 24px — dưới 44px minimum
```

**Giải pháp — Extend vertical tap area:**

```typescript
<label
  className={`flex cursor-pointer select-none items-center gap-3 
    min-h-11 py-2 -my-2  // extend touch area vertically
    text-sm font-medium ...
  `}
  onClick={handleToggle}
>
  <div className="relative shrink-0">
    {/* Track giữ nguyên h-6 w-11 */}
    <div className={`block ... h-6 w-11 rounded-full ...`} />
    {/* Knob giữ nguyên h-5 w-5 */}
    <div className={`absolute left-0.5 top-0.5 h-5 w-5 ...`} />
  </div>
  {label}
</label>
```

**Tương tự Checkbox:** giữ visual, mở rộng tap area qua label wrapper.

---

## Patterns áp dụng

| Pattern | Spec Reference | Áp dụng |
|---------|---------------|---------|
| 3d Form | `font-size: 16px` trên mobile tránh iOS auto-zoom | InputField, Select, PhoneInput |
| 3d Form | `min-height: 44px` cho inputs | Tất cả 5 components |
| 3e Touch | Interactive elements ≥ 44×44px | Checkbox, Switch (extend via label) |
| 3g Spacing | Padding giảm trên mobile | InputField, Select, PhoneInput |

---

## QA Checklist

### 375px (iPhone)
- [ ] InputField: height 44px, text 16px, không trigger iOS zoom khi focus
- [ ] Select: height 44px, text 16px, dropdown hiển thị đúng (native select)
- [ ] PhoneInput: country code + input fit trong viewport, không overflow
- [ ] Checkbox: tap area ≥ 44px vertical — tap vùng xung quanh checkbox cũng toggle
- [ ] Switch: tap area ≥ 44px vertical — tap dễ dàng bằng ngón tay
- [ ] Tất cả inputs focus state hiển thị rõ (ring + border)

### 768px (iPad)
- [ ] Inputs chuyển sang desktop styling (text-sm, px-4)
- [ ] PhoneInput padding đúng 84px
- [ ] Layout không bị break

### 1440px (Desktop)
- [ ] **KHÔNG thay đổi gì visible** — padding, height, font-size giữ nguyên
- [ ] Checkbox/Switch visual giữ nguyên size
- [ ] Focus states giữ nguyên

### Cross-cutting
- [ ] Dark mode hoạt động cho tất cả states (normal, focus, error, success, disabled)
- [ ] Error/success states hiển thị đúng trên cả mobile và desktop
- [ ] Placeholder text readable trên cả breakpoints
