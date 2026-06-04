import { useState } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Menu, X } from "lucide-react";
import ThemeToggle from "../ThemeToggle";
import readioraLogo from "../../assets/readioralogo.webp";

const navLinks = [
  { label: "Overview", href: "#overview" },
  { label: "Mission Control", href: "#mission-control" },
  { label: "FAQ", href: "#faq" },
];

export default function LandingHeader() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-30 border-b border-border/80 bg-background/82 backdrop-blur-2xl transition-colors duration-500">
      <div className="mx-auto flex w-full max-w-352 items-center justify-between gap-3 px-3 py-3 sm:px-4 lg:px-5 xl:px-6">
        <Link to="/" className="flex min-w-0 items-center" onClick={() => setMenuOpen(false)}>
          <img
            src={readioraLogo}
            alt="Readiora"
            className="h-7 w-auto object-contain sm:h-8 lg:h-9"
          />
        </Link>

        <nav className="landing-card-surface hidden items-center gap-1 rounded-2xl border border-border bg-card/78 p-1 shadow-lg shadow-black/5 transition-colors duration-500 lg:flex">
          {navLinks.map((item) => (
            <a
              key={item.label}
              href={item.href}
              className="rounded-xl px-4 py-2.5 text-sm font-semibold text-secondary transition-colors duration-500 hover:bg-card-hover hover:text-primary"
            >
              {item.label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          <ThemeToggle />
          <Link
            to="/login"
            className="landing-card-surface rounded-xl border border-border bg-card/80 px-4 py-2.5 text-sm font-semibold text-secondary shadow-sm shadow-black/5 transition-colors duration-500 hover:border-strong-border hover:bg-card-hover hover:text-primary"
          >
            Sign In
          </Link>
          <Link
            to="/signup"
            className="inline-flex items-center gap-2 rounded-xl bg-button px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-button/25 transition hover:-translate-y-0.5 hover:bg-button-hover"
          >
            Get Started
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="flex items-center gap-2 md:hidden">
          <ThemeToggle compact />
          <button
            type="button"
            onClick={() => setMenuOpen((current) => !current)}
            className="landing-card-surface grid h-10 w-10 place-items-center rounded-xl border border-border bg-card/85 text-secondary shadow-sm shadow-black/5 transition-colors duration-500 hover:border-strong-border hover:bg-card-hover hover:text-primary"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
          >
            {menuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="border-t border-border bg-background/95 px-3 py-3 shadow-xl shadow-black/10 backdrop-blur-2xl transition-colors duration-500 md:hidden"
          >
            <nav className="mx-auto grid w-full max-w-352 gap-2">
              {navLinks.map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  onClick={() => setMenuOpen(false)}
                  className="landing-card-surface rounded-xl border border-border bg-card/75 px-4 py-3 text-sm font-semibold text-secondary transition-colors duration-500 hover:border-strong-border hover:bg-card-hover hover:text-primary"
                >
                  {item.label}
                </a>
              ))}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <Link
                  to="/login"
                  onClick={() => setMenuOpen(false)}
                  className="landing-card-surface inline-flex min-h-11 items-center justify-center rounded-xl border border-border bg-card/80 px-4 py-2.5 text-sm font-semibold text-secondary transition-colors duration-500 hover:border-strong-border hover:bg-card-hover hover:text-primary"
                >
                  Sign In
                </Link>
                <Link
                  to="/signup"
                  onClick={() => setMenuOpen(false)}
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-button px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-button/25 transition hover:bg-button-hover"
                >
                  Get Started
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
