"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Send, Users, Sparkles, MessageSquare, Loader2, Smile } from "lucide-react";
import { useAuth } from "./AuthProvider";
import { supabase } from "@/lib/supabase-client";

export interface ChatMessage {
  id: string;
  content: string;
  teamId: string;
  senderId: string;
  createdAt: string;
  sender?: {
    id: string;
    name?: string;
    email?: string;
  } | null;
}

interface TeamChatProps {
  teamId: string;
  teamName: string;
  ownerId?: string;
  adminIds?: string[];
}

export default function TeamChat({ teamId, teamName, ownerId, adminIds = [] }: TeamChatProps) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<{ id: string; name: string }[]>([]);
  const [typingUsers, setTypingUsers] = useState<{ [userId: string]: string }>({});

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const scrollToBottom = (behavior: ScrollBehavior = "smooth") => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  };

  // Tải lịch sử tin nhắn ban đầu
  const fetchMessages = useCallback(async () => {
    try {
      const res = await fetch(`/api/teams/${teamId}/messages`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setMessages(data);
          setTimeout(() => scrollToBottom("auto"), 100);
        }
      }
    } catch (error) {
      console.error("Lỗi khi tải tin nhắn:", error);
    } finally {
      setLoading(false);
    }
  }, [teamId]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  // Kết nối Real-time qua Supabase Channel (Broadcast & Presence)
  useEffect(() => {
    if (!user || !teamId) return;

    const channelName = `team-room-${teamId}`;
    const channel = supabase.channel(channelName, {
      config: {
        presence: {
          key: user.id,
        },
      },
    });

    // 1. Lắng nghe tin nhắn mới qua Broadcast
    channel.on("broadcast", { event: "new-message" }, (event) => {
      const newMsg = event.payload as ChatMessage;
      if (newMsg && newMsg.teamId === teamId && newMsg.id) {
        const safeMsg: ChatMessage = {
          ...newMsg,
          sender: newMsg.sender || {
            id: newMsg.senderId,
            name: "Thành viên",
            email: "",
          },
        };
        setMessages((prev) => {
          if (prev.some((m) => m.id === safeMsg.id)) return prev;
          return [...prev, safeMsg];
        });
        setTimeout(() => scrollToBottom("smooth"), 80);
      }
    });

    // 2. Lắng nghe trạng thái đang soạn tin (Typing Indicator)
    channel.on("broadcast", { event: "typing" }, (event) => {
      const payload = event.payload as { userId?: string; userName?: string };
      if (payload && payload.userId && payload.userId !== user.id) {
        const uId = payload.userId;
        const uName = payload.userName || "Ai đó";
        setTypingUsers((prev) => ({ ...prev, [uId]: uName }));

        // Tự động xóa sau 3.5s nếu không gõ tiếp
        setTimeout(() => {
          setTypingUsers((prev) => {
            const next = { ...prev };
            delete next[uId];
            return next;
          });
        }, 3500);
      }
    });

    // 3. Online Presence (ai đang online trong phòng chat)
    channel
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState<{ id: string; name: string }>();
        const uniqueOnline: { id: string; name: string }[] = [];
        Object.values(state).forEach((presences) => {
          presences.forEach((p) => {
            if (p && p.id && !uniqueOnline.some((u) => u.id === p.id)) {
              uniqueOnline.push({ id: p.id, name: p.name || "Thành viên" });
            }
          });
        });
        setOnlineUsers(uniqueOnline);
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await channel.track({
            id: user.id,
            name: user.name,
          });
        }
      });

    // Polling dự phòng mỗi 25s (kết hợp Supabase Realtime broadcast tức thì)
    const pollInterval = setInterval(async () => {
      // Chỉ poll nếu tab đang active
      if (typeof document !== "undefined" && document.hidden) return;

      try {
        const res = await fetch(`/api/teams/${teamId}/messages`);
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data)) {
            setMessages((prev) => {
              if (data.length !== prev.length) {
                setTimeout(() => scrollToBottom("smooth"), 50);
                return data;
              }
              return prev;
            });
          }
        }
      } catch {
        // bỏ qua
      }
    }, 25000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(pollInterval);
    };
  }, [user, teamId]);

  // Xử lý gửi tín hiệu typing
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputText(e.target.value);

    if (!user) return;
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

    typingTimeoutRef.current = setTimeout(() => {
      try {
        const channel = supabase.channel(`team-room-${teamId}`);
        channel.send({
          type: "broadcast",
          event: "typing",
          payload: { userId: user.id, userName: user.name },
        });
      } catch {
        // Bỏ qua nếu lỗi socket
      }
    }, 300);
  };

  // Gửi tin nhắn với Optimistic Update (hiển thị tức thì không độ trễ)
  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const content = inputText.trim();
    if (!content || sending || !user) return;

    const tempId = `temp-${Date.now()}`;
    const optimisticMsg: ChatMessage = {
      id: tempId,
      content,
      teamId,
      senderId: user.id,
      createdAt: new Date().toISOString(),
      sender: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    };

    // 1. Hiển thị ngay trên UI và reset ô nhập liệu tức thì
    setMessages((prev) => [...prev, optimisticMsg]);
    setInputText("");
    setTimeout(() => scrollToBottom("smooth"), 50);
    setSending(true);

    try {
      const res = await fetch(`/api/teams/${teamId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });

      if (res.ok) {
        const newMsg: ChatMessage = await res.json();
        // Thay thế tin nhắn tạm thời bằng dữ liệu chính thức từ DB
        setMessages((prev) =>
          prev.map((m) => (m.id === tempId ? newMsg : m))
        );

        // Broadcast tin nhắn tới tất cả thành viên khác trong phòng chat qua Supabase Realtime
        try {
          const channel = supabase.channel(`team-room-${teamId}`);
          await channel.send({
            type: "broadcast",
            event: "new-message",
            payload: newMsg,
          });
        } catch {
          // Bỏ qua
        }
      } else {
        // Revert nếu lỗi
        setMessages((prev) => prev.filter((m) => m.id !== tempId));
        setInputText(content);
        const errData = await res.json();
        alert(errData.error || "Không thể gửi tin nhắn.");
      }
    } catch (error) {
      console.error("Lỗi gửi tin nhắn:", error);
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
      setInputText(content);
    } finally {
      setSending(false);
    }
  };

  const formatMessageTime = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
    } catch {
      return "";
    }
  };

  const typingNames = Object.values(typingUsers);

  return (
    <div className="flex flex-col h-[650px] w-full rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950 shadow-sm overflow-hidden">
      {/* Chat Room Header */}
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-900/50">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-black text-white dark:bg-white dark:text-black font-bold shadow-xs">
            <MessageSquare className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-black text-zinc-900 dark:text-white">
                Phòng trò chuyện: {teamName}
              </h3>
              <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Trực tiếp
              </span>
            </div>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
              Trao đổi và tương tác thời gian thực giữa các thành viên
            </p>
          </div>
        </div>

        {/* Online Presence Badge */}
        {onlineUsers.length > 0 && (
          <div className="hidden sm:flex items-center gap-1.5 text-xs font-semibold text-zinc-600 dark:text-zinc-300 bg-white dark:bg-zinc-900 px-3 py-1 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-2xs">
            <Users className="h-3.5 w-3.5 text-emerald-500" />
            <span>
              {onlineUsers.length} đang online:{" "}
              <span className="text-zinc-900 dark:text-white font-bold">
                {onlineUsers.map((u) => (u?.id === user?.id ? "Bạn" : (u?.name || "Thành viên"))).join(", ")}
              </span>
            </span>
          </div>
        )}
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
        {loading ? (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-zinc-400">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span className="text-xs">Đang tải lịch sử tin nhắn...</span>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-center text-zinc-400 dark:text-zinc-500">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-100 dark:bg-zinc-900 text-zinc-400 mb-3">
              <MessageSquare className="h-6 w-6" />
            </div>
            <p className="text-sm font-bold text-zinc-700 dark:text-zinc-300">Chưa có tin nhắn nào</p>
            <p className="text-xs text-zinc-400 dark:text-zinc-500 max-w-sm mt-1">
              Hãy gửi tin nhắn đầu tiên để bắt đầu thảo luận công việc cùng các thành viên trong nhóm!
            </p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.senderId === user?.id;
            const isMsgOwner = msg.senderId === ownerId;
            const isMsgAdmin = (adminIds || []).includes(msg.senderId);
            const senderDisplayName = msg.sender?.name || (isMe ? (user?.name || "Bạn") : "Thành viên");
            const senderInitial = (senderDisplayName || "U").charAt(0).toUpperCase();

            return (
              <div
                key={msg.id}
                className={`flex gap-3 max-w-[85%] sm:max-w-[75%] ${
                  isMe ? "ml-auto flex-row-reverse" : "mr-auto"
                }`}
              >
                {/* Avatar */}
                <div
                  className={`flex h-8 w-8 shrink-0 select-none items-center justify-center rounded-xl text-xs font-bold uppercase shadow-2xs ${
                    isMe
                      ? "bg-black text-white dark:bg-white dark:text-black"
                      : "bg-zinc-200 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200"
                  }`}
                >
                  {senderInitial}
                </div>

                {/* Message Bubble */}
                <div className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}>
                  <div className="flex items-center gap-1.5 mb-1 px-1">
                    <span className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300">
                      {isMe ? "Bạn" : senderDisplayName}
                    </span>
                    {isMsgOwner && (
                      <span className="text-[9px] font-black uppercase px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300">
                        Owner
                      </span>
                    )}
                    {!isMsgOwner && isMsgAdmin && (
                      <span className="text-[9px] font-black uppercase px-1.5 py-0.2 rounded bg-blue-100 text-blue-800 dark:bg-blue-950/80 dark:text-blue-300">
                        Admin
                      </span>
                    )}
                    <span className="text-[10px] text-zinc-400">
                      {formatMessageTime(msg.createdAt)}
                    </span>
                  </div>

                  <div
                    className={`rounded-2xl px-4 py-2.5 text-xs sm:text-[13px] leading-relaxed shadow-2xs break-words max-w-full ${
                      isMe
                        ? "bg-black text-white dark:bg-white dark:text-black rounded-tr-xs"
                        : "bg-zinc-100 text-zinc-900 dark:bg-zinc-900 dark:text-zinc-100 rounded-tl-xs border border-zinc-200/60 dark:border-zinc-800"
                    }`}
                  >
                    {msg.content}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Typing Indicator Bar */}
      {typingNames.length > 0 && (
        <div className="px-5 py-1 text-[11px] font-medium text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5 animate-pulse bg-zinc-50/50 dark:bg-zinc-900/30">
          <span className="flex gap-0.5 items-center">
            <span className="h-1.5 w-1.5 rounded-full bg-zinc-400 animate-bounce" style={{ animationDelay: "0ms" }} />
            <span className="h-1.5 w-1.5 rounded-full bg-zinc-400 animate-bounce" style={{ animationDelay: "150ms" }} />
            <span className="h-1.5 w-1.5 rounded-full bg-zinc-400 animate-bounce" style={{ animationDelay: "300ms" }} />
          </span>
          <span>{typingNames.join(", ")} đang soạn tin nhắn...</span>
        </div>
      )}

      {/* Message Input Box */}
      <form
        onSubmit={handleSendMessage}
        className="flex items-center gap-2 p-3 sm:p-4 border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950"
      >
        <input
          type="text"
          value={inputText}
          onChange={handleInputChange}
          placeholder="Nhập tin nhắn... (nhấn Enter để gửi)"
          className="flex-1 rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-2.5 text-xs sm:text-sm text-zinc-900 placeholder-zinc-400 focus:border-black focus:bg-white focus:outline-none dark:border-zinc-800 dark:bg-zinc-900 dark:text-white dark:placeholder-zinc-500 dark:focus:border-white transition-all shadow-inner"
        />
        <button
          type="submit"
          disabled={!inputText.trim() || sending}
          className="flex items-center justify-center gap-1.5 rounded-xl bg-black px-4 py-2.5 text-xs sm:text-sm font-bold text-white transition-all hover:bg-zinc-800 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-white dark:text-black dark:hover:bg-zinc-200 shadow-sm cursor-pointer"
        >
          {sending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              <span>Gửi</span>
              <Send className="h-3.5 w-3.5" />
            </>
          )}
        </button>
      </form>
    </div>
  );
}
