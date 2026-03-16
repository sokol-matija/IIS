import { useMutation } from "@tanstack/react-query";
import { GradientCard } from "@msokol/gradient-card-component";
import { Button } from "@/components/ui/button";

const API_URL = import.meta.env.VITE_API_URL || "";

export default function Task3Page() {
  const generateMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`${API_URL}/api/generate-xml`);
      const data = await res.json();
      return (data.message as string) || "XML generated successfully";
    },
  });

  const validateMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`${API_URL}/api/validate-xml`).catch(() => {
        throw new Error("Failed to contact server");
      });
      if (!res.ok) throw new Error("Failed to contact server");
      const data = await res.json();
      return data as { valid: boolean; errors: string[] };
    },
  });

  const generateMsg = generateMutation.data ?? "";
  const generateError = !!generateMutation.error;

  const result = validateMutation.data ?? null;
  const validateError = validateMutation.error
    ? validateMutation.error instanceof Error
      ? validateMutation.error.message
      : "Failed to contact server"
    : null;

  return (
    <div className="flex-1 overflow-y-auto p-6 lg:p-8">
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold">Task 3 — XML Validation</h1>
          <p className="text-sm text-muted-foreground mt-1">
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
            <div className="mt-6 rounded-lg bg-destructive/10 border border-destructive/20 p-4 text-destructive">
              {validateError}
            </div>
          )}

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
