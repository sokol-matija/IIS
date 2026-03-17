import { useMutation } from "@tanstack/react-query"
import { GradientCard } from "@msokol/gradient-card-component"
import { Button } from "@/components/ui/button"
import { useGenerateXmlMutation } from "../hooks/useGenerateXmlMutation"
import { getMutationError } from "@/lib/utils"

const API_URL = import.meta.env.VITE_API_URL || ""

export default function Task3Page() {
  const generateMutation = useGenerateXmlMutation()

  const validateMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`${API_URL}/api/validate-xml`).catch(() => {
        throw new Error("Failed to contact server")
      })
      if (!res.ok) throw new Error("Failed to contact server")
      const data = await res.json()
      return data as { valid: boolean; errors: string[] }
    },
  })

  const generateMsg = generateMutation.data ?? ""
  const generateError = !!generateMutation.error

  const result = validateMutation.data ?? null
  const validateError = getMutationError(validateMutation.error, "Failed to contact server") || null

  return (
    <div className="flex-1 overflow-y-auto p-6 lg:p-8">
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Task 3 — XML Validation</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Validate the generated categories.xml against the category.xsd schema.
          </p>
        </div>
        <Button variant="outline" onClick={() => generateMutation.mutate()} className="h-10 px-5">
          Generate XML
        </Button>
      </div>

      {(generateMsg || generateError) && (
        <div
          className={
            generateError
              ? "bg-destructive/10 border-destructive/20 text-destructive mb-5 rounded-lg border p-4"
              : "mb-5 rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-4 text-emerald-400"
          }
        >
          {generateError
            ? generateMutation.error instanceof Error
              ? generateMutation.error.message
              : "Failed to generate XML"
            : generateMsg}
        </div>
      )}

      <GradientCard
        variant="lavender"
        title="XSD Validation"
        description="Validate categories.xml against category.xsd schema"
      >
        <div className="mt-4">
          <Button
            onClick={() => validateMutation.mutate()}
            disabled={validateMutation.isPending}
            className="h-10 px-7 text-sm"
          >
            {validateMutation.isPending ? "Validating..." : "Run Validation"}
          </Button>

          {validateError && !result && (
            <div className="bg-destructive/10 border-destructive/20 text-destructive mt-6 rounded-lg border p-4">
              {validateError}
            </div>
          )}

          {result && (
            <div className="mt-6">
              {result.valid ? (
                <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-4 text-emerald-400">
                  <strong>XML is valid</strong> — The document conforms to the XSD schema.
                </div>
              ) : (
                <div className="bg-destructive/10 border-destructive/20 text-destructive rounded-lg border p-4">
                  <div className={result.errors.length > 0 ? "mb-2" : ""}>
                    <strong>XML validation failed</strong>
                  </div>
                  {result.errors.length > 0 && (
                    <ul className="m-0 mt-2 list-disc pl-5">
                      {result.errors.map((err) => (
                        <li key={err} className="mb-1">
                          {err}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </GradientCard>
    </div>
  )
}
