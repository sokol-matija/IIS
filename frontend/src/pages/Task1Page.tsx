import { useState, useRef, type FormEvent, type ChangeEvent } from "react";

const API_URL = import.meta.env.VITE_API_URL || "";

export default function Task1Page() {
  const [result, setResult] = useState<{ data?: unknown; errors?: string[] } | null>(null);
  const [loading, setLoading] = useState(false);
  const [xmlFileName, setXmlFileName] = useState<string | null>(null);
  const [jsonFileName, setJsonFileName] = useState<string | null>(null);
  const xmlRef = useRef<HTMLInputElement>(null);
  const jsonRef = useRef<HTMLInputElement>(null);

  const handleXmlChange = (e: ChangeEvent<HTMLInputElement>) => {
    setXmlFileName(e.target.files?.[0]?.name ?? null);
  };

  const handleJsonChange = (e: ChangeEvent<HTMLInputElement>) => {
    setJsonFileName(e.target.files?.[0]?.name ?? null);
  };

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
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Task 1 — XML &amp; JSON Upload</h1>
          <p className="page-subtitle">
            Upload an XML file (validated against category.xsd) and a JSON file (validated against
            category.schema.json). On success, the category is saved to the database.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 16,
            marginBottom: 24,
          }}
        >
          {/* XML Card */}
          <div className="card">
            <h3
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: "var(--text-secondary)",
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                marginBottom: 16,
              }}
            >
              XML File
            </h3>
            <label
              className="upload-zone"
              htmlFor="xml-upload"
              style={{ cursor: "pointer", marginBottom: 12 }}
            >
              <div style={{ fontSize: 28, marginBottom: 8 }}>📄</div>
              <p style={{ color: "var(--text-secondary)", fontSize: 13, marginBottom: 4 }}>
                {xmlFileName ? (
                  <span style={{ color: "var(--accent)" }}>{xmlFileName}</span>
                ) : (
                  "Click to select XML file"
                )}
              </p>
              <p style={{ color: "var(--text-muted)", fontSize: 11 }}>category.xml</p>
              <input
                id="xml-upload"
                type="file"
                ref={xmlRef}
                accept=".xml"
                onChange={handleXmlChange}
              />
            </label>
          </div>

          {/* JSON Card */}
          <div className="card">
            <h3
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: "var(--text-secondary)",
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                marginBottom: 16,
              }}
            >
              JSON File
            </h3>
            <label
              className="upload-zone"
              htmlFor="json-upload"
              style={{ cursor: "pointer", marginBottom: 12 }}
            >
              <div style={{ fontSize: 28, marginBottom: 8 }}>📋</div>
              <p style={{ color: "var(--text-secondary)", fontSize: 13, marginBottom: 4 }}>
                {jsonFileName ? (
                  <span style={{ color: "var(--accent)" }}>{jsonFileName}</span>
                ) : (
                  "Click to select JSON file"
                )}
              </p>
              <p style={{ color: "var(--text-muted)", fontSize: 11 }}>category.json</p>
              <input
                id="json-upload"
                type="file"
                ref={jsonRef}
                accept=".json"
                onChange={handleJsonChange}
              />
            </label>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="btn-primary"
          style={{ height: 40, padding: "0 24px" }}
        >
          {loading ? "Uploading..." : "Upload & Validate"}
        </button>
      </form>

      {result && (
        <div style={{ marginTop: 24 }}>
          {result.errors && result.errors.length > 0 ? (
            <div className="card alert-error" style={{ padding: 20 }}>
              <p style={{ fontWeight: 600, marginBottom: 8 }}>Validation Errors</p>
              <ul style={{ paddingLeft: 20, margin: 0 }}>
                {result.errors.map((err, i) => (
                  <li key={i} style={{ marginBottom: 4 }}>
                    {err}
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <div className="card alert-success" style={{ padding: 20 }}>
              <p style={{ fontWeight: 600, marginBottom: 8 }}>Category saved successfully</p>
              <pre className="json-viewer" style={{ marginTop: 0 }}>
                {JSON.stringify(result.data, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
