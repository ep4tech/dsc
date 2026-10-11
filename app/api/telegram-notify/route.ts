import {
  guardMessaging,
  messagingUser,
  readMessagingBody,
  messageString,
  messagingError,
  localMessagingDisabled,
} from "@/lib/messaging-security"
export async function POST(request: Request) {
  try {
    guardMessaging(request)
    await messagingUser(request)
    const text = messageString(await readMessagingBody(request), "text", 4000)
    if (localMessagingDisabled())
      return Response.json({ message: "Sent successfully" })
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
