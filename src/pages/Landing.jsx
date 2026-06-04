import LandingBackground from "../components/landing/LandingBackground";
import LandingFAQ from "../components/landing/LandingFAQ";
import LandingFooter from "../components/landing/LandingFooter";
import LandingHeader from "../components/landing/LandingHeader";
import LandingHero from "../components/landing/LandingHero";
import LiveCommandSimulation from "../components/landing/LiveCommandSimulation";

export default function Landing() {
  return (
    <main className="landing-page relative min-h-screen overflow-x-clip bg-background text-primary transition-colors duration-500">
      <LandingBackground />
      <LandingHeader />
      <LandingHero />
      <LiveCommandSimulation />
      <LandingFAQ />
      <LandingFooter />
    </main>
  );
}
