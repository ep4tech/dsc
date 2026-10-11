"use client"

import { useCallback, useEffect, useState } from "react"
import pb, { getErrorMessage } from "@/lib/pb"
import { ROLE_PROFILE_COLLECTION, type AnyUserProfile } from "@/types/account-profile"
import type { UserRole } from "@/types/user"
import { ROLE_PROFILE_SECTIONS } from "@/lib/user-profile-fields"

/**
 * Values the admin can change on a user: the two editable columns on the
 * account row, plus every field the role's profile collection holds.
 */
export interface UserProfileDraft {
  name: string
  contactNumber: string
  fields: Record<string, string>
  notes: string
}

export function draftFromUserProfile(
  user: { name: string; contact_number: string; role: UserRole },
  profile: AnyUserProfile | null
): UserProfileDraft {
  const source = (profile ?? {}) as unknown as Record<string, unknown>
  const fields: Record<string, string> = {}
  for (const section of ROLE_PROFILE_SECTIONS[user.role] ?? []) {
    for (const field of section.fields) {
      const value = source[field.field]
      fields[field.field] = typeof value === "string" ? value : ""
    }
  }
  return {
    name: user.name ?? "",
    contactNumber: user.contact_number ?? "",
    fields,
    notes: typeof profile?.notes === "string" ? profile.notes : "",
  }
}

/**
 * Loads the profile record that matches a user's role. Both a role with no
 * profile collection (admins) and a record that was never created resolve to
 * null without an error, since neither is a failure for an admin browsing
 * users.
 *
 * `role` being undefined means it is not known yet, which keeps `isLoading`
 * true. Treating that as "no profile" would briefly render an empty profile
 * before the users list resolves.
 */
/**
 * Select and date columns reject an empty string with an "Invalid value" error,
 * so a cleared control is sent as null, which PocketBase accepts to unset an
 * optional field. Text columns keep the empty string.
 */
function nullableFields(fields: Record<string, string>): Record<string, string | null> {
  const nonText = new Set<string>()
  for (const section of Object.values(ROLE_PROFILE_SECTIONS)) {
    for (const item of section ?? []) {
      for (const field of item.fields) {
        if (field.input === "select" || field.input === "date") {
          nonText.add(field.field)
        }
      }
    }
  }

  const payload: Record<string, string | null> = {}
  for (const [key, value] of Object.entries(fields)) {
    payload[key] = nonText.has(key) && !value ? null : value
  }
  return payload
}

export function useUserProfileRecord(userId?: string, role?: UserRole) {
  const [profile, setProfile] = useState<AnyUserProfile | null>(null)
  const [fileToken, setFileToken] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [loadError, setLoadError] = useState("")

  const collectionName = role ? ROLE_PROFILE_COLLECTION[role] : undefined
  const isRoleKnown = Boolean(role)

  const load = useCallback(async () => {
    if (!isRoleKnown) {
      // Waiting on the users list; load() re-runs once the role arrives.
      return
    }
    if (!userId || !collectionName) {
      setProfile(null)
      setIsLoading(false)
      return
    }
    setIsLoading(true)
    setLoadError("")
    try {
      const record = await pb
        .collection(collectionName)
        .getFirstListItem(pb.filter("user = {:value0}", { value0: userId }))
      setProfile(record as unknown as AnyUserProfile)
    } catch (error) {
      setProfile(null)
      const status = (error as { status?: number }).status
      if (status !== 404) {
        setLoadError(getErrorMessage(error))
      }
    } finally {
      setIsLoading(false)
    }
  }, [userId, collectionName, isRoleKnown])

  useEffect(() => {
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

  /**
   * Writes the account columns first, then the profile record. The account row
   * is updated separately because it lives in a different collection. Creates
   * the profile row when the user has never submitted one.
   */
  const save = useCallback(
    async (draft: UserProfileDraft) => {
      if (!userId) throw new Error("No user selected")
      if (!collectionName) {
        // Admin accounts have no profile collection; only the row updates.
        await pb.collection("users").update(userId, {
          name: draft.name.trim(),
          contact_number: draft.contactNumber.trim(),
        })
        return null
      }

      setIsSaving(true)
      try {
        await pb.collection("users").update(userId, {
          name: draft.name.trim(),
          contact_number: draft.contactNumber.trim(),
        })

        const payload: Record<string, unknown> = {
          // Select and date fields reject an empty string, so a cleared value
          // is sent as null instead. PocketBase accepts null to unset an
          // optional field.
          ...nullableFields(draft.fields),
          notes: draft.notes.trim() || null,
        }
        if (!profile?.id) {
          payload.user = userId
        }
        const saved = profile?.id
          ? await pb.collection(collectionName).update(profile.id, payload)
          : await pb.collection(collectionName).create(payload)
        setProfile(saved as unknown as AnyUserProfile)
        return saved as unknown as AnyUserProfile
      } finally {
        setIsSaving(false)
      }
    },
    [userId, collectionName, profile?.id]
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