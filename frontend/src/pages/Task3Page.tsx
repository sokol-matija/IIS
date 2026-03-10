import { useState } from "react";
import { GradientCard } from "@msokol/gradient-card-component";
import { Button } from "@/components/ui/button";

const API_URL = import.meta.env.VITE_API_URL || "";

export default function Task3Page() {
  const [result, setResult] = useState<{ valid: boolean; errors: string[] } | null>(null);
  const [loading, setLoading] = useState(false);
  const [generateMsg, setGenerateMsg] = useState("");
  const [generateError, setGenerateError] = useState(false);

  const handleGenerate = async () => {
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

  const handleValidate = async () => {
    setResult(null);
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/validate-xml`);
      const data = await res.json();
      setResult(data);
    } catch {
      setResult({ valid: false, errors: ["Failed to contact server"] });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 lg:p-8">
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold">Task 3 — XML Validation</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Validate the generated categories.xml against the category.xsd schema.
          </p>
        </div>
        <Button variant="outline" onClick={handleGenerate} className="h-10 px-5">
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

      <GradientCard
        variant="mint"
        title="XSD Validation"
        description="Validate categories.xml against category.xsd schema"
      >
        <div className="mt-4">
          <Button
            onClick={handleValidate}
            disabled={loading}
            className="h-10 px-7 text-sm"
          >
            {loading ? "Validating..." : "Run Validation"}
          </Button>

          {result && (
            <div className="mt-6">
              {result.valid ? (
                <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-4 text-emerald-400">
                  <strong>XML is valid</strong> — The document conforms to the XSD schema.
                </div>
              ) : (
                <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-4 text-destructive">
                  <div className={result.errors.length > 0 ? "mb-2" : ""}>
                    <strong>XML validation failed</strong>
                  </div>
                  {result.errors.length > 0 && (
                    <ul className="pl-5 m-0 mt-2 list-disc">
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
  );
}
