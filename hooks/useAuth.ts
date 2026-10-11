"use client"

import { useState, useEffect, useCallback } from "react"
import { getCurrentLang } from "@/lib/current-lang"
import { t } from "@/lib/i18n"
import pb, {
  getCurrentUser,
  getErrorMessage,
  isAuthenticated as checkAuth,
  isAdmin as checkIsAdmin,
  isSuperAdmin as checkIsSuperAdmin,
  authWithPassword,
  logout as pbLogout,
} from "@/lib/pb"
import type { User } from "@/types/user"

export function useAuth() {
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [isSuperAdmin, setIsSuperAdmin] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  const refreshAuth = useCallback(() => {
    const user = getCurrentUser()
    if (user && user.is_active === false) {
      pbLogout()
      setCurrentUser(null)
      setIsAuthenticated(false)
      setIsAdmin(false)
      setIsSuperAdmin(false)
      setIsLoading(false)
      return
    }
    setCurrentUser(user)
    setIsAuthenticated(checkAuth())
    setIsAdmin(checkIsAdmin())
    setIsSuperAdmin(checkIsSuperAdmin())
    setIsLoading(false)
  }, [])

  useEffect(() => {
    const unsubscribe = pb.authStore.onChange(() => {
      refreshAuth()
    }, true)

    return () => {
      unsubscribe()
    }
  }, [refreshAuth])

  const login = async (email: string, password: string) => {
    try {
      const authData = await authWithPassword(email, password)
      const user = authData.record as unknown as User
      if (user && user.is_active === false) {
        await pbLogout()
        return {
          success: false,
          error:
            user.role === "expert"
              ? t(
                  {
                    en: "Your account is pending approval. You will be able to log in once approved.",
                    ar: "حسابك قيد المراجعة. ستتمكن من تسجيل الدخول بعد الموافقة عليه.",
                  },
                  getCurrentLang()
                )
              : t(
                  {
                    en: "Your account has been deactivated. Please contact the administrator.",
                    ar: "تم تعطيل حسابك. يرجى التواصل مع المسؤول.",
                  },
                  getCurrentLang()
                ),
        }
      }
      refreshAuth()
      return { success: true as const, role: user.role }
    } catch (error: unknown) {
      const status = (error as { status?: number } | null)?.status
      if (status === 400 || status === 401) {
        return {
          success: false,
          error: t(
            {
              en: "Incorrect email or password.",
              ar: "البريد الإلكتروني أو كلمة المرور غير صحيحة.",
            },
            getCurrentLang()
          ),
        }
      }
      return { success: false, error: getErrorMessage(error) }
    }
  }

  const logout = async () => {
    await pbLogout()
    setCurrentUser(null)
    setIsAuthenticated(false)
    setIsAdmin(false)
    setIsSuperAdmin(false)
  }

  return {
    currentUser,
    isAuthenticated,
    isAdmin,
    isSuperAdmin,
    isLoading,
    login,
    logout,
  }
}
