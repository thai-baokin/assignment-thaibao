"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Bell, CheckCheck, CheckSquare, Users } from "lucide-react";
import { useAuth } from "./AuthProvider";
import { supabase } from "@/lib/supabase-client";

export interface NotificationItem {
  id: string;
  type: "ASSIGNED_TASK" | "ADDED_TO_TEAM" | string;
  title: string;
  message: string;
  relatedId: string | null;
  targetUrl?: string | null;
  read: boolean;
  createdAt: string;
}

export default function NotificationBell() {
  const { user } = useAuth();
  const router = useRouter();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [browserPermission, setBrowserPermission] = useState<
    NotificationPermission | "unsupported"
  >("default");
  const dropdownRef = useRef<HTMLDivElement>(null);
  const seenNotificationIds = useRef<Set<string>>(new Set());

  // Fetch danh sách thông báo
  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    try {
      const res = await fetch("/api/notifications");
      if (res.ok) {
        const data = await res.json();
        (data.notifications || []).forEach((n: NotificationItem) => {
          if (n.id) seenNotificationIds.current.add(n.id);
        });
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (error) {
      console.error("Lỗi khi tải thông báo:", error);
    }
  }, [user]);

  useEffect(() => {
    queueMicrotask(() => {
      void fetchNotifications();
    });
  }, [fetchNotifications]);

  // Đồng bộ trạng thái quyền thông báo trình duyệt sau khi mount (tránh lệch hydration)
  useEffect(() => {
    const timer = setTimeout(() => {
      setBrowserPermission(
        typeof window !== "undefined" && "Notification" in window
          ? Notification.permission
          : "unsupported"
      );
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  const requestBrowserPermission = async () => {
    if (typeof window === "undefined" || !("Notification" in window)) return;
    try {
      const result = await Notification.requestPermission();
      setBrowserPermission(result);
    } catch (error) {
      console.error("Lỗi khi xin quyền thông báo trình duyệt:", error);
    }
  };

  // Real-time listener qua Supabase Realtime
  useEffect(() => {
    if (!user) return;

    // Lắng nghe channel riêng của user
    const channelName = `notifications:user-${user.id}`;
    const channel = supabase.channel(channelName);

    channel
      .on("broadcast", { event: "new-notification" }, (event) => {
        const newNotif = event.payload as NotificationItem;
        if (newNotif && newNotif.id) {
          if (seenNotificationIds.current.has(newNotif.id)) return;
          seenNotificationIds.current.add(newNotif.id);
          setNotifications((prev) => [newNotif, ...prev.filter((n) => n.id !== newNotif.id)]);
          if (!newNotif.read) setUnreadCount((c) => c + 1);

          // Phát âm thanh thông báo nhẹ qua Web Audio API
          try {
            const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = "sine";
            osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5 note
            osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15); // A5
            gain.gain.setValueAtTime(0.08, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start();
            osc.stop(ctx.currentTime + 0.25);
          } catch {
            // Audio context có thể bị chặn nếu chưa tương tác người dùng
          }

          // Hiển thị thông báo desktop khi tab không ở foreground
          if (
            "Notification" in window &&
            Notification.permission === "granted" &&
            document.visibilityState !== "visible"
          ) {
            try {
              const desktopNotification = new Notification(newNotif.title, {
                body: newNotif.message,
                tag: newNotif.id,
              });
              desktopNotification.onclick = () => {
                window.focus();
                desktopNotification.close();
              };
            } catch {
              // Một số trình duyệt chặn Notification constructor
            }
          }
        }
      })
      .subscribe();

    // Polling dự phòng mỗi 30 giây
    const interval = setInterval(fetchNotifications, 30000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, [user, fetchNotifications]);

  // Đóng dropdown khi click ra ngoài
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Đánh dấu tất cả đã đọc
  const handleMarkAllAsRead = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/notifications", { method: "PUT" });
      if (res.ok) {
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
        setUnreadCount(0);
      }
    } catch (error) {
      console.error("Lỗi khi đánh dấu tất cả đã đọc:", error);
    } finally {
      setLoading(false);
    }
  };

  // Đánh dấu 1 thông báo đã đọc và chuyển trang nếu có
  const handleNotificationClick = async (item: NotificationItem) => {
    if (!item.read) {
      try {
        await fetch(`/api/notifications/${item.id}`, { method: "PUT" });
        setNotifications((prev) =>
          prev.map((n) => (n.id === item.id ? { ...n, read: true } : n))
        );
        setUnreadCount((c) => Math.max(0, c - 1));
      } catch (error) {
        console.error("Lỗi khi cập nhật thông báo:", error);
      }
    }

    setIsOpen(false);

    // Chuyển hướng tới trang phù hợp (nhóm và công việc cụ thể)
    if (item.targetUrl) {
      router.push(item.targetUrl);
    } else if (item.relatedId) {
      if (item.relatedId.startsWith("/teams")) {
        router.push(item.relatedId);
      } else {
        router.push(`/teams/${item.relatedId}`);
      }
    } else {
      router.push("/teams");
    }
  };

  const formatRelativeTime = (dateStr: string) => {
    try {
      const now = new Date();
      const date = new Date(dateStr);
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / (1000 * 60));
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

      if (diffMins < 1) return "Vừa xong";
      if (diffMins < 60) return `${diffMins} phút trước`;
      if (diffHours < 24) return `${diffHours} giờ trước`;
      if (diffDays < 7) return `${diffDays} ngày trước`;
      return date.toLocaleDateString("vi-VN");
    } catch {
      return dateStr;
    }
  };

  if (!user) return null;

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Nút Chuông */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-zinc-200 bg-white text-zinc-700 hover:border-zinc-400 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300 dark:hover:bg-zinc-900 transition-all cursor-pointer shadow-2xs"
        aria-label="Thông báo"
        title="Thông báo"
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-black text-white shadow-xs animate-pulse">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl border border-zinc-200 bg-white p-2 shadow-2xl dark:border-zinc-800 dark:bg-zinc-950 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
          {/* Header */}
          <div className="flex items-center justify-between px-3 py-2 border-b border-zinc-100 dark:border-zinc-800/80">
            <div className="flex items-center gap-2">
              <span className="text-xs font-black uppercase tracking-wider text-zinc-900 dark:text-zinc-100">
                Thông báo
              </span>
              {unreadCount > 0 && (
                <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[11px] font-bold text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                  {unreadCount} mới
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                disabled={loading}
                className="flex items-center gap-1 text-[11px] font-semibold text-zinc-500 hover:text-black dark:text-zinc-400 dark:hover:text-white transition-colors cursor-pointer"
              >
                <CheckCheck className="h-3 w-3" />
                <span>Đã đọc tất cả</span>
              </button>
            )}
          </div>

          {/* Bật thông báo desktop */}
          {browserPermission === "default" && (
            <button
              onClick={requestBrowserPermission}
              className="mt-1 w-full rounded-xl border border-dashed border-zinc-200 px-3 py-2 text-left text-[11px] font-semibold text-zinc-600 hover:border-zinc-400 hover:bg-zinc-50 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-900 cursor-pointer transition-colors"
            >
              Bật thông báo trên desktop để không bỏ lỡ việc mới
            </button>
          )}
          {browserPermission === "denied" && (
            <p className="mt-1 px-3 py-1 text-[11px] text-zinc-400">
              Thông báo desktop đang bị chặn trong cài đặt trình duyệt.
            </p>
          )}

          {/* Body / List */}
          <div className="max-h-80 overflow-y-auto divide-y divide-zinc-100 dark:divide-zinc-900 py-1">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center text-zinc-400 dark:text-zinc-500">
                <Bell className="h-8 w-8 mb-2 opacity-30 stroke-[1.5]" />
                <p className="text-xs font-semibold">Chưa có thông báo nào</p>
                <p className="text-[11px] text-zinc-400 dark:text-zinc-600 mt-0.5">
                  Bạn sẽ nhận được thông báo khi được giao việc hoặc tham gia nhóm mới.
                </p>
              </div>
            ) : (
              notifications.map((item) => (
                <div
                  key={item.id}
                  onClick={() => handleNotificationClick(item)}
                  className={`group flex items-start gap-3 p-3 transition-colors cursor-pointer rounded-xl ${
                    !item.read
                      ? "bg-zinc-50/80 hover:bg-zinc-100 dark:bg-zinc-900/60 dark:hover:bg-zinc-900"
                      : "hover:bg-zinc-50 dark:hover:bg-zinc-900/30 opacity-75 hover:opacity-100"
                  }`}
                >
                  {/* Icon loại thông báo */}
                  <div
                    className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${
                      item.type === "ASSIGNED_TASK"
                        ? "bg-black text-white dark:bg-white dark:text-black"
                        : "bg-zinc-200 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200"
                    }`}
                  >
                    {item.type === "ASSIGNED_TASK" ? (
                      <CheckSquare className="h-3.5 w-3.5" />
                    ) : (
                      <Users className="h-3.5 w-3.5" />
                    )}
                  </div>

                  {/* Nội dung */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <p className="text-xs font-bold text-zinc-900 dark:text-white truncate">
                        {item.title}
                      </p>
                      <span className="text-[10px] text-zinc-400 shrink-0">
                        {formatRelativeTime(item.createdAt)}
                      </span>
                    </div>
                    <p className="text-[11px] text-zinc-600 dark:text-zinc-300 mt-0.5 leading-snug line-clamp-2">
                      {item.message}
                    </p>
                  </div>

                  {/* Dấu chấm chưa đọc */}
                  {!item.read && (
                    <div className="mt-2 h-2 w-2 rounded-full bg-black dark:bg-white shrink-0" />
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
