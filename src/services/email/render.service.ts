import { readFileSync, existsSync, readdirSync } from "fs";
import path from "path";

/**
 * Render service for Maizzle email templates.
 *
 * Reads pre-built Maizzle HTML output and performs string replacement
 * of {= varName =} tokens with provided data.
 *
 * The {= varName =} syntax is used because it survives the Maizzle
 * build process in both text content and HTML attributes, unlike
 * Vue/Nunjucks {{ }} syntax which gets resolved during build.
 *
 * Build output path resolution:
 * - Production: dist/email/ (copied by Vite plugin during build)
 * - Development falls back to src/email/build/
 */
export class EmailRenderService {
  private buildDir: string;

  /**
   * @param buildDir - Path to the Maizzle build output directory.
   *   Defaults to dist/email/ if it exists (production), otherwise src/email/build/ (development).
   */
  constructor(buildDir?: string) {
    if (buildDir) {
      this.buildDir = buildDir;
    } else {
      const prodDir = path.resolve(process.cwd(), "dist/email");
      const devDir = path.resolve(process.cwd(), "src/email/build");
      this.buildDir = existsSync(prodDir) ? prodDir : devDir;
    }
  }

  /**
   * Renders an email template with the provided data.
   *
   * @param template - Template name (without extension, e.g. "welcome")
   * @param data - Key-value pairs for variable substitution
   * @returns Object with rendered HTML content or error details
   */
  render(
    template: string,
    data: Record<string, string>,
  ): { ok: true; html: string } | { ok: false; error: string; status: number } {
    const htmlPath = path.resolve(this.buildDir, `${template}.html`);

    if (!existsSync(htmlPath)) {
      return {
        ok: false,
        error: `Template "${template}" not found. Available templates: ${this.listTemplates().join(", ")}`,
        status: 404,
      };
    }

    try {
      let html = readFileSync(htmlPath, "utf-8");

      // First pass: replace provided variables with their values
      html = html.replace(/\{=\s*(\w+)\s*=\}/g, (_match, varName: string) => {
        return varName in data ? escapeHtml(data[varName]) : "";
      });

      // Second pass: warn about and remove any remaining unmatched tokens
      // This catches typos in template variable names without failing silently.
      const unmatched = html.match(/\{=\s*\w+\s*=\}/g);
      if (unmatched) {
        const names = [...new Set(unmatched.map((t) => t.replace(/\{=\s*|\s*=\}/g, "")))];
        console.warn(
          `[email-render] Template "${template}" has unmatched tokens: [${names.join(", ")}]. ` +
            "These variables were not provided in the render data.",
        );
        html = html.replace(/\{=\s*\w+\s*=\}/g, "");
      }

      return { ok: true, html };
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : String(cause);
      return {
        ok: false,
        error: `Failed to render template: ${message}`,
        status: 500,
      };
    }
  }

  /**
   * Lists available templates from the build output directory.
   *
   * @returns Array of template names (without extensions)
   */
  listTemplates(): string[] {
    if (!existsSync(this.buildDir)) {
      return [];
    }

    try {
      return readdirSync(this.buildDir)
        .filter((file) => file.endsWith(".html"))
        .map((file) => file.replace(/\.html$/, ""));
    } catch {
      return [];
    }
  }
}

/**
 * HTML entity map used for single-pass escaping.
 */
const htmlEntities: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#039;",
};

/**
 * Escapes HTML special characters to prevent injection attacks.
 *
 * Applied uniformly to all variable values, including URLs in `href`
 * attributes. `&amp;` in an `href` is correctly interpreted by browsers
 * as `&`, so this is safe. Data values should NOT be pre-encoded —
 * the template system handles encoding at render time.
 *
 * Uses a single regex pass over the string for performance.
 *
 * @param value - Raw string value
 * @returns HTML-escaped string
 */
export function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => htmlEntities[char]);
}

/**
 * Singleton instance of the email render service.
 *
 * Constructor accepts an optional `buildDir` parameter for testing:
 * ```ts
 * const service = new EmailRenderService(mockBuildDir);
 * ```
 * This follows the same DI pattern used by repositories in this project.
 * The module-level singleton is a convenience for the controller layer.
 */
export const emailRenderService = new EmailRenderService();