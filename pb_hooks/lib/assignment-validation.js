module.exports = (e) => {
  const name = e.record.collection().name
  if (name === "case_experts") {
    const expert = e.app.findRecordById(
      "users",
      e.record.getString("expert_id")
    )
    if (expert.getString("role") !== "expert" || !expert.getBool("is_active"))
      throw new BadRequestError("Only active experts can be assigned.")
    const role = e.record.getString("role").trim()
    if (!role) throw new BadRequestError("Select an expert role.")
    e.app.findFirstRecordByFilter(
      "roles_management",
      "role_name_en = {:role}",
      { role }
    )
    const duplicates = e.app.findRecordsByFilter(
      "case_experts",
      "case_id = {:caseId} && expert_id = {:expert} && role = {:role} && id != {:id}",
      "",
      1,
      0,
      {
        caseId: e.record.getString("case_id"),
        expert: expert.id,
        role,
        id: e.record.id,
      }
    )
    if (duplicates.length)
      throw new BadRequestError("This expert and role are already assigned.")
  } else {
    // Progress updates retain their original assignment even if an expert later edits specialties.
    const body = e.requestInfo().body
    if (
      !["case", "assigned_expert", "specialization", "task_brief"].some((key) =>
        Object.prototype.hasOwnProperty.call(body, key)
      )
    )
      return e.next()
    const expertId = e.record.getString("assigned_expert")
    if (!expertId) return
    const expert = e.app.findRecordById("users", expertId)
    if (expert.getString("role") !== "expert" || !expert.getBool("is_active"))
      throw new BadRequestError("Select an active expert.")
    e.app.findFirstRecordByFilter(
      "case_experts",
      "case_id = {:caseId} && expert_id = {:expert}",
      { caseId: e.record.getString("case"), expert: expertId }
    )
    const profile = e.app.findFirstRecordByFilter(
      "expert_profiles",
      "user = {:id}",
      { id: expertId }
    )
    let list = profile.getStringSlice("specialization_type")
    if (!list.length) {
      const raw = profile.getString("specialization_type")
      try {
        const parsed = JSON.parse(raw)
        list = Array.isArray(parsed) ? parsed : [parsed]
      } catch {
        list = raw ? [raw] : []
      }
    }
    if (!list.includes(e.record.getString("specialization")))
      throw new BadRequestError(
        "The selected expert does not have this specialization."
      )
    const brief = e.record.getString("task_brief").trim()
    if (brief.length < 10 || brief.length > 3000)
      throw new BadRequestError("Task brief must contain 10–3000 characters.")
  }
  return e.next()
}
