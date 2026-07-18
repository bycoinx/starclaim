import path from "node:path";
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { nodePolyfills } from "vite-plugin-node-polyfills";

function resolveProxyTarget(env) {
  const rawTarget = env.REACT_APP_BACKEND_URL || env.REACT_APP_API_URL || "http://127.0.0.1:8000";
  return rawTarget.replace(/\/api\/?$/, "");
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  return {
    plugins: [
      react(),
      nodePolyfills({
        include: ["assert", "buffer", "crypto", "path", "process", "stream", "vm"],
        globals: { Buffer: true, global: true, process: true },
        protocolImports: true,
      }),
    ],
    resolve: {
      alias: { "@": path.resolve(process.cwd(), "src") },
    },
    envPrefix: ["VITE_", "REACT_APP_"],
    server: {
      host: "127.0.0.1",
      port: 3000,
      proxy: {
        "/api": {
          target: resolveProxyTarget(env),
          changeOrigin: true,
          secure: false,
          ws: true,
        },
      },
    },
    preview: { host: "127.0.0.1", port: 4173 },
    build: {
      outDir: "build",
      sourcemap: false,
      chunkSizeWarningLimit: 750,
      rolldownOptions: {
        output: {
          codeSplitting: {
            groups: [
              {
                name: "react-vendor",
                test: /node_modules[\\/](react|react-dom|react-router|react-router-dom|scheduler)[\\/]/,
                priority: 30,
              },
              {
                name: "observability",
                test: /node_modules[\\/]@sentry[\\/]/,
                priority: 20,
              },
              {
                name: "vendor",
                test: /node_modules[\\/]/,
                minSize: 20_000,
                maxSize: 600_000,
                entriesAware: true,
                priority: 5,
              },
            ],
          },
        },
      },
    },
    test: {
      globals: true,
      environment: "jsdom",
      include: ["src/**/*.test.{js,jsx,ts,tsx}"],
      clearMocks: true,
      restoreMocks: true,
      mockReset: false,
    },
  };
});
