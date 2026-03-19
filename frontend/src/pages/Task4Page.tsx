import React, { useState } from "react"
import { useMutation } from "@tanstack/react-query"
import { GradientCard } from "@msokol/gradient-card-component"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ChevronDown, ChevronRight } from "lucide-react"

const API_URL = import.meta.env.VITE_API_URL || ""

interface WeatherStation {
  city: string
  temperature: string
  description: string
}

const PROTO_DEFINITION = `syntax = "proto3";
package weather;

service WeatherService {
  rpc GetTemperature (TemperatureRequest) returns (TemperatureResponse);
}

message TemperatureRequest {
  string city = 1;
}

message TemperatureResponse {
  repeated WeatherStation stations = 1;
}

message WeatherStation {
  string city        = 1;
  string temperature = 2;
  string description = 3;
}`

function CollapsibleCode({
  label,
  code,
  defaultOpen = false,
}: {
  label: string
  code: string
  defaultOpen?: boolean
}) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="border-border mt-4 overflow-hidden rounded-lg border">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="bg-card hover:bg-accent/30 flex w-full items-center gap-2 px-4 py-2.5 text-left transition-colors"
      >
        {open ? <ChevronDown size={14} className="opacity-60" /> : <ChevronRight size={14} className="opacity-60" />}
        <span className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">{label}</span>
      </button>
      {open && (
        <pre className="bg-muted/40 max-h-72 overflow-auto border-t p-4 font-mono text-xs text-cyan-300 whitespace-pre-wrap">
          {code}
        </pre>
      )}
    </div>
  )
}

function TempBadge({ temp }: { temp: string }) {
  const num = parseFloat(temp)
  let variant: "warning" | "destructive" | "success" = "warning"
  if (!isNaN(num)) {
    if (num <= 5) variant = "destructive"
    else if (num >= 25) variant = "success"
  }
  return <Badge variant={variant}>{temp} °C</Badge>
}

export default function Task4Page() {
  const [city, setCity] = useState("")

  const searchMutation = useMutation({
    mutationFn: async (cityName: string) => {
      const res = await fetch(`${API_URL}/api/weather?city=${encodeURIComponent(cityName)}`)
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Request failed")
      }
      const data = await res.json()
      return data as { stations: WeatherStation[] }
    },
  })

  const handleSearch = (e: React.BaseSyntheticEvent) => {
    e.preventDefault()
    searchMutation.mutate(city)
  }

  const rawData = searchMutation.data ?? null
  const stations = rawData?.stations ?? []
  const loading = searchMutation.isPending
  const error =
    searchMutation.error instanceof Error
      ? searchMutation.error.message
      : searchMutation.error
        ? "Failed to fetch weather"
        : ""

  return (
    <div className="flex-1 overflow-y-auto p-6 lg:p-8">
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Task 4 — Weather / gRPC</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Search for weather data from Croatian weather stations via gRPC.
          </p>
        </div>
      </div>

      {/* Proto definition — always visible */}
      <GradientCard variant="ghost" title="Proto Contract" description="weather.proto — the gRPC service definition">
        <pre className="bg-muted/40 mt-3 max-h-64 overflow-auto rounded-lg p-4 font-mono text-xs text-cyan-300 whitespace-pre">
          {PROTO_DEFINITION}
        </pre>
      </GradientCard>

      {/* Protocol flow */}
      <div className="border-border bg-card mt-4 rounded-xl border p-5">
        <p className="text-muted-foreground mb-3 text-xs font-semibold tracking-wide uppercase">Protocol Flow</p>
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span className="bg-primary/10 text-primary rounded px-2 py-1 font-mono text-xs">Browser</span>
          <span className="text-muted-foreground text-xs">→ REST GET /api/weather?city=…</span>
          <span className="bg-primary/10 text-primary rounded px-2 py-1 font-mono text-xs">Express proxy</span>
          <span className="text-muted-foreground text-xs">→ gRPC GetTemperature(city)</span>
          <span className="bg-primary/10 text-primary rounded px-2 py-1 font-mono text-xs">gRPC server :50051</span>
          <span className="text-muted-foreground text-xs">→ fetch XML</span>
          <span className="bg-primary/10 text-primary rounded px-2 py-1 font-mono text-xs">
            vrijeme.hr/hrvatska_n.xml
          </span>
        </div>
        <p className="text-muted-foreground mt-3 text-xs">
          Browsers cannot call gRPC directly (HTTP/2 + binary framing). The Express backend acts as a REST-to-gRPC
          proxy: it loads the <code className="bg-muted rounded px-1">weather.proto</code> at runtime, creates a gRPC
          client, calls <code className="bg-muted rounded px-1">GetTemperature</code>, and returns the decoded response
          as JSON.
        </p>
      </div>

      {/* Search Card */}
      <GradientCard
        variant="lavender"
        title="Station Search"
        description="Enter a city name to find weather stations"
        className="mt-4"
      >
        <form onSubmit={handleSearch} className="mt-2 flex gap-3">
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
          <div className="bg-destructive/10 border-destructive/20 text-destructive mt-4 rounded-lg border p-4">
            {error}
          </div>
        )}

        {/* Raw gRPC response */}
        {rawData && (
          <CollapsibleCode
            label="gRPC Response (decoded JSON from proxy)"
            code={JSON.stringify(rawData, null, 2)}
          />
        )}
      </GradientCard>

      {/* Results Grid */}
      {stations.length > 0 && (
        <div className="mt-6 grid grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-4">
          {stations.map((s) => (
            <GradientCard
              key={s.city}
              variant="lavender"
              title={s.city}
              footer={
                <span className="text-muted-foreground text-sm">{s.description || "\u2014"}</span>
              }
            >
              <div className="mt-2">
                <TempBadge temp={s.temperature} />
              </div>
            </GradientCard>
          ))}
        </div>
      )}

      {stations.length === 0 && !loading && !error && !rawData && (
        <div className="bg-card border-border mt-6 rounded-xl border p-6">
          <p className="text-muted-foreground text-center text-sm">
            Enter a city name to search weather stations.
          </p>
        </div>
      )}

      {rawData && stations.length === 0 && !loading && (
        <div className="bg-card border-border mt-6 rounded-xl border p-6">
          <p className="text-muted-foreground text-center text-sm">No stations found for that city name.</p>
        </div>
      )}
    </div>
  )
}
