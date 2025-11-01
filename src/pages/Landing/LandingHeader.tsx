import { useEffect, useState } from "react";
import { Link } from "react-router";
import { cn } from "@/lib/utils";

// Các mục điều hướng cuộn tới từng section trên landing page.
const navItems = [
  { label: "Tổng quan", id: "hero" },
  { label: "Tính năng", id: "features" },
  { label: "Quy trình", id: "workflow" },
  { label: "Giải pháp", id: "solutions" },
  { label: "Khách hàng", id: "testimonials" },
  { label: "Giá", id: "pricing" },
];

type LandingHeaderProps = {
  onNavigate: (sectionId: string) => void;
  authenticated: boolean;
  userName: string;
};

export function LandingHeader({
  onNavigate,
  authenticated,
  userName,
}: LandingHeaderProps) {
  const [activeSection, setActiveSection] = useState<string>(navItems[0].id);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleScroll = () => {
      setIsScrolled(window.scrollY > 24);
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const observer = new IntersectionObserver(
      (entries) => {
        const intersecting = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

        if (intersecting?.target?.id) {
          setActiveSection(intersecting.target.id);
        }
      },
      {
        rootMargin: "-45% 0px -45% 0px",
        threshold: [0.1, 0.3, 0.6],
      }
    );

    const targets = navItems
      .map((item) => document.getElementById(item.id))
      .filter((el): el is HTMLElement => Boolean(el));

    targets.forEach((el) => observer.observe(el));

    return () => {
      observer.disconnect();
    };
  }, []);

  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full transition-all duration-500",
        isScrolled
          ? "border-b border-white/60 bg-white/85 shadow-[0_10px_40px_rgba(15,23,42,0.08)] backdrop-blur-md"
          : "bg-transparent"
      )}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5 md:py-8">
      {/* Logo và menu điều hướng chính của trang. */}
      <div className="flex items-center gap-3">
        <img
          src="/images/logo/logo.svg"
          alt="CareerGraph"
          className="h-10 w-10"
          loading="lazy"
        />
        <span className="text-2xl font-semibold bg-gradient-to-r from-[#4f46e5] via-[#7c3aed] to-[#ec4899] bg-clip-text text-transparent">
          CareerGraph
        </span>
      </div>
      <nav className="hidden flex-1 items-center justify-center gap-4 md:flex">
        {navItems.map((item) => (
          <a
            key={item.id}
            href={`#${item.id}`}
            onClick={(event) => {
              event.preventDefault();
              onNavigate(item.id);
            }}
            className={cn(
              "group relative inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-semibold transition-all duration-300 ease-out whitespace-nowrap",
              activeSection === item.id
                ? "text-slate-900"
                : "text-slate-600 hover:text-slate-900"
            )}
          >
            <span
              aria-hidden
              className={cn(
                "absolute inset-0 scale-90 rounded-full bg-white/80 opacity-0 shadow-sm transition-all duration-300 ease-out group-hover:scale-100 group-hover:opacity-100 dark:bg-white/10",
                activeSection === item.id && "scale-100 opacity-100"
              )}
            />
            <span className="relative z-10">{item.label}</span>
          </a>
        ))}
      </nav>
      {authenticated ? (
        <div className="flex items-center gap-4">
          <div className="hidden text-sm font-medium text-slate-700 sm:block whitespace-nowrap">
            Xin chào, {userName}
          </div>
          <Link
            to="/dashboard"
            className="rounded-xl bg-gradient-to-r from-[#4f46e5] via-[#7c3aed] to-[#ec4899] px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:opacity-95"
          >
            Vào Dashboard
          </Link>
        </div>
      ) : (
        <div className="flex items-center gap-3">
          <Link
            to="/signin"
            className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:text-slate-900"
          >
            Đăng nhập
          </Link>
          <Link
            to="/signup"
            className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
          >
            Đăng ký miễn phí
          </Link>
        </div>
      )}
      </div>
    </header>
  );
}
