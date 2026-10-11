import type { BilingualString, Lang } from "@/types/form"
import { COUNTRY_CODES } from "./country-codes"

export function countryLabel(value: string, lang: Lang): string {
  const country = COUNTRY_CODES.find(c => c.value === value || c.label.en === value || c.label.ar === value)
  return country?.label[lang] || value
}

export interface ExpertOption {
  value: string
  label: string
}

/** Turns a stored enum value into a readable sentence-cased label. */
export function humanize(value: string): string {
  return value
    .replace(/_/g, " ")
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ")
}

export const AGE_GROUPS: ExpertOption[] = [
  "0-3",
  "4-6",
  "7-12",
  "13-17",
  "18-25",
  "26-40",
  "41-60",
  "60+",
  "all_ages",
].map((value) => ({ value, label: humanize(value) }))

export const CONSULTATION_MODES: ExpertOption[] = [
  "online",
  "at_dsc",
  "home_visit",
  "client_institution",
  "hybrid",
].map((value) => ({ value, label: humanize(value) }))

export const ACADEMIC_DEGREES: ExpertOption[] = [
  { value: "high_school_secondary", label: "High School / Secondary" },
  { value: "diploma", label: "Diploma" },
  { value: "associate_degree", label: "Associate Degree" },
  { value: "bachelors_degree", label: "Bachelor's Degree" },
  { value: "masters_degree", label: "Master's Degree" },
  { value: "doctorate_phd", label: "Doctorate (PhD)" },
  { value: "professional_degree", label: "Professional Degree" },
  { value: "postdoctoral_fellowship", label: "Postdoctoral / Fellowship" },
  { value: "other", label: "Other" },
]

/** Combined cap for a profile photo plus all CV uploads. */
export const MAX_ATTACHMENT_MB = 35
export const MAX_ATTACHMENT_BYTES = MAX_ATTACHMENT_MB * 1024 * 1024

const AGE_GROUP_LABELS: Record<string, BilingualString> = {
  "0-3": { en: "0-3", ar: "0-3" },
  "4-6": { en: "4-6", ar: "4-6" },
  "7-12": { en: "7-12", ar: "7-12" },
  "13-17": { en: "13-17", ar: "13-17" },
  "18-25": { en: "18-25", ar: "18-25" },
  "26-40": { en: "26-40", ar: "26-40" },
  "41-60": { en: "41-60", ar: "41-60" },
  "60+": { en: "60+", ar: "+60" },
  all_ages: { en: "All ages", ar: "جميع الأعمار" },
}

const CONSULTATION_MODE_LABELS: Record<string, BilingualString> = {
  online: { en: "Online", ar: "عن بُعد" },
  at_dsc: { en: "At DSC", ar: "في مركز DSC" },
  home_visit: { en: "Home visit", ar: "زيارة منزلية" },
  client_institution: { en: "Client institution", ar: "مؤسسة العميل" },
  hybrid: { en: "Hybrid", ar: "هجين" },
}

export function ageGroupLabel(value: string, lang: Lang): string {
  return AGE_GROUP_LABELS[value]?.[lang] ?? humanize(value)
}

export function consultationModeLabel(value: string, lang: Lang): string {
  return CONSULTATION_MODE_LABELS[value]?.[lang] ?? humanize(value)
}

