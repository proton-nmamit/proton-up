import { Navbar } from "@/components/navbar"
import { HeroSection } from "@/components/hero-section"
import { ProtonPillarsBento } from "@/components/proton-pillars-bento"
import { ProtonFeaturedEvents } from "@/components/proton-featured-events"
import { Footer } from "@/components/footer"
import { getPublicEvents } from "@/lib/data-service"

export const dynamic = "force-dynamic"

export default async function Page() {
  const events = await getPublicEvents()

  return (
    <div className="min-h-screen dot-grid-bg flex flex-col">
      <Navbar />
      <main className="flex-1 flex flex-col">
        <HeroSection />
        <div id="proton-initiatives">
          <ProtonPillarsBento />
        </div>
        <ProtonFeaturedEvents events={events} />
      </main>
      <Footer />
    </div>
  )
}
