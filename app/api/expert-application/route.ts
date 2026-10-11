import { Resend } from "resend"
import { escapeContactHtml } from "@/lib/contact-validation"
import {
  guardMessaging,
  messagingUser,
  readMessagingBody,
  messagingError,
  RequestError,
  localMessagingDisabled,
  takeQuota,
} from "@/lib/messaging-security"
export async function POST(request: Request) {
  try {
    guardMessaging(request)
    const user = await messagingUser(request, false, true)
    if (user.role !== "expert" || user.is_active === true)
      throw new RequestError("Access denied", 403)
    await readMessagingBody(request)
    takeQuota("expert-application:" + user.id, 1)
    if (localMessagingDisabled()) return Response.json({ success: true })
    const { error } = await new Resend(process.env.RESEND_API_KEY).emails.send({
      from: "admin@dsc.ac",
      to: "admin@dsc.ac",
      subject: "New expert application",
      html: `<p>New application from ${escapeContactHtml(String(user.name || ""))} (${escapeContactHtml(user.email)}). Review the application and its files in the DSC administration dashboard.</p>`,
    })
    if (error) throw new Error("Delivery failed")
    return Response.json({ success: true })
  } catch (error) {
    return messagingError(error)
  }
}
