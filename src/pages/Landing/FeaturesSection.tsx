import { ReactNode } from "react";
import clsx from "clsx";
import { ScrollReveal } from "./ScrollReveal";

// FeaturesSection trình bày các nhóm tính năng kèm lợi ích nổi bật.

type Feature = {
  icon: ReactNode;
  title: string;
  description: string;
  benefits: string[];
};

type FeaturesSectionProps = {
  features: Feature[];
};

export function FeaturesSection({ features }: FeaturesSectionProps) {
  return (
    <section id="features" className="space-y-12">
      {/* Tiêu đề và mô tả chung cho phần tính năng. */}
      <ScrollReveal direction="up" className="text-center space-y-4">
        <span className="inline-flex items-center justify-center rounded-full bg-primary/10 px-4 py-1 text-xs font-semibold uppercase tracking-wide text-primary">
          Tối ưu quy trình
        </span>
        <h2 className="text-3xl font-semibold text-slate-900">
          Bộ công cụ giúp HR dẫn đầu tốc độ và trải nghiệm
        </h2>
        <p className="text-base leading-relaxed text-slate-600">
          CareerGraph được thiết kế cho các đội ngũ tuyển dụng đang phát triển
          nhanh, cần quản trị pipeline linh hoạt và chăm sóc ứng viên chuyên
          nghiệp.
        </p>
      </ScrollReveal>
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {features.map((feature, index) => {
          // Mỗi thẻ tính năng hiển thị icon, mô tả và danh sách lợi ích.
          return (
            <ScrollReveal
              key={feature.title}
              direction={index % 2 === 0 ? "left" : "right"}
              className={clsx(
                "relative flex h-full flex-col gap-5 overflow-hidden rounded-3xl border border-slate-200/70 bg-white p-6 shadow-sm"
              )}
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10">
                {feature.icon}
              </div>
              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-slate-900">
                  {feature.title}
                </h3>
                <p className="text-sm leading-relaxed text-slate-600">
                  {feature.description}
                </p>
              </div>
              <ul className="mt-auto space-y-2 text-sm text-slate-500">
                {feature.benefits.map((benefit) => (
                  <li key={benefit} className="flex items-start gap-2">
                    <span
                      className="mt-1 inline-block size-1.5 rounded-full bg-primary/70"
                      aria-hidden
                    />
                    <span>{benefit}</span>
                  </li>
                ))}
              </ul>
              <div
                className={clsx(
                  "pointer-events-none absolute inset-0 -z-10 rounded-3xl opacity-70",
                  "bg-gradient-to-br",
                  [
                    "from-primary/15 via-white to-transparent",
                    "from-emerald-100/40 via-white to-transparent",
                    "from-amber-100/40 via-white to-transparent",
                  ][index % 3]
                )}
                aria-hidden
              />
            </ScrollReveal>
          );
        })}
      </div>
    </section>
  );
}
