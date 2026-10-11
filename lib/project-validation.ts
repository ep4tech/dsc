export interface ProjectDraft {
  name: string
  projectType: string
  description: string
  startDate: string
  endDate: string
}
export function validateProject(
  draft: ProjectDraft,
  lang: "en" | "ar" = "en"
): string | null {
  const message = (en: string, ar: string) => (lang === "ar" ? ar : en)
  if (draft.name.trim().length < 3 || draft.name.trim().length > 120)
    return message(
      "Project name must contain 3–120 characters.",
      "يجب أن يتكون اسم المشروع من 3 إلى 120 حرفًا."
    )
  if (draft.projectType.trim().length > 100)
    return message(
      "Project type must not exceed 100 characters.",
      "يجب ألا يتجاوز نوع المشروع 100 حرف."
    )
  if (draft.description.trim().length > 3000)
    return message(
      "Description must not exceed 3,000 characters.",
      "يجب ألا يتجاوز الوصف 3000 حرف."
    )
  const validDate = (value: string) =>
    /^\d{4}-\d{2}-\d{2}$/.test(value) &&
    !Number.isNaN(Date.parse(value)) &&
    new Date(value).toISOString().slice(0, 10) === value
  if (!validDate(draft.startDate))
    return message("Enter a valid start date.", "أدخل تاريخ بدء صالحًا.")
  if (draft.endDate && !validDate(draft.endDate))
    return message("Enter a valid end date.", "أدخل تاريخ انتهاء صالحًا.")
  if (draft.endDate && draft.endDate < draft.startDate)
    return message(
      "End date must be on or after the start date.",
      "يجب أن يكون تاريخ الانتهاء في تاريخ البدء أو بعده."
    )
  return null
}
export function projectCaseData(
  draft: ProjectDraft,
  details: Record<string, unknown> = {}
) {
  return {
    name: draft.name.trim(),
    grade: draft.projectType.trim(),
    notes: draft.description.trim(),
    date_of_birth: draft.startDate,
    service_type: "organization",
    case_details: {
      ...details,
      project_name: draft.name.trim(),
      project_type: draft.projectType.trim(),
      start_date: draft.startDate,
      end_date: draft.endDate,
    },
  }
}
