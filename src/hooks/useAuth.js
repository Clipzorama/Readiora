import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { getCurrentSession } from "../services/authService";

export function useAuth() {
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadSession() {
      try {
        const currentSession = await getCurrentSession();

        setSession(currentSession);
        setUser(currentSession?.user ?? null);
      } catch (error) {
        console.error("Error loading session:", error.message);
      } finally {
        setLoading(false);
      }
    }

    loadSession();
    

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      setUser(newSession?.user ?? null);
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return {
    session,
    user,
    loading,
    isAuthenticated: !!user,
  };
}