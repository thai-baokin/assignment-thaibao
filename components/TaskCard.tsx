"use client";

import { useState } from "react";
import { TaskItem } from "@/lib/types";
import { 
  Calendar, 
  Trash2, 
  Edit3, 
  Clock, 
  CheckCircle2, 
  CircleDashed,
  Loader2 
} from "lucide-react";

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
    if (confirm(`Bạn có chắc chắn muốn xóa công việc "${task.title}" không?`)) {
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
          label: "Done",
          bg: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800",
          icon: CheckCircle2,
        };
      case "IN_PROGRESS":
        return {
          label: "In Progress",
          bg: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800",
          icon: CircleDashed,
        };
      case "TODO":
      default:
        return {
          label: "To Do",
          bg: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800",
          icon: Clock,
        };
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "HIGH":
        return {
          label: "High Priority",
          classes: "text-rose-700 bg-rose-50 border-rose-200 dark:text-rose-300 dark:bg-rose-950/60 dark:border-rose-900",
        };
      case "LOW":
        return {
          label: "Low Priority",
          classes: "text-slate-600 bg-slate-100 border-slate-200 dark:text-slate-400 dark:bg-slate-800 dark:border-slate-700",
        };
      case "MEDIUM":
      default:
        return {
          label: "Medium Priority",
          classes: "text-amber-700 bg-amber-50 border-amber-200 dark:text-amber-300 dark:bg-amber-950/60 dark:border-amber-800",
        };
    }
  };

  const statusInfo = getStatusBadge(task.status);
  const StatusIcon = statusInfo.icon;
  const priorityInfo = getPriorityBadge(task.priority);

  const formattedDueDate = task.dueDate
    ? new Date(task.dueDate).toLocaleDateString("vi-VN", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : null;

  const isDone = task.status === "DONE";

  return (
    <div
      className={`group relative flex flex-col justify-between rounded-xl border p-5 transition-all duration-200 hover:shadow-md ${
        isDone
          ? "border-emerald-200/80 bg-emerald-50/20 dark:border-emerald-900/40 dark:bg-emerald-950/10"
          : "border-slate-200 bg-white hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700"
      }`}
    >
      <div>
        {/* Top Badges */}
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            {/* Status Dropdown/Badge */}
            <div className="relative inline-flex items-center">
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${statusInfo.bg}`}
              >
                {isChangingStatus ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <StatusIcon className="h-3.5 w-3.5" />
                )}
                <span>{statusInfo.label}</span>
              </span>
            </div>

            {/* Priority Badge */}
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold border ${priorityInfo.classes}`}
            >
              {priorityInfo.label}
            </span>
          </div>

          {/* Quick Status toggle buttons */}
          <div className="flex items-center gap-1">
            <button
              title="Đánh dấu To Do"
              onClick={() => handleQuickStatus("TODO")}
              disabled={isChangingStatus || task.status === "TODO"}
              className={`p-1 rounded text-xs transition-opacity ${
                task.status === "TODO"
                  ? "opacity-30 cursor-default"
                  : "text-slate-400 hover:text-amber-600 hover:bg-amber-50 cursor-pointer"
              }`}
            >
              <Clock className="h-3.5 w-3.5" />
            </button>
            <button
              title="Đánh dấu In Progress"
              onClick={() => handleQuickStatus("IN_PROGRESS")}
              disabled={isChangingStatus || task.status === "IN_PROGRESS"}
              className={`p-1 rounded text-xs transition-opacity ${
                task.status === "IN_PROGRESS"
                  ? "opacity-30 cursor-default"
                  : "text-slate-400 hover:text-blue-600 hover:bg-blue-50 cursor-pointer"
              }`}
            >
              <CircleDashed className="h-3.5 w-3.5" />
            </button>
            <button
              title="Đánh dấu Done"
              onClick={() => handleQuickStatus("DONE")}
              disabled={isChangingStatus || task.status === "DONE"}
              className={`p-1 rounded text-xs transition-opacity ${
                task.status === "DONE"
                  ? "opacity-30 cursor-default"
                  : "text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 cursor-pointer"
              }`}
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Task Title */}
        <h3
          className={`text-base font-bold text-slate-900 dark:text-white leading-snug break-words ${
            isDone ? "line-through text-slate-500 dark:text-slate-400" : ""
          }`}
        >
          {task.title}
        </h3>

        {/* Task Description */}
        {task.description && (
          <p
            className={`mt-2 text-sm leading-relaxed whitespace-pre-wrap break-words ${
              isDone
                ? "text-slate-400 dark:text-slate-500"
                : "text-slate-600 dark:text-slate-300"
            }`}
          >
            {task.description}
          </p>
        )}
      </div>

      {/* Card Footer: Due Date & Actions */}
      <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-2 text-xs">
        {/* Due Date */}
        <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 font-medium">
          {formattedDueDate ? (
            <>
              <Calendar className="h-3.5 w-3.5 text-slate-400" />
              <span>Hạn: {formattedDueDate}</span>
            </>
          ) : (
            <span className="text-slate-400 dark:text-slate-500 italic">Không có thời hạn</span>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => onEdit(task)}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-slate-600 hover:text-blue-600 hover:bg-blue-50 dark:text-slate-400 dark:hover:text-blue-400 dark:hover:bg-blue-950/50 transition-colors font-medium cursor-pointer"
            title="Sửa công việc"
          >
            <Edit3 className="h-3.5 w-3.5" />
            <span>Sửa</span>
          </button>
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-slate-600 hover:text-rose-600 hover:bg-rose-50 dark:text-slate-400 dark:hover:text-rose-400 dark:hover:bg-rose-950/50 transition-colors font-medium cursor-pointer disabled:opacity-50"
            title="Xóa công việc"
          >
            {isDeleting ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Trash2 className="h-3.5 w-3.5" />
            )}
            <span>Xóa</span>
          </button>
        </div>
      </div>
    </div>
  );
}
