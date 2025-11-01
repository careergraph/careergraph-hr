import { LucideIcon, CalendarPlus } from "lucide-react";

import { Button } from "@/components/ui/button";

// CalendarHero hiển thị thống kê chính và các hành động nhanh cho trang lịch.

export type CalendarStatCard = {
  title: string;
  value: number;
  icon: LucideIcon;
  helper: string;
};

interface CalendarHeroProps {
  statCards: CalendarStatCard[];
  onCreate: () => void;
  onToday: () => void;
}

export const CalendarHero = ({ statCards, onCreate, onToday }: CalendarHeroProps) => {
  return (
    <section className="rounded-3xl border border-border/60 bg-card/80 p-6 shadow-lg shadow-brand-950/5 backdrop-blur-sm transition dark:bg-slate-950/40">
      {/* Các thẻ thống kê và hành động chính để quản lý lịch. */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

        <div className="flex flex-wrap items-center gap-3">
          <Button variant="outline" onClick={onToday}>
            Hôm nay
          </Button>
          <Button onClick={onCreate}>
            <CalendarPlus className="size-4" />
            Tạo lịch mới
          </Button>
        </div>
      </div>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map(({ title, value, icon: Icon, helper }) => (
          <div
            key={title}
            className="group rounded-2xl border border-border/70 bg-background/60 p-4 transition hover:-translate-y-0.5 hover:shadow-md hover:shadow-brand-500/10 dark:bg-slate-950/60"
          >
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  {title}
                </p>
                <p className="mt-2 text-2xl font-semibold text-foreground">
                  {value}
                </p>
              </div>
              <span className="rounded-2xl bg-muted/60 p-3 text-brand-500">
                <Icon className="size-5" />
              </span>
            </div>
            <p className="mt-4 text-xs text-muted-foreground">{helper}</p>
          </div>
        ))}
      </div>
    </section>
  );
};
