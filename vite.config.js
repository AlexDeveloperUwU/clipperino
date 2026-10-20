import { readFileSync } from "node:fs";
import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import { VitePWA } from "vite-plugin-pwa";
import vueDevTools from "vite-plugin-vue-devtools";

const { version } = JSON.parse(readFileSync("./package.json", "utf-8"));

const CSP = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "media-src 'self' blob:",
  "connect-src 'self'",
  "font-src 'self' data:",
  "worker-src 'self'",
  "manifest-src 'self'",
  "base-uri 'self'",
  "form-action 'self'",
].join("; ");

/** Adds the Content-Security-Policy to production builds only; dev tooling needs blob workers and inline scripts. */
const buildOnlyCsp = {
  name: "build-only-csp",
  apply: "build",
  transformIndexHtml: () => [
    {
      tag: "meta",
      attrs: { "http-equiv": "Content-Security-Policy", content: CSP },
      injectTo: "head-prepend",
    },
  ],
};

export default defineConfig({
  base: "./",
  define: { __APP_VERSION__: JSON.stringify(version) },
  plugins: [
    vue(),
    vueDevTools(),
    buildOnlyCsp,
    VitePWA({
      registerType: "prompt",
      workbox: { globPatterns: ["**/*.{js,css,html,ico,png,svg,webmanifest,mp4}"] },
      manifest: {
        name: "Clipperino",
        short_name: "Clipperino",
        description: "Turn timestamped transcripts into clips.",
        theme_color: "#0a0a0a",
        background_color: "#121212",
        display: "standalone",
        start_url: ".",
        icons: [
          {
            src: "icon.svg",
            sizes: "any",
            type: "image/svg+xml",
            purpose: "any",
          },
          {
            src: "icon-maskable.svg",
            sizes: "any",
            type: "image/svg+xml",
            purpose: "maskable",
          },
        ],
      },
    }),
  ],
});
