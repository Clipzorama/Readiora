import { motion, useReducedMotion } from "framer-motion";
import {
  Activity,
  BrainCircuit,
  Cpu,
  ListChecks,
  Radio,
} from "lucide-react";
import SpotlightCard from "../reactbits/SpotlightCard";
import {
  activityFeed,
  dashboardMetrics,
  reviewQueue,
  statusPills,
  weakTopics,
} from "./landingData";
import SectionReveal from "./SectionReveal";

export default function LiveCommandSimulation() {
  const prefersReducedMotion = useReducedMotion();

  return (
    <SectionReveal id="mission-control" className="relative z-10 mx-auto w-full max-w-[88rem] scroll-mt-24 px-3 py-16 sm:px-4 sm:py-20 lg:px-5 lg:py-28 xl:px-6">
      <div className="mx-auto max-w-4xl text-center">
        <div className="landing-card-surface mx-auto inline-flex items-center gap-2 rounded-full border border-border bg-card/80 px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-secondary transition-colors duration-500">
          <BrainCircuit className="h-3.5 w-3.5 text-primary" />
          Live AI Command Simulation
        </div>
        <h2 className="mt-6 text-[clamp(2.2rem,8vw,4.4rem)] font-extrabold leading-[1.05] tracking-normal">
          Watch Readiora turn study chaos into a live command system.
        </h2>
        <p className="mx-auto mt-5 max-w-3xl text-base leading-8 text-secondary sm:text-lg">
          Readiora analyzes notes, detects weak topics, generates review tools,
          and tracks readiness while your study session moves from raw material
          to a tactical exam plan.
        </p>
      </div>

      <div className="mt-10 sm:mt-12">
        <SpotlightCard
          spotlightColor="rgba(14, 182, 211, 0.22)"
          className="landing-card-surface relative overflow-hidden rounded-[1.75rem] border border-strong-border/60 bg-card/90 p-3 shadow-2xl shadow-button/20 transition-colors duration-500 sm:p-4 lg:rounded-[2.125rem] lg:p-5"
        >
          <motion.div
            aria-hidden="true"
            animate={
              prefersReducedMotion
                ? undefined
                : { opacity: [0.1, 0.28, 0.1], x: ["-12%", "12%", "-12%"] }
            }
            transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
            className="absolute inset-y-0 left-1/4 hidden w-1/2 bg-[linear-gradient(90deg,transparent,hsla(var(--button),0.16),transparent)] blur-2xl lg:block"
          />
          <div className="landing-panel-surface relative overflow-hidden rounded-[1.35rem] border border-border bg-background/88 transition-colors duration-500">
            <motion.div
              aria-hidden="true"
              animate={prefersReducedMotion ? undefined : { top: ["0%", "100%"] }}
              transition={{
                duration: 4.8,
                repeat: Infinity,
                ease: "linear",
                repeatDelay: 0.25,
              }}
              className="pointer-events-none absolute inset-x-0 top-0 z-10 h-px bg-button/70 shadow-[0_0_28px_8px_hsla(var(--button),0.18)]"
            />
            <div className="flex flex-col gap-4 border-b border-border px-4 py-4 transition-colors duration-500 sm:px-5 lg:flex-row lg:items-center lg:justify-between">
              <div className="min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-secondary">
                  Biology Final / Session 04
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-3">
                  <h3 className="text-xl font-bold sm:text-2xl">
                    AI study operations live
                  </h3>
                  <span className="inline-flex items-center gap-2 rounded-full border border-strong-border bg-button/15 px-3 py-1.5 text-xs font-semibold text-primary transition-colors duration-500">
                    <span className="relative flex h-2 w-2">
                      <span className="absolute inline-flex h-full w-full rounded-full bg-button opacity-75 motion-safe:animate-ping" />
                      <span className="relative inline-flex h-2 w-2 rounded-full bg-button" />
                    </span>
                    AI Status: Live
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:justify-end">
                {statusPills.map((pill, index) => (
                  <motion.span
                    key={pill}
                    animate={
                      prefersReducedMotion
                        ? undefined
                        : { opacity: [0.64, 1, 0.74], y: [0, -2, 0] }
                    }
                    transition={{
                      duration: 2.8,
                      delay: index * 0.32,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                    className="landing-card-surface rounded-full border border-border bg-card/80 px-3 py-2 text-center text-[11px] font-semibold uppercase tracking-[0.14em] text-secondary transition-colors duration-500"
                  >
                    {pill}
                  </motion.span>
                ))}
              </div>
            </div>

            <div className="grid gap-4 p-4 sm:p-5 lg:grid-cols-[minmax(0,0.92fr)_minmax(25rem,1.08fr)]">
              <div className="landing-card-surface min-w-0 overflow-hidden rounded-[1.35rem] border border-border bg-card/65 transition-colors duration-500">
                <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3 transition-colors duration-500">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="landing-soft-surface flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-border bg-background/75 transition-colors duration-500">
                      <Cpu className="h-4 w-4 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-primary">
                        AI Activity Feed
                      </p>
                      <p className="text-xs text-secondary">Neural parser online</p>
                    </div>
                  </div>
                  <Radio className="h-4 w-4 shrink-0 text-secondary" />
                </div>

                <div className="space-y-3 p-4">
                  {activityFeed.map((item, index) => (
                    <motion.div
                      key={item.label}
                      animate={
                        prefersReducedMotion
                          ? undefined
                          : {
                              boxShadow: [
                                "0 0 0 hsla(195, 100%, 39%, 0)",
                                "0 0 28px hsla(195, 100%, 39%, 0.16)",
                                "0 0 0 hsla(195, 100%, 39%, 0)",
                              ],
                            }
                      }
                      transition={{
                        duration: 3.4,
                        delay: index * 0.38,
                        repeat: Infinity,
                        ease: "easeInOut",
                      }}
                      className="landing-soft-surface group rounded-2xl border border-border bg-background/70 px-3 py-3 transition-colors duration-500 hover:border-strong-border hover:bg-background/90 sm:px-4"
                    >
                      <div className="flex min-w-0 items-start gap-3">
                        <motion.span
                          animate={
                            prefersReducedMotion
                              ? undefined
                              : { scale: [1, 1.7, 1], opacity: [0.65, 1, 0.65] }
                          }
                          transition={{
                            duration: 1.8,
                            delay: index * 0.18,
                            repeat: Infinity,
                            ease: "easeInOut",
                          }}
                          className="mt-1 h-2 w-2 shrink-0 rounded-full bg-button shadow-[0_0_18px_hsla(var(--button),0.85)]"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-3">
                            <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted">
                              {item.time}
                            </span>
                            <span className="text-[10px] uppercase tracking-[0.18em] text-secondary">
                              {index === 2 ? "Flagged" : "Processing"}
                            </span>
                          </div>
                          <p
                            className={`mt-2 break-words font-mono text-xs leading-6 sm:text-sm ${item.tone}`}
                          >
                            {">"} {item.label}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>

              <div className="min-w-0 space-y-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  {dashboardMetrics.map((metric, index) => {
                    const Icon = metric.icon;
                    return (
                      <motion.div
                        key={metric.label}
                        animate={
                          prefersReducedMotion
                            ? undefined
                            : { y: [0, index % 2 === 0 ? -3 : 3, 0] }
                        }
                        transition={{
                          duration: 4 + index * 0.35,
                          delay: index * 0.25,
                          repeat: Infinity,
                          ease: "easeInOut",
                        }}
                        className="landing-card-surface rounded-[1.25rem] border border-border bg-card/70 p-4 shadow-lg shadow-black/15 transition-colors duration-500"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="min-w-0">
                            <p className="text-xs uppercase tracking-[0.18em] text-secondary">
                              {metric.label}
                            </p>
                            <p className="mt-2 text-3xl font-bold leading-none">
                              {metric.value}
                            </p>
                          </div>
                          <div className="landing-soft-surface flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-border bg-background/75 transition-colors duration-500">
                            <Icon className="h-5 w-5 text-secondary" />
                          </div>
                        </div>
                        <div className="landing-soft-surface mt-4 h-2 overflow-hidden rounded-full bg-background transition-colors duration-500">
                          <motion.div
                            initial={prefersReducedMotion ? false : { width: 0 }}
                            whileInView={
                              prefersReducedMotion
                                ? { width: metric.progress }
                                : { width: metric.progress }
                            }
                            viewport={{ once: false, amount: 0.2 }}
                            transition={{
                              duration: 1.35,
                              delay: 0.18 + index * 0.08,
                              ease: [0.22, 1, 0.36, 1],
                            }}
                            className="h-full rounded-full bg-button shadow-[0_0_18px_hsla(var(--button),0.55)]"
                          />
                        </div>
                      </motion.div>
                    );
                  })}
                </div>

                <div className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
                  <div className="landing-card-surface rounded-[1.25rem] border border-border bg-card/70 p-4 transition-colors duration-500">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-xs uppercase tracking-[0.18em] text-secondary">
                          Review Queue
                        </p>
                        <p className="mt-2 font-semibold text-primary">
                          Generation pipeline
                        </p>
                      </div>
                      <ListChecks className="h-5 w-5 text-secondary" />
                    </div>
                    <div className="mt-4 space-y-2">
                      {reviewQueue.map((item, index) => (
                        <motion.div
                          key={item}
                          animate={
                            prefersReducedMotion
                              ? undefined
                              : { x: [0, 3, 0], opacity: [0.86, 1, 0.86] }
                          }
                          transition={{
                            duration: 3.1,
                            delay: index * 0.28,
                            repeat: Infinity,
                            ease: "easeInOut",
                          }}
                          className="landing-soft-surface flex items-center justify-between gap-3 rounded-xl border border-border bg-background/70 px-3 py-2.5 text-sm transition-colors duration-500"
                        >
                          <span className="font-semibold text-primary">{item}</span>
                          <span className="text-xs text-secondary">Ready</span>
                        </motion.div>
                      ))}
                    </div>
                  </div>

                  <div className="landing-card-surface rounded-[1.25rem] border border-border bg-card/70 p-4 transition-colors duration-500">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-xs uppercase tracking-[0.18em] text-secondary">
                          Weak-Topic Detection
                        </p>
                        <p className="mt-2 font-semibold text-primary">
                          Priority targets
                        </p>
                      </div>
                      <Activity className="h-5 w-5 text-secondary" />
                    </div>
                    <div className="mt-4 space-y-3">
                      {weakTopics.map((topic, index) => (
                        <div key={topic.label}>
                          <div className="flex items-center justify-between gap-3 text-sm">
                            <span className="min-w-0 truncate font-semibold text-primary">
                              {topic.label}
                            </span>
                            <span className="shrink-0 text-xs text-secondary">
                              {topic.score}
                            </span>
                          </div>
                          <div className="landing-soft-surface mt-2 h-1.5 overflow-hidden rounded-full bg-background transition-colors duration-500">
                            <motion.div
                              initial={prefersReducedMotion ? false : { width: 0 }}
                              whileInView={
                                prefersReducedMotion
                                  ? { width: topic.progress }
                                  : { width: topic.progress }
                              }
                              viewport={{ once: false, amount: 0.2 }}
                              transition={{
                                duration: 1.25,
                                delay: 0.24 + index * 0.08,
                                ease: [0.22, 1, 0.36, 1],
                              }}
                              className="h-full rounded-full bg-button/85"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </SpotlightCard>
      </div>
    </SectionReveal>
  );
}
