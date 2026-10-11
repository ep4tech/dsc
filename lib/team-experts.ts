import { boundedFullList } from "@/lib/bounded-records"
import pb from "@/lib/pb"
import type { TeamExpert } from "@/types/team"
import { applyExpertOrder, readExpertOrder } from "./expert-display-order"

interface ExpertProfileRecord {
  id: string
  user?: string
  full_legal_name?: string
  profile_photo?: string
  specialization_type?: unknown
  highest_academic_degree?: string
  field_of_study?: string
  bio?: string
  public_name_en?: string
  public_name_ar?: string
  public_qualification_en?: string
  public_qualification_ar?: string
  public_specialty_en?: string
  public_specialty_ar?: string
  short_bio_en?: string
  short_bio_ar?: string
  name?: string
  degree_title?: string
}

const MAX_EXPERTS = 6

/** Normalizes a PocketBase JSON field that may hold an array or a single value. */
function toList(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter(
      (v): v is string => typeof v === "string" && v.length > 0
    )
  }
  if (typeof value === "string" && value.trim()) {
    return [value.trim()]
  }
  return []
}

export async function getTeamExperts({
  all = false,
  throwOnError = false,
}: { all?: boolean; throwOnError?: boolean } = {}): Promise<TeamExpert[]> {
  try {
    const [records, order] = await Promise.all([
      boundedFullList(pb.collection("experts_public"), { sort: "name" }),
      readExpertOrder().catch(() => []),
    ])

    return applyExpertOrder(records as unknown as ExpertProfileRecord[], order)
      .slice(0, all ? undefined : MAX_EXPERTS)
      .map((record) => {
        const filename = record.profile_photo
        return {
          id: record.id,
          name: record.name || record.full_legal_name || "",
          photoUrl: filename
            ? `${pb.baseURL}/api/files/expert_profiles/${record.id}/${encodeURIComponent(filename)}`
            : null,
          roles: toList(record.specialization_type),
          degree: record.highest_academic_degree || null,
          fieldOfStudy: record.degree_title || null,
          bio: "",
          publicNameEn: record.public_name_en || "",
          publicNameAr: record.public_name_ar || "",
          publicQualificationEn: record.public_qualification_en || "",
          publicQualificationAr: record.public_qualification_ar || "",
          publicSpecialtyEn: record.public_specialty_en || "",
          publicSpecialtyAr: record.public_specialty_ar || "",
          shortBioEn: record.short_bio_en || "",
          shortBioAr: record.short_bio_ar || "",
        }
      })
  } catch (error) {
    if (throwOnError) throw error
    return []
  }
}
