"use client";

import { useState } from "react";
import { CreateTaskInput } from "@/lib/types";
import { PlusCircle, Loader2, AlertCircle } from "lucide-react";

interface TaskFormProps {
  onTaskCreated: (data: CreateTaskInput) => Promise<boolean>;
}

export default function TaskForm({ onTaskCreated }: TaskFormProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("TODO");
  const [priority, setPriority] = useState("MEDIUM");
  const [dueDate, setDueDate] = useState("");

  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Client-side Validation (Bonus mark requirement)
    if (!title.trim()) {
      setError("Vui lòng nhập tiêu đề cho công việc.");
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      const success = await onTaskCreated({
        title: title.trim(),
        description: description.trim() || undefined,
        status,
        priority,
        dueDate: dueDate || null,
      });

      if (success) {
        // Reset form on success
        setTitle("");
        setDescription("");
        setStatus("TODO");
        setPriority("MEDIUM");
        setDueDate("");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center gap-2.5 pb-4 mb-5 border-b border-slate-100 dark:border-slate-800">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400">
          <PlusCircle className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            Tạo công việc mới
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Thêm task vào danh sách để quản lý tiến độ
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Error Alert */}
        {error && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm dark:bg-rose-950/50 dark:border-rose-900 dark:text-rose-300">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Title Input (Required) */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
            Tiêu đề công việc <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              if (error) setError(null);
            }}
            placeholder="Ví dụ: Thiết kế giao diện Homepage..."
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder-slate-500 transition-colors"
          />
        </div>

        {/* Description Textarea (Optional) */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
            Mô tả chi tiết <span className="text-slate-400 font-normal lowercase">(tùy chọn)</span>
          </label>
          <textarea
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Nhập thông tin chi tiết hoặc ghi chú về công việc..."
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder-slate-500 transition-colors resize-none"
          />
        </div>

        {/* Grid for Status, Priority, Due Date */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Status */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Trạng thái
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 dark:border-slate-700 dark:bg-slate-800 dark:text-white transition-colors"
            >
              <option value="TODO">To Do</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="DONE">Done</option>
            </select>
          </div>

          {/* Priority */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Độ ưu tiên
            </label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 dark:border-slate-700 dark:bg-slate-800 dark:text-white transition-colors"
            >
              <option value="LOW">Thấp (Low)</option>
              <option value="MEDIUM">Trung bình (Medium)</option>
              <option value="HIGH">Cao (High)</option>
            </select>
          </div>

          {/* Due Date */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Hạn chót
            </label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 dark:border-slate-700 dark:bg-slate-800 dark:text-white transition-colors"
            />
          </div>
        </div>

        {/* Submit Button */}
        <div className="pt-2 flex justify-end">
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl font-semibold text-sm text-white bg-blue-600 hover:bg-blue-700 active:scale-98 shadow-sm shadow-blue-500/25 transition-all cursor-pointer disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Đang lưu...</span>
              </>
            ) : (
              <>
                <PlusCircle className="h-4 w-4" />
                <span>Tạo công việc</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
