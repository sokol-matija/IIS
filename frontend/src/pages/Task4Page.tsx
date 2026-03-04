import { useState, type FormEvent } from "react";

const API_URL = import.meta.env.VITE_API_URL || "";

interface WeatherStation {
  city: string;
  temperature: string;
  description: string;
}

function TempBadge({ temp }: { temp: string }) {
  const num = parseFloat(temp);
  let className = "badge-warning";
  if (!isNaN(num)) {
    if (num <= 5) className = "badge-error";
    else if (num >= 25) className = "badge-success";
  }
  return (
    <span className={className}>
      {temp} °C
    </span>
  );
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
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Task 4 — Weather / gRPC</h1>
          <p className="page-subtitle">
            Search for weather data from Croatian weather stations via gRPC.
          </p>
        </div>
      </div>

      {/* Search Card */}
      <div className="card" style={{ marginBottom: 24 }}>
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
          Station Search
        </h2>
        <form onSubmit={handleSearch} style={{ display: "flex", gap: 12 }}>
          <input
            type="text"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="City name (e.g. Zagreb)"
            className="input"
            style={{ flex: 1 }}
          />
          <button
            type="submit"
            disabled={loading}
            className="btn-primary"
            style={{ height: 40, padding: "0 20px" }}
          >
            {loading ? "Searching..." : "Get Temperature"}
          </button>
        </form>

        {error && (
          <div className="alert-error" style={{ marginTop: 16 }}>
            {error}
          </div>
        )}
      </div>

      {/* Results Grid */}
      {stations.length > 0 && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
            gap: 16,
          }}
        >
          {stations.map((s) => (
            <div
              key={s.city}
              className="card"
              style={{ padding: 20 }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: 10,
                }}
              >
                <span
                  style={{
                    fontWeight: 600,
                    fontSize: 15,
                    color: "var(--text-primary)",
                  }}
                >
                  {s.city}
                </span>
                <TempBadge temp={s.temperature} />
              </div>
              <p
                style={{
                  color: "var(--text-muted)",
                  fontSize: 13,
                  margin: 0,
                }}
              >
                {s.description || "—"}
              </p>
            </div>
          ))}
        </div>
      )}

      {stations.length === 0 && !loading && !error && (
        <div className="card">
          <p style={{ color: "var(--text-muted)", textAlign: "center", fontSize: 14 }}>
            Enter a city name to search weather stations.
          </p>
        </div>
      )}
    </div>
  );
}
