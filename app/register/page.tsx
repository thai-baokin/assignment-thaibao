"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";

export default function RegisterPage() {
  const router = useRouter();
  const { refreshUser } = useAuth();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("Mật khẩu xác nhận không khớp.");
      return;
    }

    if (password.length < 6) {
      setError("Mật khẩu tối thiểu 6 ký tự.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Đăng ký không thành công.");
      }

      await refreshUser();
      router.push("/teams");
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Đã xảy ra lỗi khi tạo tài khoản.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center px-3.5 py-1 mb-3 rounded-full text-xs font-semibold bg-zinc-100 text-zinc-900 dark:bg-zinc-900 dark:text-zinc-100 border border-zinc-300 dark:border-zinc-800 shadow-2xs">
            Khởi đầu nhanh
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-black dark:text-white tracking-tight">
            Đăng ký tài khoản
          </h1>
          <p className="mt-1.5 text-sm text-zinc-500">
            Bắt đầu quản lý công việc và đội ngũ của bạn
          </p>
        </div>

        {/* Register Card */}
        <div className="card-3d rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white p-6 sm:p-8 dark:bg-zinc-950">
          {error && (
            <div className="mb-5 rounded-xl border border-zinc-300 bg-zinc-100 p-3 text-sm text-zinc-900 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100">
              {error}
            </div>
          )}

          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                Họ và tên
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nguyễn Văn A"
                className="w-full rounded-xl border border-zinc-300 bg-white px-3.5 py-2.5 text-sm text-black outline-none transition-all placeholder:text-zinc-400 focus:border-black dark:border-zinc-700 dark:bg-zinc-950 dark:text-white dark:placeholder:text-zinc-500 dark:focus:border-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
                className="w-full rounded-xl border border-zinc-300 bg-white px-3.5 py-2.5 text-sm text-black outline-none transition-all placeholder:text-zinc-400 focus:border-black dark:border-zinc-700 dark:bg-zinc-950 dark:text-white dark:placeholder:text-zinc-500 dark:focus:border-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                Mật khẩu
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Tối thiểu 6 ký tự"
                className="w-full rounded-xl border border-zinc-300 bg-white px-3.5 py-2.5 text-sm text-black outline-none transition-all placeholder:text-zinc-400 focus:border-black dark:border-zinc-700 dark:bg-zinc-950 dark:text-white dark:placeholder:text-zinc-500 dark:focus:border-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                Xác nhận mật khẩu
              </label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Nhập lại mật khẩu"
                className="w-full rounded-xl border border-zinc-300 bg-white px-3.5 py-2.5 text-sm text-black outline-none transition-all placeholder:text-zinc-400 focus:border-black dark:border-zinc-700 dark:bg-zinc-950 dark:text-white dark:placeholder:text-zinc-500 dark:focus:border-white"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-3 py-2.5 px-4 text-sm font-semibold rounded-xl btn-3d-primary cursor-pointer disabled:opacity-50"
            >
              {loading ? "Đang tạo tài khoản..." : "Tạo tài khoản"}
            </button>
          </form>

          <div className="mt-6 text-center text-xs text-zinc-500">
            Đã có tài khoản?{" "}
            <Link
              href="/login"
              className="font-semibold text-black hover:underline dark:text-white"
            >
              Đăng nhập ngay
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
