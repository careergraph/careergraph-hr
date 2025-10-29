import clsx from "clsx";
import { ScrollReveal } from "./ScrollReveal";

type PricingPlan = {
  name: string;
  price: string;
  description: string;
  highlight?: boolean;
  features: string[];
};

type PricingSectionProps = {
  plans: PricingPlan[];
};

export function PricingSection({ plans }: PricingSectionProps) {
  return (
    <section id="pricing" className="space-y-12">
      <ScrollReveal direction="up" className="text-center space-y-4">
        <span className="inline-flex items-center justify-center rounded-full bg-primary/10 px-4 py-1 text-xs font-semibold uppercase tracking-wide text-primary">
          Linh hoạt theo quy mô
        </span>
        <h2 className="text-3xl font-semibold text-slate-900">
          Chọn gói giải pháp phù hợp với lộ trình tuyển dụng của bạn
        </h2>
        <p className="text-base leading-relaxed text-slate-600">
          Từ đội ngũ đang xây nền tảng đến các doanh nghiệp lớn, CareerGraph cung cấp đầy đủ công cụ để vận hành hiệu quả.
        </p>
      </ScrollReveal>
      <div className="grid gap-6 lg:grid-cols-3">
        {plans.map((plan, index) => (
          <ScrollReveal
            key={plan.name}
            direction={index === 0 ? "left" : index === plans.length - 1 ? "right" : "up"}
            className={clsx(
              "flex h-full flex-col gap-6 rounded-3xl border p-6 shadow-sm",
              plan.highlight
                ? "border-transparent bg-gradient-to-br from-[#4f46e5] via-[#7c3aed] to-[#ec4899] text-white"
                : "border-slate-200/80 bg-white"
            )}
          >
            <div className="space-y-2">
              <h3 className={clsx("text-xl font-semibold", plan.highlight ? "text-white" : "text-slate-900")}>{plan.name}</h3>
              <p className={clsx("text-sm leading-relaxed", plan.highlight ? "text-white/80" : "text-slate-600")}>{plan.description}</p>
            </div>
            <div className="text-3xl font-semibold">
              {plan.price}
              <span className="text-sm font-normal">/tháng</span>
            </div>
            <ul className="space-y-3 text-sm leading-relaxed">
              {plan.features.map((feature) => (
                <li key={feature} className={clsx("flex items-start gap-2", plan.highlight ? "text-white/90" : "text-slate-600")}>
                  <span className="mt-1 inline-block size-1.5 rounded-full bg-current" aria-hidden />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
            <button
              type="button"
              className={clsx(
                "mt-auto inline-flex items-center justify-center rounded-xl px-5 py-2.5 text-sm font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
                plan.highlight
                  ? "bg-white text-slate-900 focus-visible:ring-white"
                  : "border border-slate-200 text-slate-700 hover:border-primary/40 hover:text-primary focus-visible:ring-primary"
              )}
            >
              Liên hệ tư vấn
            </button>
          </ScrollReveal>
        ))}
      </div>
    </section>
  );
}
