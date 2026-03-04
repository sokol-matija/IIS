import { useState, useRef, type FormEvent } from "react";

const API_URL = import.meta.env.VITE_API_URL || "";

export default function Task1Page() {
  const [result, setResult] = useState<{ data?: unknown; errors?: string[] } | null>(null);
  const [loading, setLoading] = useState(false);
  const xmlRef = useRef<HTMLInputElement>(null);
  const jsonRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setResult(null);
    setLoading(true);

    const formData = new FormData();
    if (xmlRef.current?.files?.[0]) {
      formData.append("xmlFile", xmlRef.current.files[0]);
    }
    if (jsonRef.current?.files?.[0]) {
      formData.append("jsonFile", jsonRef.current.files[0]);
    }

    try {
      const res = await fetch(`${API_URL}/api/upload`, {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      setResult(data);
    } catch (err) {
      setResult({ errors: [err instanceof Error ? err.message : "Upload failed"] });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1>Task 1 - REST Upload + XML/JSON Validation</h1>
      <p style={{ color: "#666", marginBottom: 20 }}>
        Upload an XML file (validated against category.xsd) and a JSON file (validated against
        category.schema.json). On success, the category is saved to the database.
      </p>

      <form onSubmit={handleSubmit} style={formStyle}>
        <div style={{ marginBottom: 16 }}>
          <label style={labelStyle}>XML File (category.xml):</label>
          <input type="file" ref={xmlRef} accept=".xml" style={{ fontSize: 14 }} />
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={labelStyle}>JSON File (category.json):</label>
          <input type="file" ref={jsonRef} accept=".json" style={{ fontSize: 14 }} />
        </div>

        <button type="submit" disabled={loading} style={btnStyle}>
          {loading ? "Uploading..." : "Upload & Validate"}
        </button>
      </form>

      {result && (
        <div style={{ marginTop: 20 }}>
          {result.errors && result.errors.length > 0 ? (
            <div style={errorBoxStyle}>
              <strong>Validation Errors:</strong>
              <ul style={{ margin: "8px 0 0", paddingLeft: 20 }}>
                {result.errors.map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
              </ul>
            </div>
          ) : (
            <div style={successBoxStyle}>
              <strong>Success! Category saved:</strong>
              <pre style={{ marginTop: 8 }}>{JSON.stringify(result.data, null, 2)}</pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const formStyle: React.CSSProperties = {
  background: "#fff",
  padding: 24,
  borderRadius: 8,
  boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
};

const labelStyle: React.CSSProperties = {
  display: "block",
  marginBottom: 6,
  fontWeight: "bold",
  fontSize: 14,
};

const btnStyle: React.CSSProperties = {
  padding: "10px 24px",
  background: "#0f3460",
  color: "#fff",
  border: "none",
  borderRadius: 4,
  fontSize: 14,
  cursor: "pointer",
};

const errorBoxStyle: React.CSSProperties = {
  background: "#fdecea",
  color: "#c62828",
  padding: 16,
  borderRadius: 4,
  fontSize: 14,
};

const successBoxStyle: React.CSSProperties = {
  background: "#e8f5e9",
  color: "#2e7d32",
  padding: 16,
  borderRadius: 4,
  fontSize: 14,
};
