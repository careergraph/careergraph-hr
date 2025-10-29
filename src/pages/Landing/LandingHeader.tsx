import { Link } from "react-router";

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
  return (
    <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-8">
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
      <nav className="hidden flex-1 items-center justify-center gap-5 text-sm font-semibold text-slate-600 md:flex">
        {navItems.map((item) => (
          <a
            key={item.id}
            href={`#${item.id}`}
            onClick={(event) => {
              event.preventDefault();
              onNavigate(item.id);
            }}
            className="relative inline-flex items-center gap-2 rounded-full px-3 py-1 text-slate-600 transition-colors whitespace-nowrap hover:text-slate-900"
          >
            {item.label}
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
    </header>
  );
}
