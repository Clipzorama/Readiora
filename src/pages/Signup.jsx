import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";

import readioraFaviconLogo from "../assets/readiora-favicon.webp";
import {
  signUpWithEmail,
  signInWithGoogle,
  signInWithGithub,
} from "../services/authService";

const panelVariants = {
  hidden: { opacity: 0, x: 28 },
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

export default function Signup() {
  const navigate = useNavigate();

  async function handleSignup(e) {
    e.preventDefault();

    const formData = new FormData(e.currentTarget);
    const firstName = formData.get("firstName");
    const lastName = formData.get("lastName");
    const email = formData.get("email");
    const password = formData.get("password");

    try {
      const data = await signUpWithEmail(email, password, firstName, lastName);

      if (data.session) {
        navigate("/dashboard");
        return;
      }

      navigate("/verify-email", { state: { email } });
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
        className="absolute bottom-8 left-0 h-56 w-56 rounded-full bg-button-hover/15 blur-3xl lg:hidden"
      />
      {/* Signup Form */}
      <section className="relative z-10 flex min-h-screen items-center justify-center px-4 py-4 sm:px-6 sm:py-8 lg:min-h-0 lg:py-12">
        <motion.div
          variants={formVariants}
          initial="hidden"
          animate="visible"
          className="w-full max-w-sm rounded-2xl border border-border bg-card/95 p-4 shadow-2xl shadow-black/30 backdrop-blur sm:max-w-md sm:rounded-3xl sm:p-8"
        >
          <motion.div variants={itemVariants} className="text-center">
            <img
              src={readioraFaviconLogo}
              alt="Readiora"
              className="mx-auto h-14 w-auto object-contain sm:h-20"
            />
            <h2 className="mt-2 text-xl font-bold sm:mt-3 sm:text-4xl">
              Create account
            </h2>

            <p className="mt-2 text-sm text-secondary sm:mt-3 sm:text-base">
              Build your personal AI-powered study command center.
            </p>
          </motion.div>

          <form onSubmit={handleSignup} className="mt-4 space-y-3 sm:mt-8 sm:space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <motion.input
                variants={itemVariants}
                name="firstName"
                type="text"
                placeholder="First name"
                required
                autoComplete="given-name"
                className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-primary outline-none transition placeholder:text-muted focus:border-strong-border sm:py-3"
              />

              <motion.input
                variants={itemVariants}
                name="lastName"
                type="text"
                placeholder="Last name"
                required
                autoComplete="family-name"
                className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-primary outline-none transition placeholder:text-muted focus:border-strong-border sm:py-3"
              />
            </div>

            <motion.input
              variants={itemVariants}
              name="email"
              type="email"
              placeholder="Email address"
              required
              className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-primary outline-none transition placeholder:text-muted focus:border-strong-border sm:py-3"
            />

            <motion.input
              variants={itemVariants}
              name="password"
              type="password"
              placeholder="Password"
              required
              className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-primary outline-none transition placeholder:text-muted focus:border-strong-border sm:py-3"
            />

            <motion.button
              variants={itemVariants}
              whileHover={{ y: -2, scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              className="w-full rounded-xl bg-button py-2.5 font-semibold text-white transition hover:bg-button-hover sm:py-3"
            >
              Launch Readiora
            </motion.button>
          </form>

          <motion.div variants={itemVariants} className="my-4 flex items-center gap-3 sm:my-6">
            <div className="h-px flex-1 bg-border" />
            <span className="text-xs uppercase tracking-widest text-muted">
              or
            </span>
            <div className="h-px flex-1 bg-border" />
          </motion.div>

          <div className="space-y-2 sm:space-y-3">
            <motion.button
              variants={itemVariants}
              whileHover={{ y: -2, borderColor: "hsl(var(--strong-border))" }}
              whileTap={{ scale: 0.98 }}
              onClick={signInWithGoogle}
              className="flex w-full items-center justify-center gap-3 rounded-xl border border-border bg-background py-2.5 font-medium transition hover:bg-card-hover sm:py-3"
            >
              <GoogleIcon />
              Sign up with Google
            </motion.button>

            <motion.button
              variants={itemVariants}
              whileHover={{ y: -2, borderColor: "hsl(var(--strong-border))" }}
              whileTap={{ scale: 0.98 }}
              onClick={signInWithGithub}
              className="flex w-full items-center justify-center gap-3 rounded-xl border border-border bg-background py-2.5 font-medium transition hover:bg-card-hover sm:py-3"
            >
              <GithubIcon />
              Sign up with GitHub
            </motion.button>
          </div>

          <motion.p
            variants={itemVariants}
            className="mt-5 text-center text-sm text-secondary sm:mt-8"
          >
            Already have an account?{" "}
            <Link to="/login" className="font-semibold text-button">
              Sign in
            </Link>
          </motion.p>

          <motion.div variants={itemVariants} className="mt-3 sm:mt-5">
            <Link
              to="/"
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-background py-2.5 font-medium text-secondary transition hover:border-strong-border hover:bg-card-hover hover:text-primary sm:py-3"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to home
            </Link>
          </motion.div>
        </motion.div>
      </section>

      {/* Brand / Vision Panel */}
      <motion.section
        variants={panelVariants}
        initial="hidden"
        animate="visible"
        className="relative hidden overflow-hidden border-l border-border bg-card p-8 lg:flex xl:p-10"
      >
        <motion.div
          animate={{ scale: [1, 1.08, 1], opacity: [0.7, 1, 0.7] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-20 right-0 h-96 w-96 rounded-full bg-button/20 blur-3xl"
        />
        <motion.div
          animate={{ y: [0, -18, 0], opacity: [0.55, 0.85, 0.55] }}
          transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-0 left-10 h-72 w-72 rounded-full bg-button-hover/10 blur-3xl"
        />

        <div className="relative z-10 flex w-full flex-col gap-8 xl:gap-20">
          <motion.div variants={formVariants} initial="hidden" animate="visible">
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-secondary">
              Readiora
            </p>

            <motion.h1
              variants={itemVariants}
              className="mt-7 max-w-xl text-5xl font-bold leading-tight"
            >
              Study with structure, strategy, and intelligent feedback.
            </motion.h1>

            <motion.p
              variants={itemVariants}
              className="mt-6 max-w-lg text-base leading-8 text-secondary xl:text-lg"
            >
              Readiora helps students move from scattered notes to organized
              missions, AI-generated practice, and measurable progress.
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
              className="rounded-2xl border border-border bg-background/70 p-4 backdrop-blur xl:p-5"
            >
              <p className="text-xs uppercase tracking-[0.3em] text-secondary">
                Organize
              </p>
              <h3 className="mt-3 text-2xl font-semibold">
                Subjects & Notes
              </h3>
              <p className="mt-2 leading-7 text-secondary">
                Build a clean study system around subjects, notes, and topics.
              </p>
            </motion.div>

            <motion.div
              variants={itemVariants}
              whileHover={{ y: -4, borderColor: "hsl(var(--strong-border))" }}
              className="rounded-2xl border border-border bg-background/70 p-4 backdrop-blur xl:p-5"
            >
              <p className="text-xs uppercase tracking-[0.3em] text-secondary">
                Generate
              </p>
              <h3 className="mt-3 text-2xl font-semibold">
                Flashcards & Quizzes
              </h3>
              <p className="mt-2 leading-7 text-secondary">
                Convert learning material into practice tools with AI support.
              </p>
            </motion.div>

            <motion.div
              variants={itemVariants}
              whileHover={{ y: -4, borderColor: "hsl(var(--strong-border))" }}
              className="rounded-2xl border border-border bg-background/70 p-4 backdrop-blur xl:p-5"
            >
              <p className="text-xs uppercase tracking-[0.3em] text-secondary">
                Improve
              </p>
              <h3 className="mt-3 text-2xl font-semibold">
                Mission-Based Progress
              </h3>
              <p className="mt-2 leading-7 text-secondary">
                Track focused sessions and build momentum toward exam mastery.
              </p>
            </motion.div>
          </motion.div>
        </div>
      </motion.section>
    </main>
  );
}
