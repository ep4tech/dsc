"use client"


import { boundedFullList } from "@/lib/bounded-records"
import { useState, useEffect, useCallback } from "react"
import pb, { getErrorMessage } from "@/lib/pb"
import type { PaymentBankDetails } from "@/lib/payment"
import { DEFAULT_BANK_DETAILS } from "@/lib/payment"
import { toast } from "sonner"

export function usePaymentSettings() {
  const [bankDetails, setBankDetails] =
    useState<PaymentBankDetails>(DEFAULT_BANK_DETAILS)
  const [isLoading, setIsLoading] = useState(true)

  const fetchSettings = useCallback(async () => {
    try {
      const records = await boundedFullList(pb.collection("settings"), { limit: 1 })
      const record = records[0]
      const stored = record?.payment_bank_details
      if (stored && typeof stored === "object") {
        setBankDetails({
          ...DEFAULT_BANK_DETAILS,
          ...(stored as Partial<PaymentBankDetails>),
        })
      }
    } catch (error) {
      console.error("Failed to fetch payment settings:", error)
      toast.error(getErrorMessage(error))
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchSettings()
  }, [fetchSettings])

  const saveBankDetails = async (details: PaymentBankDetails) => {
    try {
      const records = await boundedFullList(pb.collection("settings"), { limit: 1 })
      if (records[0]) {
        await pb
          .collection("settings")
          .update(records[0].id, { payment_bank_details: details })
      } else {
        await pb
          .collection("settings")
          .create({ payment_bank_details: details })
      }
      setBankDetails(details)
    } catch (error) {
      console.error("Failed to save payment settings:", error)
      throw error
    }
  }

  return { bankDetails, isLoading, saveBankDetails, refresh: fetchSettings }
}
