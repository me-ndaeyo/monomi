import AudienceTabs from "./_components/audience-tabs"
import Hero from "./_components/hero"
import { HowItWorks, Safety } from "./_components/how-and-safety"
import LandingFooter from "./_components/landing-footer"
import LandingNav from "./_components/landing-nav"

export default function LandingPage() {
  return (
    <div className="min-h-dvh overflow-x-hidden bg-ink text-bone">
      <LandingNav />
      <main>
        <Hero />
        <AudienceTabs />
        <HowItWorks />
        <Safety />
      </main>
      <LandingFooter />
    </div>
  )
}
