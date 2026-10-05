"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import TaskForm from "@/components/TaskForm";
import TaskCard from "@/components/TaskCard";
import TaskEditModal from "@/components/TaskEditModal";
import TaskFilter from "@/components/TaskFilter";
import { TaskItem, CreateTaskInput, UpdateTaskInput } from "@/lib/types";
import { 
  AlertCircle, 
  Loader2, 
  Sparkles, 
  RefreshCw, 
  Inbox
} from "lucide-react";

export default function HomePage() {
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter & Search states
  const [selectedStatus, setSelectedStatus] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  // Edit Modal State
  const [editingTask, setEditingTask] = useState<TaskItem | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Notification Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  // Manual refresh tasks
  const refreshTasks = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/tasks");
      if (!res.ok) {
        const errData = await res.json().catch(() => null);
        throw new Error(errData?.error || "Không thể kết nối tới cơ sở dữ liệu. Vui lòng kiểm tra DATABASE_URL.");
      }
      const data = await res.json();
      setTasks(data);
      setError(null);
    } catch (err: unknown) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Đã có lỗi xảy ra.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let isCancelled = false;

    fetch("/api/tasks")
      .then(async (res) => {
        if (!res.ok) {
          const errData = await res.json().catch(() => null);
          throw new Error(errData?.error || "Không thể kết nối tới cơ sở dữ liệu. Vui lòng kiểm tra DATABASE_URL.");
        }
        return res.json();
      })
      .then((data) => {
        if (!isCancelled) {
          setTasks(data);
          setError(null);
          setIsLoading(false);
        }
      })
      .catch((err: unknown) => {
        if (!isCancelled) {
          setError(err instanceof Error ? err.message : "Đã có lỗi xảy ra.");
          setIsLoading(false);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, []);

  // Handle Create Task (POST /api/tasks)
  const handleCreateTask = async (data: CreateTaskInput): Promise<boolean> => {
    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Lỗi khi tạo công việc.");
      }

      const newTask = await res.json();
      // Update UI automatically without manual page reload
      setTasks((prev) => [newTask, ...prev]);
      showToast("Tạo công việc mới thành công! 🎉");
      return true;
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Tạo thất bại");
      return false;
    }
  };

  // Handle Edit Task (PUT /api/tasks/[id])
  const handleUpdateTask = async (id: string, data: UpdateTaskInput): Promise<boolean> => {
    try {
      const res = await fetch(`/api/tasks/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Lỗi khi cập nhật công việc.");
      }

      const updated = await res.json();
      // Update UI state directly
      setTasks((prev) => prev.map((t) => (t.id === id ? updated : t)));
      showToast("Cập nhật công việc thành công! ✨");
      return true;
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Cập nhật thất bại");
      return false;
    }
  };

  // Handle Quick Status Change
  const handleStatusChange = async (id: string, newStatus: string) => {
    await handleUpdateTask(id, { status: newStatus });
  };

  // Handle Delete Task (DELETE /api/tasks/[id])
  const handleDeleteTask = async (id: string) => {
    try {
      const res = await fetch(`/api/tasks/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Lỗi khi xóa công việc.");
      }

      // Remove from UI state directly
      setTasks((prev) => prev.filter((t) => t.id !== id));
      showToast("Đã xóa công việc khỏi danh sách.");
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Xóa thất bại");
    }
  };

  // Open Edit Modal
  const openEditModal = (task: TaskItem) => {
    setEditingTask(task);
    setIsEditModalOpen(true);
  };

  // Statistics
  const counts = useMemo(() => {
    return {
      all: tasks.length,
      todo: tasks.filter((t) => t.status === "TODO").length,
      inProgress: tasks.filter((t) => t.status === "IN_PROGRESS").length,
      done: tasks.filter((t) => t.status === "DONE").length,
    };
  }, [tasks]);

  // Filter & Search computation
  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      const matchesStatus =
        selectedStatus === "ALL" || task.status === selectedStatus;
      const matchesSearch =
        task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (task.description &&
          task.description.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesStatus && matchesSearch;
    });
  }, [tasks, selectedStatus, searchQuery]);

  return (
    <div className="flex-1 py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-xl bg-slate-900 text-white text-sm shadow-xl dark:bg-white dark:text-slate-900 animate-in slide-in-from-bottom-3 duration-200">
          <Sparkles className="h-4 w-4 text-amber-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Hero / Introduction Section */}
      <section className="mb-10 text-center sm:text-left">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 dark:bg-indigo-950/60 dark:border-indigo-800 dark:text-indigo-300 text-xs font-semibold mb-3">
              <Sparkles className="h-3.5 w-3.5 text-indigo-500" />
              <span>Assignment 2: Authentication & Team Workspace</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Task & Team Management
            </h1>
            <p className="mt-2 text-sm sm:text-base text-slate-600 dark:text-slate-400 max-w-2xl leading-relaxed">
              Hệ thống quản lý công việc và nhóm làm việc. Đăng nhập để tạo nhóm, mời thành viên theo email, phân công công việc và quản lý task trên bảng Kanban.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-center sm:justify-end gap-2.5 flex-wrap">
            <Link
              href="/teams"
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-semibold shadow-md shadow-blue-500/20 transition-all cursor-pointer"
            >
              <span>Vào Không Gian Nhóm</span>
              <span>→</span>
            </Link>
            <button
              onClick={refreshTasks}
              disabled={isLoading}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 text-xs font-semibold hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors shadow-2xs cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />
              <span>Đồng bộ DB</span>
            </button>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 shadow-2xs">
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Tổng công việc</p>
            <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">{counts.all}</p>
          </div>
          <div className="rounded-xl border border-amber-200/80 bg-amber-50/30 p-4 dark:border-amber-900/30 dark:bg-amber-950/10 shadow-2xs">
            <p className="text-xs font-medium text-amber-700 dark:text-amber-300">Cần làm (To Do)</p>
            <p className="mt-1 text-2xl font-bold text-amber-800 dark:text-amber-200">{counts.todo}</p>
          </div>
          <div className="rounded-xl border border-blue-200/80 bg-blue-50/30 p-4 dark:border-blue-900/30 dark:bg-blue-950/10 shadow-2xs">
            <p className="text-xs font-medium text-blue-700 dark:text-blue-300">Đang làm (In Progress)</p>
            <p className="mt-1 text-2xl font-bold text-blue-800 dark:text-blue-200">{counts.inProgress}</p>
          </div>
          <div className="rounded-xl border border-emerald-200/80 bg-emerald-50/30 p-4 dark:border-emerald-900/30 dark:bg-emerald-950/10 shadow-2xs">
            <p className="text-xs font-medium text-emerald-700 dark:text-emerald-300">Hoàn thành (Done)</p>
            <p className="mt-1 text-2xl font-bold text-emerald-800 dark:text-emerald-200">{counts.done}</p>
          </div>
        </div>
      </section>

      {/* Main Grid: Left = Form, Right = Task List */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Create Task Form (4 cols) */}
        <div className="lg:col-span-4 sticky top-24">
          <TaskForm onTaskCreated={handleCreateTask} />
        </div>

        {/* Right Column: Task List & Filters (8 cols) */}
        <div className="lg:col-span-8 space-y-5">
          {/* Filter Bar */}
          <TaskFilter
            currentStatus={selectedStatus}
            onStatusChange={setSelectedStatus}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            counts={counts}
          />

          {/* Database Connection Alert (if any) */}
          {error && (
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-sm dark:bg-amber-950/40 dark:border-amber-900 dark:text-amber-300 flex items-start gap-3">
              <AlertCircle className="h-5 w-5 shrink-0 mt-0.5 text-amber-600" />
              <div>
                <p className="font-semibold">Chưa kết nối được Database Supabase:</p>
                <p className="text-xs mt-1 text-amber-700 dark:text-amber-400">
                  {error}
                </p>
                <p className="text-xs mt-1">
                  Hãy đảm bảo bạn đã cung cấp <strong>DATABASE_URL</strong> trong file <code>.env</code> và chạy <code>npx prisma migrate dev</code>.
                </p>
              </div>
            </div>
          )}

          {/* Task List Content */}
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 rounded-2xl border border-dashed border-slate-300 bg-white/50 dark:border-slate-800 dark:bg-slate-900/50">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600 mb-3" />
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                Đang tải danh sách công việc từ Supabase...
              </p>
            </div>
          ) : filteredTasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-4 text-center rounded-2xl border border-dashed border-slate-300 bg-white/50 dark:border-slate-800 dark:bg-slate-900/50">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500 mb-3">
                <Inbox className="h-6 w-6" />
              </div>
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                Chưa có công việc nào
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xs">
                {searchQuery || selectedStatus !== "ALL"
                  ? "Không tìm thấy công việc phù hợp với bộ lọc hiện tại."
                  : "Hãy sử dụng form bên cạnh để tạo công việc đầu tiên của bạn!"}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredTasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onEdit={openEditModal}
                  onDelete={handleDeleteTask}
                  onStatusChange={handleStatusChange}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Edit Modal */}
      <TaskEditModal
        task={editingTask}
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingTask(null);
        }}
        onSave={handleUpdateTask}
      />
    </div>
  );
}
