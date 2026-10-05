"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { Menu, X, ChevronDown } from "lucide-react";
import ThemeToggle from "@/components/ThemeToggle";

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const pathname = usePathname();
  const { user, loading, logout } = useAuth();

  const navLinks = [
    { name: "Trang chủ", href: "/" },
    { name: "Không gian nhóm", href: "/teams" },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-zinc-200/90 bg-white/90 backdrop-blur-xl dark:border-zinc-800/90 dark:bg-black/90 shadow-2xs">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8 h-16">
        {/* Brand Logo - High Contrast Monochrome */}
        <Link
          href="/"
          className="flex items-center gap-2.5 font-bold text-black dark:text-white transition-transform hover:scale-[1.02] cursor-pointer"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-black text-white dark:bg-white dark:text-black font-extrabold text-sm tracking-tight shadow-sm">
            TP
          </div>
          <span className="text-base font-black tracking-tight text-black dark:text-white">
            TaskPulse
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-1.5 sm:gap-2">
          {navLinks.map((link) => {
            const isActive = pathname === link.href || (link.href !== "/" && pathname.startsWith(link.href));
            return (
              <Link
                key={link.name}
                href={link.href}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold tracking-tight transition-all cursor-pointer ${
                  isActive
                    ? "bg-black text-white dark:bg-white dark:text-black shadow-2xs"
                    : "text-zinc-600 hover:text-black hover:bg-zinc-100 dark:text-zinc-400 dark:hover:text-white dark:hover:bg-zinc-900"
                }`}
              >
                <span>{link.name}</span>
              </Link>
            );
          })}

          {/* Theme Toggle Button (Trắng / Đen) */}
          <div className="ml-2 pl-2 border-l border-zinc-200 dark:border-zinc-800">
            <ThemeToggle />
          </div>

          {/* User Auth Buttons or Profile Menu */}
          {!loading && (
            <div className="ml-2 pl-2 border-l border-zinc-200 dark:border-zinc-800 flex items-center gap-2">
              {user ? (
                <div className="relative">
                  <button
                    onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-zinc-200 hover:border-zinc-400 bg-white hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:bg-zinc-900 transition-all text-xs font-semibold text-zinc-900 dark:text-zinc-100 cursor-pointer shadow-2xs"
                  >
                    <div className="flex h-5 w-5 items-center justify-center rounded-full bg-black text-white dark:bg-white dark:text-black text-[10px] font-bold uppercase">
                      {user.name.charAt(0)}
                    </div>
                    <span className="max-w-[120px] truncate">{user.name}</span>
                    <ChevronDown className="h-3.5 w-3.5 text-zinc-400" />
                  </button>

                  {userDropdownOpen && (
                    <div
                      onMouseLeave={() => setUserDropdownOpen(false)}
                      className="absolute right-0 mt-2 w-52 rounded-xl border border-zinc-200 bg-white p-1.5 shadow-xl dark:border-zinc-800 dark:bg-zinc-950 z-50 text-xs animate-in fade-in slide-in-from-top-1 duration-150"
                    >
                      <div className="px-3 py-2 border-b border-zinc-100 dark:border-zinc-800">
                        <p className="font-semibold text-zinc-900 dark:text-white truncate">{user.name}</p>
                        <p className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate">{user.email}</p>
                      </div>
                      <Link
                        href="/teams"
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center justify-between w-full px-3 py-2 rounded-lg text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-900 mt-1 transition-colors cursor-pointer font-medium"
                      >
                        <span>Không gian nhóm</span>
                        <span className="text-[10px] bg-zinc-100 dark:bg-zinc-900 px-1.5 py-0.5 rounded text-zinc-600 dark:text-zinc-400">
                          {user.memberships?.length || 0}
                        </span>
                      </Link>
                      <button
                        onClick={() => {
                          setUserDropdownOpen(false);
                          logout();
                        }}
                        className="flex items-center w-full px-3 py-2 rounded-lg text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer mt-1 font-medium text-left"
                      >
                        <span>Đăng xuất</span>
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Link
                    href="/login"
                    className="btn-3d-secondary px-3.5 py-1.5 text-xs tracking-tight cursor-pointer inline-flex items-center justify-center"
                  >
                    <span>Đăng nhập</span>
                  </Link>
                  <Link
                    href="/register"
                    className="btn-3d-primary px-3.5 py-1.5 text-xs tracking-tight cursor-pointer inline-flex items-center justify-center"
                  >
                    <span>Đăng ký</span>
                  </Link>
                </div>
              )}
            </div>
          )}
        </nav>

        {/* Mobile: ThemeToggle & Menu Button */}
        <div className="flex md:hidden items-center gap-2">
          <ThemeToggle />
          {user && (
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-black text-white dark:bg-white dark:text-black text-xs font-bold uppercase">
              {user.name.charAt(0)}
            </div>
          )}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-lg text-zinc-600 hover:text-black hover:bg-zinc-100 dark:text-zinc-400 dark:hover:text-white dark:hover:bg-zinc-900 focus:outline-none cursor-pointer"
            aria-label="Menu"
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-zinc-200 bg-white/95 backdrop-blur-md dark:border-zinc-800 dark:bg-black/95 px-4 pt-2 pb-4 space-y-1">
          {user && (
            <div className="px-3 py-2 mb-2 rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
              <p className="text-xs font-bold text-zinc-900 dark:text-white">{user.name}</p>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400">{user.email}</p>
            </div>
          )}

          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.name}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`block px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-black text-white dark:bg-white dark:text-black font-semibold"
                    : "text-zinc-600 hover:text-black hover:bg-zinc-100 dark:text-zinc-400 dark:hover:text-white"
                }`}
              >
                <span>{link.name}</span>
              </Link>
            );
          })}

          <div className="pt-2 border-t border-zinc-200 dark:border-zinc-800">
            {user ? (
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  logout();
                }}
                className="w-full text-left px-3 py-2 rounded-lg text-sm font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer"
              >
                <span>Đăng xuất</span>
              </button>
            ) : (
              <div className="grid grid-cols-2 gap-2 mt-2">
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="btn-3d-secondary py-2 text-center text-xs"
                >
                  <span>Đăng nhập</span>
                </Link>
                <Link
                  href="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="btn-3d-primary py-2 text-center text-xs"
                >
                  <span>Đăng ký</span>
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
