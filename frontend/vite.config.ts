import path from "path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// https://vite.dev/config/
export default defineConfig({
  assetsInclude: ["**/*.glb", "**/*.ktx2"],
  plugins: [react(), tailwindcss()],
  legacy: { inconsistentCjsInterop: true },
  base: "./",
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
