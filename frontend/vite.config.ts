import path from "path"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"
import locatorPlugin from "@locator/babel-jsx"
import Inspect from "vite-plugin-inspect"
import { visualizer } from "rollup-plugin-visualizer"

export default defineConfig({
  plugins: [
    react({
      babel: {
        plugins: [locatorPlugin],
      },
    }),
    tailwindcss(),
    Inspect(),
    visualizer({ open: true, filename: "dist/stats.html" }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 5173,
    proxy: {
      "/api": "http://localhost:3001",
      "/auth": "http://localhost:3001",
      "/graphql": "http://localhost:3001",
      "/soap": "http://localhost:3001",
    },
  },
})
