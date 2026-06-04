import LandingBackground from "../components/landing/LandingBackground";
import LandingFAQ from "../components/landing/LandingFAQ";
import LandingFooter from "../components/landing/LandingFooter";
import LandingHeader from "../components/landing/LandingHeader";
import LandingHero from "../components/landing/LandingHero";
import LiveCommandSimulation from "../components/landing/LiveCommandSimulation";

export default function Landing() {
  return (
    <main className="landing-page relative flex min-h-screen flex-col overflow-x-clip bg-background text-primary">
      <LandingBackground />
      <LandingHeader />
      <div className="relative z-10 flex-1">
        <LandingHero />
        <LiveCommandSimulation />
        <LandingFAQ />
      </div>
      <LandingFooter />
    </main>
  );
}
