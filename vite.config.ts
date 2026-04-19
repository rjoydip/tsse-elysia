import path from "path";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import evlog from "evlog/vite";

const host = import.meta.env.HOST || "localhost";
const port = parseInt(import.meta.env.PORT || "3000", 10);

export default defineConfig(() => ({
  plugins: [
    evlog({
      service: "tsse-elysia",
      environment: import.meta.env.MODE || "development",
      sourceLocation: import.meta.env.MODE !== "production",
    }),
    tanstackStart(),
    viteReact(),
    tailwindcss(),
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