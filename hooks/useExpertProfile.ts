"use client"

import { useCallback, useEffect, useState } from "react"
import pb, { getErrorMessage } from "@/lib/pb"
import type { ExpertProfile, ExpertProfileDraft } from "@/types/expert"

function toText(value: unknown): string {
  if (typeof value === "string") return value
  if (typeof value === "number") return String(value)
  return ""
}

/**
 * Normalizes a PocketBase field that may hold an array, a single value, or a
 * comma separated string into a clean list of strings.
 */
export function toStringList(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value
      .map((item) => toText(item).trim())
      .filter((item) => item.length > 0)
  }
  const single = toText(value).trim()
  if (!single) return []
  return single
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
}

export function emptyDraft(name = ""): ExpertProfileDraft {
  return {
    name,
    countryOfResidence: "",
    city: "",
    whatsappCountryCode: "",
    whatsappNumber: "",
    highestAcademicDegree: "",
    degreeTitle: "",
    fieldOfStudy: "",
    ageGroup: [],
    specialization: [],
    consultationMode: "",
    fee: "",
    availability: "",
    bio: "",
    publicNameEn: "",
    publicNameAr: "",
    publicQualificationEn: "",
    publicQualificationAr: "",
    publicSpecialtyEn: "",
    publicSpecialtyAr: "",
    shortBioEn: "",
    shortBioAr: "",
    newPhoto: null,
    removePhoto: false,
    keptCv: [],
    newCv: [],
  }
}

/**
 * Builds an editable draft out of a stored profile record. A null record (an
 * expert with no profile row yet) yields an empty draft that save() creates.
 */
export function draftFromProfile(
  profile: ExpertProfile | null,
  name = ""
): ExpertProfileDraft {
  if (!profile) return emptyDraft(name)
  return {
    name,
    countryOfResidence: toText(profile.country_of_residence),
    city: toText(profile.city),
    whatsappCountryCode: toText(profile.whatsapp_country_code),
    whatsappNumber: toText(profile.whatsapp_number),
    highestAcademicDegree: toText(profile.highest_academic_degree),
    degreeTitle: toText(profile.degree_title),
    fieldOfStudy: toText(profile.field_of_study),
    ageGroup: toStringList(profile.age_group),
    specialization: toStringList(profile.specialization_type),
    consultationMode: toText(profile.consultation_mode),
    fee: toText(profile.fee),
    availability: toText(profile.availability),
    bio: toText(profile.bio),
    publicNameEn: toText(profile.public_name_en),
    publicNameAr: toText(profile.public_name_ar),
    publicQualificationEn: toText(profile.public_qualification_en),
    publicQualificationAr: toText(profile.public_qualification_ar),
    publicSpecialtyEn: toText(profile.public_specialty_en),
    publicSpecialtyAr: toText(profile.public_specialty_ar),
    shortBioEn: toText(profile.short_bio_en),
    shortBioAr: toText(profile.short_bio_ar),
    newPhoto: null,
    removePhoto: false,
    keptCv: toStringList(profile.cv),
    newCv: [],
  }
}

/**
 * Builds a private file URL using the short-lived PocketBase file token, which
 * is required when the file's collection is not publicly readable.
 */
export function profileFileUrl(
  profile: ExpertProfile | null,
  filename: string,
  fileToken: string
): string {
  if (!profile || !filename) return ""
  return pb.files.getURL(
    profile as never,
    filename,
    fileToken ? { token: fileToken } : {}
  )
}

/** The stored profile photo filename, or "" when none is set. */
export function profilePhotoName(profile: ExpertProfile | null): string {
  return toText(profile?.profile_photo)
}

/**
 * Builds the expert_profiles payload for a draft. Shared by the expert's own
 * save and the admin's editor so the two cannot drift on field names or the
 * multi-select encoding.
 */
