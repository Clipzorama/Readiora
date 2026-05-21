import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import xevaroLogo from "../assets/xevarologo.webp";
import xevaroSymbol from "../assets/xfavi.webp";

import {
  signInWithEmail,
  signInWithGoogle,
  signInWithGithub,
} from "../services/authService";

const panelVariants = {
  hidden: { opacity: 0, x: -28 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] },
  },
};

const formVariants = {
  hidden: { opacity: 0, y: 28, scale: 0.98 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.65,
      ease: [0.22, 1, 0.36, 1],
      staggerChildren: 0.08,
      delayChildren: 0.12,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 14 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] },
  },
};

function GoogleIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-5 w-5"
      focusable="false"
    >
      <path
        fill="#4285F4"
        d="M21.6 12.23c0-.78-.07-1.53-.2-2.23H12v4.26h5.37a4.6 4.6 0 0 1-1.99 3.01v2.5h3.22c1.89-1.74 3-4.3 3-7.54Z"
      />
      <path
        fill="#34A853"
        d="M12 22c2.7 0 4.96-.9 6.6-2.43l-3.22-2.5c-.9.6-2.04.95-3.38.95-2.6 0-4.8-1.76-5.59-4.12H3.08v2.58A9.99 9.99 0 0 0 12 22Z"
      />
      <path
        fill="#FBBC05"
        d="M6.41 13.9a6.02 6.02 0 0 1 0-3.8V7.52H3.08a9.99 9.99 0 0 0 0 8.96l3.33-2.58Z"
      />
      <path
        fill="#EA4335"
        d="M12 5.98c1.47 0 2.78.5 3.82 1.5l2.85-2.85C16.95 3.01 14.7 2 12 2a9.99 9.99 0 0 0-8.92 5.52l3.33 2.58C7.2 7.74 9.4 5.98 12 5.98Z"
      />
    </svg>
  );
}

function GithubIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-5 w-5"
      fill="currentColor"
      focusable="false"
    >
      <path d="M12 .5A11.5 11.5 0 0 0 8.36 22.9c.58.1.79-.25.79-.56v-2.02c-3.22.7-3.9-1.39-3.9-1.39-.53-1.34-1.29-1.7-1.29-1.7-1.05-.72.08-.7.08-.7 1.16.08 1.77 1.2 1.77 1.2 1.04 1.76 2.72 1.25 3.38.95.1-.75.4-1.25.73-1.54-2.57-.29-5.27-1.29-5.27-5.72 0-1.27.45-2.3 1.19-3.11-.12-.29-.52-1.47.11-3.07 0 0 .98-.31 3.18 1.19a11.1 11.1 0 0 1 5.78 0c2.2-1.5 3.17-1.19 3.17-1.19.64 1.6.24 2.78.12 3.07.74.81 1.19 1.84 1.19 3.11 0 4.45-2.71 5.42-5.3 5.71.42.36.79 1.07.79 2.16v3.05c0 .31.21.67.8.56A11.5 11.5 0 0 0 12 .5Z" />
    </svg>
  );
}

