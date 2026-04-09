import { useMutation } from "@tanstack/react-query"
import { useAuthStore } from "@/store/authStore"

const API_URL = import.meta.env.VITE_API_URL || ""

export function useGenerateXmlMutation() {
  const getToken = useAuthStore((s) => s.getToken)
  return useMutation({
    mutationFn: async () => {
      const token = await getToken()
      const res = await fetch(`${API_URL}/api/generate-xml`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        credentials: "include",
      })
      const data = await res.json()
      return (data.message as string) || "XML generated successfully"
    },
  })
}
