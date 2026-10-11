import { createHash } from "node:crypto"
import PocketBase from "pocketbase"

export class RequestError extends Error {
  constructor(
    message: string,
    public status = 400
  ) {
    super(message)
  }
}
const buckets = new Map<string, { count: number; expires: number }>()
export function takeQuota(key: string, limit: number, now = Date.now()) {
  for (const [id, entry] of buckets)
    if (entry.expires <= now) buckets.delete(id)
  const entry = buckets.get(key) ?? { count: 0, expires: now + 60_000 }
  if (entry.count >= limit)
    throw new RequestError("Too many requests. Please try again later.", 429)
  entry.count++
  buckets.set(key, entry)
}
export function guardMessaging(request: Request) {
  const origin = request.headers.get("origin")
  if (origin && origin !== new URL(request.url).origin)
    throw new RequestError("Invalid origin", 403)
  if (
    !request.headers
      .get("content-type")
      ?.toLowerCase()
      .startsWith("application/json")
  )
    throw new RequestError("JSON required", 415)
  // A process-wide ceiling also applies when no trusted proxy supplies a client IP.
  takeQuota("messaging:global", 30)
  const ip =
    process.env.DSC_TRUST_PROXY === "true"
      ? request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
      : undefined
  takeQuota("messaging:client:" + (ip || "unknown"), 5)
}
export async function readMessagingBody(
  request: Request,
  maxBytes = 32_768
): Promise<Record<string, unknown>> {
  const reader = request.body?.getReader()
  if (!reader) throw new RequestError("Missing body")
  const chunks: Uint8Array[] = []
  let size = 0
  while (true) {
    const { value, done } = await reader.read()
    if (done) break
    size += value.byteLength
    if (size > maxBytes) {
      await reader.cancel()
      throw new RequestError("Request too large", 413)
    }
    chunks.push(value)
  }
  let body: unknown
  try {
    body = JSON.parse(Buffer.concat(chunks).toString("utf8"))
  } catch {
    throw new RequestError("Invalid JSON")
  }
  if (!body || typeof body !== "object" || Array.isArray(body))
    throw new RequestError("Invalid request")
  return body as Record<string, unknown>
}
export function messageString(
  body: Record<string, unknown>,
  key: string,
  max: number,
  required = true
) {
  const value = body[key]
  if (!required && (value === undefined || value === "")) return ""
  if (typeof value !== "string" || !value.trim() || value.length > max)
    throw new RequestError(`Invalid ${key}`)
  return value.trim()
}
export async function messagingUser(
  request: Request,
  adminOnly = false,
  allowPending = false
) {
  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "")
  if (!token || token.length > 4096)
    throw new RequestError("Authentication required", 401)
  takeQuota(
    "messaging:token:" + createHash("sha256").update(token).digest("hex"),
    5
  )
  const client = new PocketBase(
    process.env.NEXT_PUBLIC_POCKETBASE_URL || "http://127.0.0.1:8090"
  )
  client.authStore.save(token)
  let user
  try {
    user = (
      await client
        .collection("users")
        .authRefresh({ requestKey: null, signal: AbortSignal.timeout(10_000) })
    ).record
  } catch {
    throw new RequestError("Authentication required", 401)
  }
  if (
    (!allowPending && user.is_active !== true) ||
    (adminOnly && !["admin", "super_admin"].includes(user.role))
  )
    throw new RequestError("Access denied", 403)
  return user
}
export function messagingError(error: unknown) {
  if (error instanceof RequestError)
    return Response.json(
      { error: error.message },
      {
        status: error.status,
        ...(error.status === 429 ? { headers: { "Retry-After": "60" } } : {}),
      }
    )
  console.error("Messaging delivery failed")
  return Response.json(
    { error: "Unable to send your message. Please try again later." },
    { status: 500 }
  )
}
export const localMessagingDisabled = () =>
  process.env.NODE_ENV === "development" &&
  process.env.DSC_LOCAL_BACKEND === "true"
