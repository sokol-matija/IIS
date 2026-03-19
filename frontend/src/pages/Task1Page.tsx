import React, { useRef, type ChangeEvent } from "react"
import { useMutation } from "@tanstack/react-query"
import { toast } from "sonner"
import { useAuthStore } from "../store/authStore"
import { useTask1Store } from "../store/task1Store"
import { GradientCard } from "@msokol/gradient-card-component"
import { Button } from "@/components/ui/button"
import { FileText, FileJson } from "lucide-react"

const API_URL = import.meta.env.VITE_API_URL || ""

export default function Task1Page() {
  const { role } = useAuthStore()
  const isReadOnly = role === "read-only"

  const { xmlFileName, jsonFileName, xmlContent, jsonContent, setXmlFile, setJsonFile, setXmlContent, setJsonContent } =
    useTask1Store()

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
    onSuccess: (data) => {
      if (data.errors && data.errors.length > 0) {
        toast.error(`Validation failed: ${data.errors[0]}`)
      } else {
        toast.success("Category saved successfully")
      }
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Upload failed")
    },
  })

  const handleXmlChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => setXmlFile(file.name, (ev.target?.result as string) ?? "")
    reader.readAsText(file)
  }

  const handleJsonChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => setJsonFile(file.name, (ev.target?.result as string) ?? "")
    reader.readAsText(file)
  }

  const handleSubmit = (e: React.BaseSyntheticEvent) => {
    e.preventDefault()
    const formData = new FormData()
    if (xmlContent) {
      formData.append("xmlFile", new Blob([xmlContent], { type: "text/xml" }), xmlFileName ?? "file.xml")
    }
    if (jsonContent) {
      formData.append("jsonFile", new Blob([jsonContent], { type: "application/json" }), jsonFileName ?? "file.json")
    }
    uploadMutation.mutate(formData)
  }

  const result = uploadMutation.data ?? null
  const loading = uploadMutation.isPending

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
              className="border-border hover:border-primary hover:bg-primary/5 mt-2 mb-3 block cursor-pointer rounded-xl border-2 border-dashed p-6 text-center transition-colors"
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
            {xmlContent && (
              <textarea
                value={xmlContent}
                onChange={(e) => setXmlContent(e.target.value)}
                className="bg-muted/50 border-border focus:border-primary w-full rounded-lg border p-3 font-mono text-xs outline-none transition-colors"
                rows={10}
                spellCheck={false}
              />
            )}
          </GradientCard>

          {/* JSON Card */}
          <GradientCard variant="ghost" title="JSON File">
            <label
              className="border-border hover:border-primary hover:bg-primary/5 mt-2 mb-3 block cursor-pointer rounded-xl border-2 border-dashed p-6 text-center transition-colors"
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
            {jsonContent && (
              <textarea
                value={jsonContent}
                onChange={(e) => setJsonContent(e.target.value)}
                className="bg-muted/50 border-border focus:border-primary w-full rounded-lg border p-3 font-mono text-xs outline-none transition-colors"
                rows={10}
                spellCheck={false}
              />
            )}
          </GradientCard>
        </div>

        <Button
          type="submit"
          disabled={loading || isReadOnly || (!xmlContent && !jsonContent)}
          className="h-10 px-6"
        >
          {loading
            ? "Validating..."
            : isReadOnly
              ? "Read-Only — Upload Disabled"
              : "Upload & Validate"}
        </Button>
      </form>

      {result && result.errors && result.errors.length > 0 && (
        <div className="bg-destructive/10 border-destructive/20 text-destructive mt-6 rounded-lg border p-5">
          <p className="mb-2 font-semibold">Validation Errors</p>
          <ul className="m-0 list-disc pl-5">
            {result.errors.map((err) => (
              <li key={err} className="mb-1">
                {err}
              </li>
            ))}
          </ul>
        </div>
      )}

      {result && (!result.errors || result.errors.length === 0) && (
        <div className="mt-6 rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-5 text-emerald-400">
          <p className="mb-2 font-semibold">Category saved successfully</p>
          <pre className="bg-muted/50 mt-3 max-h-96 overflow-auto rounded-lg border p-4 font-mono text-xs text-cyan-300">
            {JSON.stringify(result.data, null, 2)}
          </pre>
        </div>
      )}
    </div>
  )
}
