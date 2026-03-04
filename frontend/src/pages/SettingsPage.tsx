import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";

const API_URL = import.meta.env.VITE_API_URL || "";

export default function SettingsPage() {
  const { role } = useAuth();
  const isReadOnly = role === "read-only";
  const [useCustomApi, setUseCustomApi] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    fetch(`${API_URL}/api/settings`, { signal: controller.signal })
      .then((res) => res.json())
      .then((data) => {
        setUseCustomApi(data.useCustomApi);
        setLoading(false);
      })
      .catch((err) => {
        if (err.name !== "AbortError") setLoading(false);
      });
    return () => controller.abort();
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

  if (loading) {
    return (
      <div className="page">
        <p style={{ color: "var(--text-muted)" }}>Loading settings...</p>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Settings</h1>
          <p className="page-subtitle">
            Toggle between Custom API (local database) and Strapi proxy.
          </p>
        </div>
      </div>

      {/* API Source Card */}
      <div className="card" style={{ marginBottom: 16 }}>
        <h2
          style={{
            fontSize: 13,
            fontWeight: 600,
            color: "var(--text-secondary)",
            textTransform: "uppercase",
            letterSpacing: "0.06em",
            marginBottom: 20,
          }}
        >
          API Source Configuration
        </h2>

        {/* Toggle row */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "16px 0",
            borderTop: "1px solid var(--border)",
            borderBottom: "1px solid var(--border)",
          }}
        >
          <div>
            <p style={{ fontWeight: 600, fontSize: 14, color: "var(--text-primary)", marginBottom: 4 }}>
              Use Custom API
            </p>
            <p style={{ color: "var(--text-muted)", fontSize: 13 }}>
              {useCustomApi
                ? "Serving categories from local SQLite database via Prisma"
                : "Proxying GET /api/categories to Strapi at localhost:1337"}
            </p>
          </div>

          <label className="toggle-switch" style={{ marginLeft: 24 }}>
            <input
              type="checkbox"
              checked={useCustomApi}
              onChange={handleToggle}
              disabled={saving || isReadOnly}
            />
            <span className="toggle-track" />
          </label>
        </div>

        {/* Status */}
        <div style={{ marginTop: 16, display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ color: "var(--text-muted)", fontSize: 13 }}>Current mode:</span>
          <span className={useCustomApi ? "badge-success" : "badge-warning"}>
            {useCustomApi ? "Custom API" : "Strapi Proxy"}
          </span>
          {saving && (
            <span style={{ color: "var(--text-muted)", fontSize: 12 }}>Saving...</span>
          )}
        </div>
      </div>

      {/* Info Card */}
      <div className="card">
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
          About API Modes
        </h2>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div
            style={{
              padding: 14,
              background: "var(--bg-input)",
              borderRadius: 4,
              borderLeft: "3px solid var(--success)",
            }}
          >
            <p style={{ fontWeight: 600, fontSize: 13, marginBottom: 4, color: "var(--text-primary)" }}>
              USE_CUSTOM_API=true (default)
            </p>
            <p style={{ color: "var(--text-muted)", fontSize: 13 }}>
              All CRUD operations work with the local SQLite database via Prisma.
            </p>
          </div>
          <div
            style={{
              padding: 14,
              background: "var(--bg-input)",
              borderRadius: 4,
              borderLeft: "3px solid var(--warning)",
            }}
          >
            <p style={{ fontWeight: 600, fontSize: 13, marginBottom: 4, color: "var(--text-primary)" }}>
              USE_CUSTOM_API=false
            </p>
            <p style={{ color: "var(--text-muted)", fontSize: 13 }}>
              GET /api/categories proxies to Strapi REST API at the configured STRAPI_URL. Write
              operations still use the custom API.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
