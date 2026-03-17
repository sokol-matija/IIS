import React, { useState, useRef, type ChangeEvent } from "react"
import { useMutation } from "@tanstack/react-query"
import { useAuthStore } from "../store/authStore"
import { GradientCard } from "@msokol/gradient-card-component"
import { Button } from "@/components/ui/button"
import { FileText, FileJson } from "lucide-react"

const API_URL = import.meta.env.VITE_API_URL || ""

export default function Task1Page() {
  const { role } = useAuthStore()
  const isReadOnly = role === "read-only"
  const [xmlFileName, setXmlFileName] = useState<string | null>(null)
  const [jsonFileName, setJsonFileName] = useState<string | null>(null)
  const xmlRef = useRef<HTMLInputElement>(null)
  const jsonRef = useRef<HTMLInputElement>(null)

  const uploadMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const res = await fetch(`${API_URL}/api/upload`, {
        method: "POST",
        body: formData,
      })
      const data = await res.json()
      return data as { data?: unknown; errors?: string[] }
    },
  })

  const handleXmlChange = (e: ChangeEvent<HTMLInputElement>) => {
    setXmlFileName(e.target.files?.[0]?.name ?? null)
  }

  const handleJsonChange = (e: ChangeEvent<HTMLInputElement>) => {
    setJsonFileName(e.target.files?.[0]?.name ?? null)
  }

  const handleSubmit = (e: React.BaseSyntheticEvent) => {
    e.preventDefault()
    const formData = new FormData()
    if (xmlRef.current?.files?.[0]) {
      formData.append("xmlFile", xmlRef.current.files[0])
    }
    if (jsonRef.current?.files?.[0]) {
      formData.append("jsonFile", jsonRef.current.files[0])
    }
    uploadMutation.mutate(formData)
  }

  const result = uploadMutation.data ?? null
  const loading = uploadMutation.isPending

  // If there was a network error (thrown), surface it as an errors array
  const networkError = uploadMutation.error instanceof Error ? uploadMutation.error.message : null

  return (
    <div className="flex-1 overflow-y-auto p-6 lg:p-8">
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Task 1 — XML &amp; JSON Upload</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Upload an XML file (validated against category.xsd) and a JSON file (validated against
            category.schema.json). On success, the category is saved to the database.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="mb-6 grid grid-cols-2 gap-4">
          {/* XML Card */}
          <GradientCard variant="lavender" title="XML File">
            <label
              className="border-border hover:border-primary hover:bg-primary/5 mt-2 mb-3 block cursor-pointer rounded-xl border-2 border-dashed p-8 text-center transition-colors"
              htmlFor="xml-upload"
            >
              <div className="mb-2 flex justify-center">
                <FileText size={28} className="opacity-60" />
              </div>
              <p className="text-muted-foreground mb-1 text-sm">
                {xmlFileName ? (
                  <span className="text-primary">{xmlFileName}</span>
                ) : (
                  "Click to select XML file"
                )}
              </p>
              <p className="text-muted-foreground text-[11px]">category.xml</p>
              <input
                id="xml-upload"
                type="file"
                ref={xmlRef}
                accept=".xml"
                onChange={handleXmlChange}
                className="hidden"
              />
            </label>
          </GradientCard>

          {/* JSON Card */}
          <GradientCard variant="ghost" title="JSON File">
            <label
              className="border-border hover:border-primary hover:bg-primary/5 mt-2 mb-3 block cursor-pointer rounded-xl border-2 border-dashed p-8 text-center transition-colors"
              htmlFor="json-upload"
            >
              <div className="mb-2 flex justify-center">
                <FileJson size={28} className="opacity-60" />
              </div>
              <p className="text-muted-foreground mb-1 text-sm">
                {jsonFileName ? (
                  <span className="text-primary">{jsonFileName}</span>
                ) : (
                  "Click to select JSON file"
                )}
              </p>
              <p className="text-muted-foreground text-[11px]">category.json</p>
              <input
                id="json-upload"
                type="file"
                ref={jsonRef}
                accept=".json"
                onChange={handleJsonChange}
                className="hidden"
              />
            </label>
          </GradientCard>
        </div>

        <Button type="submit" disabled={loading || isReadOnly} className="h-10 px-6">
          {loading
            ? "Uploading..."
            : isReadOnly
              ? "Read-Only — Upload Disabled"
              : "Upload & Validate"}
        </Button>
      </form>

      {networkError && (
        <div className="bg-destructive/10 border-destructive/20 text-destructive mt-6 rounded-lg border p-5">
          <p className="mb-2 font-semibold">Validation Errors</p>
          <ul className="m-0 list-disc pl-5">
            <li className="mb-1">{networkError}</li>
          </ul>
        </div>
      )}

      {result && (
        <div className="mt-6">
          {result.errors && result.errors.length > 0 ? (
            <div className="bg-destructive/10 border-destructive/20 text-destructive rounded-lg border p-5">
              <p className="mb-2 font-semibold">Validation Errors</p>
              <ul className="m-0 list-disc pl-5">
                {result.errors.map((err) => (
                  <li key={err} className="mb-1">
                    {err}
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-5 text-emerald-400">
              <p className="mb-2 font-semibold">Category saved successfully</p>
              <pre className="bg-muted/50 mt-3 max-h-96 overflow-auto rounded-lg border p-4 font-mono text-xs text-cyan-300">
                {JSON.stringify(result.data, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
