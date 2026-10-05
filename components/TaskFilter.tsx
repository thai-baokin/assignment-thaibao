"use client";

import { Search } from "lucide-react";

interface TaskFilterProps {
  currentStatus: string;
  onStatusChange: (status: string) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  counts: {
    all: number;
    todo: number;
    inProgress: number;
    done: number;
  };
}

export default function TaskFilter({
  currentStatus,
  onStatusChange,
  searchQuery,
  onSearchChange,
  counts,
}: TaskFilterProps) {
  const tabs = [
    { id: "ALL", label: "Tất cả", count: counts.all },
    { id: "TODO", label: "Cần làm", count: counts.todo },
    { id: "IN_PROGRESS", label: "Đang làm", count: counts.inProgress },
    { id: "DONE", label: "Hoàn thành", count: counts.done },
  ];

  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
      {/* Status Filter Tabs (Monochrome B&W) */}
      <div className="flex items-center gap-1 p-1 rounded-xl bg-zinc-100 dark:bg-zinc-900 backdrop-blur-md border border-zinc-200 dark:border-zinc-800 overflow-x-auto">
        {tabs.map((tab) => {
          const isActive = currentStatus === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onStatusChange(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                isActive
                  ? "bg-black text-white dark:bg-white dark:text-black shadow-2xs"
                  : "text-zinc-600 hover:text-black dark:text-zinc-400 dark:hover:text-white"
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`ml-0.5 px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                  isActive
                    ? "bg-zinc-800 text-white dark:bg-zinc-200 dark:text-black"
                    : "bg-zinc-200 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-400"
                }`}
              >
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Search Input */}
      <div className="relative w-full sm:w-64">
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-zinc-400">
          <Search className="h-3.5 w-3.5" />
        </div>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Tìm kiếm công việc..."
          className="w-full pl-9 pr-3.5 py-1.5 rounded-xl border border-zinc-300 bg-white text-black text-xs placeholder-zinc-400 focus:outline-none focus:border-black dark:border-zinc-700 dark:bg-zinc-950 dark:text-white dark:placeholder-zinc-500 shadow-2xs"
        />
      </div>
    </div>
  );
}
