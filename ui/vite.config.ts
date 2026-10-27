import path from "node:path"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig, type Plugin } from "vite"

// In `pnpm dev` there is no eel server: answer /eel.js with an empty script so
// the app falls back to the HTTP dev backend (ui/dev/dev_server.py).
const devEelStub = (): Plugin => ({
  name: "beolkkuri-dev-eel-stub",
  apply: "serve",
  configureServer(server) {
    server.middlewares.use("/eel.js", (_req, res) => {
      res.setHeader("Content-Type", "text/javascript")
      res.end("/* eel is provided by the desktop app */")
    })
  },
})

// The build goes straight into the Python app's webapp folder, which eel serves.
export default defineConfig({
  base: "./",
  plugins: [react(), tailwindcss(), devEelStub()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    outDir: "../src/webapp",
    emptyOutDir: true,
    assetsDir: "app",
    chunkSizeWarningLimit: 2000,
    rollupOptions: {
      // Stable file names: the in-app updater copies files over the old install,
      // so content-hashed names would pile up across versions.
      output: {
        entryFileNames: "app/[name].js",
        chunkFileNames: "app/[name].js",
        assetFileNames: "app/[name][extname]",
      },
    },
  },
  server: {
    port: 5173,
    proxy: {
      "/__py": "http://127.0.0.1:8765",
    },
  },
})
