import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

export default defineConfig(({ mode }) => {
  const isProd = mode === "production";

  return {
    // IMPORTANT: base path optional. Vercel root deploy => "/"
    base: process.env.BASE_PATH || "/",

    plugins: [
      react(),
      tailwindcss(),
      // Replit runtime overlay only in dev (optional)
      ...(isProd ? [] : []),
    ],

    resolve: {
      alias: {
        "@": path.resolve(__dirname, "src"),
        "@assets": path.resolve(__dirname, "..", "..", "attached_assets"),
      },
      dedupe: ["react", "react-dom"],
    },

    // ✅ Standard Vite output for Vercel
    build: {
      outDir: "dist",
      emptyOutDir: true,
      sourcemap: false,
    },

    // ✅ Local dev only (Vercel build ignores this)
    server: {
      host: true,
      port: Number(process.env.PORT) || 5173,
    },

    preview: {
      host: true,
      port: Number(process.env.PORT) || 4173,
    },
  };
});
