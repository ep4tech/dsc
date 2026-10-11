"use client"
import { useEffect, useState } from "react"
import pb, { getErrorMessage } from "@/lib/pb"
import { useLang } from "@/lib/lang-context"

export function ExpertBankDetails({ userId }: { userId: string }) {
  const { lang } = useLang()
  const [details, setDetails] = useState<{ iban?: string; error?: string }>({})
  useEffect(() => {
    let active = true
    pb.collection("expert_bank_details")
      .getFirstListItem(pb.filter("user={:user}", { user: userId }))
      .then((record) => {
        if (active) setDetails({ iban: record.iban })
      })
      .catch((error) => {
        if (active)
          setDetails({
            error:
              error.status === 404
                ? lang === "ar"
                  ? "لم تتم إضافة IBAN"
                  : "No IBAN provided"
                : getErrorMessage(error, lang),
          })
      })
    return () => {
      active = false
    }
  }, [userId, lang])
  return (
    <section className="space-y-2 rounded-lg border p-4">
      <h3 className="font-semibold">
        {lang === "ar" ? "بيانات الدفع الخاصة" : "Private payment details"}
      </h3>
      <p>
        IBAN:{" "}
        <span dir="ltr">
          {details.iban ||
            details.error ||
            (lang === "ar" ? "جارٍ التحميل..." : "Loading...")}
        </span>
      </p>
    </section>
  )
}
