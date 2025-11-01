import { ReactNode } from "react";
import { ScrollReveal } from "./ScrollReveal";

// WorkflowSection mô tả chuỗi bước làm việc minh họa cho quy trình tuyển dụng.

type WorkflowStep = {
  title: string;
  description: string;
  caption: string;
  icon: ReactNode;
};

type WorkflowSectionProps = {
  steps: WorkflowStep[];
  illustration: string;
};

export function WorkflowSection({ steps, illustration }: WorkflowSectionProps) {
  return (
    <section id="workflow" className="grid gap-10 rounded-3xl border border-slate-200 bg-white/90 p-10 shadow-xl md:grid-cols-[1.05fr_0.95fr]">
      {/* Cột trái liệt kê từng bước trong quy trình. */}
      <ScrollReveal direction="left" className="space-y-7">
        <span className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-4 py-1.5 text-xs font-semibold tracking-wide text-emerald-700">
          Quy trình thông minh
        </span>
        <h2 className="text-3xl font-semibold text-slate-900">
          Tự động hóa để đội ngũ HR tập trung vào chiến lược
        </h2>
        <div className="relative space-y-8">
          {steps.map((step, index) => (
            // Mỗi bước hiển thị icon, tiêu đề và mô tả chi tiết.
            <ScrollReveal key={step.title} direction="up">
              <div className="relative pl-14">
                <div className="absolute left-0 top-0 flex size-12 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10 text-primary">
                  {step.icon}
                </div>
                {index !== steps.length - 1 ? (
                  <span className="absolute left-5 top-12 bottom-0 w-px bg-slate-200" aria-hidden />
                ) : null}
                <div className="rounded-3xl border border-slate-100 bg-white/85 p-5 shadow-sm">
                  <div className="inline-flex items-center gap-2 rounded-full bg-slate-900/5 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    {step.caption}
                  </div>
                  <h3 className="mt-3 text-lg font-semibold text-slate-900">{step.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600">{step.description}</p>
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </ScrollReveal>
      <ScrollReveal direction="right" className="relative flex items-center justify-center">
        {/* Cột phải hiển thị hình minh họa quy trình. */}
        <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-primary/20 to-emerald-200/20 blur-3xl" aria-hidden />
        <div className="relative w-full rounded-3xl border border-white/60 bg-white/95 p-6 shadow-2xl">
          <img
            src={illustration}
            alt="Workflow illustration"
            className="h-full w-full rounded-2xl object-contain"
            loading="lazy"
          />
        </div>
      </ScrollReveal>
    </section>
  );
}
