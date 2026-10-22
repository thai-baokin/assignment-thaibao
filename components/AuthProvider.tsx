"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
} from "react";
import { usePathname, useRouter } from "next/navigation";

export interface UserSession {
  id: string;
  name: string;
  email: string;
  memberships?: Array<{
    teamId: string;
    role: string;
    team: {
      id: string;
      name: string;
    };
  }>;
}

interface AuthContextType {
  user: UserSession | null;
  loading: boolean;
  logout: () => Promise<void>;
  refreshUser: (broadcast?: boolean) => Promise<UserSession | null>;
}

const AUTH_CHANNEL_NAME = "taskpulse-auth";

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  logout: async () => {},
  refreshUser: async () => null,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserSession | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();
  const pathnameRef = useRef(pathname);
  const userRef = useRef<UserSession | null>(null);
  const channelRef = useRef<BroadcastChannel | null>(null);
  const lastFocusRefreshRef = useRef(0);
  const authRequestIdRef = useRef(0);

  useEffect(() => {
    pathnameRef.current = pathname;
  }, [pathname]);

  useEffect(() => {
    userRef.current = user;
  }, [user]);

  const fetchCurrentUser = useCallback(
    async (silent = false): Promise<UserSession | null> => {
      const requestId = ++authRequestIdRef.current;
      try {
        const res = await fetch("/api/auth/me", {
          cache: "no-store",
          credentials: "same-origin",
        });
        if (requestId !== authRequestIdRef.current) {
          return userRef.current;
        }
        if (res.ok) {
          const data = await res.json();
          if (requestId !== authRequestIdRef.current) {
            return userRef.current;
          }
          const nextUser: UserSession | null = data.user || null;
          setUser(nextUser);
          return nextUser;
        }
        if (!silent) setUser(null);
        return silent ? userRef.current : null;
      } catch {
        if (requestId !== authRequestIdRef.current) {
          return userRef.current;
        }
        if (!silent) setUser(null);
        return silent ? userRef.current : null;
      } finally {
        if (requestId === authRequestIdRef.current) {
          setLoading(false);
        }
      }
    },
    []
  );

  const broadcastAuthChange = useCallback(() => {
    channelRef.current?.postMessage({ type: "auth-changed" });
  }, []);

  useEffect(() => {
    fetchCurrentUser();
  }, [fetchCurrentUser]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const channel =
      "BroadcastChannel" in window
        ? new BroadcastChannel(AUTH_CHANNEL_NAME)
        : null;
    channelRef.current = channel;

    if (channel) {
      channel.onmessage = async () => {
        const nextUser = await fetchCurrentUser(true);
        if (!nextUser && pathnameRef.current.startsWith("/teams")) {
          router.push("/login");
        }
      };
    }

    const refreshOnFocus = () => {
      const now = Date.now();
      if (now - lastFocusRefreshRef.current < 1000) return;
      lastFocusRefreshRef.current = now;
      fetchCurrentUser(true);
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") refreshOnFocus();
    };

    window.addEventListener("focus", refreshOnFocus);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("focus", refreshOnFocus);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      channel?.close();
      channelRef.current = null;
    };
  }, [fetchCurrentUser, router]);

  const logout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST", cache: "no-store" });
    } finally {
      setUser(null);
      broadcastAuthChange();
      router.push("/login");
      router.refresh();
    }
  };

  const refreshUser = async (broadcast = false) => {
    const nextUser = await fetchCurrentUser();
    if (broadcast) broadcastAuthChange();
    return nextUser;
  };

  return (
    <AuthContext.Provider value={{ user, loading, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
