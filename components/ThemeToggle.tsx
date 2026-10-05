"use client";

import { useEffect, useState } from "react";

export default function ThemeToggle() {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const savedTheme = localStorage.getItem("taskpulse_theme") as "light" | "dark" | null;
    if (savedTheme) {
      setTheme(savedTheme);
      if (savedTheme === "dark") {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    } else {
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      const initialTheme = prefersDark ? "dark" : "light";
      setTheme(initialTheme);
      if (prefersDark) {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    }
  }, []);

  const toggleTheme = (newTheme: "light" | "dark") => {
    setTheme(newTheme);
    localStorage.setItem("taskpulse_theme", newTheme);
    if (newTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  if (!mounted) {
    return (
      <div className="flex items-center p-0.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900 text-xs font-semibold h-8 w-24 opacity-60" />
    );
  }

  return (
    <div
      className="flex items-center p-0.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-900 text-[11px] font-semibold tracking-tight shadow-2xs"
      title="Chuyển đổi giao diện Trắng / Đen"
    >
      <button
        type="button"
        onClick={() => toggleTheme("light")}
        className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
          theme === "light"
            ? "bg-white text-black shadow-xs font-bold"
            : "text-zinc-500 hover:text-black dark:text-zinc-400 dark:hover:text-white"
        }`}
      >
        Trắng
      </button>
      <button
        type="button"
        onClick={() => toggleTheme("dark")}
        className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
          theme === "dark"
            ? "bg-black text-white dark:bg-white dark:text-black shadow-xs font-bold"
            : "text-zinc-500 hover:text-black dark:text-zinc-400 dark:hover:text-white"
        }`}
      >
        Đen
      </button>
    </div>
  );
}
