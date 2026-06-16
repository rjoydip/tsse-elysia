import { defineConfig } from "@maizzle/framework";

/**
 * Production-specific Maizzle configuration.
 * Overrides the base config with production-only settings:
 * - Separate output directory to avoid overwriting dev builds
 * - Disables HTML formatting (redundant when minifying)
 *
 * @see https://maizzle.com/docs/development/configuration
 */
export default defineConfig({
  content: ["src/templates/**/*.vue"],
  output: {
    path: "build/production",
  },
  tailwind: {},
  css: {
    inline: true,
    purge: true,
    shorthand: true,
  },
  html: {
    minify: true,
    format: false,
  },
  plaintext: true,
});