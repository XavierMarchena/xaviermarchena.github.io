import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "node:path";

export default defineConfig({
  plugins: [react()],
  root: resolve(__dirname),
  resolve: { alias: { "@": resolve(__dirname, "src") } },
  server: { port: 5173, proxy: { "/api": "http://localhost:4321" } },
  build: { outDir: resolve(__dirname, "dist"), emptyOutDir: true },
});