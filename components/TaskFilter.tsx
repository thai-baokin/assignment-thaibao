"use client";

import { Search, CheckCircle2, Clock, CircleDashed, LayoutGrid } from "lucide-react";

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
    { id: "ALL", label: "Tất cả", count: counts.all, icon: LayoutGrid },
    { id: "TODO", label: "To Do", count: counts.todo, icon: Clock },
    { id: "IN_PROGRESS", label: "In Progress", count: counts.inProgress, icon: CircleDashed },
    { id: "DONE", label: "Done", count: counts.done, icon: CheckCircle2 },
  ];

  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
      {/* Status Filter Tabs */}
      <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-slate-800/80 overflow-x-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = currentStatus === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onStatusChange(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                isActive
                  ? "bg-white text-blue-700 shadow-xs dark:bg-slate-900 dark:text-blue-300"
                  : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              <span>{tab.label}</span>
              <span
                className={`ml-1 px-1.5 py-0.2 rounded-full text-[10px] ${
                  isActive
                    ? "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300"
                    : "bg-slate-200/80 text-slate-600 dark:bg-slate-700 dark:text-slate-400"
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
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Tìm kiếm công việc..."
          className="w-full pl-9 pr-3.5 py-1.5 rounded-xl border border-slate-200 bg-white text-slate-900 text-xs placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 dark:border-slate-800 dark:bg-slate-900 dark:text-white dark:placeholder-slate-500 transition-colors"
        />
      </div>
    </div>
  );
}
