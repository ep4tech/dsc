import { HeroSection } from "@/components/landing/HeroSection"
import { PortalDiscovery } from "@/components/landing/PortalDiscovery"
import { getTeamExperts } from "@/lib/team-experts"

export default async function HomePage() {
  const experts = await getTeamExperts({ all: true })
  return (
    <div className="flex min-h-screen flex-col">
      {/* 1. Hero Section */}
      <HeroSection experts={experts} />

      {/* 3. Portal Discovery */}
      <PortalDiscovery />
    </div>
  )
}
