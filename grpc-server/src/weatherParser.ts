import { XMLParser } from "fast-xml-parser";

export interface WeatherStation {
  city: string;
  temperature: string;
  description: string;
}

interface StationData {
  GradIme?: string;
  Temp?: string | number;
  Vrijeme?: string;
}

export function parseWeatherData(xmlData: string, cityFilter: string): WeatherStation[] {
  const parser = new XMLParser({
    ignoreAttributes: false,
    isArray: (name) => name === "Grad",
  });

  const parsed = parser.parse(xmlData);

  // The XML structure from vrijeme.hr has Hrvatska > Grad[] elements
  const stations: StationData[] = parsed?.Hrvatska?.Grad || [];
  const filter = cityFilter.toLowerCase();

  return stations
    .filter((s) => {
      const name = String(s.GradIme || "").toLowerCase();
      return name.includes(filter);
    })
    .map((s) => ({
      city: String(s.GradIme || ""),
      temperature: String(s.Temp ?? "N/A"),
      description: String(s.Vrijeme || "N/A"),
    }));
}
