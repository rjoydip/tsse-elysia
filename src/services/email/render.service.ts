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
 * - Development: src/email/build/
 * - Production: dist/email/ (copied by Vite plugin during build)
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
      const devDir = path.resolve(import.meta.dirname, "../../email/build");
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

      // Replace {= varName =} tokens with provided data values
      html = html.replace(/\{=\s*(\w+)\s*=\}/g, (_match, varName: string) => {
        return varName in data ? escapeHtml(data[varName]) : "";
      });

      // Replace {= varName =} tokens with empty string for any remaining unmatched tokens
      html = html.replace(/\{=\s*\w+\s*=\}/g, "");

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
 * Escapes HTML special characters to prevent injection attacks.
 *
 * @param value - Raw string value
 * @returns HTML-escaped string
 */
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/**
 * Singleton instance of the email render service.
 */
export const emailRenderService = new EmailRenderService();