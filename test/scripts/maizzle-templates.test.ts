/**
 * Unit tests for Maizzle email template tooling.
 * Verifies template files, config, and build output exist and are well-formed.
 */

import { describe, it, expect, beforeAll } from "bun:test";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { spawnSync } from "bun";

const BUILD_DIR = "src/email";
const ROOT_CONFIG = "maizzle.config.ts";
const TEMPLATES_DIR = "src/templates";
const COMPONENTS_DIR = "src/components/email";
const STYLES_DIR = "src/styles";

describe("Maizzle Email Templates", () => {
  describe("Project structure", () => {
    it("should have root-level maizzle config file", () => {
      expect(existsSync(ROOT_CONFIG)).toBe(true);
      const config = readFileSync(ROOT_CONFIG, "utf-8");
      expect(config).toContain("defineConfig");
      expect(config).toContain("@maizzle/framework");
    });

    it("should reference correct paths in config", () => {
      const config = readFileSync(ROOT_CONFIG, "utf-8");
      expect(config).toContain("src/templates/**/*.vue");
      expect(config).toContain("src/email/build");
      expect(config).toContain("src/components/email");
      expect(config).toContain("src/styles/email.css");
    });

    it("should have @maizzle/framework in root package.json", () => {
      const rootPkg = JSON.parse(readFileSync("package.json", "utf-8"));
      expect(rootPkg.devDependencies).toHaveProperty("@maizzle/framework");
    });
  });

  describe("Template files", () => {
    it("should have the welcome template", () => {
      expect(existsSync(join(TEMPLATES_DIR, "welcome.vue"))).toBe(true);
      const template = readFileSync(join(TEMPLATES_DIR, "welcome.vue"), "utf-8");
      expect(template).toContain("<template>");
      expect(template).toContain("Welcome to TSSE");
      expect(template).toContain("username");
      expect(template).toContain("dashboardUrl");
    });

    it("should have the verify-email template", () => {
      expect(existsSync(join(TEMPLATES_DIR, "verify-email.vue"))).toBe(true);
      const template = readFileSync(join(TEMPLATES_DIR, "verify-email.vue"), "utf-8");
      expect(template).toContain("<template>");
      expect(template).toContain("Verify Your Email Address");
      expect(template).toContain("verificationUrl");
      expect(template).toContain("expiresIn");
    });

    it("should have the password-reset template", () => {
      expect(existsSync(join(TEMPLATES_DIR, "password-reset.vue"))).toBe(true);
      const template = readFileSync(join(TEMPLATES_DIR, "password-reset.vue"), "utf-8");
      expect(template).toContain("<template>");
      expect(template).toContain("Reset Your Password");
      expect(template).toContain("resetUrl");
      expect(template).toContain("expiresIn");
    });

    it("should define expected component props via defineProps in each template", () => {
      const templates = ["welcome", "verify-email", "password-reset"];
      const expectedPropMap: Record<string, string[]> = {
        welcome: ["username", "dashboardUrl"],
        "verify-email": ["username", "verificationUrl", "expiresIn"],
        "password-reset": ["username", "resetUrl", "expiresIn"],
      };

      for (const name of templates) {
        const content = readFileSync(join(TEMPLATES_DIR, `${name}.vue`), "utf-8");
        expect(content).toContain("defineProps");
        for (const prop of expectedPropMap[name]) {
          expect(content).toContain(prop);
        }
      }
    });

    it("should use DefaultLayout component in each template", () => {
      const templates = ["welcome", "verify-email", "password-reset"];
      for (const name of templates) {
        const content = readFileSync(join(TEMPLATES_DIR, `${name}.vue`), "utf-8");
        expect(content.toLowerCase()).toContain("defaultlayout");
      }
    });

    it("should use Maizzle built-in components in each template", () => {
      const templates = ["welcome", "verify-email", "password-reset"];
      for (const name of templates) {
        const content = readFileSync(join(TEMPLATES_DIR, `${name}.vue`), "utf-8");
        expect(content).toContain("<heading");
        expect(content).toContain("<text");
        expect(content).toContain("<button");
        expect(content).toContain("<spacer");
      }
    });

    it("should have documentation comments on each template", () => {
      const templates = ["welcome", "verify-email", "password-reset"];
      for (const name of templates) {
        const content = readFileSync(join(TEMPLATES_DIR, `${name}.vue`), "utf-8");
        expect(content).toContain("/**");
        expect(content).toContain("defineProps");
      }
    });
  });

  describe("Layout and components", () => {
    it("should have a DefaultLayout component", () => {
      expect(existsSync(join(COMPONENTS_DIR, "DefaultLayout.vue"))).toBe(true);
      const layout = readFileSync(join(COMPONENTS_DIR, "DefaultLayout.vue"), "utf-8");
      expect(layout.toLowerCase()).toContain("<layout>");
      expect(layout).toContain("<slot />");
      expect(layout).toContain("currentYear");
    });

    it("should have a CSS file for custom email styles", () => {
      expect(existsSync(join(STYLES_DIR, "email.css"))).toBe(true);
      const css = readFileSync(join(STYLES_DIR, "email.css"), "utf-8");
      expect(css).toContain("--color-brand-500");
    });
  });

  describe("Maizzle config validation", () => {
    it("should configure content path to look for .vue templates in src/templates/", () => {
      const config = readFileSync(ROOT_CONFIG, "utf-8");
      expect(config).toContain("src/templates/**/*.vue");
    });

    it("should configure output path to src/email/build/", () => {
      const config = readFileSync(ROOT_CONFIG, "utf-8");
      expect(config).toContain("src/email/build");
    });

    it("should have CSS transformers enabled", () => {
      const config = readFileSync(ROOT_CONFIG, "utf-8");
      expect(config).toContain("inline: true");
      expect(config).toContain("purge: true");
      expect(config).toContain("shorthand: true");
    });

    it("should use brand tokens for brand colors", () => {
      const templates = ["welcome", "verify-email", "password-reset"];
      for (const name of templates) {
        const content = readFileSync(join(TEMPLATES_DIR, `${name}.vue`), "utf-8");
        expect(content).toContain("bg-brand-500");
        expect(content).toContain("text-white");
      }
    });

    it("should have plaintext generation enabled", () => {
      const config = readFileSync(ROOT_CONFIG, "utf-8");
      expect(config).toContain("plaintext: true");
    });
  });

  describe("Build output", () => {
    /**
     * Build email templates before testing build output.
     * Auto-builds if output is missing. Set SKIP_BUILD=1 for local iteration.
     */
    beforeAll(() => {
      if (process.env.SKIP_BUILD) return;
      if (!existsSync(join(BUILD_DIR, "build", "welcome.html"))) {
        const result = spawnSync(["bun", "run", "email:build"], {
          env: { ...process.env, NODE_ENV: "production" },
        });
        if (!existsSync(join(BUILD_DIR, "build", "welcome.html"))) {
          throw new Error(
            `Email build failed. stdout: ${result.stdout?.toString()}, stderr: ${result.stderr?.toString()}`,
          );
        }
      }
    });

    it("should produce HTML output files with template-specific content", () => {
      const templates: Record<string, string[]> = {
        welcome: ["<!DOCTYPE html>", "</html>", "Go to Dashboard", "TSSE", "{= username =}"],
        "verify-email": [
          "<!DOCTYPE html>",
          "</html>",
          "Verify Your Email Address",
          "{= verificationUrl =}",
        ],
        "password-reset": [
          "<!DOCTYPE html>",
          "</html>",
          "Reset Your Password",
          "password",
          "{= resetUrl =}",
        ],
      };
      for (const [name, expected] of Object.entries(templates)) {
        const htmlPath = join(BUILD_DIR, "build", `${name}.html`);
        expect(existsSync(htmlPath)).toBe(true);
        const html = readFileSync(htmlPath, "utf-8");
        for (const fragment of expected) {
          expect(html).toContain(fragment);
        }
      }
    });

    it("should produce plaintext output files", () => {
      const templates = ["welcome", "verify-email", "password-reset"];
      for (const name of templates) {
        const txtPath = join(BUILD_DIR, "build", `${name}.txt`);
        expect(existsSync(txtPath)).toBe(true);
      }
    });

    it("should have inline CSS and email-safe HTML structure across all templates", () => {
      const templates = ["welcome", "verify-email", "password-reset"];
      for (const name of templates) {
        const html = readFileSync(join(BUILD_DIR, "build", `${name}.html`), "utf-8");
        expect(html).toContain("<html");
        expect(html).toContain("<head>");
        expect(html).toContain("<meta charset");
        expect(html).toContain('<meta name="viewport"');
        expect(html).toContain("<!--[if mso]>");
        expect(html).toContain("<![endif]-->");
        expect(html).toContain('style="');
      }
    });

    it("should have no unresolved text-content Vue interpolation markers in pre-built HTML", () => {
      const templates = ["welcome", "verify-email", "password-reset"];
      for (const name of templates) {
        const html = readFileSync(join(BUILD_DIR, "build", `${name}.html`), "utf-8");
        expect(html).not.toContain("{{ username }}");
      }
    });

    it("should preserve {= varName =} tokens in build output for runtime replacement", () => {
      const html = readFileSync(join(BUILD_DIR, "build", "verify-email.html"), "utf-8");
      expect(html).toContain("{= expiresIn =}");
      expect(html).toContain("{= verificationUrl =}");
    });
  });

  describe("Root package.json integration", () => {
    it("should have email scripts in root package.json", () => {
      const rootPkg = JSON.parse(readFileSync("package.json", "utf-8"));
      expect(rootPkg.scripts).toHaveProperty("email:dev");
      expect(rootPkg.scripts).toHaveProperty("email:build");
      expect(rootPkg.scripts).toHaveProperty("email:new:template");
    });

    it("should run maizzle directly (no --cwd flag)", () => {
      const rootPkg = JSON.parse(readFileSync("package.json", "utf-8"));
      expect(rootPkg.scripts["email:dev"]).toBe("maizzle serve");
      expect(rootPkg.scripts["email:build"]).toBe("maizzle build");
    });
  });

  describe("Gitignore", () => {
    it("should ignore Maizzle build and .maizzle directories via generic patterns", () => {
      const rootGitignore = readFileSync(".gitignore", "utf-8");
      expect(rootGitignore).toContain("build/");
      expect(rootGitignore).toContain(".maizzle/");
    });
  });
});