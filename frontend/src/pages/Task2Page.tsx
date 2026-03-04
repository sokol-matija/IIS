import { useState, type FormEvent } from "react";
import { searchCategoriesSoap, type SoapCategory } from "../api/soap";

const API_URL = import.meta.env.VITE_API_URL || "";

export default function Task2Page() {
  const [term, setTerm] = useState("");
  const [results, setResults] = useState<SoapCategory[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [generateMsg, setGenerateMsg] = useState("");
  const [generateError, setGenerateError] = useState(false);

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

  const handleSearch = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const cats = await searchCategoriesSoap(term);
      setResults(cats);
    } catch (err) {
      setError(err instanceof Error ? err.message : "SOAP search failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Task 2 — SOAP Search</h1>
          <p className="page-subtitle">
            Generate XML from the database, then search categories using SOAP with XPath filtering.
          </p>
        </div>
        <button
          onClick={handleGenerateXml}
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

      {/* Search Card */}
      <div className="card" style={{ marginBottom: 20 }}>
        <h2
          style={{
            fontSize: 13,
            fontWeight: 600,
            color: "var(--text-secondary)",
            textTransform: "uppercase",
            letterSpacing: "0.06em",
            marginBottom: 16,
          }}
        >
          SOAP Search
        </h2>
        <form onSubmit={handleSearch} style={{ display: "flex", gap: 12 }}>
          <input
            type="text"
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            placeholder="Search term (e.g. 'electr')"
            className="input"
            style={{ flex: 1 }}
          />
          <button
            type="submit"
            disabled={loading}
            className="btn-primary"
            style={{ height: 40, padding: "0 20px" }}
          >
            {loading ? "Searching..." : "Search via SOAP"}
          </button>
        </form>

        {error && (
          <div className="alert-error" style={{ marginTop: 16 }}>
            {error}
          </div>
        )}
      </div>

      {/* Results */}
      {results.length > 0 && (
        <div
          style={{
            border: "1px solid var(--border)",
            borderRadius: 4,
            overflow: "hidden",
          }}
        >
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr
                style={{
                  background: "var(--bg-card)",
                  borderBottom: "1px solid var(--border)",
                }}
              >
                <th style={thStyle}>ID</th>
                <th style={thStyle}>Name</th>
                <th style={thStyle}>Slug</th>
                <th style={thStyle}>Description</th>
              </tr>
            </thead>
            <tbody>
              {results.map((cat) => (
                <tr
                  key={cat.id ?? cat.slug}
                  style={{
                    borderBottom: "1px solid var(--border)",
                    background: "var(--bg-card)",
                    transition: "background 0.1s",
                  }}
                  onMouseEnter={(e) =>
                    ((e.currentTarget as HTMLTableRowElement).style.background =
                      "var(--bg-hover)")
                  }
                  onMouseLeave={(e) =>
                    ((e.currentTarget as HTMLTableRowElement).style.background =
                      "var(--bg-card)")
                  }
                >
                  <td style={tdStyle}>{cat.id}</td>
                  <td style={{ ...tdStyle, fontWeight: 500 }}>{cat.name}</td>
                  <td style={tdStyle}>
                    <code
                      style={{
                        background: "var(--bg-input)",
                        borderRadius: 3,
                        padding: "2px 6px",
                        fontSize: 12,
                        color: "var(--text-secondary)",
                      }}
                    >
                      {cat.slug}
                    </code>
                  </td>
                  <td style={{ ...tdStyle, color: "var(--text-secondary)" }}>
                    {cat.description || "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {results.length === 0 && !loading && !error && (
        <div className="card">
          <p style={{ color: "var(--text-muted)", textAlign: "center", fontSize: 14 }}>
            Enter a search term above to query categories via SOAP.
          </p>
        </div>
      )}
    </div>
  );
}

const thStyle: React.CSSProperties = {
  padding: "10px 16px",
  textAlign: "left",
  fontSize: 11,
  fontWeight: 600,
  textTransform: "uppercase",
  letterSpacing: "0.06em",
  color: "var(--text-muted)",
};

const tdStyle: React.CSSProperties = {
  padding: "0 16px",
  fontSize: 14,
  height: 48,
  verticalAlign: "middle",
  color: "var(--text-primary)",
};
