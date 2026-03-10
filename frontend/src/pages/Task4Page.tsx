import React from "react";
import { useState } from "react";
import { GradientCard } from "@msokol/gradient-card-component";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const API_URL = import.meta.env.VITE_API_URL || "";

interface WeatherStation {
  city: string;
  temperature: string;
  description: string;
}

function TempBadge({ temp }: { temp: string }) {
  const num = parseFloat(temp);
  let variant: "warning" | "destructive" | "success" = "warning";
  if (!isNaN(num)) {
    if (num <= 5) variant = "destructive";
    else if (num >= 25) variant = "success";
  }
  return (
    <Badge variant={variant}>
      {temp} °C
    </Badge>
  );
}

export default function Task4Page() {
  const [city, setCity] = useState("");
  const [stations, setStations] = useState<WeatherStation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSearch = async (e: React.BaseSyntheticEvent) => {
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
    <div className="flex-1 overflow-y-auto p-6 lg:p-8">
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold">Task 4 — Weather / gRPC</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Search for weather data from Croatian weather stations via gRPC.
          </p>
        </div>
      </div>

      {/* Search Card */}
      <GradientCard
        variant="lavender"
        title="Station Search"
        description="Enter a city name to find weather stations"
      >
        <form onSubmit={handleSearch} className="flex gap-3 mt-2">
          <Input
            type="text"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="City name (e.g. Zagreb)"
            className="flex-1"
          />
          <Button type="submit" disabled={loading} className="h-10 px-5">
            {loading ? "Searching..." : "Get Temperature"}
          </Button>
        </form>

        {error && (
          <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-4 text-destructive mt-4">
            {error}
          </div>
        )}
      </GradientCard>

      {/* Results Grid */}
      {stations.length > 0 && (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-4 mt-6">
          {stations.map((s) => (
            <GradientCard
              key={s.city}
              variant="ember"
              title={s.city}
              footer={
                <span className="text-muted-foreground text-sm">
                  {s.description || "\u2014"}
                </span>
              }
            >
              <div className="mt-2">
                <TempBadge temp={s.temperature} />
              </div>
            </GradientCard>
          ))}
        </div>
      )}

      {stations.length === 0 && !loading && !error && (
        <div className="bg-card border border-border rounded-xl p-6 mt-6">
          <p className="text-muted-foreground text-center text-sm">
            Enter a city name to search weather stations.
          </p>
        </div>
      )}
    </div>
  );
}
