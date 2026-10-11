"use client"

import { useState, useEffect, useCallback } from "react"
import { caseExpertsCollection } from "@/lib/pb-collections"
import type { CaseExpert } from "@/types/allocation"
import { toast } from "sonner"
import { getErrorMessage } from "@/lib/pb"

export function useAllocations(caseId?: string) {
  const [allocations, setAllocations] = useState<CaseExpert[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState("")

  const fetchAllocations = useCallback(async () => {
    setIsLoading(true)
    setLoadError("")
    try {
      let data: CaseExpert[]
      if (caseId) {
        data = await caseExpertsCollection.getByCase(caseId)
      } else {
        data = await caseExpertsCollection.getAll()
      }
      setAllocations(data)
    } catch (error) {
      console.error("Failed to fetch allocations:", error)
      setLoadError(getErrorMessage(error))
      toast.error(getErrorMessage(error))
    } finally {
      setIsLoading(false)
    }
  }, [caseId])

  useEffect(() => {
    // Fetch external records when the selected scope changes.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchAllocations()
  }, [fetchAllocations])

  const addAllocation = async (data: {
    case_id: string
    expert_id: string
    role: CaseExpert["role"]
  }) => {
    try {
      const newAllocation = await caseExpertsCollection.create(data)
      setAllocations((prev) => [...prev, newAllocation])
      return newAllocation
    } catch (error) {
      console.error("Failed to create allocation:", error)
      throw error
    }
  }

  const updateAllocation = async (
    id: string,
    data: Partial<CaseExpert>
  ) => {
    try {
      const updated = await caseExpertsCollection.update(id, data)
      setAllocations((prev) =>
        prev.map((a) => (a.id === id ? updated : a))
      )
      return updated
    } catch (error) {
      console.error("Failed to update allocation:", error)
      throw error
    }
  }

  const removeAllocation = async (id: string) => {
    try {
      await caseExpertsCollection.delete(id)
      setAllocations((prev) => prev.filter((a) => a.id !== id))
    } catch (error) {
      console.error("Failed to delete allocation:", error)
      throw error
    }
  }

  const getAllocationsByCase = (caseId: string) =>
    allocations.filter((a) => a.case_id === caseId)

  return {
    allocations,
    isLoading,
    loadError,
    addAllocation,
    updateAllocation,
    removeAllocation,
    getAllocationsByCase,
    refresh: fetchAllocations,
  }
}
