routerAdd("GET", "/api/dsc/expert-registration-config", (e) => {
  e.app.findCollectionByNameOrId("expert_bank_details")
  return e.json(200, { iban: true })
})

onRecordCreateRequest((e) => {
  const value = e.requestInfo().body.expert_iban
  if (!value) return e.next()
  if (e.record.getString("role") !== "expert" || typeof value !== "string")
    throw new BadRequestError("Invalid expert IBAN")
  const iban = value.replace(/\s/g, "").toUpperCase()
  if (!/^[A-Z]{2}\d{2}[A-Z0-9]{11,30}$/.test(iban))
    throw new BadRequestError("Invalid IBAN")
  let remainder = 0
  for (const char of iban.slice(4) + iban.slice(0, 4)) {
    const digits = /[A-Z]/.test(char) ? String(char.charCodeAt(0) - 55) : char
    for (const digit of digits)
      remainder = (remainder * 10 + Number(digit)) % 97
  }
  if (remainder !== 1) throw new BadRequestError("Invalid IBAN checksum")
  // The IBAN belongs only to this newly created user; no public bank-data write API.
  e.app.runInTransaction((txApp) => {
    e.app = txApp
    e.next()
    const bank = new Record(
      txApp.findCollectionByNameOrId("expert_bank_details")
    )
    bank.set("user", e.record.id)
    bank.set("iban", iban)
    txApp.save(bank)
  })
}, "users")
