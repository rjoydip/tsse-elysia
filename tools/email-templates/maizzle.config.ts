import { defineConfig } from "@maizzle/framework";

/**
 * Maizzle configuration for email template compilation.
 *
 * Templates are discovered from src/templates/ and compiled to build/.
 * Includes custom brand colors and email-optimized CSS transformers.
 *
 * Consumption:
 *   - Pre-built (Option A): Compiled HTML in build/ serves as reference.
 *     For actual sending, use @maizzle/framework render() at runtime.
 *   - Runtime (Option B): Import @maizzle/framework render() directly
 *     in the app's email service and call render('welcome.vue', { data }).
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
    minify: true,
  },
  plaintext: true,
});