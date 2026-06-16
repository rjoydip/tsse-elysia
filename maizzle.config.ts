import { defineConfig } from "@maizzle/framework";

/**
 * Maizzle configuration for email template compilation.
 *
 * Configuration lives at project root; templates at src/templates/,
 * components at src/components/email/, CSS at src/styles/,
 * and build output at src/email/build/.
 *
 * Variable tokens:
 *   Templates use {= varName =} syntax for dynamic variables.
 *   This token is NOT processed by Vue or Nunjucks during build,
 *   so it survives intact in both text content and HTML attributes.
 *   At runtime, the email render service replaces {= varName =}
 *   tokens with actual data using string replacement.
 *
 * Brand color tokens (brand-*) are defined via @theme in src/styles/main.css.
 * Use bg-brand-500 / text-brand-500 in templates instead of hardcoded colors.
 *
 * @see https://maizzle.com/docs/development/configuration
 */
export default defineConfig({
  content: ["src/templates/**/*.vue"],
  components: {
    source: "src/components/email",
  },
  tailwind: {
    css: "src/styles/email.css",
  },
  output: {
    path: "src/email/build",
  },
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