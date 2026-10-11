import pb from "@/lib/pb"

export function applyExpertOrder<T extends { id: string }>(
  items: T[],
  ids: string[]
): T[] {
  const positions = new Map(ids.map((id, index) => [id, index]))
  return [...items].sort(
    (a, b) =>
      (positions.get(a.id) ?? Infinity) - (positions.get(b.id) ?? Infinity)
  )
}

export async function readExpertOrder(): Promise<string[]> {
  try {
    const record = await pb
      .collection("expert_display_settings")
      .getFirstListItem('key="landing"')
    return Array.isArray(record.expert_ids)
      ? record.expert_ids.filter(
          (id: unknown): id is string => typeof id === "string"
        )
      : []
  } catch (error) {
    // Older deployments keep their existing order until the migration is installed.
    if ((error as { status?: number }).status === 404) return []
    throw error
  }
}

export async function saveExpertOrder(ids: string[]) {
  const record = await pb
    .collection("expert_display_settings")
    .getFirstListItem('key="landing"')
  await pb
    .collection("expert_display_settings")
    .update(record.id, { expert_ids: [...new Set(ids)] })
}
