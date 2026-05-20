import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";

export default function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    async function handleAuthCallback() {
      try {
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        if (error) throw error;

        if (session) {
          navigate("/dashboard", { replace: true });
        } else {
          navigate("/login", { replace: true });
        }
      } catch (error) {
        console.error("OAuth callback error:", error.message);
        navigate("/login", { replace: true });
      }
    }

    handleAuthCallback();
  }, [navigate]);

  return (
    <main className="min-h-screen bg-background text-primary flex items-center justify-center px-6">
      <section className="w-full max-w-md rounded-2xl border border-border bg-card p-8 shadow-2xl">
        <div className="flex flex-col items-center text-center gap-5">
          
          {/* Animated Loader */}
          <div className="relative flex h-16 w-16 items-center justify-center">
            <div className="absolute inset-0 rounded-full bg-button opacity-20 blur-xl" />

            <div className="h-14 w-14 animate-spin rounded-full border-2 border-border border-t-button" />
          </div>

          {/* Branding */}
          <div>
            <p className="mb-2 text-xs uppercase tracking-[0.3em] text-secondary">
              Xevaro
            </p>

            <h1 className="text-2xl font-semibold tracking-tight">
              Initializing your workspace
            </h1>

            <p className="mt-2 text-sm leading-6 text-secondary">
              Preparing your command center and securely authenticating your
              session.
            </p>
          </div>

          {/* Progress Bar */}
          <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-background">
            <div className="h-full w-1/2 animate-pulse rounded-full bg-button" />
          </div>
        </div>
      </section>
    </main>
  );
}