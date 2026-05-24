import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ChevronDown, Sparkles } from "lucide-react";
import { faqItems } from "./landingData";
import SectionReveal from "./SectionReveal";

function FAQItem({ item, isOpen, onToggle }) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <motion.div
      layout
      className="overflow-hidden rounded-2xl border border-border bg-card/75 transition hover:border-strong-border hover:bg-card/90"
    >
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-4 px-5 py-5 text-left sm:px-6"
        aria-expanded={isOpen}
      >
        <span className="text-base font-semibold text-primary sm:text-lg">
          {item.question}
        </span>
        <motion.span
          animate={prefersReducedMotion ? undefined : { rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.24, ease: "easeOut" }}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border bg-background/75"
        >
          <ChevronDown className="h-4 w-4 text-secondary" />
        </motion.span>
      </button>
      <AnimatePresence initial={false}>
        {isOpen ? (
          <motion.div
            key="answer"
            initial={prefersReducedMotion ? false : { height: 0, opacity: 0 }}
            animate={
              prefersReducedMotion ? { opacity: 1 } : { height: "auto", opacity: 1 }
            }
            exit={prefersReducedMotion ? { opacity: 0 } : { height: 0, opacity: 0 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
          >
            <p className="px-5 pb-5 text-sm leading-7 text-secondary sm:px-6 sm:pb-6 sm:text-base">
              {item.answer}
            </p>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </motion.div>
  );
}

export default function LandingFAQ() {
  const [openIndex, setOpenIndex] = useState(0);

  return (
    <SectionReveal className="relative z-10 mx-auto w-full max-w-5xl px-3 py-16 sm:px-4 sm:py-20 lg:px-5 lg:py-24">
      <div className="mx-auto max-w-3xl text-center">
        <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-border bg-card/80 px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-secondary">
          <Sparkles className="h-3.5 w-3.5 text-primary" />
          Support the workflow
        </div>
        <h2 className="mt-6 text-[clamp(2.2rem,8vw,4.3rem)] font-extrabold leading-[1.05] tracking-normal">
          Frequently Asked Questions
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-base leading-8 text-secondary sm:text-lg">
          Everything students and teams usually ask before turning Xevaro into
          their daily study workspace.
        </p>
      </div>

      <div className="mt-10 grid gap-3 sm:mt-12">
        {faqItems.map((item, index) => (
          <FAQItem
            key={item.question}
            item={item}
            isOpen={openIndex === index}
            onToggle={() => setOpenIndex(openIndex === index ? -1 : index)}
          />
        ))}
      </div>
    </SectionReveal>
  );
}
