import React, { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { searchCategoriesSoap, type SoapCategory } from "../api/soap";
import { GradientCard } from "@msokol/gradient-card-component";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const API_URL = import.meta.env.VITE_API_URL || "";

export default function Task2Page() {
  const [term, setTerm] = useState("");

  const generateMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`${API_URL}/api/generate-xml`);
      const data = await res.json();
      return (data.message as string) || "XML generated successfully";
    },
  });

  const searchMutation = useMutation({
    mutationFn: async (searchTerm: string) => {
      return searchCategoriesSoap(searchTerm);
    },
  });

  const handleSearch = (e: React.BaseSyntheticEvent) => {
    e.preventDefault();
    searchMutation.mutate(term);
  };

  const generateMsg = generateMutation.data ?? "";
  const generateError = !!generateMutation.error;

  const results: SoapCategory[] = searchMutation.data ?? [];
  const searchLoading = searchMutation.isPending;
  const searchError = searchMutation.error instanceof Error
    ? searchMutation.error.message
    : searchMutation.error
    ? "SOAP search failed"
    : "";

  return (
    <div className="flex-1 overflow-y-auto p-6 lg:p-8">
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold">Task 2 — SOAP Search</h1>
          <p className="text-sm text-muted-foreground mt-1">
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
              ? "rounded-lg bg-destructive/10 border border-destructive/20 p-4 text-destructive mb-5"
              : "rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-4 text-emerald-400 mb-5"
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
        <form onSubmit={handleSearch} className="flex gap-3 mt-2">
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
          <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-4 text-destructive mt-4">
            {searchError}
          </div>
        )}
      </GradientCard>

      {/* Results */}
      {results.length > 0 && (
        <div className="border border-border rounded overflow-hidden mt-5">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-card border-b border-border">
                <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">ID</th>
                <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">Name</th>
                <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">Slug</th>
                <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">Description</th>
              </tr>
            </thead>
            <tbody>
              {results.map((cat) => (
                <tr
                  key={cat.id ?? cat.slug}
                  className="border-b border-border bg-card hover:bg-accent/30 transition-colors"
                >
                  <td className="px-4 h-12 align-middle text-sm text-foreground">{cat.id}</td>
                  <td className="px-4 h-12 align-middle text-sm font-medium text-foreground">{cat.name}</td>
                  <td className="px-4 h-12 align-middle text-sm">
                    <code className="bg-muted rounded px-1.5 py-0.5 text-xs text-muted-foreground">
                      {cat.slug}
                    </code>
                  </td>
                  <td className="px-4 h-12 align-middle text-sm text-muted-foreground">
                    {cat.description || "\u2014"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {results.length === 0 && !searchLoading && !searchError && (
        <div className="bg-card border border-border rounded-xl p-6 mt-5">
          <p className="text-muted-foreground text-center text-sm">
            Enter a search term above to query categories via SOAP.
          </p>
        </div>
      )}
    </div>
  );
}
