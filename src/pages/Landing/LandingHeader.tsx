import { useEffect, useState } from "react";
import { Link } from "react-router";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { label: "Tổng quan", shortLabel: "Tổng quan", id: "hero" },
  { label: "Tính năng", shortLabel: "Tính năng", id: "features" },
  { label: "Quy trình", shortLabel: "Quy trình", id: "workflow" },
  { label: "Giải pháp", shortLabel: "Giải pháp", id: "solutions" },
  { label: "Khách hàng", shortLabel: "Khách hàng", id: "testimonials" },
];

type LandingHeaderProps = {
  onNavigate: (sectionId: string) => void;
  authenticated: boolean;
  userName: string;
};

type HeaderActionProps = {
  authenticated: boolean;
  userName: string;
  candidateSiteUrl: string;
  compact?: boolean;
  hideCandidateLink?: boolean;
};

function HeaderActions({
  authenticated,
  userName,
  candidateSiteUrl,
  compact = false,
  hideCandidateLink = false,
}: HeaderActionProps) {
  if (authenticated) {
    return (
      <div className="flex items-center gap-2 lg:gap-3">
        <div
          className={cn(
            "hidden whitespace-nowrap text-sm font-medium text-slate-700",
            compact ? "2xl:block" : "xl:block"
          )}
        >
          Xin chào, {userName}
        </div>
        <Link
          to="/dashboard"
          className={cn(
            "inline-flex items-center justify-center whitespace-nowrap rounded-xl bg-gradient-to-r from-[#4f46e5] via-[#7c3aed] to-[#ec4899] text-sm font-semibold text-white shadow-sm transition hover:opacity-95",
            compact ? "h-10 px-4" : "px-4 py-2"
          )}
        >
          {compact ? "Dashboard" : "Vào Dashboard"}
        </Link>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 lg:gap-3">
      <Link
        to="/signin"
        className={cn(
          "inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-medium text-slate-700 transition hover:bg-slate-100 hover:text-slate-900",
          compact ? "h-10 px-3" : "px-4 py-2"
        )}
      >
        Đăng nhập
      </Link>

      {hideCandidateLink ? null : (
        <a
          href={candidateSiteUrl}
          className={cn(
            "inline-flex items-center justify-center whitespace-nowrap rounded-xl border border-slate-200 text-sm font-medium text-slate-700 transition hover:bg-slate-100",
            compact ? "h-10 px-3" : "px-4 py-2"
          )}
        >
          {compact ? "Ứng viên" : "Dành cho Ứng viên"}
        </a>
      )}
    </div>
  );
}

export function LandingHeader({
  onNavigate,
  authenticated,
  userName,
}: LandingHeaderProps) {
  const candidateSiteUrl =
    import.meta.env.VITE_CLIENT_SITE_URL || "https://thinz.io.vn";
  const [activeSection, setActiveSection] = useState<string>(navItems[0].id);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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

  useEffect(() => {
    if (typeof document === "undefined") return;

    document.body.classList.toggle("overflow-hidden", isMobileMenuOpen);

    return () => {
      document.body.classList.remove("overflow-hidden");
    };
  }, [isMobileMenuOpen]);

  const handleNavClick = (sectionId: string) => {
    onNavigate(sectionId);
    setIsMobileMenuOpen(false);
  };

  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full transition-all duration-500",
        isScrolled
          ? "border-b border-white/60 bg-white/85 shadow-[0_10px_40px_rgba(15,23,42,0.08)] backdrop-blur-md"
          : "bg-transparent"
      )}
    >
      <div className="mx-auto max-w-6xl px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3 xl:gap-6">
          <div className="min-w-0 shrink-0">
            <Link to="/" className="flex items-center gap-3">
              <img
                src="/images/logo/logo.svg"
                alt="CareerGraph"
                className="h-10 w-10 shrink-0"
                loading="lazy"
              />
              <span className="hidden text-xl font-semibold tracking-tight text-slate-900 sm:block xl:text-2xl">
                CareerGraph
              </span>
            </Link>
          </div>

          <nav className="hidden min-w-0 flex-1 items-center justify-center gap-1 px-2 xl:flex">
            {navItems.map((item) => (
              <a
                key={item.id}
                href={`#${item.id}`}
                onClick={(event) => {
                  event.preventDefault();
                  handleNavClick(item.id);
                }}
                className={cn(
                  "group relative inline-flex items-center rounded-full px-3 py-2 text-sm font-semibold whitespace-nowrap transition-all duration-300 ease-out",
                  activeSection === item.id
                    ? "text-slate-900"
                    : "text-slate-600 hover:text-slate-900"
                )}
              >
                <span
                  aria-hidden
                  className={cn(
                    "absolute inset-0 scale-90 rounded-full bg-white/80 opacity-0 shadow-sm transition-all duration-300 ease-out group-hover:scale-100 group-hover:opacity-100",
                    activeSection === item.id && "scale-100 opacity-100"
                  )}
                />
                <span className="relative z-10">{item.label}</span>
              </a>
            ))}
          </nav>

          <div className="ml-auto hidden items-center md:flex xl:hidden">
            <HeaderActions
              authenticated={authenticated}
              userName={userName}
              candidateSiteUrl={candidateSiteUrl}
              compact
            />
          </div>

          <div className="ml-auto hidden items-center xl:flex">
            <HeaderActions
              authenticated={authenticated}
              userName={userName}
              candidateSiteUrl={candidateSiteUrl}
            />
          </div>

          <div className="ml-auto flex items-center gap-2 md:ml-0 xl:hidden">
            <div className="md:hidden">
              <HeaderActions
                authenticated={authenticated}
                userName={userName}
                candidateSiteUrl={candidateSiteUrl}
                compact
                hideCandidateLink
              />
            </div>
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen((value) => !value)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white/90 text-slate-700 shadow-sm transition hover:bg-slate-100"
              aria-expanded={isMobileMenuOpen}
              aria-label={isMobileMenuOpen ? "Đóng menu" : "Mở menu"}
            >
              {isMobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>

        <div
          className={cn(
            "overflow-hidden transition-all duration-300 xl:hidden",
            isMobileMenuOpen
              ? "pointer-events-auto max-h-[75vh] pt-4 opacity-100"
              : "pointer-events-none max-h-0 opacity-0"
          )}
        >
          <div className="rounded-3xl border border-slate-200/80 bg-white/95 p-3 shadow-[0_20px_50px_rgba(15,23,42,0.12)] backdrop-blur">
            <nav className="grid gap-2 sm:grid-cols-2">
              {navItems.map((item) => (
                <a
                  key={item.id}
                  href={`#${item.id}`}
                  onClick={(event) => {
                    event.preventDefault();
                    handleNavClick(item.id);
                  }}
                  className={cn(
                    "inline-flex items-center justify-between rounded-2xl px-4 py-3 text-sm font-semibold transition",
                    activeSection === item.id
                      ? "bg-slate-900 text-white"
                      : "bg-slate-50 text-slate-700 hover:bg-slate-100"
                  )}
                >
                  <span>{item.shortLabel}</span>
                  {/* <span className="text-xs opacity-70">#{item.id}</span> */}
                </a>
              ))}
            </nav>

            <div className="mt-3 border-t border-slate-200 pt-3 md:hidden">
              <HeaderActions
                authenticated={authenticated}
                userName={userName}
                candidateSiteUrl={candidateSiteUrl}
              />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
