import { ArrowLeft, Compass, Home, SearchX } from "lucide-react";
import { Link } from "react-router";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#0f172a_0%,_#111827_40%,_#030712_100%)] px-4 py-10 text-white">
      <div className="mx-auto flex min-h-[85vh] w-full max-w-4xl items-center justify-center">
        <div className="w-full rounded-3xl border border-white/10 bg-slate-900/60 p-8 shadow-2xl shadow-black/40 backdrop-blur sm:p-10">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-500/15 text-rose-300">
            <SearchX className="h-8 w-8" />
          </div>

          <p className="mt-6 text-center text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
            Error 404
          </p>
          <h1 className="mt-2 text-center text-3xl font-extrabold tracking-tight sm:text-4xl">
            Trang bạn tìm không tồn tại
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-center text-sm leading-6 text-slate-300 sm:text-base">
            Đường dẫn có thể đã thay đổi hoặc không còn khả dụng. Hãy quay về dashboard để
            tiếp tục quản trị lịch phỏng vấn và ứng viên.
          </p>

          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-2 rounded-xl bg-sky-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-sky-500"
            >
              <Home className="h-4 w-4" />
              Về Dashboard
            </Link>
            <button
              type="button"
              onClick={() => window.history.back()}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-700 px-5 py-2.5 text-sm font-semibold text-slate-200 transition hover:bg-slate-800"
            >
              <ArrowLeft className="h-4 w-4" />
              Quay lại
            </button>
          </div>

          <div className="mt-8 grid gap-3 text-sm text-slate-300 sm:grid-cols-2">
            <Link
              to="/interviews"
              className="rounded-2xl border border-slate-700/80 bg-slate-800/50 p-4 transition hover:border-sky-400/40 hover:bg-slate-800"
            >
              <div className="flex items-center gap-2 font-semibold text-white">
                <Compass className="h-4 w-4 text-sky-300" />
                Quản lý phỏng vấn
              </div>
              <p className="mt-1 text-xs text-slate-400">Theo dõi lịch, phòng, và trạng thái phòng theo thời gian thực.</p>
            </Link>
            <Link
              to="/jobs"
              className="rounded-2xl border border-slate-700/80 bg-slate-800/50 p-4 transition hover:border-sky-400/40 hover:bg-slate-800"
            >
              <div className="flex items-center gap-2 font-semibold text-white">
                <Home className="h-4 w-4 text-sky-300" />
                Danh sách tin tuyển dụng
              </div>
              <p className="mt-1 text-xs text-slate-400">Mở nhanh job để kiểm tra lịch phỏng vấn và ứng viên liên quan.</p>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
