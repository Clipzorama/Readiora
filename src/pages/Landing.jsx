import { Link } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowRight,
  Layers3,
  ShieldCheck,
  Sparkles,
  Timer,
} from "lucide-react";
import SpotlightCard from "../components/reactbits/SpotlightCard";
import GradientText from "../components/reactbits/GradientText";
import TextType from "../components/reactbits/TextType";
import xevaroLogo from "../assets/xevarologo.webp";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.09,
      delayChildren: 0.12,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 18 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.62, ease: [0.22, 1, 0.36, 1] },
  },
};

const metricCards = [
  { icon: Timer, value: "42m", label: "focused block" },
  { icon: Layers3, value: "18", label: "active notes" },
  { icon: ShieldCheck, value: "82%", label: "exam readiness" },
];

const missionRows = [
  { title: "Cellular respiration", status: "Review", value: "88%" },
  { title: "Genetics flashcards", status: "Practice", value: "64%" },
  { title: "Essay outline", status: "Draft", value: "71%" },
];

function TacticalGrid() {
  return (
    <div
      aria-hidden="true"
      className="absolute inset-0 opacity-[0.18]"
      style={{
        backgroundImage:
          "linear-gradient(rgba(255,255,255,0.14) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.14) 1px, transparent 1px)",
        backgroundSize: "44px 44px",
        maskImage:
          "linear-gradient(to bottom, transparent, black 10%, black 78%, transparent)",
      }}
    />
  );
}

function AmbientSweep() {
  const prefersReducedMotion = useReducedMotion();

  if (prefersReducedMotion) {
    return (
      <div
        aria-hidden="true"
        className="absolute left-0 top-0 hidden h-full w-[58rem] rotate-[-12deg] bg-[linear-gradient(90deg,transparent,hsla(var(--button),0.14),transparent)] md:block"
      />
    );
  }

  return (
    <motion.div
      aria-hidden="true"
      initial={{ x: "-45%", opacity: 0.18 }}
      animate={{ x: ["-45%", "15%", "-45%"], opacity: [0.16, 0.28, 0.16] }}
      transition={{ duration: 13, repeat: Infinity, ease: "easeInOut" }}
      className="absolute left-0 top-0 hidden h-full w-[72rem] max-w-none rotate-[-12deg] bg-[linear-gradient(90deg,transparent,hsla(var(--button),0.2),hsla(var(--button-hover),0.12),transparent)] blur-xl md:block"
    />
  );
}

