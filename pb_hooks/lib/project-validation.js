module.exports = (e) => {
  const name = e.record.getString("name").trim()
  if (name.length < 3 || name.length > 120)
    throw new BadRequestError("Project name must contain 3–120 characters.")
  if (
    e.record.getString("grade").length > 100 ||
    e.record.getString("notes").length > 3000
  )
    throw new BadRequestError(
      "Project type or description exceeds its length limit."
    )
  let details = {}
  try {
    details = JSON.parse(e.record.getString("case_details") || "{}")
  } catch { throw new BadRequestError("Invalid project details.") }
  const start =
    e.record.getString("date_of_birth").slice(0, 10) || details.start_date
  const end = details.end_date
  const valid = (value) => {
    if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value))
      return false
    const date = new Date(value + "T00:00:00Z")
    return !isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value
  }
  if (!valid(start) || (end && !valid(end)) || (end && end < start))
    throw new BadRequestError(
      "Provide valid dates with the end date on or after the start date."
    )
  e.record.set("name", name)
}
