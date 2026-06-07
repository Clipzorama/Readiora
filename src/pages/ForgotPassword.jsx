import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Mail } from "lucide-react";

import readioraFaviconLogo from "../assets/readioralogo.webp";
import { requestPasswordReset } from "../services/authService";

export default function ForgotPassword() {
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setLoading(true);

    const email = new FormData(event.currentTarget).get("email");

    try {
      await requestPasswordReset(email);
      setSubmitted(true);
    } catch (requestError) {
      setError(requestError.message);
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
          <Mail className="h-7 w-7" />
        </div>
        <h1 className="mt-5 text-3xl font-bold">Reset your password</h1>

        {submitted ? (
          <div className="mt-5">
            <p className="leading-7 text-secondary">
              If an account exists for that email, a secure password-reset link
              is on its way. Check your inbox and spam folder.
            </p>
            <Link
              to="/login"
              className="mt-6 inline-flex w-full items-center justify-center rounded-xl bg-button px-4 py-3 font-semibold text-white transition hover:bg-button-hover"
            >
              Return to sign in
            </Link>
          </div>
        ) : (
          <>
            <p className="mt-3 leading-7 text-secondary">
              Enter your account email and we will send you a secure reset link.
            </p>
            <form onSubmit={handleSubmit} className="mt-6 space-y-4 text-left">
              <label className="block text-sm font-semibold" htmlFor="email">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="w-full rounded-xl border border-border bg-background px-4 py-3 text-primary outline-none transition placeholder:text-muted focus:border-strong-border"
                placeholder="you@example.com"
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
                {loading ? "Sending..." : "Send reset link"}
              </button>
            </form>
          </>
        )}

        <Link
          to="/login"
          className="mt-4 inline-flex items-center justify-center gap-2 text-sm font-semibold text-secondary transition hover:text-primary"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to sign in
        </Link>
      </motion.section>
    </main>
  );
}
