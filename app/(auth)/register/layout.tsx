"use client"

import { usePathname } from "next/navigation"
import styles from "@/components/internal/internal-theme.module.css"

export default function RegisterLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  if (pathname === "/register" || pathname === "/register/") return children
  return (
    <div className={styles.page}>
      <div className={`${styles.container} ${styles.form}`}>{children}</div>
    </div>
  )
}
