"use client"
import { useEffect, useState } from "react"
import pb from "@/lib/pb"
export function useUnreadMessages(userId?: string, enabled = false) {
  const [count, setCount] = useState(0)
  useEffect(() => {
    if (!userId || !enabled) return
    let active = true
    async function refresh() {
      try {
        const data = await pb.collection("internal_messages").getList(1, 1, { filter: pb.filter("recipient = {:id} && read = false", { id: userId }), requestKey: null })
        if (active) setCount(data.totalItems)
      } catch { if (active) setCount(0) }
    }
    void refresh()
    const interval = setInterval(refresh, 30000)
    window.addEventListener("messages-updated", refresh)
    return () => { active = false; clearInterval(interval); window.removeEventListener("messages-updated", refresh) }
  }, [userId, enabled])
  return enabled ? count : 0
}
