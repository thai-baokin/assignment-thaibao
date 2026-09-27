import Link from "next/link";
import { Users, Sparkles, ArrowLeft, ShieldCheck, UserPlus, FolderKanban } from "lucide-react";

export default function TeamsPage() {
  return (
    <div className="flex-1 flex items-center justify-center py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-xl w-full text-center">
        {/* Animated Badge */}
        <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 dark:bg-indigo-950/60 dark:border-indigo-800 dark:text-indigo-300 text-xs font-semibold mb-6">
          <Sparkles className="h-3.5 w-3.5 text-indigo-500 animate-pulse" />
          <span>Assignment 2 Feature</span>
        </div>

        {/* Main Heading */}
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-600 text-white shadow-xl shadow-indigo-500/25 mb-6">
          <Users className="h-10 w-10" />
        </div>

        <h1 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
          Team Management is Coming Soon!
        </h1>
        <p className="mt-4 text-base text-slate-600 dark:text-slate-400 leading-relaxed max-w-lg mx-auto">
          Tính năng quản lý thành viên, phân quyền nhóm (Owner/Admin/Member) và chỉ định công việc theo nhóm sẽ được hoàn thiện trong <strong>Assignment 2</strong>.
        </p>

        {/* Sneak peek feature cards */}
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-3 text-left">
          <div className="p-4 rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 shadow-xs">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-400 mb-2">
              <FolderKanban className="h-4 w-4" />
            </div>
            <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200">Không gian nhóm</h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
              Tạo và quản lý các workspace cho từng dự án.
            </p>
          </div>

          <div className="p-4 rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 shadow-xs">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400 mb-2">
              <UserPlus className="h-4 w-4" />
            </div>
            <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200">Mời thành viên</h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
              Thêm cộng tác viên qua email và liên kết.
            </p>
          </div>

          <div className="p-4 rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 shadow-xs">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-100 text-purple-600 dark:bg-purple-950 dark:text-purple-400 mb-2">
              <ShieldCheck className="h-4 w-4" />
            </div>
            <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200">Phân quyền</h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
              Vai trò linh hoạt: Owner, Admin, Member.
            </p>
          </div>
        </div>

        {/* Back to Home Button */}
        <div className="mt-10">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm text-white bg-slate-900 hover:bg-slate-800 dark:bg-blue-600 dark:hover:bg-blue-700 shadow-sm transition-all cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Quay lại Trang chủ (Quản lý Task)</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
