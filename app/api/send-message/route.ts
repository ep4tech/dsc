import { Resend } from "resend"
import { escapeContactHtml } from "@/lib/contact-validation"
import {
  guardMessaging,
  readMessagingBody,
  messageString,
  messagingError,
  RequestError,
  localMessagingDisabled,
} from "@/lib/messaging-security"
export async function POST(request: Request) {
  try {
    guardMessaging(request)
    const body = await readMessagingBody(request)
    const values = Object.fromEntries(
      [
        "name",
        "contact",
        "email",
        "issueType",
        "caseType",
        "consultationType",
        "preferredDate",
        "preferredTime",
        "description",
      ].map((key) => [
        key,
        messageString(
          body,
          key,
          key === "description" ? 3000 : 254,
          ["name", "contact", "email"].includes(key)
        ),
      ])
    )
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email))
      throw new RequestError("Invalid email")
    const text =
      "New Consultation Request\n" +
      Object.entries(values)
        .map(([key, value]) => `${key}: ${value}`)
        .join("\n")
    if (text.length > 4000)
      throw new RequestError("Consultation request too long")
    if (localMessagingDisabled())
      return Response.json({ message: "Sent successfully" })
    const { error } = await new Resend(process.env.RESEND_API_KEY).emails.send({
      from: "admin@dsc.ac",
      to: "consult@dsc.ac",
      replyTo: values.email,
      subject: "New consultation request",
      html: `<p>${escapeContactHtml(text).replace(/\n/g, "<br>")}</p>`,
    })
    if (error) throw new Error("Delivery failed")
    const response = await fetch(
      `https://api.telegram.org/bot${process.env.BOT_TOKEN}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: "-1003957107896", text }),
        signal: AbortSignal.timeout(10_000),
      }
    )
    if (!response.ok || !(await response.json()).ok)
      throw new Error("Delivery failed")
    return Response.json({ message: "Sent successfully" })
  } catch (error) {
    return messagingError(error)
  }
}
