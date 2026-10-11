const test = require("node:test"),
  assert = require("node:assert/strict"),
  fs = require("node:fs"),
  ts = require("typescript")
function load(file, mocks = {}) {
  const code = ts.transpile(fs.readFileSync(file, "utf8"), {
    module: ts.ModuleKind.CommonJS,
    esModuleInterop: true,
  })
  const exports = {}
  new Function("exports", "require", code)(exports, (name) => mocks[name])
  return exports
}
const mockPb = {
  files: { getURL: (row, file) => `http://localhost/files/${row.id}/${file}` },
}
const { portalFromRecord } = load("lib/portal-data.ts", { "@/lib/pb": mockPb })
const { portalJourneyHref } = load("lib/portal-journey.ts")
test("portal record preserves existing service and philosophy configuration while editable fields drive display", () => {
  const config = {
    heroTitle: { en: "Existing hero", ar: "العنوان" },
    heroText: { en: "Existing detail", ar: "تفاصيل" },
    philosophy: { en: "Keep philosophy", ar: "الفلسفة" },
    services: [{ id: "autism", name: { en: "Autism", ar: "التوحد" } }],
    banner: "/existing.png",
  }
  const row = {
    id: "record1",
    portal_key: "1",
    title_en: "Edited title",
    title_ar: "العنوان المعدل",
    description_en: "Edited description",
    description_ar: "الوصف المعدل",
    icon: "brain",
    registration_type: "parent",
    accent: "#008f53",
    order: 0,
    is_deleted: false,
    config,
  }
  const p = portalFromRecord(row)
  assert.equal(p.id, "1")
  assert.equal(p.title.en, "Edited title")
  assert.equal(p.tagline.ar, "الوصف المعدل")
  assert.deepEqual(p.services, config.services)
  assert.deepEqual(p.philosophy, config.philosophy)
  assert.equal(p.banner, "/existing.png")
  assert.equal(p.registrationType, "parent")
})
test("new portals work without a hardcoded default and their picture replaces banner", () => {
  const p = portalFromRecord({
    id: "record2",
    portal_key: "community",
    title_en: "Community",
    title_ar: "المجتمع",
    description_en: "Support",
    description_ar: "الدعم",
    icon: "globe",
    picture: "image.png",
    registration_type: "expert",
    accent: "#123456",
    order: 5,
    is_deleted: false,
  })
  assert.equal(p.heroTitle.en, "Community")
  assert.equal(p.heroText.ar, "الدعم")
  assert.deepEqual(p.services, [])
  assert.equal(p.picture, "http://localhost/files/record2/image.png")
  assert.equal(p.banner, p.picture)
  assert.equal(p.registrationType, "expert")
})
test("configured portal registration types apply to guests while signed-in roles go to their own cases", () => {
  for (const type of ["parent", "individual", "organization", "expert"])
    assert.equal(
      portalJourneyHref("new-portal", undefined, type),
      `/register/${type}`
    )
  assert.equal(
    portalJourneyHref("new-portal", "expert", "parent"),
    "/dashboard/expert/cases"
  )
  assert.equal(
    portalJourneyHref("new-portal", "organization", "individual"),
    "/dashboard/institution/projects"
  )
  assert.equal(portalJourneyHref("1", undefined), "/register/parent")
})
