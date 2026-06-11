import path from "path";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import evlog from "evlog/vite";
import { comptime } from "comptime/vite";
import { viteDevBridge } from "devframe/helpers/vite";

/** Devframe definition for Vite Bridge integration */
const devframe = {
  id: "tsse-elysia-devkit",
  name: "TSSE Elysia DevKit",
  basePath: "/__devkit",
  cli: { name: "devkit", description: "TSSE Elysia Developer Administration Toolkit" },
  setup: () => {},
};

const host = import.meta.env.HOST || "localhost";
const port = parseInt(import.meta.env.PORT || "3000", 10);

export default defineConfig(() => ({
  plugins: [
    evlog({
      service: "tsse-elysia",
      environment: import.meta.env.MODE || "development",
      sourceLocation: import.meta.env.MODE !== "production",
    }),
    comptime(),
    tanstackStart(),
    viteReact(),
    tailwindcss(),
    viteDevBridge(devframe as any),
  ],
  ssr: {
    noExternal: ["drizzle-orm"],
  },
  environments: {
    ssr: {
      build: {
        rollupOptions: {
          input: "./src/server.ts",
          output: {
            entryFileNames: "server.js",
          },
        },
      },
    },
  },
  resolve: {
    alias: {
      "~": path.resolve(import.meta.dirname, "src"),
    },
  },
  server: {
    host,
    port,
    envPrefix: ["VITE_", "PUBLIC_"],
  },
  preview: {
    host,
    port,
  },
}));