"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { createClient } from "@/lib/supabase/client";
import { User, Session } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  sessionExpired: boolean;
  handleSessionExpired: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [sessionExpired, setSessionExpired] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);

      // Handle different auth events
      switch (event) {
        case "SIGNED_IN":
        case "TOKEN_REFRESHED":
          // Session refreshed successfully - clear any expired state
          setSessionExpired(false);
          break;
        case "SIGNED_OUT":
          // User signed out - redirect to login
          setSessionExpired(false);
          router.push("/login");
          router.refresh();
          break;
        case "USER_UPDATED":
          // User data updated
          break;
        case "PASSWORD_RECOVERY":
          // Password recovery flow
          break;
        default:
          break;
      }
    });

    return () => subscription.unsubscribe();
  }, [supabase, router]);

  // Function to handle session expiry - call this when API calls return 401
  // This will attempt to refresh the session first before showing expired UI
  const handleSessionExpired = async () => {
    try {
      // Try to refresh the session first
      const { data, error } = await supabase.auth.refreshSession();
      if (error || !data.session) {
        // Refresh failed - session is truly expired
        setSessionExpired(true);
      }
      // If refresh succeeded, onAuthStateChange will fire with TOKEN_REFRESHED
      // and setSessionExpired(false) will be called automatically
    } catch {
      // Network error or other issue - show expired UI
      setSessionExpired(true);
    }
  };

  const value = {
    user,
    session,
    loading,
    sessionExpired,
    handleSessionExpired,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
