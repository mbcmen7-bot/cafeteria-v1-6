import React, { createContext, useContext, useEffect, useState } from "react";
import { nanoid } from "nanoid";
import { supabase, type Profile, type AppRole } from "@/lib/supabase";
import { toast } from "sonner";

interface AuthContextType {
  authToken: string | null;
  userId: string | null;
  userEmail: string | null;
  role: AppRole | null;
  profile: Profile | null;
  guestSessionId: string;
  isLoggedIn: boolean;
  isLoading: boolean;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [role, setRole] = useState<AppRole | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [guestSessionId, setGuestSessionId] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);

  const fetchProfile = async (uid: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', uid)
        .single();

      if (error) throw error;
      if (data) {
        setProfile(data as Profile);
        setRole((data as Profile).role);
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
    }
  };

  useEffect(() => {
    // Initialize guest session ID
    const stored = localStorage.getItem("guestSessionId");
    if (stored) {
      setGuestSessionId(stored);
    } else {
      const newId = nanoid();
      localStorage.setItem("guestSessionId", newId);
      setGuestSessionId(newId);
    }

    // Check current session
    const initAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setAuthToken(session.access_token);
        setUserId(session.user.id);
        setUserEmail(session.user.email || null);
        await fetchProfile(session.user.id);
      }
      setIsLoading(false);
    };

    initAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session) {
        setAuthToken(session.access_token);
        setUserId(session.user.id);
        setUserEmail(session.user.email || null);
        await fetchProfile(session.user.id);
      } else {
        setAuthToken(null);
        setUserId(null);
        setUserEmail(null);
        setRole(null);
        setProfile(null);
      }
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const logout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error("Error logging out: " + error.message);
    } else {
      toast.success("Logged out successfully");
    }
  };

  const refreshProfile = async () => {
    if (userId) {
      await fetchProfile(userId);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        authToken,
        userId,
        userEmail,
        role,
        profile,
        guestSessionId,
        isLoggedIn: !!authToken,
        isLoading,
        logout,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
