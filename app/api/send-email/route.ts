import { Resend } from "resend"
import {
  guardMessaging,
  readMessagingBody,
  messagingUser,
  messageString,
  messagingError,
  RequestError,
  localMessagingDisabled,
} from "@/lib/messaging-security"

export async function POST(request: Request) {
  try {
    guardMessaging(request)
    const user = await messagingUser(request, true)
    const body = await readMessagingBody(request, 2_000_000)
    const to = messageString(body, "to", 254)
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to))
      throw new RequestError("Invalid recipient")
    const subject = messageString(body, "subject", 200)
    if (/[\r\n]/.test(subject)) throw new RequestError("Invalid subject")
    const html = messageString(body, "html", 100_000)
    if (body.cc !== undefined && body.cc !== "admin@dsc.ac")
      throw new RequestError("Invalid CC")
    const attachments: { filename: string; content: string }[] = []
    if (body.attachments !== undefined) {
      if (!Array.isArray(body.attachments) || body.attachments.length > 5)
        throw new RequestError("Invalid attachments")
      for (const item of body.attachments) {
        if (!item || typeof item !== "object" || Array.isArray(item))
          throw new RequestError("Invalid attachment")
        const filename = messageString(item, "filename", 120)
        const content = messageString(item, "content", 300_000)
        if (
          /[\/\\\r\n]/.test(filename) ||
          !/^[A-Za-z0-9+/]*={0,2}$/.test(content) ||
          content.length % 4
        )
          throw new RequestError("Invalid attachment")
        attachments.push({ filename, content })
      }
    }
    if (localMessagingDisabled())
      return Response.json({ data: { id: "local-development-email-disabled" } })
    const { data, error } = await new Resend(
      process.env.RESEND_API_KEY
    ).emails.send({
      from: "admin@dsc.ac",
      to,
      subject,
      html,
      ...(body.cc ? { cc: "admin@dsc.ac" } : {}),
      attachments,
    })
    if (error) throw new Error("Delivery failed")
    console.info("Administrative email sent", { actor: user.id })
    return Response.json({ data })
  } catch (error) {
    return messagingError(error)
  }
}
