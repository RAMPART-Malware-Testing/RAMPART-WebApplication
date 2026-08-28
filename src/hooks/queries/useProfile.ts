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
