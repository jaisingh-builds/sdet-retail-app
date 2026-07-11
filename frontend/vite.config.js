import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    allowedHosts: true,
    proxy: {
      "/api": "http://localhost:8080",
      "/openapi.yaml": "http://localhost:8080",
      "/api-docs": "http://localhost:8080"
    }
  }
});
