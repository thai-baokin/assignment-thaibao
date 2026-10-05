export default function Footer() {
  return (
    <footer className="mt-auto border-t border-zinc-200/90 bg-white/70 dark:border-zinc-800/90 dark:bg-black/70 backdrop-blur-md py-6">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          {/* Brand Info */}
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-sm text-black dark:text-white">
              TaskPulse
            </span>
            <span className="text-xs text-zinc-500 font-normal">
              — Hệ thống quản lý công việc và nhóm
            </span>
          </div>

          {/* Tech Badges */}
          <div className="flex flex-wrap items-center justify-center gap-2 text-[11px] text-zinc-600 dark:text-zinc-400 font-medium">
            <span className="px-2.5 py-0.5 rounded-md border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300">
              Next.js
            </span>
            <span className="px-2.5 py-0.5 rounded-md border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300">
              Prisma & Supabase
            </span>
            <span className="px-2.5 py-0.5 rounded-md border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300">
              Tailwind CSS
            </span>
          </div>

          {/* Copyright */}
          <p className="text-[11px] text-zinc-400 dark:text-zinc-500">
            &copy; {new Date().getFullYear()} TaskPulse
          </p>
        </div>
      </div>
    </footer>
  );
}
