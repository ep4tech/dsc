"use client"
import { useCallback, useEffect, useState } from "react"
import { getPortals } from "@/lib/portal-data"
import type { Portal } from "@/lib/portals"
export function usePortals(includeDeleted = false) {
  const [portals, setPortals] = useState<Portal[]>([])
  const [isLoading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const reload = useCallback(async (background = false) => {
    if (!background) setLoading(true)
    setError(null)
    try {
      setPortals(await getPortals(includeDeleted))
    } catch {
      setError("Unable to load portals.")
    } finally {
      if (!background) setLoading(false)
    }
  }, [includeDeleted])
  useEffect(() => {
    const timer = window.setTimeout(() => void reload(), 0)
    // Returning from the native file chooser fires focus. Refresh data without
    // replacing the editor (and its file input) with a loading screen.
    const refresh = () => void reload(true)
    window.addEventListener("portals-updated", refresh)
    window.addEventListener("focus", refresh)
    return () => {
      window.clearTimeout(timer)
      window.removeEventListener("portals-updated", refresh)
      window.removeEventListener("focus", refresh)
    }
  }, [reload])
  return { portals, isLoading, error, reload }
}
