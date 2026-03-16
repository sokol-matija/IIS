import React, { useState, useRef, type ChangeEvent } from "react";
import { useMutation } from "@tanstack/react-query";
import { useAuthStore as useAuth } from "../store/authStore";
import { GradientCard } from "@msokol/gradient-card-component";
import { Button } from "@/components/ui/button";
import { FileText, FileJson } from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL || "";

export default function Task1Page() {
  const { role } = useAuth();
  const isReadOnly = role === "read-only";
  const [xmlFileName, setXmlFileName] = useState<string | null>(null);
  const [jsonFileName, setJsonFileName] = useState<string | null>(null);
  const xmlRef = useRef<HTMLInputElement>(null);
  const jsonRef = useRef<HTMLInputElement>(null);

  const uploadMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const res = await fetch(`${API_URL}/api/upload`, {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      return data as { data?: unknown; errors?: string[] };
    },
  });

  const handleXmlChange = (e: ChangeEvent<HTMLInputElement>) => {
    setXmlFileName(e.target.files?.[0]?.name ?? null);
  };

  const handleJsonChange = (e: ChangeEvent<HTMLInputElement>) => {
    setJsonFileName(e.target.files?.[0]?.name ?? null);
  };

  const handleSubmit = (e: React.BaseSyntheticEvent) => {
    e.preventDefault();
    const formData = new FormData();
    if (xmlRef.current?.files?.[0]) {
      formData.append("xmlFile", xmlRef.current.files[0]);
    }
    if (jsonRef.current?.files?.[0]) {
      formData.append("jsonFile", jsonRef.current.files[0]);
    }
    uploadMutation.mutate(formData);
  };

  const result = uploadMutation.data ?? null;
  const loading = uploadMutation.isPending;

  // If there was a network error (thrown), surface it as an errors array
  const networkError = uploadMutation.error instanceof Error
    ? uploadMutation.error.message
    : null;

  return (
    <div className="flex-1 overflow-y-auto p-6 lg:p-8">
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold">Task 1 — XML &amp; JSON Upload</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Upload an XML file (validated against category.xsd) and a JSON file (validated against
            category.schema.json). On success, the category is saved to the database.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-2 gap-4 mb-6">
          {/* XML Card */}
          <GradientCard variant="lavender" title="XML File">
            <label
              className="border-2 border-dashed border-border rounded-xl p-8 text-center cursor-pointer transition-colors hover:border-primary hover:bg-primary/5 block mb-3 mt-2"
              htmlFor="xml-upload"
            >
              <div className="mb-2 flex justify-center">
                <FileText size={28} className="opacity-60" />
              </div>
              <p className="text-sm text-muted-foreground mb-1">
                {xmlFileName ? (
                  <span className="text-primary">{xmlFileName}</span>
                ) : (
                  "Click to select XML file"
                )}
              </p>
              <p className="text-[11px] text-muted-foreground">category.xml</p>
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
              className="border-2 border-dashed border-border rounded-xl p-8 text-center cursor-pointer transition-colors hover:border-primary hover:bg-primary/5 block mb-3 mt-2"
              htmlFor="json-upload"
            >
              <div className="mb-2 flex justify-center">
                <FileJson size={28} className="opacity-60" />
              </div>
              <p className="text-sm text-muted-foreground mb-1">
                {jsonFileName ? (
                  <span className="text-primary">{jsonFileName}</span>
                ) : (
                  "Click to select JSON file"
                )}
              </p>
              <p className="text-[11px] text-muted-foreground">category.json</p>
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

        <Button
          type="submit"
          disabled={loading || isReadOnly}
          className="h-10 px-6"
        >
          {loading ? "Uploading..." : isReadOnly ? "Read-Only — Upload Disabled" : "Upload & Validate"}
        </Button>
      </form>

      {networkError && (
        <div className="mt-6 rounded-lg bg-destructive/10 border border-destructive/20 p-5 text-destructive">
          <p className="font-semibold mb-2">Validation Errors</p>
          <ul className="pl-5 m-0 list-disc">
            <li className="mb-1">{networkError}</li>
          </ul>
        </div>
      )}

      {result && (
        <div className="mt-6">
          {result.errors && result.errors.length > 0 ? (
            <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-5 text-destructive">
              <p className="font-semibold mb-2">Validation Errors</p>
              <ul className="pl-5 m-0 list-disc">
                {result.errors.map((err) => (
                  <li key={err} className="mb-1">
                    {err}
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-5 text-emerald-400">
              <p className="font-semibold mb-2">Category saved successfully</p>
              <pre className="rounded-lg bg-muted/50 border p-4 font-mono text-xs text-cyan-300 overflow-auto max-h-96 mt-3">
                {JSON.stringify(result.data, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