function expertProfileFormData(
  draft: ExpertProfileDraft,
  userId: string,
  profileId?: string
): FormData {
  const formData = new FormData()
  formData.set("country_of_residence", draft.countryOfResidence.trim())
  formData.set("city", draft.city.trim())
  formData.set("whatsapp_country_code", draft.whatsappCountryCode.trim())
  formData.set("whatsapp_number", draft.whatsappNumber.trim())
  formData.set("highest_academic_degree", draft.highestAcademicDegree)
  formData.set("degree_title", draft.degreeTitle.trim())
  formData.set("field_of_study", draft.fieldOfStudy.trim())

  // Both are multi-select fields, so each value is appended separately. A
  // comma-joined string would be rejected by the server.
  formData.set("age_group", JSON.stringify(draft.ageGroup))
  formData.set("specialization_type", JSON.stringify(draft.specialization))

  formData.set("consultation_mode", draft.consultationMode)
  formData.set("fee", draft.fee.trim())
  formData.set("availability", draft.availability.trim())
  formData.set("public_name_en", draft.publicNameEn.trim())
  formData.set("public_name_ar", draft.publicNameAr.trim())
  formData.set("public_qualification_en", draft.publicQualificationEn.trim())
  formData.set("public_qualification_ar", draft.publicQualificationAr.trim())
  formData.set("public_specialty_en", draft.publicSpecialtyEn.trim())
  formData.set("public_specialty_ar", draft.publicSpecialtyAr.trim())
  formData.set("short_bio_en", draft.shortBioEn)
  formData.set("short_bio_ar", draft.shortBioAr)

  // An empty string clears a single-file field in PocketBase.
  if (draft.removePhoto) {
    formData.set("profile_photo", "")
  } else if (draft.newPhoto) {
    formData.append("profile_photo", draft.newPhoto)
  }

  // Re-sending stored filenames preserves the documents on the record;
  // anything removed is simply left out.
  draft.keptCv.forEach((filename) => formData.append("cv", filename))
  draft.newCv.forEach((file) => formData.append("cv", file))
  if (!draft.keptCv.length && !draft.newCv.length) formData.set("cv", "")

  if (!profileId) {
    formData.set("user", userId)
  }
  return formData
}

/**
 * Writes an expert profile on behalf of a user. Works for the signed-in expert
 * and for an admin editing someone else's application.
 */
export async function saveExpertProfileFor(
  draft: ExpertProfileDraft,
  userId: string,
  profileId?: string
): Promise<ExpertProfile> {
  if (draft.shortBioEn.length > 250 || draft.shortBioAr.length > 250)
    throw new Error("Each short biography must be at most 250 characters.")
  await pb.collection("users").update(userId, { name: draft.name.trim() })
  const formData = expertProfileFormData(draft, userId, profileId)
  const collection = pb.collection("expert_profiles")
  const saved = profileId
    ? await collection.update(profileId, formData)
    : await collection.create(formData)
  return saved as unknown as ExpertProfile
}

export function useExpertProfile(userId?: string) {
  const [profile, setProfile] = useState<ExpertProfile | null>(null)
  const [fileToken, setFileToken] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [loadError, setLoadError] = useState("")

  const load = useCallback(async () => {
    if (!userId) {
      setIsLoading(false)
      return
    }
    setIsLoading(true)
    setLoadError("")
    try {
      const record = await pb
        .collection("expert_profiles")
        .getFirstListItem(pb.filter("user = {:value0}", { value0: userId }))
      setProfile(record as unknown as ExpertProfile)
    } catch (error) {
      // An expert without a profile row is a valid state, not a failure.
      const status = (error as { status?: number }).status
      if (status === 404) {
        setProfile(null)
      } else {
        setProfile(null)
        setLoadError(getErrorMessage(error))
      }
    } finally {
      setIsLoading(false)
    }
  }, [userId])

  useEffect(() => {
    // Begin the external profile fetch when the selected expert changes.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load()
  }, [load])

  useEffect(() => {
    let cancelled = false
    pb.files
      .getToken()
      .then((token) => {
        if (!cancelled) setFileToken(token)
      })
      .catch(() => {
        if (!cancelled) setFileToken("")
      })
    return () => {
      cancelled = true
    }
  }, [])

  const save = useCallback(
    async (draft: ExpertProfileDraft) => {
      if (!userId) throw new Error("No signed-in expert")
      setIsSaving(true)
      try {
        // Updating users first syncs the PocketBase auth store on a self-update,
        // which keeps the sidebar name in step with the profile.
        const saved = await saveExpertProfileFor(draft, userId, profile?.id)
        setProfile(saved)
        return saved
      } finally {
        setIsSaving(false)
      }
    },
    [userId, profile?.id]
  )

  return {
    profile,
    fileToken,
    isLoading,
    isSaving,
    loadError,
    reload: load,
    save,
  }
}
