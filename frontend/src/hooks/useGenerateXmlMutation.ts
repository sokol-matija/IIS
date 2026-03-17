import { useMutation } from "@tanstack/react-query"

const API_URL = import.meta.env.VITE_API_URL || ""

export function useGenerateXmlMutation() {
  return useMutation({
    mutationFn: async () => {
      const res = await fetch(`${API_URL}/api/generate-xml`)
      const data = await res.json()
      return (data.message as string) || "XML generated successfully"
    },
  })
}
