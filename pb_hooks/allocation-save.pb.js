routerAdd(
  "POST",
  "/api/dsc/cases/{caseId}/allocations",
  (e) => {
    const auth = e.auth
    if (
      !auth ||
      !auth.getBool("is_active") ||
      !["admin", "super_admin"].includes(auth.getString("role"))
    )
      throw new ForbiddenError("Administrator access required.")
    const caseId = e.request.pathValue("caseId")
    e.app.findRecordById("cases", caseId)
    const rows = e.requestInfo().body.rows
    if (!Array.isArray(rows) || rows.length > 100)
      throw new BadRequestError("Invalid allocation list.")
    const seen = {}
    for (const row of rows) {
      if (
        !row ||
        typeof row.expert_id !== "string" ||
        typeof row.role !== "string"
      )
        throw new BadRequestError("Select an expert and role.")
      const expert = e.app.findRecordById("users", row.expert_id)
      if (expert.getString("role") !== "expert" || !expert.getBool("is_active"))
        throw new BadRequestError("Select active experts.")
      e.app.findFirstRecordByFilter(
        "roles_management",
        "role_name_en = {:role}",
        { role: row.role }
      )
      const key = row.expert_id + ":" + row.role
      if (seen[key]) throw new BadRequestError("Duplicate expert and role.")
      seen[key] = true
    }
    e.app.runInTransaction((app) => {
      const existing = app.findRecordsByFilter(
        "case_experts",
        "case_id = {:id}",
        "",
        0,
        0,
        { id: caseId }
      )
      for (const row of rows)
        if (row.id && !existing.some((r) => r.id === row.id))
          throw new BadRequestError("Allocation does not belong to this case.")
      for (const record of existing)
        if (!rows.some((row) => row.id === record.id)) app.delete(record)
      const collection = app.findCollectionByNameOrId("case_experts")
      for (const row of rows) {
        const record = row.id
          ? existing.find((r) => r.id === row.id)
          : new Record(collection)
        record.set("case_id", caseId)
        record.set("expert_id", row.expert_id)
        record.set("role", row.role)
        app.save(record)
      }
    })
    return e.json(200, { success: true })
  },
  $apis.requireAuth("users")
)
