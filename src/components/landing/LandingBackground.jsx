import { motion, useReducedMotion } from "framer-motion";

function TacticalGrid() {
  return (
    <div
      aria-hidden="true"
      className="absolute inset-0 opacity-[0.34]"
      style={{
        backgroundImage:
          "linear-gradient(hsl(var(--primary) / 0.16) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--primary) / 0.16) 1px, transparent 1px)",
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

export default function LandingBackground() {
  return (
    <>
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
    </>
  );
}
