import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  base: "/",   // ⭐ important for Vercel
  server: {
    host: true,
    port: 8080,
    hmr: {
      overlay: false,
    },
    proxy: {
      "/api": {
        target: "http://localhost:5001",
        changeOrigin: true,
        secure: false,
      },
      // AI Agent microservice proxy (optional — used if VITE_AI_AGENT_URL is not set)
      "/ai": {
        target: "http://localhost:3001",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/ai/, ""),
        secure: false,
      },
    },
  },
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.png", "robots.txt", "pwa-192x192.png", "pwa-512x512.png"],
      manifest: {
        name: "MM Dairy Farm",
        short_name: "MM Dairy",
        description: "Farm-fresh dairy products delivered to your doorstep.",
        theme_color: "#16a34a",
        background_color: "#ffffff",
        display: "standalone",
        start_url: "/",
        icons: [
          {
            src: "/pwa-192x192.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "/pwa-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any maskable",
          },
        ],
      },
      workbox: {
        maximumFileSizeToCacheInBytes: 4000000,
        cleanupOutdatedCaches: true,
        skipWaiting: true,
        clientsClaim: true,
        sourcemap: true,
        navigateFallback: "/index.html",
        navigateFallbackDenylist: [/^\/api/, /^\/admin/]
      },
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    sourcemap: true,
  },
});
