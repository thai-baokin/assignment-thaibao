"use client";

import { useState } from "react";
import { TaskItem, UpdateTaskInput } from "@/lib/types";
import { X, Loader2 } from "lucide-react";

interface TaskEditModalProps {
  task: TaskItem | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (id: string, data: UpdateTaskInput) => Promise<boolean>;
}

function TaskEditModalContent({
  task,
  onClose,
  onSave,
}: {
  task: TaskItem;
  onClose: () => void;
  onSave: (id: string, data: UpdateTaskInput) => Promise<boolean>;
}) {
  const [title, setTitle] = useState(task.title || "");
  const [description, setDescription] = useState(task.description || "");
  const [status, setStatus] = useState(task.status || "TODO");
  const [priority, setPriority] = useState(task.priority || "MEDIUM");
  const [dueDate, setDueDate] = useState(
    task.dueDate ? new Date(task.dueDate).toISOString().split("T")[0] : ""
  );

  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      setError("Tiêu đề không được để trống.");
      return;
    }

    setError(null);
    setIsSaving(true);

    try {
      const success = await onSave(task.id, {
        title: title.trim(),
        description: description.trim() || undefined,
        status,
        priority,
        dueDate: dueDate || null,
      });

      if (success) {
        onClose();
      }
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-150">
      <div className="card-3d relative w-full max-w-lg rounded-2xl p-6 shadow-2xl border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 mb-4 border-b border-zinc-200 dark:border-zinc-800">
          <h3 className="text-base font-bold text-black dark:text-white tracking-tight">
            Chỉnh sửa công việc
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-black hover:bg-zinc-100 dark:hover:text-white dark:hover:bg-zinc-900 transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-zinc-100 border border-zinc-300 text-zinc-900 text-xs dark:bg-zinc-900 dark:border-zinc-700 dark:text-zinc-100">
              <span>{error}</span>
            </div>
          )}

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
              className="w-full px-3.5 py-2 rounded-xl border border-zinc-300 bg-white text-black text-xs focus:outline-none dark:border-zinc-700 dark:bg-zinc-950 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
              Mô tả
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-zinc-300 bg-white text-black text-xs focus:outline-none dark:border-zinc-700 dark:bg-zinc-950 dark:text-white resize-none"
            />
          </div>

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

          {/* Action buttons */}
          <div className="pt-3 flex items-center justify-end gap-2 border-t border-zinc-200 dark:border-zinc-800">
            <button
              type="button"
              onClick={onClose}
              className="btn-3d-secondary px-4 py-2 text-xs cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="btn-3d-primary px-5 py-2 text-xs cursor-pointer disabled:opacity-50 inline-flex items-center gap-1.5"
            >
              {isSaving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              <span>{isSaving ? "Đang lưu..." : "Lưu thay đổi"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function TaskEditModal({ task, isOpen, onClose, onSave }: TaskEditModalProps) {
  if (!isOpen || !task) return null;

  return (
    <TaskEditModalContent
      key={task.id}
      task={task}
      onClose={onClose}
      onSave={onSave}
    />
  );
}
