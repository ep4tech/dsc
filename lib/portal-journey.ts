import type { UserRole } from "@/types/user"

const registrationRoutes: Record<string, string> = {
  "1": "/register/parent",
  "2": "/register/individual",
  "4": "/register/individual",
  "5": "/register/organization",
}
const caseRoutes: Record<UserRole, string> = {
  parent: "/dashboard/parent/cases",
  individual: "/dashboard/individual/cases",
  organization: "/dashboard/institution/projects",
  expert: "/dashboard/expert/cases",
  admin: "/dashboard/admin/cases",
  super_admin: "/dashboard/admin/cases",
}

export function portalJourneyHref(portalId: string, role?: UserRole, registrationType?: "parent" | "individual" | "organization" | "expert"): string {
  if (role) return caseRoutes[role] || "/dashboard"
  if (registrationType) return `/register/${registrationType}`
  return registrationRoutes[portalId] || "/register"
}
