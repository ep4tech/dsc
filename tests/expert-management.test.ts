import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { runInNewContext } from "node:vm"
import { isValidIban, normalizeIban } from "../lib/iban"
import { applyExpertOrder } from "../lib/expert-display-order"

assert.equal(isValidIban("GB82 WEST 1234 5698 7654 32"), true)
assert.equal(isValidIban("DE89370400440532013000"), true)
assert.equal(isValidIban("GB83WEST12345698765432"), false)
assert.equal(isValidIban(""), false)
assert.equal(
  normalizeIban("gb82 west 1234 5698 7654 32"),
  "GB82WEST12345698765432"
)
assert.deepEqual(
  applyExpertOrder(
    [{ id: "new" }, { id: "a" }, { id: "b" }, { id: "other" }],
    ["deleted", "b", "a"]
  ).map((x) => x.id),
  ["b", "a", "new", "other"]
)

interface HookApp {
  findCollectionByNameOrId: () => object
  save: (record: BankRecord) => number
  runInTransaction: (callback: (transaction: HookApp) => void) => void
}
type HookEvent = {
  app: HookApp
  requestInfo: () => { body: { expert_iban: string } }
  record: { id: string; getString: () => string }
  next: () => void
}
let hook: (event: HookEvent) => void = () => {}
const records: Record<string, string>[] = []
class BankRecord {
  data: Record<string, string> = {}
  set(key: string, value: string) {
    this.data[key] = value
  }
}
runInNewContext(readFileSync("pb_hooks/expert-registration.pb.js", "utf8"), {
  routerAdd: () => {},
  onRecordCreateRequest: (callback: typeof hook) => {
    hook = callback
  },
  Record: BankRecord,
  BadRequestError: Error,
})
let created = false
const app = {
  findCollectionByNameOrId: () => ({}),
  save: (record: BankRecord) => records.push(record.data),
  runInTransaction: (callback: (transaction: HookApp) => void) => callback(app),
}
const event = {
  app,
  requestInfo: () => ({ body: { expert_iban: "GB82 WEST 1234 5698 7654 32" } }),
  record: { id: "new-expert", getString: () => "expert" },
  next: () => {
    created = true
  },
}
hook(event)
assert.equal(created, true)
assert.equal(records[0].user, "new-expert")
assert.equal(records[0].iban, "GB82WEST12345698765432")
created = false
assert.throws(() =>
  hook({
    ...event,
    requestInfo: () => ({ body: { expert_iban: "GB83WEST12345698765432" } }),
  })
)
assert.equal(created, false)
assert.equal(records.length, 1)
console.log(
  "Expert ordering, IBAN checksum and private registration hook checks passed"
)
