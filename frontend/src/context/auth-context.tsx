"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { User, Session } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { Database } from "@/types/database";

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
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const supabase = createClient();

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("id", userId)
        .maybeSingle();
      if (!error && data) {
        let finalProfile: any = { ...(data as any) };
        try {
          const { data: authData } = await supabase.auth.getUser();
          const meta = authData?.user?.user_metadata;
          if (
            meta?.subscription_tier === "max" ||
            meta?.tier === "max" ||
            (data as any)?.email === "truongcri0101@gmail.com"
          ) {
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
    if (user) await fetchProfile(user.id);
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
          fetchProfile(session.user.id),
          fetchWallet(session.user.id),
        ]);
        autoClaimPendingReport(session.user.id);
      }
      setIsLoading(false);
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        setSession(newSession);
        setUser(newSession?.user ?? null);

        if (newSession?.user) {
          await Promise.all([
            fetchProfile(newSession.user.id),
            fetchWallet(newSession.user.id),
          ]);
          autoClaimPendingReport(newSession.user.id);
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
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    setWallet(null);
    setSession(null);
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
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
