import assert from "node:assert/strict"
import { sanitizeCmsContent } from "../lib/sanitize"
import { boundedFullList } from "../lib/bounded-records"
import PocketBase from "pocketbase"
import {
  guardMessaging,
  readMessagingBody,
  messagingUser,
  takeQuota,
  RequestError,
} from "../lib/messaging-security"
import { POST as sendEmail } from "../app/api/send-email/route"
import { POST as contact } from "../app/api/contact/route"
import { POST as consultation } from "../app/api/send-message/route"
import { POST as notify } from "../app/api/telegram-notify/route"

const attack = `<script>alert(1)</script><svg onload="alert(1)"></svg><img src="x" onerror="alert(1)"><a href="jav&#x61;script:alert(1)" onclick="evil()">link</a><iframe src="https://evil.example"></iframe><p style="background-image:url(javascript:evil());text-align:left">Safe</p>`
const clean = sanitizeCmsContent(attack, "ar")
assert.doesNotMatch(
  clean,
  /<script|<svg|onerror|onclick|javascript:|evil\.example|background-image/i
)
assert.match(clean, /Safe/)
assert.match(clean, /text-align:right/)
assert.match(
  sanitizeCmsContent(
    '<h2>Title</h2><iframe src="https://www.youtube.com/embed/test"></iframe>'
  ),
  /<h2>Title<\/h2>/
)
assert.match(
  sanitizeCmsContent(
    '<iframe src="https://www.youtube.com/embed/test"></iframe>'
  ),
  /www.youtube.com/
)
assert.doesNotMatch(
  sanitizeCmsContent('<img src="data:image/svg+xml,test">'),
  /data:/
)

const req = (body: unknown, headers: Record<string, string> = {}) =>
  new Request("http://localhost/api/test", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify(body),
  })
assert.throws(
  () => guardMessaging(req({}, { Origin: "https://evil.example" })),
  (e: unknown) => e instanceof RequestError && e.status === 403
)
assert.deepEqual(await readMessagingBody(req({ text: "hello" })), {
  text: "hello",
})
for (const body of [null, [], "text"])
  await assert.rejects(readMessagingBody(req(body)), RequestError)
await assert.rejects(
  readMessagingBody(req({ text: "x".repeat(100) }), 20),
  (e: unknown) => e instanceof RequestError && e.status === 413
)
await assert.rejects(
  readMessagingBody(
    new Request("http://localhost", { method: "POST", body: "{" })
  ),
  RequestError
)
takeQuota("regression:limit", 1, 1000)
assert.throws(() => takeQuota("regression:limit", 1, 1001), RequestError)
takeQuota("regression:limit", 1, 61_001)

const originalFetch = globalThis.fetch
let deliveries = 0
let role = "individual"
let active = true
let invalidToken = false
globalThis.fetch = async (input) => {
  const url = String(input instanceof Request ? input.url : input)
  if (url.includes("/auth-refresh"))
    return Response.json(
      invalidToken
        ? { message: "Invalid token" }
        : {
            token: "server-verified",
            record: {
              id: "test-user",
              role,
              is_active: active,
              email: "user@example.com",
            },
          },
      { status: invalidToken ? 401 : 200 }
    )
  deliveries++
  throw new Error("Unexpected external delivery during regression test")
}
try {
  await assert.rejects(
    messagingUser(req({})),
    (e: unknown) => e instanceof RequestError && e.status === 401
  )
  await assert.rejects(
    messagingUser(req({}, { Authorization: "Bearer ordinary" }), true),
    (e: unknown) => e instanceof RequestError && e.status === 403
  )
  role = "admin"
  assert.equal(
    (await messagingUser(req({}, { Authorization: "Bearer admin" }), true)).id,
    "test-user"
  )
  active = false
  await assert.rejects(
    messagingUser(req({}, { Authorization: "Bearer inactive" }), true),
    RequestError
  )
  active = true
  invalidToken = true
  await assert.rejects(
    messagingUser(req({}, { Authorization: "Bearer invalid" }), true),
    RequestError
  )
  invalidToken = false
  assert.equal(
    (await sendEmail(req({ to: "user@example.com", subject: "x", html: "x" })))
      .status,
    401
  )
  assert.equal((await notify(req({ text: "hi" }))).status, 401)
  assert.equal((await contact(req(null))).status, 400)
  assert.equal(
    (await consultation(req({ name: "Test", email: [], contact: "123" })))
      .status,
    400
  )
  assert.equal(deliveries, 0)
} finally {
  globalThis.fetch = originalFetch
}

const pb = new PocketBase("http://localhost:8090")
const service = pb.collection("test")
const originalGetList = service.getList
const calls: number[] = []
service.getList = async <T>(page = 1) => {
  calls.push(page)
  return {
    page,
    perPage: 200,
    totalPages: 2,
    totalItems: 201,
    items: Array.from({ length: page === 1 ? 200 : 1 }, (_, i) => ({
      id: `${page}-${i}`,
    })) as T[],
  }
}
assert.equal((await boundedFullList(service)).length, 201)
assert.deepEqual(calls, [1, 2])
// Explicit singleton requests must not enumerate the collection.
service.getList = async <T>(page = 1, perPage = 200) => ({
  page,
  perPage,
  totalPages: 99,
  totalItems: 99,
  items: [{ id: "singleton" }] as T[],
})
assert.equal((await boundedFullList(service, { limit: 1 })).length, 1)
service.getList = async <T>(page = 1) => ({
  page,
  perPage: 200,
  totalPages: 2,
  totalItems: 201,
  items: [] as T[],
})
await assert.rejects(boundedFullList(service, {}, 100), /Too many records/)
service.getList = originalGetList
const escaped = pb.filter("user = {:id}", { id: 'x" || true || user="x' })
assert.notEqual(escaped, 'user = "x" || true || user="x"')
console.log(
  "PASS: HTML sanitization, messaging access, request bounds, throttling, bound filters and paginated retrieval"
)
