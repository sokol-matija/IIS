import { useState, type FormEvent } from "react";
import { searchCategoriesSoap, type SoapCategory } from "../api/soap";

const API_URL = import.meta.env.VITE_API_URL || "";

export default function Task2Page() {
  const [term, setTerm] = useState("");
  const [results, setResults] = useState<SoapCategory[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [generateMsg, setGenerateMsg] = useState("");

  const handleGenerateXml = async () => {
    setGenerateMsg("");
    try {
      const res = await fetch(`${API_URL}/api/generate-xml`);
      const data = await res.json();
      setGenerateMsg(data.message || "XML generated");
    } catch {
      setGenerateMsg("Failed to generate XML");
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
    <div>
      <h1>Task 2 - SOAP Interface + XPath Filtering</h1>
      <p style={{ color: "#666", marginBottom: 20 }}>
        First generate the XML from the database, then search categories using SOAP with XPath
        filtering.
      </p>

      <div style={cardStyle}>
        <h3 style={{ marginTop: 0 }}>Step 1: Generate XML</h3>
        <button onClick={handleGenerateXml} style={btnStyle}>
          Generate categories.xml
        </button>
        {generateMsg && (
          <span style={{ marginLeft: 12, color: "#2e7d32" }}>{generateMsg}</span>
        )}
      </div>

      <div style={{ ...cardStyle, marginTop: 16 }}>
        <h3 style={{ marginTop: 0 }}>Step 2: SOAP Search</h3>
        <form onSubmit={handleSearch} style={{ display: "flex", gap: 8, marginBottom: 16 }}>
          <input
            type="text"
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            placeholder="Search term (e.g. 'electr')"
            style={{ flex: 1, padding: 8, border: "1px solid #ddd", borderRadius: 4 }}
          />
          <button type="submit" disabled={loading} style={btnStyle}>
            {loading ? "Searching..." : "Search via SOAP"}
          </button>
        </form>

        {error && <div style={{ color: "#c62828", marginBottom: 12 }}>{error}</div>}

        {results.length > 0 && (
          <table style={tableStyle}>
            <thead>
              <tr style={{ background: "#1a1a2e", color: "#fff" }}>
                <th style={thStyle}>ID</th>
                <th style={thStyle}>Name</th>
                <th style={thStyle}>Slug</th>
                <th style={thStyle}>Description</th>
              </tr>
            </thead>
            <tbody>
              {results.map((cat, i) => (
                <tr key={i} style={{ borderBottom: "1px solid #eee" }}>
                  <td style={tdStyle}>{cat.id}</td>
                  <td style={tdStyle}>{cat.name}</td>
                  <td style={tdStyle}>{cat.slug}</td>
                  <td style={tdStyle}>{cat.description || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {results.length === 0 && !loading && !error && (
          <p style={{ color: "#999", fontSize: 14 }}>No results yet. Enter a term and search.</p>
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
  padding: "8px 16px",
  background: "#0f3460",
  color: "#fff",
  border: "none",
  borderRadius: 4,
  cursor: "pointer",
};

const tableStyle: React.CSSProperties = {
  width: "100%",
  borderCollapse: "collapse",
};

const thStyle: React.CSSProperties = { padding: "8px 12px", textAlign: "left", fontSize: 13 };
const tdStyle: React.CSSProperties = { padding: "8px 12px", fontSize: 13 };
