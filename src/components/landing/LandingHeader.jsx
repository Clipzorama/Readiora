import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import xevaroLogo from "../../assets/xevarologo.webp";

export default function LandingHeader() {
  return (
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
  );
}
