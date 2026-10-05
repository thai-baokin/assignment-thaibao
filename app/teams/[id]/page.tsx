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
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Danh sách các nhóm</span>
        </Link>

        {/* Owner Settings Actions */}
        {isOwner && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsEditTeamOpen(true)}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 dark:border-slate-800 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
            >
              <Edit2 className="h-3.5 w-3.5" />
              <span>Sửa nhóm</span>
            </button>
            <button
              onClick={handleDeleteTeam}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-rose-200 bg-rose-50 hover:bg-rose-100 dark:border-rose-900/50 dark:bg-rose-950/40 dark:hover:bg-rose-950 text-xs font-semibold text-rose-700 dark:text-rose-300 transition-colors cursor-pointer"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>Xóa nhóm</span>
            </button>
          </div>
        )}
      </div>

      {/* Team Header Banner */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              {team.name}
            </h1>
            {isOwner ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/60 dark:border-amber-800 dark:text-amber-300">
                <Crown className="h-3.5 w-3.5 text-amber-500" />
                <span>Trưởng nhóm (Owner)</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/60 dark:border-emerald-800 dark:text-emerald-300">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
                <span>Thành viên (Member)</span>
              </span>
            )}
          </div>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400 max-w-2xl">
            {team.description || "Chưa có mô tả cho nhóm này."}
          </p>
          <div className="mt-3 flex items-center gap-4 text-xs text-slate-400 dark:text-slate-500">
            <span>Tạo bởi: <strong className="text-slate-700 dark:text-slate-300">{team.owner.name}</strong></span>
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
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold text-xs shadow-md shadow-blue-500/20 transition-all cursor-pointer active:scale-95"
          >
            <Plus className="h-4 w-4" />
            <span>Tạo Task Mới</span>
          </button>
        </div>
      </div>

      {/* Tabs Switcher: Tasks vs Members */}
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800">
        <div className="flex gap-4">
          <button
            onClick={() => setActiveTab("tasks")}
            className={`pb-3 text-sm font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
              activeTab === "tasks"
                ? "border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400"
                : "border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
            }`}
          >
            <CheckSquare className="h-4 w-4" />
            <span>Danh sách Công việc ({team.tasks.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("members")}
            className={`pb-3 text-sm font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
              activeTab === "members"
                ? "border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400"
                : "border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
            }`}
          >
            <Users className="h-4 w-4" />
            <span>Thành viên Nhóm ({team.members.length})</span>
          </button>
        </div>

        {/* View Mode Toggle when on Tasks tab */}
        {activeTab === "tasks" && (
          <div className="flex items-center gap-1 pb-2">
            <button
              onClick={() => setViewMode("board")}
              title="Xem dạng Bảng Kanban"
              className={`p-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                viewMode === "board"
                  ? "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300"
                  : "text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
            >
              <Kanban className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode("table")}
              title="Xem dạng Danh sách / Bảng"
              className={`p-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                viewMode === "table"
                  ? "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300"
                  : "text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
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
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
            {/* Search Input */}
            <div className="relative">
              <Search className="pointer-events-none absolute inset-y-0 left-0 my-auto ml-3 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm task theo tên hoặc mô tả..."
                className="w-full rounded-lg border border-slate-200 bg-slate-50 py-1.5 pl-8 pr-3 text-xs text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-blue-500 focus:bg-white dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:bg-slate-900"
              />
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-lg border border-slate-200 bg-slate-50 py-1.5 px-3 text-xs text-slate-900 outline-none transition-all focus:border-blue-500 focus:bg-white dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:bg-slate-900"
            >
              <option value="ALL">Mọi Trạng Thái</option>
              <option value="TODO">To Do (Chưa thực hiện)</option>
              <option value="IN_PROGRESS">In Progress (Đang làm)</option>
              <option value="DONE">Done (Đã hoàn thành)</option>
            </select>

            {/* Priority Filter */}
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="rounded-lg border border-slate-200 bg-slate-50 py-1.5 px-3 text-xs text-slate-900 outline-none transition-all focus:border-blue-500 focus:bg-white dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:bg-slate-900"
            >
              <option value="ALL">Mọi Mức Ưu Tiên</option>
              <option value="HIGH">High (Ưu tiên cao)</option>
              <option value="MEDIUM">Medium (Trung bình)</option>
              <option value="LOW">Low (Thấp)</option>
            </select>

            {/* Assignee Filter */}
            <select
              value={assigneeFilter}
              onChange={(e) => setAssigneeFilter(e.target.value)}
              className="rounded-lg border border-slate-200 bg-slate-50 py-1.5 px-3 text-xs text-slate-900 outline-none transition-all focus:border-blue-500 focus:bg-white dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:bg-slate-900"
            >
              <option value="ALL">Tất cả người phụ trách</option>
              <option value="ME">Công việc của tôi</option>
              <option value="UNASSIGNED">Chưa phân công</option>
              {team.members.map((m) => (
                <option key={m.userId} value={m.userId}>
                  {m.user.name} ({m.role})
                </option>
              ))}
            </select>
          </div>

          {/* Empty tasks state */}
          {filteredTasks.length === 0 ? (
            <div className="py-16 text-center rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 bg-white/40 dark:bg-slate-900/40">
              <CheckSquare className="mx-auto h-12 w-12 text-slate-300 dark:text-slate-600 mb-2" />
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">Không tìm thấy công việc nào</p>
              <p className="text-xs text-slate-500 mt-1">
                {team.tasks.length === 0
                  ? "Hãy bấm 'Tạo Task Mới' để bắt đầu giao việc cho thành viên."
                  : "Thử điều chỉnh lại bộ lọc hoặc từ khóa tìm kiếm."}
              </p>
            </div>
          ) : viewMode === "board" ? (
            /* ========================================== */
            /* KANBAN BOARD VIEW (Bonus Feature)          */
            /* ========================================== */
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {(["TODO", "IN_PROGRESS", "DONE"] as const).map((colStatus) => {
                const columnTasks = filteredTasks.filter((t) => t.status === colStatus);
                const colTitle =
                  colStatus === "TODO"
                    ? "To Do (Cần làm)"
                    : colStatus === "IN_PROGRESS"
                    ? "In Progress (Đang thực hiện)"
                    : "Done (Đã hoàn thành)";

                const colColor =
                  colStatus === "TODO"
                    ? "border-amber-300/80 bg-amber-50/40 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400"
                    : colStatus === "IN_PROGRESS"
                    ? "border-blue-300/80 bg-blue-50/40 dark:bg-blue-950/20 text-blue-700 dark:text-blue-400"
                    : "border-emerald-300/80 bg-emerald-50/40 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400";

                return (
                  <div
                    key={colStatus}
                    className="flex flex-col rounded-2xl border border-slate-200 bg-slate-100/60 dark:border-slate-800 dark:bg-slate-900/50 p-4 min-h-[450px]"
                  >
                    {/* Column Header */}
                    <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-200 dark:border-slate-800">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-bold border ${colColor}`}>
                          {colTitle}
                        </span>
                      </div>
                      <span className="text-xs font-semibold text-slate-400">{columnTasks.length}</span>
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
                            ? "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/60 dark:text-rose-400"
                            : task.priority === "MEDIUM"
                            ? "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-400"
                            : "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300";

                        return (
                          <div
                            key={task.id}
                            className="group rounded-xl border border-slate-200 bg-white p-4 shadow-xs hover:shadow-md dark:border-slate-800 dark:bg-slate-900 transition-all flex flex-col justify-between"
                          >
                            <div>
                              <div className="flex items-start justify-between gap-2 mb-2">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${priorityBadge}`}>
                                  {task.priority}
                                </span>

                                <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                                  <button
                                    onClick={() => openEditTask(task)}
                                    title="Chỉnh sửa task"
                                    className="p-1 rounded text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-800 cursor-pointer"
                                  >
                                    <Edit2 className="h-3.5 w-3.5" />
                                  </button>
                                  {canDelete && (
                                    <button
                                      onClick={() => handleDeleteTask(task)}
                                      title="Xóa task (Quyền: Người tạo, Người làm hoặc Owner)"
                                      className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-800 cursor-pointer"
                                    >
                                      <Trash2 className="h-3.5 w-3.5" />
                                    </button>
                                  )}
                                </div>
                              </div>

                              <h4 className="text-sm font-bold text-slate-900 dark:text-white leading-snug">
                                {task.title}
                              </h4>
                              {task.description && (
                                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                                  {task.description}
                                </p>
                              )}
                            </div>

                            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex flex-col gap-2">
                              {/* Assignee & Due Date */}
                              <div className="flex items-center justify-between text-[11px] text-slate-500">
                                <div className="flex items-center gap-1.5" title={`Người làm: ${task.assignee?.name || "Chưa phân công"}`}>
                                  <div className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300 font-bold text-[10px]">
                                    {task.assignee ? task.assignee.name.charAt(0) : "?"}
                                  </div>
                                  <span className="truncate max-w-[90px]">
                                    {task.assignee ? task.assignee.name : "Chưa gán"}
                                  </span>
                                </div>

                                {task.dueDate && (
                                  <div className="flex items-center gap-1 text-slate-400">
                                    <Calendar className="h-3 w-3" />
                                    <span>{new Date(task.dueDate).toLocaleDateString("vi-VN")}</span>
                                  </div>
                                )}
                              </div>

                              {/* Quick Move Buttons */}
                              <div className="flex items-center gap-1 pt-1 justify-end">
                                {colStatus !== "TODO" && (
                                  <button
                                    onClick={() => handleQuickStatusChange(task, "TODO")}
                                    className="px-2 py-0.5 text-[10px] font-semibold rounded bg-slate-100 text-slate-600 hover:bg-amber-100 hover:text-amber-800 dark:bg-slate-800 dark:text-slate-300 cursor-pointer"
                                  >
                                    ← To Do
                                  </button>
                                )}
                                {colStatus !== "IN_PROGRESS" && (
                                  <button
                                    onClick={() => handleQuickStatusChange(task, "IN_PROGRESS")}
                                    className="px-2 py-0.5 text-[10px] font-semibold rounded bg-slate-100 text-slate-600 hover:bg-blue-100 hover:text-blue-800 dark:bg-slate-800 dark:text-slate-300 cursor-pointer"
                                  >
                                    In Progress
                                  </button>
                                )}
                                {colStatus !== "DONE" && (
                                  <button
                                    onClick={() => handleQuickStatusChange(task, "DONE")}
                                    className="px-2 py-0.5 text-[10px] font-semibold rounded bg-slate-100 text-slate-600 hover:bg-emerald-100 hover:text-emerald-800 dark:bg-slate-800 dark:text-slate-300 cursor-pointer"
                                  >
                                    Done ✓
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
            <div className="rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-950 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200 dark:border-slate-800">
                    <tr>
                      <th className="py-3 px-4">Công việc</th>
                      <th className="py-3 px-4">Trạng thái</th>
                      <th className="py-3 px-4">Ưu tiên</th>
                      <th className="py-3 px-4">Phụ trách</th>
                      <th className="py-3 px-4">Hạn chót</th>
                      <th className="py-3 px-4 text-right">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {filteredTasks.map((task) => {
                      const canDelete =
                        user?.id === task.creatorId ||
                        user?.id === task.assigneeId ||
                        user?.id === team.ownerId;

                      const statusBadge =
                        task.status === "DONE"
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-400"
                          : task.status === "IN_PROGRESS"
                          ? "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/60 dark:text-blue-400"
                          : "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-400";

                      const priorityBadge =
                        task.priority === "HIGH"
                          ? "text-rose-600 font-bold"
                          : task.priority === "MEDIUM"
                          ? "text-amber-600 font-semibold"
                          : "text-slate-500";

                      return (
                        <tr key={task.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                          <td className="py-3.5 px-4 font-semibold text-slate-900 dark:text-white max-w-xs">
                            <p className="truncate">{task.title}</p>
                            {task.description && (
                              <p className="text-[11px] font-normal text-slate-400 truncate">{task.description}</p>
                            )}
                          </td>
                          <td className="py-3.5 px-4">
                            <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold border ${statusBadge}`}>
                              {task.status}
                            </span>
                          </td>
                          <td className="py-3.5 px-4">
                            <span className={priorityBadge}>{task.priority}</span>
                          </td>
                          <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300">
                            {task.assignee ? (
                              <div className="flex items-center gap-1.5">
                                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-100 text-blue-700 font-bold text-[10px]">
                                  {task.assignee.name.charAt(0)}
                                </div>
                                <span>{task.assignee.name}</span>
                              </div>
                            ) : (
                              <span className="text-slate-400 italic">Chưa gán</span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-slate-500">
                            {task.dueDate ? new Date(task.dueDate).toLocaleDateString("vi-VN") : "—"}
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => openEditTask(task)}
                                className="p-1 rounded text-slate-400 hover:text-blue-600 hover:bg-slate-100 cursor-pointer"
                                title="Sửa task"
                              >
                                <Edit2 className="h-4 w-4" />
                              </button>
                              {canDelete && (
                                <button
                                  onClick={() => handleDeleteTask(task)}
                                  className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-slate-100 cursor-pointer"
                                  title="Xóa task"
                                >
                                  <Trash2 className="h-4 w-4" />
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
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Danh sách Thành viên</h3>
              <p className="text-xs text-slate-500">Thành viên có quyền xem, tạo và cập nhật công việc trong nhóm.</p>
            </div>

            {/* Owner Add Member Button */}
            {isOwner && (
              <button
                onClick={() => setIsAddMemberOpen(true)}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm transition-colors cursor-pointer"
              >
                <UserPlus className="h-4 w-4" />
                <span>Mời Thành Viên Bằng Email</span>
              </button>
            )}
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 overflow-hidden shadow-xs">
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {team.members.map((m) => {
                const isMemberOwner = m.role === "OWNER" || m.userId === team.ownerId;
                const isCurrent = m.userId === user?.id;

                return (
                  <div key={m.id} className="p-4 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-500 to-indigo-600 text-white font-bold text-sm uppercase shadow-sm">
                        {m.user.name.charAt(0)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-bold text-slate-900 dark:text-white">{m.user.name}</p>
                          {isCurrent && (
                            <span className="text-[10px] font-semibold bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">
                              Bạn
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400">{m.user.email}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      {isMemberOwner ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/60 dark:border-amber-800 dark:text-amber-300">
                          <Crown className="h-3 w-3 text-amber-500" />
                          <span>Owner</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300">
                          <ShieldCheck className="h-3 w-3 text-emerald-500" />
                          <span>Member</span>
                        </span>
                      )}

                      {/* Action buttons */}
                      {isOwner && !isMemberOwner && (
                        <button
                          onClick={() => handleRemoveMember(m.userId, m.user.name)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                          title="Xóa thành viên khỏi nhóm"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}

                      {/* Leave team if current user is member (not owner) */}
                      {!isOwner && isCurrent && (
                        <button
                          onClick={() => handleRemoveMember(m.userId, m.user.name)}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:text-rose-300 cursor-pointer"
                        >
                          <LogOut className="h-3.5 w-3.5" />
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="relative w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {editingTask ? "Chỉnh sửa Công việc" : "Tạo Công việc Mới"}
              </h3>
              <button
                onClick={() => setIsTaskModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {taskError && (
              <div className="mt-4 flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700 dark:border-rose-900 dark:bg-rose-950/40">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{taskError}</span>
              </div>
            )}

            <form onSubmit={handleSaveTask} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Tiêu đề công việc <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  placeholder="Ví dụ: Thiết kế cơ sở dữ liệu cho tính năng Auth..."
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 px-3 text-sm text-slate-900 outline-none transition-all focus:border-blue-600 focus:bg-white dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:bg-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Mô tả chi tiết
                </label>
                <textarea
                  rows={3}
                  value={taskDesc}
                  onChange={(e) => setTaskDesc(e.target.value)}
                  placeholder="Mô tả cụ thể yêu cầu, tài liệu tham khảo..."
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 px-3 text-sm text-slate-900 outline-none transition-all focus:border-blue-600 focus:bg-white dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:bg-slate-900 resize-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Trạng thái
                  </label>
                  <select
                    value={taskStatus}
                    onChange={(e) => setTaskStatus(e.target.value as "TODO" | "IN_PROGRESS" | "DONE")}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 px-3 text-sm text-slate-900 outline-none focus:border-blue-600 focus:bg-white dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:bg-slate-900"
                  >
                    <option value="TODO">To Do (Chưa thực hiện)</option>
                    <option value="IN_PROGRESS">In Progress (Đang làm)</option>
                    <option value="DONE">Done (Đã hoàn thành)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Mức độ ưu tiên
                  </label>
                  <select
                    value={taskPriority}
                    onChange={(e) => setTaskPriority(e.target.value as "LOW" | "MEDIUM" | "HIGH")}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 px-3 text-sm text-slate-900 outline-none focus:border-blue-600 focus:bg-white dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:bg-slate-900"
                  >
                    <option value="LOW">Low (Thấp)</option>
                    <option value="MEDIUM">Medium (Trung bình)</option>
                    <option value="HIGH">High (Khẩn cấp / Cao)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Phân công cho thành viên
                  </label>
                  <select
                    value={taskAssigneeId}
                    onChange={(e) => setTaskAssigneeId(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 px-3 text-sm text-slate-900 outline-none focus:border-blue-600 focus:bg-white dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:bg-slate-900"
                  >
                    <option value="">-- Chưa gán ai --</option>
                    {team.members.map((m) => (
                      <option key={m.userId} value={m.userId}>
                        {m.user.name} ({m.role})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Hạn chót hoàn thành
                  </label>
                  <input
                    type="date"
                    value={taskDueDate}
                    onChange={(e) => setTaskDueDate(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 px-3 text-sm text-slate-900 outline-none focus:border-blue-600 focus:bg-white dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:bg-slate-900"
                  />
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsTaskModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={taskSubmitting || !taskTitle.trim()}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 shadow-sm disabled:opacity-50 cursor-pointer"
                >
                  {taskSubmitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  <span>{taskSubmitting ? "Đang lưu..." : editingTask ? "Cập nhật" : "Tạo công việc"}</span>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="relative w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Thêm Thành Viên Vào Nhóm</h3>
              <button
                onClick={() => setIsAddMemberOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {memberError && (
              <div className="mt-4 flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700 dark:border-rose-900 dark:bg-rose-950/40">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{memberError}</span>
              </div>
            )}

            <form onSubmit={handleAddMember} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Địa chỉ Email của thành viên <span className="text-rose-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={memberEmail}
                  onChange={(e) => setMemberEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 px-3 text-sm text-slate-900 outline-none transition-all focus:border-blue-600 focus:bg-white dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:bg-slate-900"
                />
                <p className="mt-1.5 text-[11px] text-slate-400">
                  Lưu ý: Thành viên cần đã có tài khoản trên hệ thống để được thêm vào nhóm.
                </p>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddMemberOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={memberSubmitting || !memberEmail.trim()}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 shadow-sm disabled:opacity-50 cursor-pointer"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="relative w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Cập nhật Thông tin Nhóm</h3>
              <button
                onClick={() => setIsEditTeamOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateTeam} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Tên nhóm <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={teamNameEdit}
                  onChange={(e) => setTeamNameEdit(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 px-3 text-sm text-slate-900 outline-none focus:border-blue-600 focus:bg-white dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:bg-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Mô tả nhóm
                </label>
                <textarea
                  rows={3}
                  value={teamDescEdit}
                  onChange={(e) => setTeamDescEdit(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 px-3 text-sm text-slate-900 outline-none focus:border-blue-600 focus:bg-white dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:bg-slate-900 resize-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditTeamOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={teamSubmitting || !teamNameEdit.trim()}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 shadow-sm disabled:opacity-50 cursor-pointer"
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
