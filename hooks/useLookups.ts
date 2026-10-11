"use client"


import { boundedFullList } from "@/lib/bounded-records"
import { useState, useCallback } from "react"
import pb, { getErrorMessage } from "@/lib/pb"

export type LookupType = "tool_types" | "case_types" | "user_types"

export interface LookupRecord {
  id: string
  type: string
  key: string
  label_en: string
  label_ar: string
  created: string
  updated: string
}

export function useLookups() {
  const [lookups, setLookups] = useState<LookupRecord[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchLookups = useCallback(async (type?: LookupType) => {
    setIsLoading(true)
    setError(null)
    try {
      const filter = type ? pb.filter("type = {:type}", { type }) : ""
      const data = await boundedFullList(pb.collection("lookups"), {
        filter: filter || undefined,
        sort: "created",
      })
      const records: LookupRecord[] = data.map((item) => ({
        id: item.id,
        type: item.type as string,
        key: item.key as string,
        label_en: (item.label_en as string) || "",
        label_ar: (item.label_ar as string) || "",
        created: item.created as string,
        updated: item.updated as string,
      }))
      setLookups(records)
      return records
    } catch (err) {
      const message = getErrorMessage(err)
      setError(message)
      return []
    } finally {
      setIsLoading(false)
    }
  }, [])

  const createLookup = useCallback(
    async (data: {
      type: string
      key: string
      label_en: string
      label_ar: string
    }): Promise<LookupRecord | null> => {
      setError(null)
      try {
        const created = await pb.collection("lookups").create({
          type: data.type,
          key: data.key,
          label_en: data.label_en,
          label_ar: data.label_ar,
        })
        const record: LookupRecord = {
          id: created.id,
          type: created.type as string,
          key: created.key as string,
          label_en: (created.label_en as string) || "",
          label_ar: (created.label_ar as string) || "",
          created: created.created as string,
          updated: created.updated as string,
        }
        setLookups((prev) => [record, ...prev])
        return record
      } catch (err) {
        const message = getErrorMessage(err)
        setError(message)
        return null
      }
    },
    []
  )

  const updateLookup = useCallback(
    async (
      id: string,
      data: {
        key?: string
        label_en?: string
        label_ar?: string
      }
    ): Promise<LookupRecord | null> => {
      setError(null)
      try {
        const updated = await pb.collection("lookups").update(id, {
          ...(data.key !== undefined && { key: data.key }),
          ...(data.label_en !== undefined && { label_en: data.label_en }),
          ...(data.label_ar !== undefined && { label_ar: data.label_ar }),
        })
        const record: LookupRecord = {
          id: updated.id,
          type: updated.type as string,
          key: updated.key as string,
          label_en: (updated.label_en as string) || "",
          label_ar: (updated.label_ar as string) || "",
          created: updated.created as string,
          updated: updated.updated as string,
        }
        setLookups((prev) =>
          prev.map((item) => (item.id === id ? record : item))
        )
        return record
      } catch (err) {
        const message = getErrorMessage(err)
        setError(message)
        return null
      }
    },
    []
  )

  const deleteLookup = useCallback(async (id: string): Promise<boolean> => {
    setError(null)
    try {
      await pb.collection("lookups").delete(id)
      setLookups((prev) => prev.filter((item) => item.id !== id))
      return true
    } catch (err) {
      const message = getErrorMessage(err)
      setError(message)
      return false
    }
  }, [])

  return {
    lookups,
    isLoading,
    error,
    fetchLookups,
    createLookup,
    updateLookup,
    deleteLookup,
  }
}
