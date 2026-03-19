import React, { useState } from "react"
import { useMutation } from "@tanstack/react-query"
import { searchCategoriesSoap, type SoapCategory } from "../api/soap"
import { GradientCard } from "@msokol/gradient-card-component"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useGenerateXmlMutation } from "../hooks/useGenerateXmlMutation"
import { getMutationError } from "@/lib/utils"
import { ChevronDown, ChevronRight } from "lucide-react"

function CollapsibleCode({
  label,
  code,
  defaultOpen = false,
}: {
  label: string
  code: string
  defaultOpen?: boolean
}) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="border-border mt-4 overflow-hidden rounded-lg border">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="bg-card hover:bg-accent/30 flex w-full items-center gap-2 px-4 py-2.5 text-left transition-colors"
      >
        {open ? <ChevronDown size={14} className="opacity-60" /> : <ChevronRight size={14} className="opacity-60" />}
        <span className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">{label}</span>
      </button>
      {open && (
        <pre className="bg-muted/40 max-h-72 overflow-auto border-t p-4 font-mono text-xs text-cyan-300 whitespace-pre-wrap break-all">
          {code}
        </pre>
      )}
    </div>
  )
}

export default function Task2Page() {
  const [term, setTerm] = useState("")

  const generateMutation = useGenerateXmlMutation()

  const searchMutation = useMutation({
    mutationFn: (searchTerm: string) => searchCategoriesSoap(searchTerm),
  })

  const handleSearch = (e: React.BaseSyntheticEvent) => {
    e.preventDefault()
    searchMutation.mutate(term)
  }

  const generateMsg = generateMutation.data ?? ""
  const generateError = !!generateMutation.error

  const result = searchMutation.data ?? null
  const results: SoapCategory[] = result?.categories ?? []
  const searchLoading = searchMutation.isPending
  const searchError = getMutationError(searchMutation.error, "SOAP search failed")

  return (
    <div className="flex-1 overflow-y-auto p-6 lg:p-8">
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Task 2 — SOAP Search</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Generate XML from the database, then search categories using SOAP with XPath filtering.
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

      {/* Search Card */}
      <GradientCard
        variant="lavender"
        title="SOAP Search"
        description="Search categories via SOAP with XPath filtering"
      >
        <form onSubmit={handleSearch} className="mt-2 flex gap-3">
          <Input
            type="text"
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            placeholder="Search term (e.g. 'electr')"
            className="flex-1"
          />
          <Button type="submit" disabled={searchLoading} className="h-10 px-5">
            {searchLoading ? "Searching..." : "Search via SOAP"}
          </Button>
        </form>

        {searchError && (
          <div className="bg-destructive/10 border-destructive/20 text-destructive mt-4 rounded-lg border p-4">
            {searchError}
          </div>
        )}

        {/* Protocol panels — shown after a search */}
        {result && (
          <>
            <CollapsibleCode label="Request — SOAP Envelope (XML)" code={result.envelope} defaultOpen />
            <CollapsibleCode label="Response — Raw SOAP XML" code={result.rawResponse} />
          </>
        )}
      </GradientCard>

      {/* Results */}
      {results.length > 0 && (
        <div className="border-border mt-5 overflow-hidden rounded border">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-card border-border border-b">
                <th className="text-muted-foreground px-4 py-2.5 text-left text-[11px] font-semibold tracking-[0.06em] uppercase">
                  ID
                </th>
                <th className="text-muted-foreground px-4 py-2.5 text-left text-[11px] font-semibold tracking-[0.06em] uppercase">
                  Name
                </th>
                <th className="text-muted-foreground px-4 py-2.5 text-left text-[11px] font-semibold tracking-[0.06em] uppercase">
                  Slug
                </th>
                <th className="text-muted-foreground px-4 py-2.5 text-left text-[11px] font-semibold tracking-[0.06em] uppercase">
                  Description
                </th>
              </tr>
            </thead>
            <tbody>
              {results.map((cat) => (
                <tr
                  key={cat.id ?? cat.slug}
                  className="border-border bg-card hover:bg-accent/30 border-b transition-colors"
                >
                  <td className="text-foreground h-12 px-4 align-middle text-sm">{cat.id}</td>
                  <td className="text-foreground h-12 px-4 align-middle text-sm font-medium">
                    {cat.name}
                  </td>
                  <td className="h-12 px-4 align-middle text-sm">
                    <code className="bg-muted text-muted-foreground rounded px-1.5 py-0.5 text-xs">
                      {cat.slug}
                    </code>
                  </td>
                  <td className="text-muted-foreground h-12 px-4 align-middle text-sm">
                    {cat.description || "\u2014"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {results.length === 0 && !searchLoading && !searchError && !result && (
        <div className="bg-card border-border mt-5 rounded-xl border p-6">
          <p className="text-muted-foreground text-center text-sm">
            Enter a search term above to query categories via SOAP.
          </p>
        </div>
      )}

      {result && results.length === 0 && !searchLoading && (
        <div className="bg-card border-border mt-5 rounded-xl border p-6">
          <p className="text-muted-foreground text-center text-sm">No categories matched your search term.</p>
        </div>
      )}
    </div>
  )
}
