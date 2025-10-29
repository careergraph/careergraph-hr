import { ScrollReveal } from "./ScrollReveal";

type Testimonial = {
  quote: string;
  author: string;
  role: string;
};

type TestimonialsSectionProps = {
  testimonials: Testimonial[];
};

export function TestimonialsSection({ testimonials }: TestimonialsSectionProps) {
  return (
    <section
      id="testimonials"
      className="rounded-3xl border border-slate-200 bg-slate-900 px-8 py-14 text-slate-100 shadow-2xl"
    >
      <div className="grid gap-12 md:grid-cols-[1.1fr_0.9fr] md:items-start">
        <ScrollReveal direction="left" className="space-y-5">
          <span className="inline-flex items-center gap-2 rounded-full bg-slate-800 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-300">
            Tin dùng bởi đội ngũ HR hàng đầu
          </span>
          <h2 className="text-3xl font-semibold text-white">
            Hơn 500 doanh nghiệp tin tưởng CareerGraph để xây dựng trải nghiệm tuyển dụng xuất sắc
          </h2>
          <p className="text-base leading-relaxed text-slate-300">
            Chúng tôi hợp tác với các doanh nghiệp từ startup đến tập đoàn lớn để tối ưu thời gian tuyển dụng, tăng tỷ lệ chấp nhận offer và xây dựng thương hiệu nhà tuyển dụng nổi bật.
          </p>
        </ScrollReveal>
        <ScrollReveal direction="right" className="grid gap-6 sm:grid-cols-2">
          {testimonials.map((item, index) => (
            <ScrollReveal key={item.quote} direction={index % 2 === 0 ? "up" : "down"} className="rounded-3xl border border-white/10 bg-white/5 p-6">
              <blockquote className="border-l-2 border-primary/60 pl-4 text-sm leading-relaxed text-slate-200">
                “{item.quote}”
              </blockquote>
              <figcaption className="mt-4 text-sm font-semibold text-white">
                {item.author}
                <span className="ml-2 font-normal text-slate-400">{item.role}</span>
              </figcaption>
            </ScrollReveal>
          ))}
        </ScrollReveal>
      </div>
    </section>
  );
}
