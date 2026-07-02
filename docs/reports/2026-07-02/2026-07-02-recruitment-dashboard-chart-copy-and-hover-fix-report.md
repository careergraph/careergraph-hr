# Recruitment Dashboard Chart Copy And Hover Fix Report

## Scope

- Refine chart titles and descriptions for a more enterprise-ready HR dashboard tone.
- Replace ambiguous wording such as `chuyển bước` with more explicit pipeline language.
- Remove unstable hover tooltip behavior from the recruitment charts without changing data behavior or chart layout.

## Frontend changes

- Updated [`FunnelConversionChart.tsx`](/home/theron/Desktop/careergraph/careergraph-hr/src/components/recruitment/FunnelConversionChart.tsx):
  - Title changed from `Phễu chuyển đổi tuyển dụng` to `Hiệu quả chuyển đổi tuyển dụng`
  - Description rewritten to sound more operational and less marketing-oriented
  - Disabled chart tooltip rendering entirely after hover behavior proved inconsistent in production-like usage
  - Scroll wrapper now keeps a stable gutter and hides vertical overflow to avoid scrollbar flashing on hover

- Updated [`PipelineVelocityChart.tsx`](/home/theron/Desktop/careergraph/careergraph-hr/src/components/recruitment/PipelineVelocityChart.tsx):
  - Title changed from `Tốc độ quy trình tuyển dụng theo tháng` to `Tiến độ luân chuyển hồ sơ theo tháng`
  - Description changed to `Số lượng hồ sơ được cập nhật sang giai đoạn kế tiếp trong từng tháng`
  - Series label changed from `Ứng viên chuyển bước` to `Ứng viên chuyển giai đoạn`
  - Disabled chart tooltip rendering entirely after hover behavior proved inconsistent in production-like usage
  - Scroll wrapper now keeps a stable gutter and hides vertical overflow to avoid scrollbar flashing on hover

## Verification

- Passed: `npm run build`

## UX review

- The new labels are clearer for enterprise customers because they describe operational movement in the hiring pipeline rather than consumer-style marketing concepts.
- The revised series label is more precise and easier to understand in exports, screenshots, and stakeholder reviews.
- Removing tooltips is the lowest-risk production choice here because it eliminates flicker and inconsistent hover persistence without touching metrics or aggregation logic.
- The charts remain readable through titles, axis labels, legends, and exported reports, which is acceptable for this dashboard use case.
