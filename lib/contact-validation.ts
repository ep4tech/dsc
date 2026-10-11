import { isValidEmail } from "./validators"
import type { Lang } from "@/types/form"

export const CONTACT_LIMITS = {
  name: [2, 100],
  email: [3, 254],
  phone: [7, 15],
  description: [10, 2000],
} as const
export interface ContactValues {
  name: string
  email: string
  countryCode: string
  phoneNumber: string
  description: string
}
export function validateContact(
  values: ContactValues,
  lang: Lang = "en"
): Partial<Record<keyof ContactValues, string>> {
  const errors: Partial<Record<keyof ContactValues, string>> = {}
  const ar = lang === "ar"
  if (values.name.trim().length < 2 || values.name.trim().length > 100)
    errors.name = ar
      ? "يجب أن يتكون الاسم من 2 إلى 100 حرف."
      : "Name must contain 2–100 characters."
  if (values.email.trim().length > 254 || !isValidEmail(values.email))
    errors.email = ar
      ? "أدخل بريدًا إلكترونيًا صحيحًا لا يتجاوز 254 حرفًا."
      : "Enter a valid email address of up to 254 characters."
  if (!/^\+\d{1,4}$/.test(values.countryCode))
    errors.countryCode = ar ? "اختر رمز البلد." : "Select a country code."
  if (!/^\d{7,15}$/.test(values.phoneNumber.trim()))
    errors.phoneNumber = ar
      ? "يجب أن يتكون رقم الهاتف من 7 إلى 15 رقمًا."
      : "Phone number must contain 7–15 digits."
  if (
    values.description.trim().length < 10 ||
    values.description.trim().length > 2000
  )
    errors.description = ar
      ? "يجب أن تتكون الرسالة من 10 إلى 2000 حرف."
      : "Message must contain 10–2000 characters."
  return errors
}
export function escapeContactHtml(value: string): string {
  return value.replace(
    /[&<>"']/g,
    (char) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        char
      ]!
  )
}
