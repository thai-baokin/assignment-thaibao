"use client";

import { useState } from "react";
import { TaskItem } from "@/lib/types";

interface TaskCardProps {
  task: TaskItem;
  onEdit: (task: TaskItem) => void;
  onDelete: (id: string) => Promise<void>;
  onStatusChange?: (id: string, newStatus: string) => Promise<void>;
}

export default function TaskCard({ task, onEdit, onDelete, onStatusChange }: TaskCardProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [isChangingStatus, setIsChangingStatus] = useState(false);

  const handleDelete = async () => {
    if (confirm(`Xác nhận xóa công việc "${task.title}"?`)) {
      setIsDeleting(true);
      try {
        await onDelete(task.id);
      } finally {
        setIsDeleting(false);
      }
    }
  };

  const handleQuickStatus = async (status: string) => {
    if (onStatusChange && !isChangingStatus && task.status !== status) {
      setIsChangingStatus(true);
      try {
        await onStatusChange(task.id, status);
      } finally {
        setIsChangingStatus(false);
      }
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "DONE":
        return {
          label: "Hoàn thành",
          classes: "bg-black text-white border-black dark:bg-white dark:text-black dark:border-white font-bold",
        };
      case "IN_PROGRESS":
        return {
          label: "Đang làm",
          classes: "bg-zinc-200 text-zinc-900 border-zinc-300 dark:bg-zinc-800 dark:text-zinc-100 dark:border-zinc-700",
        };
      case "TODO":
      default:
        return {
          label: "Cần làm",
          classes: "bg-zinc-50 text-zinc-700 border-zinc-300 dark:bg-zinc-900/60 dark:text-zinc-300 dark:border-zinc-700",
        };
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "HIGH":
        return {
          label: "Cao",
          classes: "bg-black text-white dark:bg-white dark:text-black font-bold border border-black dark:border-white",
        };
      case "LOW":
        return {
          label: "Thấp",
          classes: "text-zinc-500 bg-zinc-50 border-zinc-200 dark:text-zinc-400 dark:bg-zinc-900 dark:border-zinc-800",
        };
      case "MEDIUM":
      default:
        return {
          label: "Trung bình",
          classes: "text-zinc-800 bg-zinc-100 border-zinc-300 dark:text-zinc-200 dark:bg-zinc-800 dark:border-zinc-700",
        };
    }
  };

  const statusInfo = getStatusBadge(task.status);
  const priorityInfo = getPriorityBadge(task.priority);

  const formattedDueDate = task.dueDate
    ? new Date(task.dueDate).toLocaleDateString("vi-VN", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      })
    : null;

  const isDone = task.status === "DONE";

  return (
    <div
      className={`card-3d group relative flex flex-col justify-between rounded-2xl p-5 ${
        isDone
          ? "border-zinc-300 bg-zinc-50/50 dark:border-zinc-800 dark:bg-zinc-950/50 opacity-90"
          : ""
      }`}
    >
      <div>
        {/* Top Badges & Quick Status Switch */}
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3.5">
          <div className="flex items-center gap-2">
            {/* Status Pill (Monochrome) */}
            <span className={`pill-3d inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] border ${statusInfo.classes}`}>
              {isChangingStatus ? "..." : statusInfo.label}
            </span>

            {/* Priority Pill (Monochrome) */}
            <span className={`pill-3d inline-flex items-center px-2 py-0.5 rounded-md text-[11px] border ${priorityInfo.classes}`}>
              {priorityInfo.label}
            </span>
          </div>

          {/* Quick Status Pill Toggle (Monochrome B&W) */}
          <div className="flex items-center p-0.5 rounded-lg bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-[10px] font-semibold">
            <button
              onClick={() => handleQuickStatus("TODO")}
              disabled={isChangingStatus || task.status === "TODO"}
              className={`px-2 py-0.5 rounded transition-all cursor-pointer ${
                task.status === "TODO"
                  ? "bg-black text-white dark:bg-white dark:text-black font-bold shadow-2xs"
                  : "text-zinc-500 hover:text-black dark:hover:text-white"
              }`}
            >
              Chờ
            </button>
            <button
              onClick={() => handleQuickStatus("IN_PROGRESS")}
              disabled={isChangingStatus || task.status === "IN_PROGRESS"}
              className={`px-2 py-0.5 rounded transition-all cursor-pointer ${
                task.status === "IN_PROGRESS"
                  ? "bg-black text-white dark:bg-white dark:text-black font-bold shadow-2xs"
                  : "text-zinc-500 hover:text-black dark:hover:text-white"
              }`}
            >
              Làm
            </button>
            <button
              onClick={() => handleQuickStatus("DONE")}
              disabled={isChangingStatus || task.status === "DONE"}
              className={`px-2 py-0.5 rounded transition-all cursor-pointer ${
                task.status === "DONE"
                  ? "bg-black text-white dark:bg-white dark:text-black font-bold shadow-2xs"
                  : "text-zinc-500 hover:text-black dark:hover:text-white"
              }`}
            >
              Xong
            </button>
          </div>
        </div>

        {/* Task Title */}
        <h3
          className={`text-base font-bold tracking-tight text-black dark:text-white leading-snug break-words ${
            isDone ? "line-through text-zinc-400 dark:text-zinc-500" : ""
          }`}
        >
          {task.title}
        </h3>

        {/* Task Description */}
        {task.description && (
          <p
            className={`mt-2 text-xs leading-relaxed whitespace-pre-wrap break-words line-clamp-3 ${
              isDone
                ? "text-zinc-400 dark:text-zinc-500"
                : "text-zinc-600 dark:text-zinc-300"
            }`}
          >
            {task.description}
          </p>
        )}
      </div>

      {/* Card Footer: Due Date & Actions */}
      <div className="mt-4 pt-3.5 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between gap-2 text-xs">
        {/* Due Date */}
        <div className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
          {formattedDueDate ? (
            <span>Hạn: <strong className="text-black dark:text-zinc-200">{formattedDueDate}</strong></span>
          ) : (
            <span className="text-zinc-400 dark:text-zinc-600">Không có hạn</span>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => onEdit(task)}
            className="px-2.5 py-1 rounded-lg text-xs font-semibold text-zinc-800 dark:text-zinc-200 bg-zinc-100 hover:bg-black hover:text-white dark:bg-zinc-800 dark:hover:bg-white dark:hover:text-black transition-all cursor-pointer"
          >
            Sửa
          </button>
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="px-2.5 py-1 rounded-lg text-xs font-semibold text-zinc-500 hover:text-rose-600 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-all cursor-pointer disabled:opacity-50"
          >
            {isDeleting ? "..." : "Xóa"}
          </button>
        </div>
      </div>
    </div>
  );
}
