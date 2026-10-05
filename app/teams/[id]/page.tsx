"use client";

import { useEffect, useState, useCallback, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import {
  Users,
  Plus,
  Crown,
  ShieldCheck,
  CheckSquare,
  ArrowLeft,
  Calendar,
  UserPlus,
  Trash2,
  Edit2,
  AlertCircle,
  Loader2,
  X,
  Search,
  Kanban,
  Table as TableIcon,
  LogOut,
  Clock,
  Sparkles,
  UserCheck,
  User as UserIcon,
} from "lucide-react";

interface TeamMember {
  id: string;
  role: string;
  joinedAt: string;
  userId: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
}

interface TaskItem {
  id: string;
  title: string;
  description: string | null;
  status: "TODO" | "IN_PROGRESS" | "DONE";
  priority: "LOW" | "MEDIUM" | "HIGH";
  dueDate: string | null;
  teamId: string;
  creatorId: string;
  assigneeId: string | null;
  createdAt: string;
  creator?: {
    id: string;
    name: string;
    email: string;
  };
  assignee?: {
    id: string;
    name: string;
    email: string;
  } | null;
}

interface TeamDetail {
  id: string;
  name: string;
  description: string | null;
  ownerId: string;
  createdAt: string;
  owner: {
    id: string;
    name: string;
    email: string;
  };
  members: TeamMember[];
  tasks: TaskItem[];
}

export default function TeamDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const teamId = resolvedParams.id;
  const router = useRouter();
  const { user } = useAuth();

  const [team, setTeam] = useState<TeamDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Tab: 'tasks' | 'members'
  const [activeTab, setActiveTab] = useState<"tasks" | "members">("tasks");
  // Task View mode: 'board' | 'table'
  const [viewMode, setViewMode] = useState<"board" | "table">("board");

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [priorityFilter, setPriorityFilter] = useState<string>("ALL");
  const [assigneeFilter, setAssigneeFilter] = useState<string>("ALL");

  // Modals
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<TaskItem | null>(null);
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
  const [isEditTeamOpen, setIsEditTeamOpen] = useState(false);

  // Form states for Task
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDesc, setTaskDesc] = useState("");
  const [taskStatus, setTaskStatus] = useState<"TODO" | "IN_PROGRESS" | "DONE">("TODO");
  const [taskPriority, setTaskPriority] = useState<"LOW" | "MEDIUM" | "HIGH">("MEDIUM");
  const [taskDueDate, setTaskDueDate] = useState("");
  const [taskAssigneeId, setTaskAssigneeId] = useState("");
  const [taskSubmitting, setTaskSubmitting] = useState(false);
  const [taskError, setTaskError] = useState<string | null>(null);

  // Form state for Member
  const [memberEmail, setMemberEmail] = useState("");
  const [memberSubmitting, setMemberSubmitting] = useState(false);
  const [memberError, setMemberError] = useState<string | null>(null);

  // Form state for Team Edit
  const [teamNameEdit, setTeamNameEdit] = useState("");
  const [teamDescEdit, setTeamDescEdit] = useState("");
  const [teamSubmitting, setTeamSubmitting] = useState(false);

  const fetchTeamData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`/api/teams/${teamId}`);
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Không thể tải thông tin nhóm.");
      }
      const data = await res.json();
      setTeam(data);
      setTeamNameEdit(data.name);
      setTeamDescEdit(data.description || "");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Đã xảy ra lỗi khi tải dữ liệu.");
    } finally {
      setLoading(false);
    }
  }, [teamId]);

  useEffect(() => {
    fetchTeamData();
  }, [fetchTeamData]);

  const isOwner = user?.id === team?.ownerId;

  // Open Task Modal (Create or Edit)
  const openCreateTask = () => {
    setEditingTask(null);
    setTaskTitle("");
    setTaskDesc("");
    setTaskStatus("TODO");
    setTaskPriority("MEDIUM");
    setTaskDueDate("");
    setTaskAssigneeId("");
    setTaskError(null);
    setIsTaskModalOpen(true);
  };

  const openEditTask = (task: TaskItem) => {
    setEditingTask(task);
    setTaskTitle(task.title);
    setTaskDesc(task.description || "");
    setTaskStatus(task.status);
    setTaskPriority(task.priority);
    setTaskDueDate(task.dueDate ? new Date(task.dueDate).toISOString().split("T")[0] : "");
    setTaskAssigneeId(task.assigneeId || "");
    setTaskError(null);
    setIsTaskModalOpen(true);
  };

  // Submit Task (Create or Edit)
  const handleSaveTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle.trim()) return;

    setTaskSubmitting(true);
    setTaskError(null);

    const payload = {
      title: taskTitle.trim(),
      description: taskDesc.trim() || null,
      status: taskStatus,
      priority: taskPriority,
      dueDate: taskDueDate ? new Date(taskDueDate).toISOString() : null,
      assigneeId: taskAssigneeId || null,
    };

    try {
      const url = editingTask ? `/api/tasks/${editingTask.id}` : `/api/teams/${teamId}/tasks`;
      const method = editingTask ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Không thể lưu công việc.");
      }

      setIsTaskModalOpen(false);
      fetchTeamData();
    } catch (err: unknown) {
      setTaskError(err instanceof Error ? err.message : "Lỗi khi lưu task.");
    } finally {
      setTaskSubmitting(false);
    }
  };

  // Quick Status change (for Kanban board quick action)
  const handleQuickStatusChange = async (task: TaskItem, newStatus: "TODO" | "IN_PROGRESS" | "DONE") => {
    try {
      const res = await fetch(`/api/tasks/${task.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        fetchTeamData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Delete Task
  const handleDeleteTask = async (task: TaskItem) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa công việc "${task.title}" không?`)) return;

    try {
      const res = await fetch(`/api/tasks/${task.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Không thể xóa công việc.");
        return;
      }
      fetchTeamData();
    } catch (err) {
      alert("Lỗi khi xóa công việc.");
    }
  };

  // Add Member
  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!memberEmail.trim()) return;

    setMemberSubmitting(true);
    setMemberError(null);

    try {
      const res = await fetch(`/api/teams/${teamId}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: memberEmail.trim(), role: "MEMBER" }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Không thể thêm thành viên.");
      }

      setMemberEmail("");
      setIsAddMemberOpen(false);
      fetchTeamData();
    } catch (err: unknown) {
      setMemberError(err instanceof Error ? err.message : "Lỗi khi thêm thành viên.");
    } finally {
      setMemberSubmitting(false);
    }
  };

  // Remove Member / Leave Team
  const handleRemoveMember = async (targetUserId: string, targetName: string) => {
    const isSelf = user?.id === targetUserId;
    const confirmMsg = isSelf
      ? "Bạn có chắc chắn muốn rời khỏi nhóm này không?"
      : `Bạn có chắc chắn muốn xóa thành viên "${targetName}" khỏi nhóm?`;

    if (!confirm(confirmMsg)) return;

    try {
      const res = await fetch(`/api/teams/${teamId}/members/${targetUserId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Không thể xóa thành viên.");
        return;
      }

      if (isSelf) {
        router.push("/teams");
      } else {
        fetchTeamData();
      }
    } catch {
      alert("Lỗi khi xử lý thành viên.");
    }
  };

  // Update Team Info
  const handleUpdateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    setTeamSubmitting(true);
    try {
      const res = await fetch(`/api/teams/${teamId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: teamNameEdit.trim(),
          description: teamDescEdit.trim() || null,
        }),
      });
      if (res.ok) {
        setIsEditTeamOpen(false);
        fetchTeamData();
      }
    } finally {
      setTeamSubmitting(false);
    }
  };

  // Delete Team
  const handleDeleteTeam = async () => {
    if (!confirm("BẠN CÓ CHẮC CHẮN MUỐN XÓA TOÀN BỘ NHÓM NÀY?\nMọi công việc và dữ liệu thành viên sẽ bị xóa vĩnh viễn.")) return;

    try {
      const res = await fetch(`/api/teams/${teamId}`, { method: "DELETE" });
      if (res.ok) {
        router.push("/teams");
      } else {
        const data = await res.json();
        alert(data.error || "Lỗi khi xóa nhóm.");
      }
    } catch {
      alert("Lỗi khi kết nối máy chủ.");
    }
  };

  // Filter tasks logic
  const filteredTasks = (team?.tasks || []).filter((task) => {
    const matchesSearch =
      task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (task.description && task.description.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus = statusFilter === "ALL" || task.status === statusFilter;
    const matchesPriority = priorityFilter === "ALL" || task.priority === priorityFilter;

    let matchesAssignee = true;
    if (assigneeFilter === "UNASSIGNED") {
      matchesAssignee = !task.assigneeId;
    } else if (assigneeFilter === "ME") {
      matchesAssignee = task.assigneeId === user?.id;
    } else if (assigneeFilter !== "ALL") {
      matchesAssignee = task.assigneeId === assigneeFilter;
    }

    return matchesSearch && matchesStatus && matchesPriority && matchesAssignee;
  });

  if (loading) {
    return (
      <div className="flex-1 py-24 flex flex-col items-center justify-center text-slate-400">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600 mb-3" />
        <p className="text-sm font-medium">Đang tải không gian làm việc của nhóm...</p>
      </div>
    );
  }

  if (error || !team) {
    return (
      <div className="flex-1 max-w-xl mx-auto py-16 px-4 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-50 text-rose-600 mb-4">
          <AlertCircle className="h-7 w-7" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Không thể truy cập nhóm</h2>
        <p className="mt-2 text-sm text-slate-500">{error || "Nhóm không tồn tại hoặc bạn không có quyền truy cập."}</p>
        <Link
          href="/teams"
          className="mt-6 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Quay lại Danh sách Nhóm</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="flex-1 py-6 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full space-y-6">
      {/* Top Breadcrumb & Nav */}
      <div className="flex items-center justify-between">
        <Link
          href="/teams"
          className="text-xs font-semibold text-zinc-500 hover:text-black dark:text-zinc-400 dark:hover:text-white transition-colors"
        >
          ← Danh sách các nhóm
        </Link>

        {/* Owner Settings Actions */}
        {isOwner && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsEditTeamOpen(true)}
              className="btn-3d-secondary px-3 py-1.5 text-xs font-semibold cursor-pointer"
            >
              <span>Sửa nhóm</span>
            </button>
            <button
              onClick={handleDeleteTeam}
              className="px-3 py-1.5 rounded-xl border border-zinc-300 bg-white hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:bg-zinc-900 text-xs font-semibold text-zinc-600 hover:text-rose-600 dark:text-zinc-400 dark:hover:text-rose-400 transition-colors cursor-pointer"
            >
              <span>Xóa nhóm</span>
            </button>
          </div>
        )}
      </div>

      {/* Team Header Banner (3D Card Surface) */}
      <div className="card-3d rounded-2xl p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-2xl sm:text-3xl font-black text-black dark:text-white tracking-tight">
              {team.name}
            </h1>
            {isOwner ? (
              <span className="pill-3d px-2.5 py-0.5 rounded-full text-xs font-bold bg-black text-white dark:bg-white dark:text-black border border-black dark:border-white">
                Trưởng nhóm
              </span>
            ) : (
              <span className="pill-3d px-2.5 py-0.5 rounded-full text-xs font-semibold bg-zinc-100 text-zinc-800 border border-zinc-300 dark:bg-zinc-800 dark:text-zinc-200 dark:border-zinc-700">
                Thành viên
              </span>
            )}
          </div>
          <p className="mt-1 text-xs sm:text-sm text-zinc-500 max-w-2xl">
            {team.description || "Chưa có mô tả cho nhóm."}
          </p>
          <div className="mt-3 flex items-center gap-3 text-xs text-zinc-400">
            <span>Tạo bởi: <strong className="text-zinc-700 dark:text-zinc-300">{team.owner.name}</strong></span>
            <span>•</span>
            <span>{team.members.length} thành viên</span>
            <span>•</span>
            <span>{team.tasks.length} công việc</span>
          </div>
        </div>

        {/* Quick Action Button */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={openCreateTask}
            className="btn-3d-primary px-4 py-2.5 text-xs font-semibold cursor-pointer inline-flex items-center justify-center"
          >
            <span>Tạo công việc</span>
          </button>
        </div>
      </div>

      {/* Tabs Switcher: Tasks vs Members */}
      <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800">
        <div className="flex gap-4">
          <button
            onClick={() => setActiveTab("tasks")}
            className={`pb-3 text-xs sm:text-sm font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === "tasks"
                ? "border-black text-black dark:border-white dark:text-white"
                : "border-transparent text-zinc-500 hover:text-black dark:text-zinc-400 dark:hover:text-white"
            }`}
          >
            <span>Công việc ({team.tasks.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("members")}
            className={`pb-3 text-xs sm:text-sm font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === "members"
                ? "border-black text-black dark:border-white dark:text-white"
                : "border-transparent text-zinc-500 hover:text-black dark:text-zinc-400 dark:hover:text-white"
            }`}
          >
            <span>Thành viên ({team.members.length})</span>
          </button>
        </div>

        {/* View Mode Toggle when on Tasks tab */}
        {activeTab === "tasks" && (
          <div className="flex items-center gap-1 pb-2">
            <button
              onClick={() => setViewMode("board")}
              title="Dạng Bảng Kanban"
              className={`p-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                viewMode === "board"
                  ? "bg-black text-white dark:bg-white dark:text-black"
                  : "text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              }`}
            >
              <Kanban className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode("table")}
              title="Dạng Danh sách"
              className={`p-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                viewMode === "table"
                  ? "bg-black text-white dark:bg-white dark:text-black"
                  : "text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              }`}
            >
              <TableIcon className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>

      {/* ============================================================== */}
      {/* TAB 1: TASKS VIEW */}
      {/* ============================================================== */}
      {activeTab === "tasks" && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 bg-white/90 dark:bg-zinc-950/90 backdrop-blur-md p-3 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-2xs">
            {/* Search Input */}
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm kiếm công việc..."
                className="w-full rounded-xl border border-zinc-300 bg-white py-2 px-3 text-xs text-black outline-none transition-all placeholder:text-zinc-400 focus:border-black dark:border-zinc-700 dark:bg-zinc-950 dark:text-white dark:placeholder:text-zinc-500 shadow-2xs"
              />
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-xl border border-zinc-300 bg-white py-2 px-3 text-xs text-black outline-none focus:border-black dark:border-zinc-700 dark:bg-zinc-950 dark:text-white shadow-2xs"
            >
              <option value="ALL">Mọi trạng thái</option>
              <option value="TODO">Cần làm</option>
              <option value="IN_PROGRESS">Đang làm</option>
              <option value="DONE">Hoàn thành</option>
            </select>

            {/* Priority Filter */}
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="rounded-xl border border-zinc-300 bg-white py-2 px-3 text-xs text-black outline-none focus:border-black dark:border-zinc-700 dark:bg-zinc-950 dark:text-white shadow-2xs"
            >
              <option value="ALL">Mọi ưu tiên</option>
              <option value="HIGH">Cao</option>
              <option value="MEDIUM">Trung bình</option>
              <option value="LOW">Thấp</option>
            </select>

            {/* Assignee Filter */}
            <select
              value={assigneeFilter}
              onChange={(e) => setAssigneeFilter(e.target.value)}
              className="rounded-xl border border-zinc-300 bg-white py-2 px-3 text-xs text-black outline-none focus:border-black dark:border-zinc-700 dark:bg-zinc-950 dark:text-white shadow-2xs"
            >
              <option value="ALL">Tất cả thành viên</option>
              <option value="ME">Công việc của tôi</option>
              <option value="UNASSIGNED">Chưa phân công</option>
              {team.members.map((m) => (
                <option key={m.userId} value={m.userId}>
                  {m.user.name} ({m.role === "OWNER" ? "Trưởng nhóm" : "Thành viên"})
                </option>
              ))}
            </select>
          </div>

          {/* Empty tasks state */}
          {filteredTasks.length === 0 ? (
            <div className="py-16 text-center rounded-2xl border-2 border-dashed border-zinc-300 dark:border-zinc-800 bg-white/40 dark:bg-zinc-950/40 backdrop-blur-sm">
              <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100">Không tìm thấy công việc nào</p>
              <p className="text-xs text-zinc-500 mt-1">
                {team.tasks.length === 0
                  ? "Bấm 'Tạo công việc' để bắt đầu giao việc cho thành viên."
                  : "Thử điều chỉnh lại bộ lọc."}
              </p>
            </div>
          ) : viewMode === "board" ? (
            /* ========================================== */
            /* KANBAN BOARD VIEW (3D Columns & Cards)     */
            /* ========================================== */
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {(["TODO", "IN_PROGRESS", "DONE"] as const).map((colStatus) => {
                const columnTasks = filteredTasks.filter((t) => t.status === colStatus);
                const colTitle =
                  colStatus === "TODO"
                    ? "Cần làm"
                    : colStatus === "IN_PROGRESS"
                    ? "Đang làm"
                    : "Hoàn thành";

                const colColor =
                  colStatus === "TODO"
                    ? "border-zinc-300 bg-zinc-100 text-zinc-800 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200"
                    : colStatus === "IN_PROGRESS"
                    ? "border-zinc-400 bg-zinc-200 text-zinc-900 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
                    : "border-black bg-black text-white dark:border-white dark:bg-white dark:text-black";

                return (
                  <div
                    key={colStatus}
                    className="flex flex-col rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-950/50 backdrop-blur-sm p-4 min-h-[460px] shadow-2xs"
                  >
                    {/* Column Header */}
                    <div className="flex items-center justify-between pb-3 mb-3 border-b border-zinc-200 dark:border-zinc-800">
                      <span className={`pill-3d px-2.5 py-0.5 rounded-full text-xs font-bold border ${colColor}`}>
                        {colTitle}
                      </span>
                      <span className="text-xs font-bold text-zinc-400">{columnTasks.length}</span>
                    </div>

                    {/* Column Task Cards */}
                    <div className="flex-1 space-y-3 overflow-y-auto">
                      {columnTasks.map((task) => {
                        const canDelete =
                          user?.id === task.creatorId ||
                          user?.id === task.assigneeId ||
                          user?.id === team.ownerId;

                        const priorityBadge =
                          task.priority === "HIGH"
                            ? "bg-black text-white border-black dark:bg-white dark:text-black dark:border-white font-bold"
                            : task.priority === "MEDIUM"
                            ? "bg-zinc-200 text-zinc-800 border-zinc-300 dark:bg-zinc-800 dark:text-zinc-200 dark:border-zinc-700 font-semibold"
                            : "bg-zinc-100 text-zinc-600 border-zinc-200 dark:bg-zinc-900 dark:text-zinc-400 dark:border-zinc-800";

                        const priorityLabel =
                          task.priority === "HIGH"
                            ? "Cao"
                            : task.priority === "MEDIUM"
                            ? "Trung bình"
                            : "Thấp";

                        return (
                          <div
                            key={task.id}
                            className="card-3d group rounded-2xl p-4 transition-all flex flex-col justify-between"
                          >
                            <div>
                              <div className="flex items-start justify-between gap-2 mb-2">
                                <span className={`pill-3d px-2 py-0.5 rounded text-[10px] border ${priorityBadge}`}>
                                  {priorityLabel}
                                </span>

                                <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                                  <button
                                    onClick={() => openEditTask(task)}
                                    title="Sửa công việc"
                                    className="px-2 py-0.5 rounded-md text-[11px] font-semibold text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800 cursor-pointer"
                                  >
                                    Sửa
                                  </button>
                                  {canDelete && (
                                    <button
                                      onClick={() => handleDeleteTask(task)}
                                      title="Xóa công việc"
                                      className="px-2 py-0.5 rounded-md text-[11px] font-semibold text-zinc-500 hover:text-rose-600 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
                                    >
                                      Xóa
                                    </button>
                                  )}
                                </div>
                              </div>

                              <h4 className="text-sm font-bold text-black dark:text-white leading-snug">
                                {task.title}
                              </h4>
                              {task.description && (
                                <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400 line-clamp-2">
                                  {task.description}
                                </p>
                              )}
                            </div>

                            <div className="mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-800/80 flex flex-col gap-2">
                              {/* Assignee & Due Date */}
                              <div className="flex items-center justify-between text-[11px] text-zinc-500">
                                <div className="flex items-center gap-1.5" title={`Phụ trách: ${task.assignee?.name || "Chưa phân công"}`}>
                                  <div className="flex h-5 w-5 items-center justify-center rounded-full bg-black text-white dark:bg-white dark:text-black font-bold text-[10px]">
                                    {task.assignee ? task.assignee.name.charAt(0) : "?"}
                                  </div>
                                  <span className="truncate max-w-[90px] font-medium">
                                    {task.assignee ? task.assignee.name : "Chưa gán"}
                                  </span>
                                </div>

                                {task.dueDate && (
                                  <div className="text-zinc-500 dark:text-zinc-400 font-medium">
                                    <span>Hạn: {new Date(task.dueDate).toLocaleDateString("vi-VN")}</span>
                                  </div>
                                )}
                              </div>

                              {/* Quick Move Buttons */}
                              <div className="flex items-center gap-1 pt-1 justify-end">
                                {colStatus !== "TODO" && (
                                  <button
                                    onClick={() => handleQuickStatusChange(task, "TODO")}
                                    className="px-2 py-0.5 text-[10px] font-semibold rounded-md bg-zinc-100 text-zinc-700 hover:bg-black hover:text-white dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-white dark:hover:text-black cursor-pointer transition-colors"
                                  >
                                    Cần làm
                                  </button>
                                )}
                                {colStatus !== "IN_PROGRESS" && (
                                  <button
                                    onClick={() => handleQuickStatusChange(task, "IN_PROGRESS")}
                                    className="px-2 py-0.5 text-[10px] font-semibold rounded-md bg-zinc-100 text-zinc-700 hover:bg-black hover:text-white dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-white dark:hover:text-black cursor-pointer transition-colors"
                                  >
                                    Đang làm
                                  </button>
                                )}
                                {colStatus !== "DONE" && (
                                  <button
                                    onClick={() => handleQuickStatusChange(task, "DONE")}
                                    className="px-2 py-0.5 text-[10px] font-semibold rounded-md bg-zinc-100 text-zinc-700 hover:bg-black hover:text-white dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-white dark:hover:text-black cursor-pointer transition-colors"
                                  >
                                    Hoàn thành
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* ========================================== */
            /* TABLE / LIST VIEW                          */
            /* ========================================== */
            <div className="card-3d rounded-2xl overflow-hidden shadow-2xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-zinc-50 dark:bg-zinc-950 text-zinc-500 uppercase tracking-wider font-bold border-b border-zinc-200 dark:border-zinc-800 text-[10px]">
                    <tr>
                      <th className="py-3 px-4">Công việc</th>
                      <th className="py-3 px-4">Trạng thái</th>
                      <th className="py-3 px-4">Ưu tiên</th>
                      <th className="py-3 px-4">Phụ trách</th>
                      <th className="py-3 px-4">Hạn chót</th>
                      <th className="py-3 px-4 text-right">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/80">
                    {filteredTasks.map((task) => {
                      const canDelete =
                        user?.id === task.creatorId ||
                        user?.id === task.assigneeId ||
                        user?.id === team.ownerId;

                      const statusLabel =
                        task.status === "DONE"
                          ? "Hoàn thành"
                          : task.status === "IN_PROGRESS"
                          ? "Đang làm"
                          : "Cần làm";

                      const statusBadge =
                        task.status === "DONE"
                          ? "bg-black text-white border-black dark:bg-white dark:text-black dark:border-white font-bold"
                          : task.status === "IN_PROGRESS"
                          ? "bg-zinc-200 text-zinc-900 border-zinc-300 dark:bg-zinc-800 dark:text-zinc-100 dark:border-zinc-700"
                          : "bg-zinc-100 text-zinc-700 border-zinc-200 dark:bg-zinc-900 dark:text-zinc-300 dark:border-zinc-800";

                      const priorityLabel =
                        task.priority === "HIGH"
                          ? "Cao"
                          : task.priority === "MEDIUM"
                          ? "Trung bình"
                          : "Thấp";

                      const priorityBadge =
                        task.priority === "HIGH"
                          ? "text-black dark:text-white font-bold"
                          : task.priority === "MEDIUM"
                          ? "text-zinc-700 dark:text-zinc-300 font-semibold"
                          : "text-zinc-400";

                      return (
                        <tr key={task.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/40 transition-colors">
                          <td className="py-3.5 px-4 font-semibold text-black dark:text-white max-w-xs">
                            <p className="truncate">{task.title}</p>
                            {task.description && (
                              <p className="text-[11px] font-normal text-zinc-400 truncate">{task.description}</p>
                            )}
                          </td>
                          <td className="py-3.5 px-4">
                            <span className={`pill-3d px-2 py-0.5 rounded-full text-[10px] font-bold border ${statusBadge}`}>
                              {statusLabel}
                            </span>
                          </td>
                          <td className="py-3.5 px-4">
                            <span className={priorityBadge}>{priorityLabel}</span>
                          </td>
                          <td className="py-3.5 px-4 text-zinc-700 dark:text-zinc-300">
                            {task.assignee ? (
                              <div className="flex items-center gap-1.5">
                                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-black text-white dark:bg-white dark:text-black font-bold text-[10px]">
                                  {task.assignee.name.charAt(0)}
                                </div>
                                <span className="font-medium">{task.assignee.name}</span>
                              </div>
                            ) : (
                              <span className="text-zinc-400 italic">Chưa gán</span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-zinc-500">
                            {task.dueDate ? new Date(task.dueDate).toLocaleDateString("vi-VN") : "—"}
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => openEditTask(task)}
                                className="px-2 py-1 rounded-md text-xs font-semibold text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800 cursor-pointer"
                              >
                                Sửa
                              </button>
                              {canDelete && (
                                <button
                                  onClick={() => handleDeleteTask(task)}
                                  className="px-2 py-1 rounded-md text-xs font-semibold text-zinc-500 hover:text-rose-600 hover:bg-zinc-100 dark:hover:bg-zinc-900 cursor-pointer"
                                >
                                  Xóa
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 2: MEMBERS VIEW                                            */}
      {/* ============================================================== */}
      {activeTab === "members" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-black dark:text-white">Thành viên nhóm</h3>
              <p className="text-xs text-zinc-500">Danh sách các thành viên cùng tham gia nhóm làm việc.</p>
            </div>

            {/* Owner Add Member Button */}
            {isOwner && (
              <button
                onClick={() => setIsAddMemberOpen(true)}
                className="btn-3d-primary px-3.5 py-2 text-xs font-semibold cursor-pointer inline-flex items-center justify-center"
              >
                <span>Mời thành viên</span>
              </button>
            )}
          </div>

          <div className="card-3d rounded-2xl overflow-hidden shadow-2xs">
            <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {team.members.map((m) => {
                const isMemberOwner = m.role === "OWNER" || m.userId === team.ownerId;
                const isCurrent = m.userId === user?.id;

                return (
                  <div key={m.id} className="p-4 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-black text-white dark:bg-white dark:text-black font-bold text-sm uppercase shadow-2xs">
                        {m.user.name.charAt(0)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-bold text-black dark:text-white">{m.user.name}</p>
                          {isCurrent && (
                            <span className="text-[10px] font-semibold bg-zinc-200 text-black dark:bg-zinc-800 dark:text-white px-1.5 py-0.5 rounded">
                              Bạn
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-zinc-500">{m.user.email}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      {isMemberOwner ? (
                        <span className="pill-3d px-2.5 py-0.5 rounded-full text-xs font-bold bg-black text-white dark:bg-white dark:text-black border border-black dark:border-white">
                          Trưởng nhóm
                        </span>
                      ) : (
                        <span className="pill-3d px-2.5 py-0.5 rounded-full text-xs font-semibold bg-zinc-100 text-zinc-800 border border-zinc-300 dark:bg-zinc-800 dark:text-zinc-200 dark:border-zinc-700">
                          Thành viên
                        </span>
                      )}

                      {/* Action buttons */}
                      {isOwner && !isMemberOwner && (
                        <button
                          onClick={() => handleRemoveMember(m.userId, m.user.name)}
                          className="px-2.5 py-1 rounded-lg text-xs font-semibold text-zinc-500 hover:text-rose-600 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors cursor-pointer"
                        >
                          Xóa
                        </button>
                      )}

                      {/* Leave team if current user is member (not owner) */}
                      {!isOwner && isCurrent && (
                        <button
                          onClick={() => handleRemoveMember(m.userId, m.user.name)}
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold text-zinc-600 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 dark:text-zinc-300 cursor-pointer"
                        >
                          <span>Rời nhóm</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}


      {/* ============================================================== */}
      {/* MODAL 1: CREATE / EDIT TASK                                    */}
      {/* ============================================================== */}
      {isTaskModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-150">
          <div className="card-3d relative w-full max-w-lg rounded-2xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
            <div className="flex items-center justify-between pb-3.5 border-b border-zinc-200 dark:border-zinc-800">
              <h3 className="text-base font-bold text-black dark:text-white tracking-tight">
                {editingTask ? "Chỉnh sửa công việc" : "Tạo công việc mới"}
              </h3>
              <button
                onClick={() => setIsTaskModalOpen(false)}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-black hover:bg-zinc-100 dark:hover:text-white dark:hover:bg-zinc-900 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {taskError && (
              <div className="mt-4 rounded-xl border border-zinc-300 bg-zinc-100 p-3 text-xs text-zinc-900 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100">
                <span>{taskError}</span>
              </div>
            )}

            <form onSubmit={handleSaveTask} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                  Tiêu đề <span className="text-black dark:text-white">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  placeholder="Ví dụ: Thiết kế giao diện Dashboard..."
                  className="w-full rounded-xl border border-zinc-300 bg-white py-2 px-3 text-xs text-black outline-none focus:border-black dark:border-zinc-700 dark:bg-zinc-950 dark:text-white dark:placeholder:text-zinc-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                  Mô tả
                </label>
                <textarea
                  rows={3}
                  value={taskDesc}
                  onChange={(e) => setTaskDesc(e.target.value)}
                  placeholder="Chi tiết công việc..."
                  className="w-full rounded-xl border border-zinc-300 bg-white py-2 px-3 text-xs text-black outline-none focus:border-black dark:border-zinc-700 dark:bg-zinc-950 dark:text-white dark:placeholder:text-zinc-500 resize-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                    Trạng thái
                  </label>
                  <select
                    value={taskStatus}
                    onChange={(e) => setTaskStatus(e.target.value as "TODO" | "IN_PROGRESS" | "DONE")}
                    className="w-full rounded-xl border border-zinc-300 bg-white py-2 px-2.5 text-xs text-black outline-none focus:border-black dark:border-zinc-700 dark:bg-zinc-950 dark:text-white"
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
                    value={taskPriority}
                    onChange={(e) => setTaskPriority(e.target.value as "LOW" | "MEDIUM" | "HIGH")}
                    className="w-full rounded-xl border border-zinc-300 bg-white py-2 px-2.5 text-xs text-black outline-none focus:border-black dark:border-zinc-700 dark:bg-zinc-950 dark:text-white"
                  >
                    <option value="LOW">Thấp</option>
                    <option value="MEDIUM">Trung bình</option>
                    <option value="HIGH">Cao</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                    Phân công
                  </label>
                  <select
                    value={taskAssigneeId}
                    onChange={(e) => setTaskAssigneeId(e.target.value)}
                    className="w-full rounded-xl border border-zinc-300 bg-white py-2 px-2.5 text-xs text-black outline-none focus:border-black dark:border-zinc-700 dark:bg-zinc-950 dark:text-white"
                  >
                    <option value="">-- Chưa phân công --</option>
                    {team.members.map((m) => (
                      <option key={m.userId} value={m.userId}>
                        {m.user.name} ({m.role === "OWNER" ? "Trưởng nhóm" : "Thành viên"})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                    Hạn chót
                  </label>
                  <input
                    type="date"
                    value={taskDueDate}
                    onChange={(e) => setTaskDueDate(e.target.value)}
                    className="w-full rounded-xl border border-zinc-300 bg-white py-1.5 px-2.5 text-xs text-black outline-none focus:border-black dark:border-zinc-700 dark:bg-zinc-950 dark:text-white"
                  />
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-zinc-200 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsTaskModalOpen(false)}
                  className="btn-3d-secondary px-4 py-2 text-xs cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={taskSubmitting || !taskTitle.trim()}
                  className="btn-3d-primary px-4 py-2 text-xs disabled:opacity-50 cursor-pointer inline-flex items-center gap-1.5"
                >
                  {taskSubmitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  <span>{taskSubmitting ? "Đang lưu..." : editingTask ? "Lưu thay đổi" : "Tạo công việc"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 2: ADD TEAM MEMBER BY EMAIL                              */}
      {/* ============================================================== */}
      {isAddMemberOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-150">
          <div className="card-3d relative w-full max-w-md rounded-2xl p-6 shadow-2xl border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
            <div className="flex items-center justify-between pb-3.5 border-b border-zinc-200 dark:border-zinc-800">
              <h3 className="text-base font-bold text-black dark:text-white tracking-tight">
                Mời thành viên
              </h3>
              <button
                onClick={() => setIsAddMemberOpen(false)}
                className="p-1.5 rounded-lg text-zinc-400 hover:bg-zinc-100 hover:text-black dark:hover:bg-zinc-900 dark:hover:text-white cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {memberError && (
              <div className="mt-4 rounded-xl border border-zinc-300 bg-zinc-100 p-3 text-xs text-zinc-900 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100">
                <span>{memberError}</span>
              </div>
            )}

            <form onSubmit={handleAddMember} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                  Email thành viên <span className="text-black dark:text-white">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={memberEmail}
                  onChange={(e) => setMemberEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="w-full rounded-xl border border-zinc-300 bg-white py-2 px-3 text-xs text-black outline-none focus:border-black dark:border-zinc-700 dark:bg-zinc-950 dark:text-white dark:placeholder:text-zinc-500"
                />
                <p className="mt-1.5 text-[11px] text-zinc-400">
                  Thành viên cần có tài khoản trên hệ thống để được thêm vào nhóm.
                </p>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddMemberOpen(false)}
                  className="btn-3d-secondary px-4 py-2 text-xs cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={memberSubmitting || !memberEmail.trim()}
                  className="btn-3d-primary px-4 py-2 text-xs disabled:opacity-50 cursor-pointer inline-flex items-center gap-1.5"
                >
                  {memberSubmitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  <span>{memberSubmitting ? "Đang thêm..." : "Thêm vào nhóm"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 3: EDIT TEAM INFO (OWNER ONLY)                           */}
      {/* ============================================================== */}
      {isEditTeamOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-150">
          <div className="card-3d relative w-full max-w-md rounded-2xl p-6 shadow-2xl border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
            <div className="flex items-center justify-between pb-3.5 border-b border-zinc-200 dark:border-zinc-800">
              <h3 className="text-base font-bold text-black dark:text-white tracking-tight">
                Cập nhật thông tin nhóm
              </h3>
              <button
                onClick={() => setIsEditTeamOpen(false)}
                className="p-1.5 rounded-lg text-zinc-400 hover:bg-zinc-100 hover:text-black dark:hover:bg-zinc-900 dark:hover:text-white cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleUpdateTeam} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                  Tên nhóm <span className="text-black dark:text-white">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={teamNameEdit}
                  onChange={(e) => setTeamNameEdit(e.target.value)}
                  className="w-full rounded-xl border border-zinc-300 bg-white py-2 px-3 text-xs text-black outline-none focus:border-black dark:border-zinc-700 dark:bg-zinc-950 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                  Mô tả nhóm
                </label>
                <textarea
                  rows={3}
                  value={teamDescEdit}
                  onChange={(e) => setTeamDescEdit(e.target.value)}
                  className="w-full rounded-xl border border-zinc-300 bg-white py-2 px-3 text-xs text-black outline-none focus:border-black dark:border-zinc-700 dark:bg-zinc-950 dark:text-white resize-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditTeamOpen(false)}
                  className="btn-3d-secondary px-4 py-2 text-xs cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={teamSubmitting || !teamNameEdit.trim()}
                  className="btn-3d-primary px-4 py-2 text-xs disabled:opacity-50 cursor-pointer inline-flex items-center gap-1.5"
                >
                  {teamSubmitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  <span>{teamSubmitting ? "Đang lưu..." : "Lưu thay đổi"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
