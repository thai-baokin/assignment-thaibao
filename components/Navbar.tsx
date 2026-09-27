"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { CheckSquare, Users, LogIn, Menu, X, Sparkles } from "lucide-react";

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showLoginNotice, setShowLoginNotice] = useState(false);
  const pathname = usePathname();

  const navLinks = [
    { name: "Home", href: "/", icon: CheckSquare },
    { name: "Teams", href: "/teams", icon: Users },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 bg-white/90 backdrop-blur-md dark:border-slate-800/80 dark:bg-slate-950/90 shadow-xs">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8 h-16">
        {/* Brand Logo */}
        <Link
          href="/"
          className="flex items-center gap-2.5 font-bold text-slate-900 dark:text-white transition-opacity hover:opacity-90"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 text-white shadow-md shadow-blue-500/20">
            <CheckSquare className="h-5 w-5" />
          </div>
          <div className="flex flex-col">
            <span className="text-lg font-black tracking-tight leading-none bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 bg-clip-text text-transparent dark:from-blue-400 dark:to-indigo-300">
              TaskPulse
            </span>
            <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-400 dark:text-slate-500">
              Assignment 1
            </span>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-1 sm:gap-2">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.name}
                href={link.href}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? "bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 shadow-xs"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-100 dark:hover:bg-slate-800/60"
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{link.name}</span>
                {link.name === "Teams" && (
                  <span className="ml-1 text-[10px] font-semibold uppercase bg-indigo-100 text-indigo-700 dark:bg-indigo-900/60 dark:text-indigo-300 px-1.5 py-0.5 rounded-full">
                    Ass 2
                  </span>
                )}
              </Link>
            );
          })}

          {/* Login Placeholder Button */}
          <div className="relative ml-2">
            <button
              onClick={() => setShowLoginNotice(!showLoginNotice)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-sm shadow-blue-500/25 transition-all cursor-pointer active:scale-95"
            >
              <LogIn className="h-4 w-4" />
              <span>Login</span>
            </button>

            {/* Login Coming Soon Tooltip / Popover */}
            {showLoginNotice && (
              <div className="absolute right-0 mt-2 w-64 rounded-xl border border-slate-200 bg-white p-3 shadow-xl dark:border-slate-800 dark:bg-slate-900 z-50 text-xs animate-in fade-in slide-in-from-top-1 duration-150">
                <div className="flex items-center gap-1.5 font-semibold text-slate-800 dark:text-slate-200 mb-1">
                  <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                  <span>Authentication Placeholder</span>
                </div>
                <p className="text-slate-500 dark:text-slate-400 leading-relaxed">
                  Tính năng xác thực và đăng nhập tài khoản sẽ được tích hợp trong <strong>Assignment 2</strong>.
                </p>
                <button
                  onClick={() => setShowLoginNotice(false)}
                  className="mt-2 text-blue-600 dark:text-blue-400 hover:underline font-medium text-[11px]"
                >
                  Đóng thông báo
                </button>
              </div>
            )}
          </div>
        </nav>

        {/* Mobile Menu Button */}
        <div className="flex md:hidden items-center gap-2">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800"
            aria-label="Toggle Menu"
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Dropdown Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-4 py-3 space-y-2">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.name}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center justify-between px-3 py-2 rounded-lg text-base font-medium ${
                  isActive
                    ? "bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300"
                    : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                }`}
              >
                <div className="flex items-center gap-2">
                  <Icon className="h-5 w-5" />
                  <span>{link.name}</span>
                </div>
                {link.name === "Teams" && (
                  <span className="text-[10px] font-semibold uppercase bg-indigo-100 text-indigo-700 dark:bg-indigo-900/60 dark:text-indigo-300 px-2 py-0.5 rounded-full">
                    Coming Soon
                  </span>
                )}
              </Link>
            );
          })}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
            <button
              onClick={() => {
                alert("Tính năng Đăng nhập sẽ được phát triển trong Assignment 2!");
                setMobileMenuOpen(false);
              }}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 shadow-sm"
            >
              <LogIn className="h-4 w-4" />
              <span>Login (Placeholder)</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
