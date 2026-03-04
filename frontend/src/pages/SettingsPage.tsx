import { useState, useEffect } from "react";

const API_URL = import.meta.env.VITE_API_URL || "";

export default function SettingsPage() {
  const [useCustomApi, setUseCustomApi] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch(`${API_URL}/api/settings`)
      .then((res) => res.json())
      .then((data) => {
        setUseCustomApi(data.useCustomApi);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleToggle = async () => {
    setSaving(true);
    try {
      const res = await fetch(`${API_URL}/api/settings`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ useCustomApi: !useCustomApi }),
      });
      const data = await res.json();
      setUseCustomApi(data.useCustomApi);
    } catch {
      // ignore
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p>Loading settings...</p>;

  return (
    <div>
      <h1>Settings</h1>
      <p style={{ color: "#666", marginBottom: 20 }}>
        Toggle between Custom API (local database) and Strapi proxy.
      </p>

      <div style={cardStyle}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <label style={{ fontSize: 16, fontWeight: "bold" }}>API Source:</label>
          <button
            onClick={handleToggle}
            disabled={saving}
            style={{
              padding: "10px 20px",
              background: useCustomApi ? "#4caf50" : "#ff9800",
              color: "#fff",
              border: "none",
              borderRadius: 4,
              cursor: "pointer",
              fontSize: 14,
            }}
          >
            {saving ? "Saving..." : useCustomApi ? "Custom API (Local DB)" : "Strapi Proxy"}
          </button>
        </div>

        <div
          style={{
            marginTop: 16,
            padding: 12,
            background: "#f5f5f5",
            borderRadius: 4,
            fontSize: 14,
          }}
        >
          <strong>Current mode:</strong>{" "}
          {useCustomApi ? (
            <span style={{ color: "#4caf50" }}>
              Custom API — serving categories from local SQLite database
            </span>
          ) : (
            <span style={{ color: "#ff9800" }}>
              Strapi Proxy — proxying GET /api/categories to Strapi at localhost:1337
            </span>
          )}
        </div>

        <div style={{ marginTop: 16, fontSize: 13, color: "#666" }}>
          <p>
            When <strong>USE_CUSTOM_API=true</strong> (default): All CRUD operations work with the
            local SQLite database via Prisma.
          </p>
          <p>
            When <strong>USE_CUSTOM_API=false</strong>: GET /api/categories proxies to Strapi REST
            API at the configured STRAPI_URL. Write operations still require the custom API.
          </p>
        </div>
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
