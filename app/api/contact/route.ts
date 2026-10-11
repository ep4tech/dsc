import {
  guardMessaging,
  readMessagingBody,
  messagingError,
} from "@/lib/messaging-security"
import { Resend } from "resend"
import {
  escapeContactHtml,
  validateContact,
  type ContactValues,
} from "@/lib/contact-validation"

export async function POST(request: Request) {
  try {
    guardMessaging(request)
    const raw = await readMessagingBody(request)
    const lang = raw.lang === "ar" ? "ar" : "en"
    const values = Object.fromEntries(
      ["name", "email", "countryCode", "phoneNumber", "description"].map(
        (key) => [key, typeof raw[key] === "string" ? raw[key].trim() : ""]
      )
    ) as unknown as ContactValues
    const errors = validateContact(values, lang)
    if (Object.keys(errors).length)
      return Response.json({ errors }, { status: 400 })
    if (
      process.env.NODE_ENV === "development" &&
      process.env.DSC_LOCAL_BACKEND === "true"
    )
      return Response.json({ success: true })
    const html = `<h2>Contact message</h2><p>${escapeContactHtml(values.name)}</p><p>${escapeContactHtml(values.email)}</p><p>${escapeContactHtml(values.countryCode + " " + values.phoneNumber)}</p><p>${escapeContactHtml(values.description).replace(/\n/g, "<br/>")}</p>`
    const { error } = await new Resend(process.env.RESEND_API_KEY).emails.send({
      from: "admin@dsc.ac",
      to: "contact@dsc.ac",
      replyTo: values.email,
      subject: `Contact message from: ${values.name}`,
      html,
    })
    if (error) throw new Error("Email delivery failed")
    return Response.json({ success: true })
  } catch (error) {
    return messagingError(error)
  }
}
