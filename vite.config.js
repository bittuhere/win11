import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

const config = ({ mode }) => {
  return defineConfig({
    plugins: [
      react(),
      VitePWA({
        registerType: "autoUpdate",
      }),
    ],
    base: "",
    define: {
      "process.env.NODE_ENV": `"${mode}"`,
    },
    server: {
      host: "0.0.0.0",
      port: 5173,
      proxy: {
        "/api/bing-search": {
          target: "https://www.bing.com",
          changeOrigin: true,
          rewrite: (path) => {
            const q = new URLSearchParams(path.split("?")[1] || "").get("q") || "";
            return "/search?format=rss&q=" + encodeURIComponent(q);
          },
        },
        "/api/bing-suggest": {
          target: "https://api.bing.com",
          changeOrigin: true,
          rewrite: (path) => {
            const q = new URLSearchParams(path.split("?")[1] || "").get("q") || "";
            return "/osjson.aspx?query=" + encodeURIComponent(q);
          },
        },
      },
    },
    build: {
      outDir: "build",
      rollupOptions: {
        output: {
          manualChunks: (id) => {
            return "vendor";
          },
        },
      },
    },
  });
};

export default config;