export default function Login() {
  const navigate = useNavigate();

  async function handleEmailLogin(e) {
    e.preventDefault();

    const formData = new FormData(e.currentTarget);
    const email = formData.get("email");
    const password = formData.get("password");

    try {
      await signInWithEmail(email, password);
      navigate("/dashboard");
    } catch (error) {
      console.error(error.message);
      alert(error.message);
    }
  }

  return (
    <main className="relative grid min-h-screen overflow-hidden bg-background text-primary lg:grid-cols-2">
      <motion.div
        aria-hidden="true"
        animate={{ scale: [1, 1.08, 1], opacity: [0.55, 0.8, 0.55] }}
        transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
        className="absolute -top-24 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-button/25 blur-3xl lg:hidden"
      />
      <motion.div
        aria-hidden="true"
        animate={{ y: [0, -16, 0], opacity: [0.35, 0.6, 0.35] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        className="absolute bottom-8 right-0 h-56 w-56 rounded-full bg-emerald/15 blur-3xl lg:hidden"
      />
      {/* Brand / Vision Panel */}
      <motion.section
        variants={panelVariants}
        initial="hidden"
        animate="visible"
        className="hidden lg:flex relative overflow-hidden border-r border-border bg-card p-10"
      >
        <motion.div
          animate={{ scale: [1, 1.08, 1], opacity: [0.7, 1, 0.7] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-button/20 blur-3xl"
        />
        <motion.div
          animate={{ y: [0, -18, 0], opacity: [0.55, 0.85, 0.55] }}
          transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-20 right-10 h-72 w-72 rounded-full bg-emerald/10 blur-3xl"
        />

        <div className="relative z-10 flex w-full flex-col justify-between">
          <motion.div variants={formVariants} initial="hidden" animate="visible">
            <img
              src={xevaroLogo}
              alt="Xevaro"
              className="h-14 w-auto object-contain"
            />

            <motion.h1
              variants={itemVariants}
              className="mt-8 max-w-xl text-6xl font-bold leading-tight"
            >
              Your tactical AI learning operating system.
            </motion.h1>

            <motion.p
              variants={itemVariants}
              className="mt-6 max-w-lg text-lg leading-8 text-secondary"
            >
              Transform notes into missions, flashcards, quizzes, and focused
              study workflows built for serious exam preparation.
            </motion.p>
          </motion.div>

          <motion.div
            variants={formVariants}
            initial="hidden"
            animate="visible"
            className="grid gap-4"
          >
            <motion.div
              variants={itemVariants}
              whileHover={{ y: -4, borderColor: "hsl(var(--strong-border))" }}
              className="rounded-2xl border border-border bg-background/70 p-5 backdrop-blur"
            >
              <p className="text-xs uppercase tracking-[0.3em] text-secondary">
                AI Generated
              </p>
              <h3 className="mt-3 text-2xl font-semibold">Smart Flashcards</h3>
              <p className="mt-2 leading-7 text-secondary">
                Turn raw notes into focused flashcards and review material.
              </p>
            </motion.div>

            <motion.div
              variants={itemVariants}
              whileHover={{ y: -4, borderColor: "hsl(var(--strong-border))" }}
              className="rounded-2xl border border-border bg-background/70 p-5 backdrop-blur"
            >
              <p className="text-xs uppercase tracking-[0.3em] text-secondary">
                Mission System
              </p>
              <h3 className="mt-3 text-2xl font-semibold">
                Tactical Study Sessions
              </h3>
              <p className="mt-2 leading-7 text-secondary">
                Launch structured study missions with objectives and timers.
              </p>
            </motion.div>

            <motion.div
              variants={itemVariants}
              whileHover={{ y: -4, borderColor: "hsl(var(--strong-border))" }}
              className="rounded-2xl border border-border bg-background/70 p-5 backdrop-blur"
            >
              <p className="text-xs uppercase tracking-[0.3em] text-secondary">
                Analytics
              </p>
              <h3 className="mt-3 text-2xl font-semibold">
                Readiness Engine
              </h3>
              <p className="mt-2 leading-7 text-secondary">
                Understand progress through performance and study patterns.
              </p>
            </motion.div>
          </motion.div>
        </div>
      </motion.section>

      {/* Login Form */}
      <section className="relative z-10 flex min-h-screen items-center justify-center px-5 py-8 sm:px-6 lg:min-h-0 lg:py-12">
        <motion.div
          variants={formVariants}
          initial="hidden"
          animate="visible"
          className="w-full max-w-sm rounded-3xl border border-border bg-card/95 p-5 shadow-2xl shadow-black/30 backdrop-blur sm:max-w-md sm:p-8"
        >
          <motion.div variants={itemVariants} className="mb-6 flex justify-center">
            <img
              src={xevaroSymbol}
              alt="Xevaro"
              className="h-12 w-auto max-w-[220px] object-contain"
            />
          </motion.div>

          <motion.div
            variants={itemVariants}
            className="mb-6 border-b border-border pb-5 lg:hidden"
          >
            <div>
              <p className="text-xs uppercase tracking-[0.35em] text-secondary">
                Xevaro
              </p>
              <h1 className="mt-2 text-xl font-bold leading-tight">
                Study command center
              </h1>
            </div>

            <div className="mt-4 grid grid-cols-3 gap-2 text-center">
              <div className="rounded-xl border border-border bg-background/70 px-2 py-2">
                <p className="text-xs font-semibold">AI</p>
                <p className="mt-1 text-[10px] uppercase tracking-widest text-muted">
                  Notes
                </p>
              </div>
              <div className="rounded-xl border border-border bg-background/70 px-2 py-2">
                <p className="text-xs font-semibold">Quiz</p>
                <p className="mt-1 text-[10px] uppercase tracking-widest text-muted">
                  Prep
                </p>
              </div>
              <div className="rounded-xl border border-border bg-background/70 px-2 py-2">
                <p className="text-xs font-semibold">Focus</p>
                <p className="mt-1 text-[10px] uppercase tracking-widest text-muted">
                  Mode
                </p>
              </div>
            </div>
          </motion.div>

          <motion.div variants={itemVariants}>
            <h2 className="mt-3 text-2xl font-bold sm:text-4xl">Sign in</h2>

            <p className="mt-3 text-secondary">
              Continue your study mission inside Xevaro.
            </p>
          </motion.div>

          <form onSubmit={handleEmailLogin} className="mt-6 space-y-4 sm:mt-8">
            <motion.input
              variants={itemVariants}
              name="email"
              type="email"
              placeholder="Email address"
              required
              className="w-full rounded-xl border border-border bg-background px-4 py-3 text-primary outline-none transition placeholder:text-muted focus:border-strong-border"
            />

            <motion.input
              variants={itemVariants}
              name="password"
              type="password"
              placeholder="Password"
              required
              className="w-full rounded-xl border border-border bg-background px-4 py-3 text-primary outline-none transition placeholder:text-muted focus:border-strong-border"
            />

            <motion.button
              variants={itemVariants}
              whileHover={{ y: -2, scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              className="w-full rounded-xl bg-button py-3 font-semibold text-white transition hover:bg-button-hover"
            >
              Enter Command Center
            </motion.button>
          </form>

          <motion.div variants={itemVariants} className="my-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-border" />
            <span className="text-xs uppercase tracking-widest text-muted">
              or
            </span>
            <div className="h-px flex-1 bg-border" />
          </motion.div>

          <div className="space-y-3">
            <motion.button
              variants={itemVariants}
              whileHover={{ y: -2, borderColor: "hsl(var(--strong-border))" }}
              whileTap={{ scale: 0.98 }}
              onClick={signInWithGoogle}
              className="flex w-full items-center justify-center gap-3 rounded-xl border border-border bg-background py-3 font-medium transition hover:bg-card-hover"
            >
              <GoogleIcon />
              Continue with Google
            </motion.button>

            <motion.button
              variants={itemVariants}
              whileHover={{ y: -2, borderColor: "hsl(var(--strong-border))" }}
              whileTap={{ scale: 0.98 }}
              onClick={signInWithGithub}
              className="flex w-full items-center justify-center gap-3 rounded-xl border border-border bg-background py-3 font-medium transition hover:bg-card-hover"
            >
              <GithubIcon />
              Continue with GitHub
            </motion.button>
          </div>

          <motion.p
            variants={itemVariants}
            className="mt-8 text-center text-sm text-secondary"
          >
            Don&apos;t have an account?{" "}
            <Link to="/signup" className="font-semibold text-button">
              Create one manually
            </Link>
          </motion.p>
        </motion.div>
      </section>
    </main>
  );
}
