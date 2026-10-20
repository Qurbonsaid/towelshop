import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
import { defineConfig, loadEnv } from "vite";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function firebaseSwPlugin(env) {
  return {
    name: "firebase-sw-env-inject",
    closeBundle() {
      const swDistPath = path.resolve(
        __dirname,
        "dist/firebase-messaging-sw.js"
      );
      if (fs.existsSync(swDistPath)) {
        let content = fs.readFileSync(swDistPath, "utf-8");
        content = content
          .replace(/__FIREBASE_API_KEY__/g, env.VITE_FIREBASE_API_KEY || "")
          .replace(
            /__FIREBASE_AUTH_DOMAIN__/g,
            env.VITE_FIREBASE_AUTH_DOMAIN || ""
          )
          .replace(
            /__FIREBASE_PROJECT_ID__/g,
            env.VITE_FIREBASE_PROJECT_ID || ""
          )
          .replace(
            /__FIREBASE_STORAGE_BUCKET__/g,
            env.VITE_FIREBASE_STORAGE_BUCKET || ""
          )
          .replace(
            /__FIREBASE_MESSAGING_SENDER_ID__/g,
            env.VITE_FIREBASE_MESSAGING_SENDER_ID || ""
          )
          .replace(/__FIREBASE_APP_ID__/g, env.VITE_FIREBASE_APP_ID || "")
          .replace(
            /__FIREBASE_MESSAGING_VAPID_KEY__/g,
            env.VITE_FIREBASE_MESSAGING_VAPID_KEY || ""
          );
        fs.writeFileSync(swDistPath, content);
      }
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  return {
    plugins: [
      react(),
      firebaseSwPlugin(env),
      VitePWA({
        registerType: "autoUpdate",
        injectRegister: "auto",
        devOptions: {
          enabled: true,
        },
        includeAssets: [
          "favicon.svg",
          "apple-touch-icon.png",
          "pwa-192x192.png",
          "pwa-512x512.png",
        ],
        manifest: {
          id: "/",
          name: "Towelshop",
          short_name: "Towelshop",
          description: "Sartaroshxonalar uchun mobil savdo va yig'im tizimi",
          theme_color: "#059669",
          background_color: "#f8fafc",
          display: "standalone",
          orientation: "portrait-primary",
          scope: "/",
          start_url: "/",
          lang: "uz-Latn-UZ",
          categories: ["business", "productivity"],
          icons: [
            {
              src: "/pwa-192x192.png",
              sizes: "192x192",
              type: "image/png",
              purpose: "any",
            },
            {
              src: "/pwa-512x512.png",
              sizes: "512x512",
              type: "image/png",
              purpose: "any",
            },
            {
              src: "/pwa-512x512.png",
              sizes: "512x512",
              type: "image/png",
              purpose: "maskable",
            },
            {
              src: "/apple-touch-icon.png",
              sizes: "180x180",
              type: "image/png",
              purpose: "any",
            },
            {
              src: "/favicon.svg",
              sizes: "any",
              type: "image/svg+xml",
              purpose: "any",
            },
          ],
        },
      }),
    ],
    build: {
      chunkSizeWarningLimit: 1200,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (
              id.includes("node_modules/react/") ||
              id.includes("node_modules/react-dom/") ||
              id.includes("node_modules/react-router")
            ) {
              return "react-vendor";
            }
            if (
              id.includes("node_modules/firebase") ||
              id.includes("node_modules/@firebase")
            ) {
              return "firebase-vendor";
            }
            if (
              id.includes("node_modules/leaflet") ||
              id.includes("node_modules/react-leaflet")
            ) {
              return "leaflet-vendor";
            }
          },
        },
      },
    },
  };
});
