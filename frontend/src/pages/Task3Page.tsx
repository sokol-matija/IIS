import { useState } from "react";

const API_URL = import.meta.env.VITE_API_URL || "";

export default function Task3Page() {
  const [result, setResult] = useState<{ valid: boolean; errors: string[] } | null>(null);
  const [loading, setLoading] = useState(false);
  const [generateMsg, setGenerateMsg] = useState("");

  const handleGenerate = async () => {
    setGenerateMsg("");
    try {
      const res = await fetch(`${API_URL}/api/generate-xml`);
      const data = await res.json();
      setGenerateMsg(data.message || "XML generated");
    } catch {
      setGenerateMsg("Failed to generate XML");
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
    <div>
      <h1>Task 3 - XML Schema Validation</h1>
      <p style={{ color: "#666", marginBottom: 20 }}>
        Validate the generated categories.xml against the category.xsd schema.
      </p>

      <div style={cardStyle}>
        <div style={{ display: "flex", gap: 12, marginBottom: 20 }}>
          <button onClick={handleGenerate} style={btnStyle}>
            Generate XML
          </button>
          <button onClick={handleValidate} disabled={loading} style={btnStyle}>
            {loading ? "Validating..." : "Validate XML"}
          </button>
        </div>

        {generateMsg && (
          <div style={{ color: "#2e7d32", marginBottom: 12 }}>{generateMsg}</div>
        )}

        {result && (
          <div
            style={{
              padding: 16,
              borderRadius: 4,
              background: result.valid ? "#e8f5e9" : "#fdecea",
              color: result.valid ? "#2e7d32" : "#c62828",
            }}
          >
            <strong>
              {result.valid ? "XML is valid!" : "XML validation failed"}
            </strong>
            {result.errors.length > 0 && (
              <ul style={{ margin: "8px 0 0", paddingLeft: 20 }}>
                {result.errors.map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

const cardStyle: React.CSSProperties = {
  background: "#fff",
  padding: 24,
  borderRadius: 8,
  boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
};

const btnStyle: React.CSSProperties = {
  padding: "10px 20px",
  background: "#0f3460",
  color: "#fff",
  border: "none",
  borderRadius: 4,
  cursor: "pointer",
};
