import { defineConfig } from "@maizzle/framework";

/**
 * Production-specific Maizzle configuration.
 * Extends the base config with formatting and locked output paths.
 *
 * @see https://maizzle.com/docs/development/configuration
 */
export default defineConfig({
  content: ["src/templates/**/*.vue"],
  output: {
    path: "build",
  },
  tailwind: {
    theme: {
      extend: {
        colors: {
          brand: {
            50: "#eff6ff",
            500: "#3b82f6",
            600: "#2563eb",
            700: "#1d4ed8",
          },
        },
      },
    },
  },
  css: {
    inline: true,
    purge: true,
    shorthand: true,
  },
  html: {
    format: true,
    minify: true,
  },
  plaintext: true,
});