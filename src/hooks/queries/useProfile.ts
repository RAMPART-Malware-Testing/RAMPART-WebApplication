import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import axios from "axios"
import { queryKeys } from "./queryKeys"

export interface ProfileData {
  uid: string
  username: string
  email: string
  avatar_url: string | null
  role: "user" | "admin" | "master"
  status: string
  must_setup?: boolean
  created_at: string | null
}

async function fetchProfile(): Promise<ProfileData | null> {
  const { data } = await axios.get("/api/profile")
  if (!data?.success || !data?.data) return null
  return data.data as ProfileData
}

export function useProfile() {
  return useQuery({
    queryKey: queryKeys.profile,
    queryFn: fetchProfile,
    staleTime: 5_000,
  })
}

export function useUpdateUsername() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (username: string) => {
      const { data } = await axios.patch("/api/profile", { username })
      if (!data?.success) throw new Error(data?.message || "อัปเดตโปรไฟล์ไม่สำเร็จ")
      return data.data as ProfileData
    },
    onSuccess: (updated) => {
      queryClient.setQueryData<ProfileData | null>(queryKeys.profile, (prev) =>
        prev ? { ...prev, ...updated } : updated,
      )
    },
  })
}

export function useUpdateAvatar() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (file: File) => {
      const body = new FormData()
      body.append("file", file)
      const { data } = await axios.post("/api/profile/avatar", body)
      if (!data?.success) throw new Error(data?.message || "อัปโหลดรูปโปรไฟล์ไม่สำเร็จ")
      return data.data as ProfileData
    },
    onSuccess: (updated) => {
      queryClient.setQueryData<ProfileData | null>(queryKeys.profile, (prev) =>
        prev ? { ...prev, ...updated } : updated,
      )
    },
  })
}

export interface ChangePasswordInput {
  currentPassword: string
  newPassword: string
  confirmPassword: string
}

export function useChangePassword() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: ChangePasswordInput) => {
      try {
        const { data } = await axios.post("/api/profile/change-password", input)
        if (!data?.success) throw new Error(data?.message || "เปลี่ยนรหัสผ่านไม่สำเร็จ")
        return true
      } catch (err) {
        if (axios.isAxiosError(err)) {
          const message = (err.response?.data as { message?: string } | undefined)?.message
          throw new Error(message || "เปลี่ยนรหัสผ่านไม่สำเร็จ")
        }
        throw err instanceof Error ? err : new Error("เปลี่ยนรหัสผ่านไม่สำเร็จ")
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.passwordHistory })
    },
  })
}
