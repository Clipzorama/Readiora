import { CreditCard, LockKeyhole, Smartphone } from "lucide-react";
import { useTheme } from "../../hooks/useTheme";
import readioraDarkLogo from "../../assets/readioradark.webp";
import readioraLightLogo from "../../assets/readioralight.webp";

export default function LandingFooter() {
  const { theme } = useTheme();
  const readioraLogo = theme === "light" ? readioraLightLogo : readioraDarkLogo;

  return (
    <footer className="relative z-10 mt-auto border-t border-border bg-background/95 px-3 py-10 sm:px-4 lg:px-5">
      <div className="mx-auto flex w-full max-w-352 flex-col gap-8">
        <div className="landing-card-surface flex flex-col gap-6 rounded-3xl border border-border bg-card/65 p-5 sm:p-6 md:flex-row md:items-center md:justify-between">
          <div>
            <img src={readioraLogo} alt="Readiora" className="h-8 w-auto object-contain" />
            <p className="mt-4 max-w-xl text-sm leading-7 text-secondary">
              An AI-powered study command center for focused notes, smarter
              review, and calmer exam preparation.
            </p>
          </div>
          <div className="grid gap-2 text-sm text-secondary sm:text-right">
            <span className="font-semibold text-primary">Created by Clipzorama</span>
            <div className="flex gap-3 sm:justify-end">
              <LockKeyhole className="h-4 w-4" />
              <Smartphone className="h-4 w-4" />
              <CreditCard className="h-4 w-4" />
            </div>
          </div>
        </div>
        <p className="text-center text-xs text-muted">
          © 2026 Readiora LLC. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
