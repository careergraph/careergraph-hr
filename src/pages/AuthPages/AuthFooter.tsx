export default function AuthFooter() {
  const year = new Date().getFullYear();

  return (
    <div className="border-t border-slate-200 px-6 pt-3 text-center text-[0.72rem] leading-5 text-slate-500 dark:border-white/10 dark:text-white/60">
      <div className="mx-auto flex w-full max-w-md flex-col items-center justify-center gap-1 sm:flex-row sm:gap-3">
        <p>&copy; {year} CareerGraph. All rights reserved.</p>
      </div>
    </div>
  );
}
