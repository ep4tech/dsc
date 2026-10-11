"use client"


import { boundedFullList } from "@/lib/bounded-records"
import { useState, useEffect, useCallback } from "react"
import pb, { getErrorMessage } from "@/lib/pb"
import { normalizeEmail } from "@/lib/validators"
import type { User } from "@/types/user"
import { toast } from "sonner"

export function useUsers() {
  const [users, setUsers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const fetchUsers = useCallback(async () => {
    try {
      const data = await boundedFullList(pb.collection("users"), {
        sort: "-created",
      })
      setUsers(data as unknown as User[])
    } catch (error) {
      console.error("Failed to fetch users:", error)
      toast.error(getErrorMessage(error))
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  const addUser = async (data: {
    email: string
    password: string
    passwordConfirm: string
    name: string
    role: string
    contact_number?: string
    is_active?: boolean
  }) => {
    try {
      const newUser = await pb.collection("users").create({
        ...data,
        email: normalizeEmail(data.email),
        name: data.name.trim(),
        emailVisibility: true,
      })
      setUsers((prev) => [newUser as unknown as User, ...prev])
      return newUser.id
    } catch (error) {
      console.error("Failed to create user:", error)
      throw error
    }
  }

  const updateUser = async (id: string, data: Partial<User>) => {
    try {
      const updated = await pb.collection("users").update(id, data)
      setUsers((prev) =>
        prev.map((u) => (u.id === id ? (updated as unknown as User) : u))
      )
    } catch (error) {
      console.error("Failed to update user:", error)
      throw error
    }
  }

  /**
   * Sets a new password on a user's auth record. PocketBase stores only the
   * hash, so the admin has to communicate the plaintext out of band. Note this
   * does not revoke the user's existing sessions.
   */
  const resetPassword = async (id: string, password: string) => {
    try {
      const updated = await pb.collection("users").update(id, {
        password,
        passwordConfirm: password,
      })
      setUsers((prev) =>
        prev.map((u) => (u.id === id ? (updated as unknown as User) : u))
      )
    } catch (error) {
      console.error("Failed to reset password:", error)
      throw error
    }
  }

  const getDeletionBlockers = async (id: string) => {
    const [userCases, expertAssignments] = await Promise.all([
      boundedFullList(pb.collection("cases"), { filter: pb.filter("user = {:value0}", { value0: id }) }),
      boundedFullList(pb.collection("case_experts"), {
        filter: pb.filter("expert_id = {:value0}", { value0: id }),
      }),
    ])
    return {
      cases: userCases.length,
      assignments: expertAssignments.length,
    }
  }

  const deleteUser = async (id: string) => {
    try {
      const blockers = await getDeletionBlockers(id)
      if (blockers.cases > 0 || blockers.assignments > 0) {
        throw new Error(
          "This user has linked cases or expert assignments and cannot be deleted."
        )
      }

      const profileCollections = [
        "individual_profiles",
        "parent_profiles",
        "organization_profiles",
        "expert_profiles",
      ]
      for (const collection of profileCollections) {
        const records = await boundedFullList(pb.collection(collection), {
          filter: pb.filter("user = {:value0}", { value0: id }),
        })
        for (const record of records) {
          await pb.collection(collection).delete(record.id)
        }
      }

      await pb.collection("users").delete(id)
      setUsers((prev) => prev.filter((u) => u.id !== id))
    } catch (error) {
      console.error("Failed to delete user:", error)
      throw error
    }
  }

  const refresh = fetchUsers

  return {
    users,
    isLoading,
    addUser,
    updateUser,
    resetPassword,
    deleteUser,
    getDeletionBlockers,
    refresh,
  }
}
