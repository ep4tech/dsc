import type { BilingualString, Lang } from "@/types/form"

export function t(text: BilingualString, lang: Lang): string {
  return text[lang]
}

export function dir(lang: Lang): "ltr" | "rtl" {
  return lang === "ar" ? "rtl" : "ltr"
}

export function localizedField<T extends object>(
  item: T,
  lang: Lang,
  field: string
): string {
  const fields = item as Record<string, unknown>
  const val = fields[`${field}_${lang}`]
  if (typeof val === "string" && val) return val
  const fallback = fields[`${field}_en`]
  return typeof fallback === "string" ? fallback : ""
}

export const UI_STRINGS: Record<string, BilingualString> = {
  next: { en: "Next", ar: "التالي" },
  back: { en: "Back", ar: "السابق" },
  submit: { en: "Submit", ar: "إرسال" },
  submitting: { en: "Submitting...", ar: "جارٍ الإرسال..." },
  step: { en: "Step", ar: "الخطوة" },
  of: { en: "of", ar: "من" },
  required_error: {
    en: "This field is required",
    ar: "هذا الحقل مطلوب",
  },
  select_placeholder: {
    en: "Select an option",
    ar: "اختر خياراً",
  },
  close: {
    en: "Close",
    ar: "إغلاق",
  },
  cancel: {
    en: "Cancel",
    ar: "إلغاء",
  },
  save: {
    en: "Save",
    ar: "حفظ",
  },
  saving: {
    en: "Saving...",
    ar: "جارٍ الحفظ...",
  },
  discard_changes: {
    en: "Discard Changes",
    ar: "تجاهل التغييرات",
  },
  published: {
    en: "Published",
    ar: "منشور",
  },
  draft: {
    en: "Draft",
    ar: "مسودة",
  },
  preview: {
    en: "Preview",
    ar: "معاينة",
  },
  language_label: {
    en: "العربية",
    ar: "English",
  },
  form_title: {
    en: "Client Intake Form",
    ar: "استمارة استقبال العملاء",
  },
}

export { formatDate } from "./format-date"
