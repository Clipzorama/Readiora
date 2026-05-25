import { useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, LogIn, MailCheck } from "lucide-react";

import xfaviLogo from "../assets/xfavi.webp";

const loginRedirectDelay = 7000;

const containerVariants = {
  hidden: { opacity: 0, y: 24, scale: 0.98 },
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

export default function VerifyEmail() {
  const navigate = useNavigate();
  const { state } = useLocation();
  const email = typeof state?.email === "string" ? state.email : "";

  useEffect(() => {
    const redirectTimer = window.setTimeout(() => {
      navigate("/login", { replace: true });
    }, loginRedirectDelay);

    return () => window.clearTimeout(redirectTimer);
  }, [navigate]);

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4 py-8 text-primary sm:px-6">
      <motion.div
        aria-hidden="true"
        animate={{ scale: [1, 1.08, 1], opacity: [0.45, 0.75, 0.45] }}
        transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
        className="absolute -top-28 left-1/2 h-80 w-80 -translate-x-1/2 rounded-full bg-button/20 blur-3xl"
      />
      <motion.div
        aria-hidden="true"
        animate={{ y: [0, -18, 0], opacity: [0.25, 0.5, 0.25] }}
        transition={{ duration: 6.5, repeat: Infinity, ease: "easeInOut" }}
        className="absolute bottom-0 right-0 h-72 w-72 rounded-full bg-button-hover/15 blur-3xl"
      />

      <motion.section
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="relative z-10 w-full max-w-lg rounded-2xl border border-border bg-card/95 p-5 text-center shadow-2xl shadow-black/30 backdrop-blur sm:rounded-3xl sm:p-8"
      >
        <motion.img
          variants={itemVariants}
          src={xfaviLogo}
          alt="Xevaro"
          className="mx-auto h-14 w-auto object-contain sm:h-20"
        />

        <motion.div
          variants={itemVariants}
          className="mx-auto mt-5 flex h-16 w-16 items-center justify-center rounded-2xl border border-strong-border bg-button/15 text-primary"
        >
          <MailCheck className="h-8 w-8" />
        </motion.div>

        <motion.div variants={itemVariants}>
          <p className="mt-5 text-xs font-semibold uppercase tracking-[0.28em] text-secondary">
            Verify your email
          </p>
          <h1 className="mt-3 text-3xl font-bold tracking-normal sm:text-4xl">
            Check your inbox
          </h1>
          <p className="mx-auto mt-4 max-w-md text-sm leading-7 text-secondary sm:text-base">
            We sent a verification link
            {email ? (
              <>
                {" "}
                to <span className="font-semibold text-primary">{email}</span>
              </>
            ) : null}
            . Open that email, confirm your account, then come back and sign in
            to Xevaro.
          </p>
        </motion.div>

        <motion.div
          variants={itemVariants}
          className="mt-7 rounded-2xl border border-border bg-background/70 p-4 text-left"
        >
          <p className="text-sm font-semibold text-primary">
            After verification
          </p>
          <p className="mt-2 text-sm leading-6 text-secondary">
            Your account will be ready as soon as the email link is confirmed.
            If the email is not visible, check spam or promotions before trying
            again. You will be sent back to sign in shortly.
          </p>
        </motion.div>

        <motion.div variants={itemVariants} className="mt-7">
          <div className="h-2 overflow-hidden rounded-full bg-background">
            <motion.div
              initial={{ scaleX: 1 }}
              animate={{ scaleX: 0 }}
              transition={{ duration: loginRedirectDelay / 1000, ease: "linear" }}
              className="h-full origin-left rounded-full bg-button"
            />
          </div>
          <p className="mt-3 text-xs font-semibold uppercase tracking-[0.2em] text-secondary">
            Redirecting to sign in
          </p>
        </motion.div>

        <motion.div variants={itemVariants} className="mt-7 grid gap-3 sm:grid-cols-2">
          <Link
            to="/login"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-button px-4 py-3 font-semibold text-white transition hover:bg-button-hover"
          >
            <LogIn className="h-4 w-4" />
            Sign in
          </Link>
          <Link
            to="/"
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-background px-4 py-3 font-semibold text-secondary transition hover:border-strong-border hover:bg-card-hover hover:text-primary"
          >
            <ArrowLeft className="h-4 w-4" />
            Back home
          </Link>
        </motion.div>
      </motion.section>
    </main>
  );
}
