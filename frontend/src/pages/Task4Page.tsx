import { useState, type FormEvent } from "react";

const API_URL = import.meta.env.VITE_API_URL || "";

interface WeatherStation {
  city: string;
  temperature: string;
  description: string;
}

export default function Task4Page() {
  const [city, setCity] = useState("");
  const [stations, setStations] = useState<WeatherStation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSearch = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setStations([]);
    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/api/weather?city=${encodeURIComponent(city)}`);
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Request failed");
      }
      const data = await res.json();
      setStations(data.stations || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch weather");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1>Task 4 - gRPC Weather Service</h1>
      <p style={{ color: "#666", marginBottom: 20 }}>
        Search for weather data from Croatian weather stations via gRPC. The backend proxies the
        gRPC call to the weather server which fetches data from vrijeme.hr.
      </p>

      <div style={cardStyle}>
        <form onSubmit={handleSearch} style={{ display: "flex", gap: 8, marginBottom: 20 }}>
          <input
            type="text"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="City name (e.g. Zagreb)"
            style={{ flex: 1, padding: 8, border: "1px solid #ddd", borderRadius: 4 }}
          />
          <button type="submit" disabled={loading} style={btnStyle}>
            {loading ? "Searching..." : "Get Temperature"}
          </button>
        </form>

        {error && <div style={{ color: "#c62828", marginBottom: 12 }}>{error}</div>}

        {stations.length > 0 && (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#1a1a2e", color: "#fff" }}>
                <th style={thStyle}>City</th>
                <th style={thStyle}>Temperature</th>
                <th style={thStyle}>Description</th>
              </tr>
            </thead>
            <tbody>
              {stations.map((s, i) => (
                <tr key={i} style={{ borderBottom: "1px solid #eee" }}>
                  <td style={tdStyle}>{s.city}</td>
                  <td style={tdStyle}>{s.temperature} C</td>
                  <td style={tdStyle}>{s.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {stations.length === 0 && !loading && !error && (
          <p style={{ color: "#999", fontSize: 14 }}>Enter a city name to search.</p>
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

const thStyle: React.CSSProperties = { padding: "8px 12px", textAlign: "left", fontSize: 13 };
const tdStyle: React.CSSProperties = { padding: "8px 12px", fontSize: 13 };
