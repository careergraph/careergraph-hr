import { ScrollReveal } from "./ScrollReveal";

// IntegrationsSection giới thiệu các nền tảng có thể tích hợp với CareerGraph.

type Integration = {
  name: string;
  description: string;
};

type IntegrationsSectionProps = {
  integrations: Integration[];
};

export function IntegrationsSection({ integrations }: IntegrationsSectionProps) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white/80 px-8 py-12 shadow-xl">
      {/* Bố cục hai cột cho nội dung giới thiệu và danh sách tích hợp. */}
      <div className="grid gap-8 md:grid-cols-[1.1fr_0.9fr] md:items-center">
        <ScrollReveal direction="left" className="space-y-4">
          <span className="inline-flex items-center gap-2 rounded-full bg-slate-900/5 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-600">
            Kết nối hệ sinh thái
          </span>
          <h2 className="text-3xl font-semibold text-slate-900">Đồng bộ với công cụ bạn đang dùng</h2>
          <p className="text-base leading-relaxed text-slate-600">
            CareerGraph tích hợp sâu với các nền tảng HRIS, lịch, và truyền thông nội bộ để dữ liệu luôn cập nhật và liền mạch.
          </p>
        </ScrollReveal>
        <ScrollReveal direction="right" className="grid gap-4 sm:grid-cols-2">
          {integrations.map((integration, index) => (
            // Mỗi thẻ tích hợp hiển thị tên và mô tả ngắn. 
            <ScrollReveal key={integration.name} direction={index % 2 === 0 ? "up" : "down"} className="flex flex-col gap-2 rounded-2xl border border-slate-200/60 bg-white p-5 shadow-sm">
              <p className="text-sm font-semibold text-slate-900">{integration.name}</p>
              <p className="text-sm text-slate-600">{integration.description}</p>
            </ScrollReveal>
          ))}
        </ScrollReveal>
      </div>
    </section>
  );
}
