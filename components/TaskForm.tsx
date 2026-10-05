"use client";

import { useState } from "react";
import { CreateTaskInput } from "@/lib/types";
import { Loader2 } from "lucide-react";

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

    if (!title.trim()) {
      setError("Vui lòng nhập tiêu đề công việc.");
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
    <div className="card-3d rounded-2xl p-6">
      <div className="pb-4 mb-5 border-b border-zinc-200 dark:border-zinc-800">
        <h2 className="text-base font-bold text-black dark:text-white tracking-tight">
          Tạo công việc
        </h2>
        <p className="text-xs text-zinc-500 mt-0.5">
          Thêm việc cần thực hiện vào danh sách
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Error Alert */}
        {error && (
          <div className="p-3 rounded-xl bg-zinc-100 border border-zinc-300 text-zinc-900 text-xs dark:bg-zinc-900 dark:border-zinc-700 dark:text-zinc-100">
            <span>{error}</span>
          </div>
        )}

        {/* Title Input */}
        <div>
          <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
            Tiêu đề <span className="text-black dark:text-white">*</span>
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              if (error) setError(null);
            }}
            placeholder="Ví dụ: Thiết kế giao diện Dashboard..."
            className="w-full px-3.5 py-2 rounded-xl border border-zinc-300 bg-white text-black text-xs placeholder-zinc-400 focus:outline-none dark:border-zinc-700 dark:bg-zinc-950 dark:text-white dark:placeholder-zinc-500"
          />
        </div>

        {/* Description Textarea */}
        <div>
          <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
            Mô tả
          </label>
          <textarea
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Chi tiết công việc..."
            className="w-full px-3.5 py-2 rounded-xl border border-zinc-300 bg-white text-black text-xs placeholder-zinc-400 focus:outline-none dark:border-zinc-700 dark:bg-zinc-950 dark:text-white dark:placeholder-zinc-500 resize-none"
          />
        </div>

        {/* Form Controls Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
              Trạng thái
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full px-2.5 py-2 rounded-xl border border-zinc-300 bg-white text-black text-xs focus:outline-none dark:border-zinc-700 dark:bg-zinc-950 dark:text-white"
            >
              <option value="TODO">Cần làm</option>
              <option value="IN_PROGRESS">Đang làm</option>
              <option value="DONE">Hoàn thành</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
              Ưu tiên
            </label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              className="w-full px-2.5 py-2 rounded-xl border border-zinc-300 bg-white text-black text-xs focus:outline-none dark:border-zinc-700 dark:bg-zinc-950 dark:text-white"
            >
              <option value="LOW">Thấp</option>
              <option value="MEDIUM">Trung bình</option>
              <option value="HIGH">Cao</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
              Hạn chót
            </label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-xl border border-zinc-300 bg-white text-black text-xs focus:outline-none dark:border-zinc-700 dark:bg-zinc-950 dark:text-white"
            />
          </div>
        </div>

        {/* Submit Button (3D Monochrome Button) */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={isSubmitting}
            className="btn-3d-primary w-full py-2.5 text-xs tracking-tight cursor-pointer disabled:opacity-50 inline-flex items-center justify-center gap-1.5"
          >
            {isSubmitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            <span>{isSubmitting ? "Đang lưu..." : "Tạo công việc"}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
