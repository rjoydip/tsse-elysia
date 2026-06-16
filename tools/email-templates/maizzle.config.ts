import { defineConfig } from "@maizzle/framework";

/**
 * Maizzle configuration for email template compilation.
 *
 * Consumption:
 *   - Pre-built HTML (maizzle build): output in build/ is for structural
 *     reference and testing only. Variable substitution ({{ username }},
 *     {{ dashboardUrl }}, etc.) is NOT resolved in pre-built output.
 *   - Runtime rendering: use @maizzle/framework render() to compile + send
 *     with variable substitution. See the email service in src/services/email/.
 *
 * Brand color tokens (brand-*) are defined via @theme in src/css/main.css.
 * Use bg-brand-500 / text-brand-500 in templates instead of hardcoded colors.
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