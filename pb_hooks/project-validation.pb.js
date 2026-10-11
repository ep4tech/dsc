onRecordCreateRequest((e) => {
  if (e.record.getString("service_type") === "organization")
    require(`${__hooks}/lib/project-validation.js`)(e)
  return e.next()
}, "cases")
onRecordUpdateRequest((e) => {
  const body = e.requestInfo().body
  if (
    e.record.getString("service_type") === "organization" &&
    ["name", "grade", "notes", "date_of_birth", "case_details"].some((key) =>
      Object.prototype.hasOwnProperty.call(body, key)
    )
  )
    require(`${__hooks}/lib/project-validation.js`)(e)
  return e.next()
}, "cases")
