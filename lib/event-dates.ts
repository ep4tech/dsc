/** Calendar dates are local days; date-only programme ends include the whole day. */
export const dayKey = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`
export function parseDate(value: string, end = false): Date {
  if (/^\d{4}-\d{2}-\d{2}$/.test(value))
    return new Date(`${value}T${end ? "23:59:59.999" : "00:00:00"}`)
  return new Date(value)
}
export function overlaps(
  event: { start: Date; end: Date },
  date: string
): boolean {
  return (
    Number.isFinite(event.start.getTime()) &&
    Number.isFinite(event.end.getTime()) &&
    dayKey(event.start) <= date &&
    dayKey(event.end) >= date
  )
}
export function eventStatus(
  event: { start: Date; end: Date; completed: boolean },
  now: number
): "past" | "upcoming" | "in_progress" {
  return event.completed || event.end.getTime() < now
    ? "past"
    : event.start.getTime() > now
      ? "upcoming"
      : "in_progress"
}
