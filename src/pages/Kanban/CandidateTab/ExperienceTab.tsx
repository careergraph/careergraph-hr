import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Candidate } from "@/types/candidate";
import { CalendarClock } from "lucide-react";

type ExperienceTabProps = {
  candidate: Candidate;
};

export function ExperienceTab({ candidate }: ExperienceTabProps) {
  return (
    <ScrollArea className="h-full px-5 pb-10 pt-5 sm:px-8">
      <div className="rounded-2xl border border-slate-100 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-5 py-5 sm:px-6">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-600">
            Lộ trình tuyển dụng
          </h3>
          <p className="mt-1 text-sm text-slate-500">
            Theo dõi nhanh các hoạt động đã diễn ra với ứng viên này.
          </p>
        </div>
        <div className="space-y-5 px-5 py-5 sm:px-6 sm:py-6">
          {candidate.timeline.map((event) => (
            <div key={event.id} className="relative pl-10">
              <div className="absolute left-0 top-1.5 flex h-8 w-8 items-center justify-center rounded-full bg-slate-900 text-white shadow-md">
                <CalendarClock className="h-4 w-4" />
              </div>
              <div className="rounded-2xl border border-slate-100 bg-slate-50/80 px-4 py-3">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h4 className="text-sm font-semibold text-slate-700">
                      {event.action}
                    </h4>
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                      {event.date}
                    </p>
                  </div>
                  <span className="text-xs text-slate-500">
                    Người thực hiện: {event.user}
                  </span>
                </div>
                <p className="mt-2 text-sm text-slate-600">{event.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <Separator className="my-6" />

      <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-6">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-600">
          Kinh nghiệm tổng hợp
        </h3>
        <p className="mt-3 text-sm text-slate-600">{candidate.experience}</p>
      </div>
    </ScrollArea>
  );
}
