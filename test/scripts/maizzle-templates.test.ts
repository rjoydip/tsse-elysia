/**
 * Unit tests for Maizzle email template tooling.
 * Verifies template files, config, and build output exist and are well-formed.
 */

import { describe, it, expect, beforeAll } from "bun:test";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { $ } from "bun";

const MAIZZLE_DIR = "tools/email-templates";

/**
 * Helper to read a file from the Maizzle project.
 * @param {...string} segments - Path segments relative to maizzle dir
 * @returns {string} File content
 */
function readMaizzleFile(...segments: string[]): string {
  const filePath = join(MAIZZLE_DIR, ...segments);
  return readFileSync(filePath, "utf-8");
}

/**
 * Helper to check a file exists in the Maizzle project.
 * @param {...string} segments - Path segments relative to maizzle dir
 * @returns {boolean} Whether the file exists
 */
function maizzleFileExists(...segments: string[]): boolean {
  return existsSync(join(MAIZZLE_DIR, ...segments));
}

describe("Maizzle Email Templates", () => {
  describe("Project structure", () => {
    it("should have a package.json", () => {
      expect(maizzleFileExists("package.json")).toBe(true);
      const pkg = JSON.parse(readMaizzleFile("package.json"));
      expect(pkg.name).toBe("email-templates");
      expect(pkg.private).toBe(true);
    });

    it("should have @maizzle/framework as a dependency", () => {
      const pkg = JSON.parse(readMaizzleFile("package.json"));
      expect(pkg.dependencies).toHaveProperty("@maizzle/framework");
    });

    it("should have dev/build/new:template scripts", () => {
      const pkg = JSON.parse(readMaizzleFile("package.json"));
      expect(pkg.scripts).toHaveProperty("dev");
      expect(pkg.scripts).toHaveProperty("build");
      expect(pkg.scripts).toHaveProperty("new:template");
      expect(pkg.scripts).toHaveProperty("new:layout");
    });

    it("should have a maizzle config file", () => {
      expect(maizzleFileExists("maizzle.config.ts")).toBe(true);
      const config = readMaizzleFile("maizzle.config.ts");
      expect(config).toContain("defineConfig");
      expect(config).toContain("@maizzle/framework");
    });

    it("should have a production config file", () => {
      expect(maizzleFileExists("maizzle.config.production.ts")).toBe(true);
      const config = readMaizzleFile("maizzle.config.production.ts");
      expect(config).toContain("defineConfig");
    });

    it("should have a .gitignore", () => {
      expect(maizzleFileExists(".gitignore")).toBe(true);
      const gitignore = readMaizzleFile(".gitignore");
      expect(gitignore).toContain("build/");
      expect(gitignore).toContain(".maizzle/");
    });
  });

  describe("Template files", () => {
    it("should have the welcome template", () => {
      expect(maizzleFileExists("src/templates/welcome.vue")).toBe(true);
      const template = readMaizzleFile("src/templates/welcome.vue");
      expect(template).toContain("<template>");
      expect(template).toContain("Welcome to TSSE");
      expect(template).toContain("username");
      expect(template).toContain("dashboardUrl");
    });

    it("should have the verify-email template", () => {
      expect(maizzleFileExists("src/templates/verify-email.vue")).toBe(true);
      const template = readMaizzleFile("src/templates/verify-email.vue");
      expect(template).toContain("<template>");
      expect(template).toContain("Verify Your Email Address");
      expect(template).toContain("verificationUrl");
      expect(template).toContain("expiresIn");
    });

    it("should have the password-reset template", () => {
      expect(maizzleFileExists("src/templates/password-reset.vue")).toBe(true);
      const template = readMaizzleFile("src/templates/password-reset.vue");
      expect(template).toContain("<template>");
      expect(template).toContain("Reset Your Password");
      expect(template).toContain("resetUrl");
      expect(template).toContain("expiresIn");
    });

    it("should define expected component props in each template", () => {
      const templates = ["welcome", "verify-email", "password-reset"];
      const expectedPropMap: Record<string, string[]> = {
        welcome: ["username", "dashboardUrl"],
        "verify-email": ["username", "verificationUrl", "expiresIn"],
        "password-reset": ["username", "resetUrl", "expiresIn"],
      };

      for (const name of templates) {
        const content = readMaizzleFile(`src/templates/${name}.vue`);
        const propsMatch = content.match(/props:\s*\[([^\]]+)\]/);
        expect(propsMatch).not.toBeNull();

        const propsStr = propsMatch![1];
        for (const prop of expectedPropMap[name]) {
          expect(propsStr).toContain(prop);
        }
      }
    });

    it("should use DefaultLayout component in each template", () => {
      const templates = ["welcome", "verify-email", "password-reset"];
      for (const name of templates) {
        const content = readMaizzleFile(`src/templates/${name}.vue`);
        expect(content).toContain("<DefaultLayout");
      }
    });

    it("should use Maizzle built-in components in each template", () => {
      const templates = ["welcome", "verify-email", "password-reset"];
      for (const name of templates) {
        const content = readMaizzleFile(`src/templates/${name}.vue`);
        expect(content).toContain("<heading");
        expect(content).toContain("<text");
        expect(content).toContain("<button");
        expect(content).toContain("<spacer");
      }
    });

    it("should have proper JSDoc comments on each template", () => {
      const templates = ["welcome", "verify-email", "password-reset"];
      for (const name of templates) {
        const content = readMaizzleFile(`src/templates/${name}.vue`);
        expect(content).toContain("/**");
        expect(content).toContain("@param");
      }
    });
  });

  describe("Layout and components", () => {
    it("should have a DefaultLayout component", () => {
      expect(maizzleFileExists("components/DefaultLayout.vue")).toBe(true);
      const layout = readMaizzleFile("components/DefaultLayout.vue");
      expect(layout).toContain("<Layout>");
      expect(layout).toContain("<slot />");
      expect(layout).toContain("year");
    });

    it("should have a CSS file for custom styles", () => {
      expect(maizzleFileExists("src/css/main.css")).toBe(true);
    });
  });

  describe("Maizzle config validation", () => {
    it("should configure content path to look for .vue templates", () => {
      const config = readMaizzleFile("maizzle.config.ts");
      expect(config).toContain("src/templates/**/*.vue");
    });

    it("should configure output path to build/", () => {
      const config = readMaizzleFile("maizzle.config.ts");
      expect(config).toContain("build");
    });

    it("should have CSS transformers enabled", () => {
      const config = readMaizzleFile("maizzle.config.ts");
      expect(config).toContain("inline: true");
      expect(config).toContain("purge: true");
      expect(config).toContain("shorthand: true");
    });

    it("should have brand colors configured", () => {
      const config = readMaizzleFile("maizzle.config.ts");
      expect(config).toContain("brand");
      expect(config).toContain("6366f1");
    });

    it("should have plaintext generation enabled", () => {
      const config = readMaizzleFile("maizzle.config.ts");
      expect(config).toContain("plaintext: true");
    });
  });

  describe("Build output", () => {
    /**
     * Rebuild email templates before testing build output,
     * since the build/ directory is gitignored.
     */
    beforeAll(() => {
      const result = Bun.spawnSync(["bun", "--cwd", MAIZZLE_DIR, "build"], {
        env: { ...process.env },
      });
      if (!result.success) {
        throw new Error(`Maizzle build failed: ${result.stderr.toString()}`);
      }
    }, 30000);

    it("should produce HTML output files", () => {
      const templates = ["welcome", "verify-email", "password-reset"];
      for (const name of templates) {
        const htmlPath = join(MAIZZLE_DIR, "build", `${name}.html`);
        expect(existsSync(htmlPath)).toBe(true);
        const html = readFileSync(htmlPath, "utf-8");
        expect(html).toContain("<!DOCTYPE html>");
        expect(html).toContain("</html>");
      }
    });

    it("should produce plaintext output files", () => {
      const templates = ["welcome", "verify-email", "password-reset"];
      for (const name of templates) {
        const txtPath = join(MAIZZLE_DIR, "build", `${name}.txt`);
        expect(existsSync(txtPath)).toBe(true);
      }
    });

    it("should have inline CSS in HTML output", () => {
      const html = readMaizzleFile("build/welcome.html");
      expect(html).toContain('style="');
    });

    it("should have email-safe HTML structure", () => {
      const html = readMaizzleFile("build/welcome.html");
      expect(html).toContain("<html");
      expect(html).toContain("<head>");
      expect(html).toContain("<meta charset");
      expect(html).toContain('<meta name="viewport"');
    });

    it("should have MSO conditional comments for Outlook", () => {
      const html = readMaizzleFile("build/welcome.html");
      expect(html).toContain("<!--[if mso]>");
      expect(html).toContain("<![endif]-->");
    });
  });

  describe("Root package.json integration", () => {
    it("should have email scripts in root package.json", () => {
      const rootPkg = JSON.parse(readFileSync("package.json", "utf-8"));
      expect(rootPkg.scripts).toHaveProperty("email:dev");
      expect(rootPkg.scripts).toHaveProperty("email:build");
      expect(rootPkg.scripts).toHaveProperty("email:new:template");
    });

    it("should reference the correct Maizzle working directory", () => {
      const rootPkg = JSON.parse(readFileSync("package.json", "utf-8"));
      expect(rootPkg.scripts["email:build"]).toContain("tools/email-templates");
      expect(rootPkg.scripts["email:dev"]).toContain("tools/email-templates");
    });
  });

  describe("Gitignore", () => {
    it("should ignore Maizzle build output in root .gitignore", () => {
      const rootGitignore = readFileSync(".gitignore", "utf-8");
      expect(rootGitignore).toContain("tools/email-templates/build/");
      expect(rootGitignore).toContain("tools/email-templates/.maizzle/");
    });
  });
});