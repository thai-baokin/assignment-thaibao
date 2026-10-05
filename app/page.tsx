"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import TaskForm from "@/components/TaskForm";
import TaskCard from "@/components/TaskCard";
import TaskEditModal from "@/components/TaskEditModal";
import TaskFilter from "@/components/TaskFilter";
import { TaskItem, CreateTaskInput, UpdateTaskInput } from "@/lib/types";
import { Loader2 } from "lucide-react";

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
        throw new Error(errData?.error || "Không thể kết nối cơ sở dữ liệu.");
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
          throw new Error(errData?.error || "Không thể kết nối cơ sở dữ liệu.");
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
      setTasks((prev) => [newTask, ...prev]);
      showToast("Tạo công việc thành công");
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
      setTasks((prev) => prev.map((t) => (t.id === id ? updated : t)));
      showToast("Cập nhật công việc thành công");
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

      setTasks((prev) => prev.filter((t) => t.id !== id));
      showToast("Đã xóa công việc khỏi danh sách");
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
        <div className="fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl bg-black text-white text-xs font-semibold shadow-2xl dark:bg-white dark:text-black animate-in slide-in-from-bottom-3 duration-200">
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Hero / Introduction Section (Monochrome B&W) */}
      <section className="mb-10 text-center sm:text-left">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="pill-3d inline-flex items-center px-3 py-1 rounded-full bg-zinc-100 border border-zinc-300 text-zinc-900 dark:bg-zinc-900 dark:border-zinc-800 dark:text-zinc-100 text-xs font-semibold mb-3">
              <span>Không gian làm việc</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-black dark:text-white tracking-tight">
              Quản lý Công việc & Đội ngũ
            </h1>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400 max-w-2xl leading-relaxed">
              Theo dõi tiến độ công việc, phân công nhiệm vụ và phối hợp nhóm hiệu quả.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-center sm:justify-end gap-2.5 flex-wrap">
            <Link
              href="/teams"
              className="btn-3d-primary px-4 py-2 text-xs tracking-tight cursor-pointer inline-flex items-center justify-center"
            >
              <span>Không gian nhóm</span>
            </Link>
            <button
              onClick={refreshTasks}
              disabled={isLoading}
              className="btn-3d-secondary px-3.5 py-2 text-xs tracking-tight cursor-pointer disabled:opacity-50 inline-flex items-center gap-1.5"
            >
              {isLoading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              <span>Làm mới</span>
            </button>
          </div>
        </div>

        {/* Quick Stats Grid (Monochrome 3D Stat Cards) */}
        <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3.5">
          <div className="stat-3d rounded-2xl p-4">
            <p className="text-xs font-semibold text-zinc-500">Tổng số</p>
            <p className="mt-1 text-2xl font-black text-black dark:text-white tracking-tight">{counts.all}</p>
          </div>
          <div className="stat-3d rounded-2xl p-4">
            <p className="text-xs font-semibold text-zinc-500">Cần làm</p>
            <p className="mt-1 text-2xl font-black text-black dark:text-white tracking-tight">{counts.todo}</p>
          </div>
          <div className="stat-3d rounded-2xl p-4">
            <p className="text-xs font-semibold text-zinc-500">Đang làm</p>
            <p className="mt-1 text-2xl font-black text-black dark:text-white tracking-tight">{counts.inProgress}</p>
          </div>
          <div className="stat-3d rounded-2xl p-4">
            <p className="text-xs font-semibold text-zinc-500">Hoàn thành</p>
            <p className="mt-1 text-2xl font-black text-black dark:text-white tracking-tight">{counts.done}</p>
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
            <div className="p-3.5 rounded-xl bg-zinc-100 border border-zinc-300 text-zinc-900 text-xs dark:bg-zinc-900 dark:border-zinc-800 dark:text-zinc-100">
              <p className="font-bold">Chưa kết nối được cơ sở dữ liệu:</p>
              <p className="mt-1 text-zinc-600 dark:text-zinc-400">{error}</p>
            </div>
          )}

          {/* Task List Content */}
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 rounded-2xl border border-dashed border-zinc-300 bg-white/50 dark:border-zinc-800 dark:bg-zinc-950/50 backdrop-blur-sm">
              <Loader2 className="h-6 w-6 animate-spin text-black dark:text-white mb-2" />
              <p className="text-xs font-semibold text-zinc-500">
                Đang tải danh sách công việc...
              </p>
            </div>
          ) : filteredTasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-4 text-center rounded-2xl border border-dashed border-zinc-300 bg-white/40 dark:border-zinc-800 dark:bg-zinc-950/40 backdrop-blur-sm">
              <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                Chưa có công việc nào
              </h3>
              <p className="text-xs text-zinc-500 mt-1 max-w-xs">
                {searchQuery || selectedStatus !== "ALL"
                  ? "Không có công việc phù hợp với bộ lọc."
                  : "Bắt đầu bằng việc thêm công việc mới bên cạnh."}
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
