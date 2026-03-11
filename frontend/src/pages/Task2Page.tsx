import React, { useReducer, useState } from "react";
import { searchCategoriesSoap, type SoapCategory } from "../api/soap";
import { GradientCard } from "@msokol/gradient-card-component";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const API_URL = import.meta.env.VITE_API_URL || "";

interface SearchState {
  results: SoapCategory[];
  loading: boolean;
  error: string;
}

type SearchAction =
  | { type: "start" }
  | { type: "success"; results: SoapCategory[] }
  | { type: "failure"; error: string };

function searchReducer(_state: SearchState, action: SearchAction): SearchState {
  switch (action.type) {
    case "start":   return { results: [], loading: true, error: "" };
    case "success": return { results: action.results, loading: false, error: "" };
    case "failure": return { results: [], loading: false, error: action.error };
  }
}

export default function Task2Page() {
  const [term, setTerm] = useState("");
  const [generateMsg, setGenerateMsg] = useState("");
  const [generateError, setGenerateError] = useState(false);
  const [search, dispatch] = useReducer(searchReducer, { results: [], loading: false, error: "" });

  const handleGenerateXml = async () => {
    setGenerateMsg("");
    setGenerateError(false);
    try {
      const res = await fetch(`${API_URL}/api/generate-xml`);
      const data = await res.json();
      setGenerateMsg(data.message || "XML generated successfully");
    } catch {
      setGenerateMsg("Failed to generate XML");
      setGenerateError(true);
    }
  };

  const handleSearch = async (e: React.BaseSyntheticEvent) => {
    e.preventDefault();
    dispatch({ type: "start" });
    try {
      const cats = await searchCategoriesSoap(term);
      dispatch({ type: "success", results: cats });
    } catch (err) {
      dispatch({ type: "failure", error: err instanceof Error ? err.message : "SOAP search failed" });
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 lg:p-8">
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold">Task 2 — SOAP Search</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Generate XML from the database, then search categories using SOAP with XPath filtering.
          </p>
        </div>
        <Button variant="outline" onClick={handleGenerateXml} className="h-10 px-5">
          Generate XML
        </Button>
      </div>

      {generateMsg && (
        <div
          className={
            generateError
              ? "rounded-lg bg-destructive/10 border border-destructive/20 p-4 text-destructive mb-5"
              : "rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-4 text-emerald-400 mb-5"
          }
        >
          {generateMsg}
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
          <Button type="submit" disabled={search.loading} className="h-10 px-5">
            {search.loading ? "Searching..." : "Search via SOAP"}
          </Button>
        </form>

        {search.error && (
          <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-4 text-destructive mt-4">
            {search.error}
          </div>
        )}
      </GradientCard>

      {/* Results */}
      {search.results.length > 0 && (
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
              {search.results.map((cat) => (
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

      {search.results.length === 0 && !search.loading && !search.error && (
        <div className="bg-card border border-border rounded-xl p-6 mt-5">
          <p className="text-muted-foreground text-center text-sm">
            Enter a search term above to query categories via SOAP.
          </p>
        </div>
      )}
    </div>
  );
}
