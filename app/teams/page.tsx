"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";
import { Loader2, X, AlertCircle, RefreshCw } from "lucide-react";

interface TeamItem {
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
  members: Array<{
    id: string;
    role: string;
    user: {
      id: string;
      name: string;
      email: string;
    };
  }>;
  _count: {
    tasks: number;
    members: number;
  };
}

export default function TeamsPage() {
  const { user } = useAuth();
  const [teams, setTeams] = useState<TeamItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal State
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newTeamName, setNewTeamName] = useState("");
  const [newTeamDesc, setNewTeamDesc] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const fetchTeams = useCallback(async () => {
    setLoading(true);
    setError(null);

    let lastErrorMsg = "Lỗi khi kết nối máy chủ.";
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const res = await fetch("/api/teams", {
          cache: "no-store",
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || "Không thể tải danh sách nhóm.");
        }
        const data = await res.json();
        setTeams(data);
        setError(null);
        setLoading(false);
        return;
      } catch (err: unknown) {
        lastErrorMsg = err instanceof Error ? err.message : "Lỗi khi kết nối máy chủ.";
        if (attempt === 0) {
          await new Promise((resolve) => setTimeout(resolve, 800));
        }
      }
    }

    setError(lastErrorMsg);
    setLoading(false);
  }, []);

  useEffect(() => {
    queueMicrotask(() => {
      void fetchTeams();
    });
  }, [fetchTeams]);

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTeamName.trim()) return;

    setSubmitting(true);
    setCreateError(null);

    try {
      const res = await fetch("/api/teams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newTeamName.trim(),
          description: newTeamDesc.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Không thể tạo nhóm mới.");
      }

      setNewTeamName("");
      setNewTeamDesc("");
      setIsCreateOpen(false);
      fetchTeams();
    } catch (err: unknown) {
      setCreateError(err instanceof Error ? err.message : "Đã xảy ra lỗi khi tạo nhóm.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex-1 py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
      {/* Header section (Monochrome B&W) */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-zinc-200 dark:border-zinc-800">
        <div>
          <div className="pill-3d inline-flex items-center px-3 py-0.5 rounded-full text-xs font-semibold bg-zinc-100 text-zinc-900 border border-zinc-300 dark:bg-zinc-900 dark:border-zinc-800 dark:text-zinc-100 mb-2">
            <span>Không gian cộng tác</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-black dark:text-white tracking-tight">
            Nhóm làm việc
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-zinc-500">
            Quản lý các nhóm bạn tham gia, tạo không gian mới và phân chia công việc.
          </p>
        </div>

        <button
          onClick={() => setIsCreateOpen(true)}
          className="btn-3d-primary px-4 py-2.5 text-xs tracking-tight cursor-pointer inline-flex items-center justify-center shrink-0"
        >
          <span>Tạo nhóm mới</span>
        </button>
      </div>

      {/* Loading state */}
      {loading ? (
        <div className="py-24 flex flex-col items-center justify-center text-zinc-400">
          <Loader2 className="h-6 w-6 animate-spin text-black dark:text-white mb-2" />
          <p className="text-xs font-medium">Đang tải danh sách nhóm...</p>
        </div>
      ) : error ? (
        /* Error State */
        <div className="mt-10 rounded-2xl border border-red-200 bg-red-50/50 dark:border-red-900/50 dark:bg-red-950/20 p-8 text-center backdrop-blur-sm max-w-lg mx-auto">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400 mb-4">
            <AlertCircle className="h-6 w-6" />
          </div>
          <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
            Không thể tải danh sách nhóm
          </h3>
          <p className="mt-1.5 text-xs text-zinc-600 dark:text-zinc-400 max-w-sm mx-auto">
            {error}
          </p>
          <div className="mt-5 flex items-center justify-center gap-3">
            <button
              onClick={() => void fetchTeams()}
              className="btn-3d-primary px-4 py-2 text-xs font-semibold cursor-pointer inline-flex items-center gap-2"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span>Thử lại ngay</span>
            </button>
          </div>
        </div>
      ) : teams.length === 0 ? (
        /* Empty State */
        <div className="mt-10 rounded-2xl border-2 border-dashed border-zinc-300 dark:border-zinc-800 p-12 text-center bg-white/40 dark:bg-zinc-950/40 backdrop-blur-sm">
          <h3 className="text-base font-bold text-black dark:text-white">Chưa có nhóm nào</h3>
          <p className="mt-1 text-xs text-zinc-500 max-w-sm mx-auto">
            Tạo nhóm đầu tiên để bắt đầu quản lý dự án cùng đồng đội.
          </p>
          <button
            onClick={() => setIsCreateOpen(true)}
            className="btn-3d-primary mt-5 px-4 py-2 text-xs cursor-pointer inline-flex items-center justify-center"
          >
            <span>Tạo nhóm ngay</span>
          </button>
        </div>
      ) : (
        /* Teams Grid (Monochrome 3D Card Surfaces) */
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {teams.map((team) => {
            const isOwner = user?.id === team.ownerId;
            return (
              <div
                key={team.id}
                className="card-3d group relative rounded-2xl p-6 flex flex-col justify-between"
              >
                <div>
                  {/* Card Header & Role Badge */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-black text-white dark:bg-white dark:text-black font-extrabold text-sm shadow-2xs">
                      {team.name.charAt(0).toUpperCase()}
                    </div>
                    {isOwner ? (
                      <span className="pill-3d px-2.5 py-0.5 rounded-full text-[11px] bg-black text-white dark:bg-white dark:text-black font-bold border border-black dark:border-white">
                        Trưởng nhóm
                      </span>
                    ) : (
                      <span className="pill-3d px-2.5 py-0.5 rounded-full text-[11px] bg-zinc-100 text-zinc-800 border border-zinc-300 dark:bg-zinc-800 dark:text-zinc-200 dark:border-zinc-700">
                        Thành viên
                      </span>
                    )}
                  </div>

                  <h3 className="text-base font-bold text-black dark:text-white group-hover:underline transition-all tracking-tight">
                    {team.name}
                  </h3>

                  <p className="mt-1 text-xs text-zinc-500 line-clamp-2 min-h-[2rem]">
                    {team.description || "Chưa có mô tả cho nhóm."}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-zinc-100 dark:border-zinc-800/80">
                  <div className="flex items-center justify-between text-[11px] font-medium text-zinc-500 mb-4">
                    <span>{team._count.members} thành viên</span>
                    <span>{team._count.tasks} công việc</span>
                  </div>

                  <Link
                    href={`/teams/${team.id}`}
                    className="btn-3d-secondary flex items-center justify-center w-full py-2 text-xs font-semibold cursor-pointer"
                  >
                    <span>Vào nhóm</span>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Tạo Nhóm Mới (Monochrome 3D Surface) */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-150">
          <div className="card-3d relative w-full max-w-md rounded-2xl p-6 shadow-2xl border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
            <div className="flex items-center justify-between pb-3.5 border-b border-zinc-200 dark:border-zinc-800">
              <h3 className="text-base font-bold text-black dark:text-white tracking-tight">
                Tạo nhóm mới
              </h3>
              <button
                onClick={() => setIsCreateOpen(false)}
                className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-black dark:hover:bg-zinc-900 dark:hover:text-white cursor-pointer transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {createError && (
              <div className="mt-4 rounded-xl border border-zinc-300 bg-zinc-100 p-3 text-xs text-zinc-900 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100">
                <span>{createError}</span>
              </div>
            )}

            <form onSubmit={handleCreateTeam} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                  Tên nhóm <span className="text-black dark:text-white">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newTeamName}
                  onChange={(e) => setNewTeamName(e.target.value)}
                  placeholder="Ví dụ: Đội Frontend, Nhóm Dự án 1..."
                  className="w-full rounded-xl border border-zinc-300 bg-white py-2 px-3 text-xs text-black outline-none focus:border-black dark:border-zinc-700 dark:bg-zinc-950 dark:text-white dark:placeholder:text-zinc-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                  Mô tả nhóm
                </label>
                <textarea
                  rows={3}
                  value={newTeamDesc}
                  onChange={(e) => setNewTeamDesc(e.target.value)}
                  placeholder="Mô tả mục tiêu của nhóm..."
                  className="w-full rounded-xl border border-zinc-300 bg-white py-2 px-3 text-xs text-black outline-none focus:border-black dark:border-zinc-700 dark:bg-zinc-950 dark:text-white dark:placeholder:text-zinc-500 resize-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="btn-3d-secondary px-4 py-2 text-xs cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={submitting || !newTeamName.trim()}
                  className="btn-3d-primary px-4 py-2 text-xs disabled:opacity-50 cursor-pointer inline-flex items-center gap-1.5"
                >
                  {submitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  <span>{submitting ? "Đang tạo..." : "Xác nhận tạo"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
