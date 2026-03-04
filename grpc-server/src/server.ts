import * as grpc from "@grpc/grpc-js";
import * as protoLoader from "@grpc/proto-loader";
import { XMLParser } from "fast-xml-parser";
import path from "path";
import https from "https";

const PROTO_PATH = path.resolve(__dirname, "../proto/weather.proto");
const WEATHER_URL = "https://vrijeme.hr/hrvatska_n.xml";

interface WeatherStation {
  city: string;
  temperature: string;
  description: string;
}

interface StationData {
  GradIme?: string;
  Temp?: string | number;
  Vrijeme?: string;
}

function fetchWeatherXml(): Promise<string> {
  return new Promise((resolve, reject) => {
    https.get(WEATHER_URL, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => resolve(data));
      res.on("error", reject);
    }).on("error", reject);
  });
}

function parseWeatherData(xmlData: string, cityFilter: string): WeatherStation[] {
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

function main() {
  const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
    keepCase: true,
    longs: String,
    enums: String,
    defaults: true,
    oneofs: true,
  });

  const protoDescriptor = grpc.loadPackageDefinition(packageDefinition);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const weatherProto = (protoDescriptor as any).weather;

  const server = new grpc.Server();

  server.addService(weatherProto.WeatherService.service, {
    GetTemperature: async (
      call: grpc.ServerUnaryCall<{ city: string }, unknown>,
      callback: grpc.sendUnaryData<{ stations: WeatherStation[] }>
    ) => {
      try {
        const cityFilter = call.request.city || "";
        const xmlData = await fetchWeatherXml();
        const stations = parseWeatherData(xmlData, cityFilter);
        callback(null, { stations });
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error";
        callback({
          code: grpc.status.INTERNAL,
          message,
        });
      }
    },
  });

  const PORT = "0.0.0.0:50051";
  server.bindAsync(PORT, grpc.ServerCredentials.createInsecure(), (err, port) => {
    if (err) {
      console.error("Failed to bind gRPC server:", err);
      return;
    }
    console.log(`gRPC server running on port ${port}`);
  });
}

main();
