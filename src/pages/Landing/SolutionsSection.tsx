import clsx from "clsx";
import { ScrollReveal } from "./ScrollReveal";

// SolutionsSection giới thiệu các mô-đun giải pháp cùng chỉ số minh chứng.

type Solution = {
  title: string;
  description: string;
  accent: string;
  metrics: Array<{ label: string; value: string }>;
};

type SolutionsSectionProps = {
  solutions: Solution[];
};

export function SolutionsSection({ solutions }: SolutionsSectionProps) {
  return (
    <section id="solutions" className="space-y-12">
      {/* Phần tiêu đề mô tả tổng quan giải pháp. */}
      <ScrollReveal direction="up" className="text-center space-y-4">
        <h2 className="text-3xl font-semibold text-slate-900">
          Các mô-đun giúp hiện đại hóa toàn bộ vòng đời tuyển dụng
        </h2>
        <p className="text-base leading-relaxed text-slate-600">
          Chọn những mô-đun phù hợp để triển khai từng phần hoặc sử dụng trọn bộ
          giải pháp để mở rộng quy mô nhanh chóng.
        </p>
      </ScrollReveal>
      <div className="grid gap-6 lg:grid-cols-3">
        {solutions.map((solution, index) => (
          // Mỗi mô-đun nêu bật mô tả và các số liệu tiêu biểu.
          <ScrollReveal
            key={solution.title}
            direction={index === 0 ? "left" : index === 2 ? "right" : "up"}
            className={clsx(
              "relative flex h-full flex-col gap-6 overflow-hidden rounded-3xl border border-slate-200/70 bg-white p-6 shadow-sm"
            )}
          >
            <div
              className={clsx(
                "inline-flex w-max items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide",
                solution.accent
              )}
            >
              {solution.title}
            </div>
            <p className="text-sm leading-relaxed text-slate-600">
              {solution.description}
            </p>
            <dl className="mt-auto grid gap-3 sm:grid-cols-2">
              {solution.metrics.map((metric) => (
                <div
                  key={metric.label}
                  className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4"
                >
                  <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    {metric.label}
                  </dt>
                  <dd className="mt-2 text-lg font-semibold text-slate-900">
                    {metric.value}
                  </dd>
                </div>
              ))}
            </dl>
            <div
              className={clsx(
                "pointer-events-none absolute inset-x-0 bottom-0 -z-10 h-32 rounded-[2.5rem] blur-2xl",
                ["bg-primary/20", "bg-emerald-200/30", "bg-amber-200/30"][
                  index % 3
                ]
              )}
              aria-hidden
            />
          </ScrollReveal>
        ))}
      </div>
    </section>
  );
}
