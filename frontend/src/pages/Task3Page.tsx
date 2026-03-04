import { useState } from "react";

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
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Task 3 — XML Validation</h1>
          <p className="page-subtitle">
            Validate the generated categories.xml against the category.xsd schema.
          </p>
        </div>
        <button
          onClick={handleGenerate}
          className="btn-secondary"
          style={{ height: 40, padding: "0 20px" }}
        >
          Generate XML
        </button>
      </div>

      {generateMsg && (
        <div
          className={generateError ? "alert-error" : "alert-success"}
          style={{ marginBottom: 20 }}
        >
          {generateMsg}
        </div>
      )}

      <div className="card">
        <h2
          style={{
            fontSize: 13,
            fontWeight: 600,
            color: "var(--text-secondary)",
            textTransform: "uppercase",
            letterSpacing: "0.06em",
            marginBottom: 8,
          }}
        >
          XSD Validation
        </h2>
        <p style={{ color: "var(--text-muted)", fontSize: 13, marginBottom: 24 }}>
          Validate <code style={{ color: "var(--accent)" }}>categories.xml</code> against{" "}
          <code style={{ color: "var(--accent)" }}>category.xsd</code> schema.
        </p>

        <button
          onClick={handleValidate}
          disabled={loading}
          className="btn-primary"
          style={{ height: 40, padding: "0 28px", fontSize: 14 }}
        >
          {loading ? "Validating..." : "Run Validation"}
        </button>

        {result && (
          <div style={{ marginTop: 24 }}>
            {result.valid ? (
              <div className="alert-success">
                <span style={{ fontSize: 16, marginRight: 8 }}>✅</span>
                <strong>XML is valid</strong> — The document conforms to the XSD schema.
              </div>
            ) : (
              <div className="alert-error">
                <div style={{ marginBottom: result.errors.length > 0 ? 8 : 0 }}>
                  <span style={{ fontSize: 16, marginRight: 8 }}>❌</span>
                  <strong>XML validation failed</strong>
                </div>
                {result.errors.length > 0 && (
                  <ul style={{ paddingLeft: 20, margin: 0, marginTop: 8 }}>
                    {result.errors.map((err, i) => (
                      <li key={i} style={{ marginBottom: 4 }}>
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
    </div>
  );
}
