import {
  HeartHandshake,
  Brain,
  GraduationCap,
  Building2,
  Heart,
  Users,
  BookOpen,
  Lightbulb,
  Briefcase,
  Globe,
} from "lucide-react"
export const portalIcons = {
  heartHandshake: HeartHandshake,
  brain: Brain,
  graduationCap: GraduationCap,
  building2: Building2,
  heart: Heart,
  users: Users,
  bookOpen: BookOpen,
  lightbulb: Lightbulb,
  briefcase: Briefcase,
  globe: Globe,
}
export function PortalIcon({
  name,
  size = 25,
}: {
  name?: string
  size?: number
}) {
  const Icon = portalIcons[name as keyof typeof portalIcons] || Globe
  return <Icon size={size} strokeWidth={1.6} />
}
