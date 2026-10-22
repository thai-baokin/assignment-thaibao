"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertCircle, RefreshCw, ArrowLeft } from "lucide-react";

export default function TeamError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Lỗi trang Team:", error);
  }, [error]);

  return (
    <div className="flex-1 max-w-xl mx-auto py-20 px-4 text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400 mb-4 shadow-sm">
        <AlertCircle className="h-7 w-7" />
      </div>
      <h2 className="text-xl font-bold text-zinc-900 dark:text-white">
        Không thể tải dữ liệu nhóm
      </h2>
      <p className="mt-2 text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 max-w-md mx-auto">
        Đã có sự cố khi kết nối hoặc đồng bộ dữ liệu. Bạn có thể nhấn nút thử lại bên dưới.
      </p>

      <div className="mt-6 flex items-center justify-center gap-3">
        <button
          onClick={() => reset()}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-black text-white dark:bg-white dark:text-black text-xs font-bold hover:opacity-90 transition-all cursor-pointer shadow-sm"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          <span>Thử lại ngay</span>
        </button>

        <Link
          href="/teams"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 text-xs font-semibold hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Danh sách nhóm</span>
        </Link>
      </div>
    </div>
  );
}
