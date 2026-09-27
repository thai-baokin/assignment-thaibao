import { CheckSquare, Database, Globe } from "lucide-react";

export default function Footer() {
  return (
    <footer className="mt-auto border-t border-slate-200 bg-slate-50/50 dark:border-slate-800 dark:bg-slate-950/50 py-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-left">
          {/* Brand Info */}
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-600 text-white shadow-xs">
              <CheckSquare className="h-4 w-4" />
            </div>
            <span className="font-bold text-slate-800 dark:text-slate-200">
              Task & Team Management App
            </span>
            <span className="text-xs text-slate-400 dark:text-slate-500 font-medium">
              • Assignment 1
            </span>
          </div>

          {/* Tech Badges */}
          <div className="flex flex-wrap items-center justify-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-1 font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300">
              <Globe className="h-3 w-3 text-blue-500" /> Next.js App Router
            </span>
            <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-1 font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300">
              <Database className="h-3 w-3 text-emerald-500" /> Prisma & Supabase
            </span>
            <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-1 font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300">
              ▲ Vercel Ready
            </span>
          </div>

          {/* Copyright */}
          <p className="text-xs text-slate-400 dark:text-slate-500">
            &copy; {new Date().getFullYear()} Software Development Network. Built with Next.js & Prisma.
          </p>
        </div>
      </div>
    </footer>
  );
}
