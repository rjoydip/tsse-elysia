import { defineConfig } from "@maizzle/framework";

/**
 * Production-specific Maizzle configuration.
 * Extends the base config with formatting and locked output paths.
 *
 * Brand colors are defined via @theme in src/css/main.css (shared with base config).
 *
 * @see https://maizzle.com/docs/development/configuration
 */
export default defineConfig({
  content: ["src/templates/**/*.vue"],
  output: {
    path: "build",
  },
  tailwind: {},
  css: {
    inline: true,
    purge: true,
    shorthand: true,
  },
  html: {
    minify: true,
  },
  plaintext: true,
});