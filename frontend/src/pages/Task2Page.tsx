import React, { useState } from "react"
import { useMutation } from "@tanstack/react-query"
import { searchCategoriesSoap, type SoapCategory } from "../api/soap"
import { GradientCard } from "@msokol/gradient-card-component"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

const API_URL = import.meta.env.VITE_API_URL || ""

export default function Task2Page() {
  const [term, setTerm] = useState("")

  const generateMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`${API_URL}/api/generate-xml`)
      const data = await res.json()
      return (data.message as string) || "XML generated successfully"
    },
  })

  const searchMutation = useMutation({
    mutationFn: async (searchTerm: string) => {
      return searchCategoriesSoap(searchTerm)
    },
  })

  const handleSearch = (e: React.BaseSyntheticEvent) => {
    e.preventDefault()
    searchMutation.mutate(term)
  }

  const generateMsg = generateMutation.data ?? ""
  const generateError = !!generateMutation.error

  const results: SoapCategory[] = searchMutation.data ?? []
  const searchLoading = searchMutation.isPending
  const searchError =
    searchMutation.error instanceof Error
      ? searchMutation.error.message
      : searchMutation.error
        ? "SOAP search failed"
        : ""

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

      {results.length === 0 && !searchLoading && !searchError && (
        <div className="bg-card border-border mt-5 rounded-xl border p-6">
          <p className="text-muted-foreground text-center text-sm">
            Enter a search term above to query categories via SOAP.
          </p>
        </div>
      )}
    </div>
  )
}
