import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { KeyRound } from "lucide-react";

import readioraFaviconLogo from "../assets/readioralogo.webp";
import { supabase } from "../lib/supabase";
import {
  getCurrentSession,
  signOutUser,
  updatePassword,
} from "../services/authService";

export default function ResetPassword() {
  const navigate = useNavigate();
  const [checkingLink, setCheckingLink] = useState(true);
  const [hasRecoverySession, setHasRecoverySession] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let active = true;
    const timeout = window.setTimeout(() => {
      if (active) setCheckingLink(false);
    }, 3000);

    getCurrentSession()
      .then((session) => {
        if (active && session) {
          setHasRecoverySession(true);
          setCheckingLink(false);
        }
      })
      .catch(() => {
        if (active) setCheckingLink(false);
      });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (active && (event === "PASSWORD_RECOVERY" || session)) {
        setHasRecoverySession(true);
        setCheckingLink(false);
      }
    });

    return () => {
      active = false;
      window.clearTimeout(timeout);
      subscription.unsubscribe();
    };
  }, []);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    const formData = new FormData(event.currentTarget);
    const password = formData.get("password");
    const confirmation = formData.get("confirmation");

    if (password !== confirmation) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      await updatePassword(password);
      await signOutUser();
      navigate("/login", {
        replace: true,
        state: { passwordReset: true },
      });
    } catch (updateError) {
      setError(updateError.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4 py-8 text-primary sm:px-6">
      <div
        aria-hidden="true"
        className="absolute -top-28 left-1/2 h-80 w-80 -translate-x-1/2 rounded-full bg-button/20 blur-3xl"
      />
      <motion.section
        initial={{ opacity: 0, y: 24, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 w-full max-w-md rounded-3xl border border-border bg-card/95 p-6 text-center shadow-2xl shadow-black/30 backdrop-blur sm:p-8"
      >
        <img
          src={readioraFaviconLogo}
          alt="Readiora"
          className="mx-auto h-16 w-auto object-contain sm:h-20"
        />
        <div className="mx-auto mt-5 flex h-14 w-14 items-center justify-center rounded-2xl border border-strong-border bg-button/15">
          <KeyRound className="h-7 w-7" />
        </div>
        <h1 className="mt-5 text-3xl font-bold">Choose a new password</h1>

        {checkingLink ? (
          <p className="mt-4 text-secondary">Verifying your reset link...</p>
        ) : hasRecoverySession ? (
          <form onSubmit={handleSubmit} className="mt-6 space-y-4 text-left">
            <label className="block text-sm font-semibold" htmlFor="password">
              New password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              minLength={8}
              required
              className="w-full rounded-xl border border-border bg-background px-4 py-3 text-primary outline-none transition focus:border-strong-border"
              placeholder="At least 8 characters"
            />
            <label
              className="block text-sm font-semibold"
              htmlFor="confirmation"
            >
              Confirm new password
            </label>
            <input
              id="confirmation"
              name="confirmation"
              type="password"
              autoComplete="new-password"
              minLength={8}
              required
              className="w-full rounded-xl border border-border bg-background px-4 py-3 text-primary outline-none transition focus:border-strong-border"
              placeholder="Repeat your new password"
            />
            {error ? (
              <p role="alert" className="text-sm text-red-400">
                {error}
              </p>
            ) : null}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-button py-3 font-semibold text-white transition hover:bg-button-hover disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Updating..." : "Update password"}
            </button>
          </form>
        ) : (
          <div className="mt-5">
            <p className="leading-7 text-secondary">
              This reset link is invalid or expired. Request a new link to
              continue.
            </p>
            <Link
              to="/forgot-password"
              className="mt-6 inline-flex w-full items-center justify-center rounded-xl bg-button px-4 py-3 font-semibold text-white transition hover:bg-button-hover"
            >
              Request another link
            </Link>
          </div>
        )}
      </motion.section>
    </main>
  );
}
