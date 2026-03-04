import express from "express";
import cors from "cors";
import bodyParser from "body-parser";

import authRoutes from "./routes/auth";
import categoryRoutes from "./routes/categories";
import uploadRoutes from "./routes/upload";

const app = express();

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use("/auth", authRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/upload", uploadRoutes);

// Settings — API source toggle
app.get("/api/settings", (_req, res) => {
  res.json({ useCustomApi: process.env.USE_CUSTOM_API !== "false" });
});

app.put("/api/settings", (req, res) => {
  const { useCustomApi } = req.body;
  process.env.USE_CUSTOM_API = useCustomApi ? "true" : "false";
  res.json({ useCustomApi: process.env.USE_CUSTOM_API !== "false" });
});

export default app;
