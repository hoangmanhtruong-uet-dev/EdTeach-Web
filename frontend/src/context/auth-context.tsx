"use client";

import React, { createContext, useContext, useEffect, useState, useRef } from "react";
import { User, Session } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { Database } from "@/types/database";
import { isEmailAdmin } from "@/lib/auth/admin";

type UserProfile = Database["public"]["Tables"]["users"]["Row"];
type Wallet = Database["public"]["Tables"]["wallets"]["Row"];

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  wallet: Wallet | null;
  session: Session | null;
  isLoading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  refreshWallet: () => Promise<void>;
  updateProfileLocal: (updates: Partial<UserProfile>) => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  wallet: null,
  session: null,
  isLoading: true,
  signOut: async () => {},
  refreshProfile: async () => {},
  refreshWallet: async () => {},
  updateProfileLocal: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const userRef = useRef<User | null>(null);
  userRef.current = user;
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const supabase = createClient();

  const updateProfileLocal = (updates: Partial<UserProfile>) => {
    setProfile((prev) => (prev ? ({ ...prev, ...updates } as UserProfile) : null));
  };

  const fetchProfile = async (userId: string, tokenOverride?: string) => {
    try {
      // 1. Ưu tiên Server API route: Sử dụng Admin Client ở server, miễn dịch 100% với lỗi RLS ở client
      try {
        const activeToken = tokenOverride || session?.access_token;
        const headers: Record<string, string> = {};
        if (activeToken) {
          headers["Authorization"] = `Bearer ${activeToken}`;
        }
        const res = await fetch("/api/user/profile", { headers });
        if (res.ok) {
          const json = await res.json();
          if (json.success && json.profile) {
            let finalProfile: any = { ...json.profile };
            try {
              if (isEmailAdmin(finalProfile) || finalProfile?.role === "admin") {
                finalProfile.tier = "max";
                finalProfile.subscription_tier = "max";
              }
            } catch {
              // ignore
            }
            setProfile(finalProfile);
            return;
          }
        }
      } catch (err) {
        console.warn("fetchProfile via API failed, attempting client fallback:", err);
      }

      // 2. Client query dự phòng
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("id", userId)
        .maybeSingle();
      if (!error && data) {
        let finalProfile: any = { ...(data as any) };
        try {
          if (isEmailAdmin(data) || (data as any)?.role === "admin") {
            finalProfile.tier = "max";
            finalProfile.subscription_tier = "max";
          }
        } catch {
          // ignore
        }
        setProfile(finalProfile);
      }
    } catch (e) {
      console.error("Error fetching profile:", e);
    }
  };

  const fetchWallet = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("wallets")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();
      if (!error && data) {
        setWallet(data);
      }
    } catch (e) {
      console.error("Error fetching wallet:", e);
    }
  };

  const refreshProfile = async () => {
    if (user) {
      const { data: { session: curSession } } = await supabase.auth.getSession();
      await fetchProfile(user.id, curSession?.access_token);
    }
  };

  
  const autoClaimPendingReport = (userId: string) => {
    try {
      if (typeof window !== "undefined") {
        const pending = localStorage.getItem("edutest_pending_claim_report");
        if (pending) {
          fetch("/api/student/claim", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ token: pending, studentId: userId }),
          })
            .then(() => {
              localStorage.removeItem("edutest_pending_claim_report");
            })
            .catch(() => {});
        }
      }
    } catch {
      // ignore
    }
  };

  const refreshWallet = async () => {
    if (user) await fetchWallet(user.id);
  };

  useEffect(() => {
    const initAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        await Promise.all([
          fetchProfile(session.user.id, session.access_token),
          fetchWallet(session.user.id),
        ]);
        autoClaimPendingReport(session.user.id);
      }
      setIsLoading(false);
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        const nextUser = newSession?.user ?? null;
        const prevUser = userRef.current;
        const isSameUser = Boolean(prevUser && nextUser && prevUser.id === nextUser.id);

        // Luôn cập nhật session token ngầm để API call có access token mới nhất
        setSession(newSession);

        // Bỏ qua TOKEN_REFRESHED hoặc SIGNED_IN lặp lại nếu cùng user: KHÔNG thay đổi object reference của user
        if (isSameUser && (event === "TOKEN_REFRESHED" || event === "SIGNED_IN")) {
          return;
        }

        setUser(nextUser);

        if (nextUser) {
          if (!isSameUser) {
            await Promise.all([
              fetchProfile(nextUser.id, newSession?.access_token),
              fetchWallet(nextUser.id),
            ]);
            autoClaimPendingReport(nextUser.id);
          }
        } else {
          setProfile(null);
          setWallet(null);
        }
        setIsLoading(false);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    // 1. Invalidate client auth session via Supabase GoTrue SDK
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.warn("Supabase sign out error:", err);
    }

    // 2. Call Server API to clear HttpOnly SSR cookies
    try {
      await fetch("/api/auth/signout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
    } catch (err) {
      console.warn("Server signout endpoint error:", err);
    }

    setUser(null);
    setProfile(null);
    setWallet(null);
    setSession(null);

    // Clear cookies if any
    if (typeof document !== "undefined") {
      document.cookie = "eduteach_target_role=; path=/; max-age=0";
    }

    // Force hard redirect to login screen
    if (typeof window !== "undefined") {
      window.location.href = "/login";
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        wallet,
        session,
        isLoading,
        signOut,
        refreshProfile,
        refreshWallet,
        updateProfileLocal,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
