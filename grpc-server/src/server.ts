import * as grpc from "@grpc/grpc-js";
import * as protoLoader from "@grpc/proto-loader";
import path from "path";
import https from "https";
import { parseWeatherData, type WeatherStation } from "./weatherParser";

const PROTO_PATH = path.resolve(__dirname, "../proto/weather.proto");
const WEATHER_URL = "https://vrijeme.hr/hrvatska_n.xml";

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
