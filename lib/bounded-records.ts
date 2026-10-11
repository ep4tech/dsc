import type { RecordModel, RecordService, RecordListOptions } from "pocketbase"

/** Fetch in bounded pages. Reject excessive datasets instead of silently truncating them. */
export async function boundedFullList<T = RecordModel>(
  service: RecordService<RecordModel>,
  options: RecordListOptions = {},
  maxRecords = 10_000
): Promise<T[]> {
  // Singleton and explicitly limited callers should request only that page.
  if (
    typeof options.limit === "number" &&
    Number.isInteger(options.limit) &&
    options.limit > 0 &&
    options.limit <= maxRecords
  ) {
    return (await service.getList<T>(1, options.limit, options)).items
  }
  const result: T[] = []
  const pageSize = Math.min(200, maxRecords)
  for (let page = 1; page <= Math.ceil(maxRecords / pageSize); page++) {
    const batch = await service.getList<T>(page, pageSize, {
      ...options,
      sort: options.sort ? `${options.sort},id` : "id",
    })
    if (batch.totalItems > maxRecords)
      throw new Error("Too many records. Narrow the requested data.")
    result.push(...batch.items)
    if (page >= batch.totalPages || batch.items.length < pageSize) return result
  }
  return result
}
