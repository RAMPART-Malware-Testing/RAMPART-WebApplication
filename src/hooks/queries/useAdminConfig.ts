import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { AdminService } from '@/services/admin.service'

async function fetchConfig() {
  const res = await fetch('/api/admin/config')
  return res.json()
}

export function useAdminConfig() {
  return useQuery({
    queryKey: ['adminConfig'],
    queryFn: fetchConfig,
    staleTime: 0,
  })
}

export function useUpdateConfig() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ key, value }: { key: string; value: boolean | string | number | null }) => {
      const res = await fetch('/api/admin/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, value }),
      })
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminConfig'] })
    },
  })
}