export default function Landing() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-background text-primary">
      <TacticalGrid />
      <AmbientSweep />
      <div
        aria-hidden="true"
        className="absolute inset-x-0 top-0 h-40 bg-[linear-gradient(to_bottom,hsla(var(--button),0.16),transparent)]"
      />
      <div
        aria-hidden="true"
        className="absolute inset-x-0 bottom-0 h-48 bg-[linear-gradient(to_top,hsl(var(--background)),transparent)]"
      />

      <header className="relative z-20 mx-auto flex w-full max-w-[88rem] items-center justify-between px-3 py-6 sm:px-4 sm:py-7 lg:px-5 lg:py-6 xl:px-6">
        <Link to="/" className="flex min-w-0 items-center">
          <img
            src={xevaroLogo}
            alt="Xevaro"
            className="h-7 w-auto object-contain sm:h-8 lg:h-9"
          />
        </Link>

        <nav className="flex items-center gap-2 sm:gap-3">
          <Link
            to="/login"
            className="rounded-xl border border-border bg-card/80 px-3 py-2.5 text-sm font-semibold text-secondary transition hover:border-strong-border hover:bg-card-hover hover:text-primary sm:px-4 sm:py-3 lg:py-2"
          >
            Sign In
          </Link>
          <Link
            to="/signup"
            className="inline-flex items-center gap-2 rounded-xl bg-button px-3 py-2.5 text-sm font-semibold text-white shadow-lg shadow-button/25 transition hover:-translate-y-0.5 hover:bg-button-hover sm:px-5 sm:py-3 lg:py-2"
          >
            Get Started
            <ArrowRight className="hidden h-4 w-4 sm:block" />
          </Link>
        </nav>
      </header>

      <section className="relative z-10 mx-auto grid min-h-[calc(100vh-88px)] w-full max-w-[88rem] items-start gap-8 px-3 pb-12 pt-16 sm:min-h-[calc(100vh-104px)] sm:px-4 sm:pb-16 sm:pt-20 md:pt-24 lg:min-h-[calc(100vh-88px)] lg:grid-cols-[minmax(0,0.9fr)_minmax(26rem,0.95fr)] lg:items-center lg:gap-14 lg:px-5 lg:pt-16 xl:gap-20 xl:px-6 xl:pt-20">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="mx-auto min-w-0 w-full max-w-2xl overflow-hidden text-center lg:mx-0 lg:max-w-[38rem] lg:text-left xl:max-w-[42rem]"
        >
          <motion.div
            variants={itemVariants}
            className="mx-auto inline-flex items-center gap-2 rounded-full border border-border bg-card/85 px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-secondary sm:text-xs lg:mx-0"
          >
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            Premium AI Study Platform
          </motion.div>

          <motion.h1
            variants={itemVariants}
            className="mt-6 max-w-full text-[clamp(2.35rem,10vw,3.75rem)] font-extrabold leading-[1.02] tracking-normal sm:text-[clamp(3rem,7vw,4.75rem)] lg:text-[clamp(3.4rem,4.4vw,4.75rem)] xl:text-[5.15rem]"
          >
            Command your study day with{" "}
            <GradientText
              colors={["#e6fbff", "#7dd3fc", "#0eb6d3", "#e6fbff"]}
              animationSpeed={7}
              pauseOnHover
              className="block max-w-full overflow-hidden"
            >
              <TextType
                text={["tactical AI.", "AI precision.", "exam prep."]}
                className="max-w-full"
                typingSpeed={58}
                deletingSpeed={28}
                pauseDuration={1700}
              />
            </GradientText>
          </motion.h1>

          <motion.p
            variants={itemVariants}
            className="mx-auto mt-5 max-w-2xl text-base leading-8 text-secondary sm:text-lg lg:mx-0"
          >
            Xevaro turns notes, subjects, and revision goals into a polished
            operating system for focused sessions, AI-assisted practice, and
            measurable exam readiness.
          </motion.p>

          <motion.div
            variants={itemVariants}
            className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-3"
          >
            {metricCards.map((metric) => {
              const Icon = metric.icon;
              return (
                <SpotlightCard
                  key={metric.label}
                  spotlightColor="rgba(14, 182, 211, 0.26)"
                  className="rounded-2xl border border-border bg-card/75 p-4 text-left transition hover:border-strong-border"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border bg-background/80">
                      <Icon className="h-5 w-5 text-secondary" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-2xl font-bold leading-none">
                        {metric.value}
                      </p>
                      <p className="mt-1 text-xs leading-5 text-secondary">
                        {metric.label}
                      </p>
                    </div>
                  </div>
                </SpotlightCard>
              );
            })}
          </motion.div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 24, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.75, delay: 0.22, ease: [0.22, 1, 0.36, 1] }}
          className="mx-auto min-w-0 w-full max-w-xl lg:max-w-none"
        >
          <SpotlightCard
            spotlightColor="rgba(14, 165, 200, 0.24)"
            className="rounded-[1.75rem] border border-border bg-card/90 p-3 shadow-2xl shadow-black/35 sm:p-4 lg:rounded-[2rem]"
          >
            <div className="overflow-hidden rounded-[1.35rem] border border-border bg-background/85">
              <div className="flex items-center justify-between border-b border-border px-4 py-4 sm:px-5">
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-secondary">
                    Live Mission Control
                  </p>
                  <h2 className="mt-2 truncate text-xl font-bold sm:text-2xl">
                    Biology final prep
                  </h2>
                </div>
                <div className="ml-3 rounded-xl border border-strong-border bg-button/15 px-3 py-2 text-sm font-semibold text-primary">
                  82%
                </div>
              </div>

              <div className="grid gap-3 p-4 sm:p-5">
                <div className="grid gap-3 sm:grid-cols-[1fr_0.78fr]">
                  <div className="rounded-2xl border border-border bg-card/70 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-xs uppercase tracking-[0.2em] text-secondary">
                          Focus Window
                        </p>
                        <p className="mt-2 text-3xl font-bold">42:00</p>
                      </div>
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-border bg-background/75">
                        <Timer className="h-6 w-6 text-secondary" />
                      </div>
                    </div>
                    <div className="mt-4 h-2 overflow-hidden rounded-full bg-background">
                      <motion.div
                        initial={{ scaleX: 0 }}
                        animate={{ scaleX: 0.78 }}
                        transition={{
                          duration: 1.1,
                          delay: 0.55,
                          ease: "easeOut",
                        }}
                        className="h-full origin-left rounded-full bg-button"
                      />
                    </div>
                  </div>

                  <div className="rounded-2xl border border-border bg-card/70 p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-secondary">
                      AI Queue
                    </p>
                    <div className="mt-3 space-y-2">
                      {["Flashcards", "Quiz", "Weak topics"].map((item) => (
                        <div
                          key={item}
                          className="flex items-center justify-between rounded-xl bg-background/70 px-3 py-2 text-sm"
                        >
                          <span>{item}</span>
                          <span className="text-secondary">Ready</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  {missionRows.map((row, index) => (
                    <motion.div
                      key={row.title}
                      initial={{ opacity: 0, x: 16 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{
                        duration: 0.5,
                        delay: 0.45 + index * 0.1,
                        ease: [0.22, 1, 0.36, 1],
                      }}
                      className="grid grid-cols-[1fr_auto] items-center gap-3 rounded-2xl border border-border bg-card/65 p-4"
                    >
                      <div className="min-w-0">
                        <p className="truncate font-semibold">{row.title}</p>
                        <p className="mt-1 text-sm text-secondary">
                          {row.status}
                        </p>
                      </div>
                      <p className="rounded-xl border border-border bg-background/75 px-3 py-2 text-sm font-semibold">
                        {row.value}
                      </p>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          </SpotlightCard>
        </motion.div>
      </section>
    </main>
  );
}
