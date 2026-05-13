/**
 * Documentation Configuration
 * Dynamically scans the /docs directory to build the sidebar navigation.
 * Maps markdown files in /docs to route paths via import.meta.glob.
 * Sidebar links route through the dynamic catch-all at /docs/$.
 */

/** Display name in the sidebar */
export interface DocItem {
  /** Display name in the sidebar */
  name: string;
  /** Route path (maps to docs/<path>.md on the filesystem) */
  href: string;
}

/** Section heading in the sidebar */
export interface DocSection {
  /** Section heading in the sidebar */
  title: string;
  /** List of documentation pages in this section */
  items: DocItem[];
}

/** Display order for sidebar sections */
const SECTION_ORDER = ["getting-started", "auth", "api", "infra", "guides", "reference"] as const;

/** Maps folder names to sidebar section titles */
const SECTION_TITLE_MAP: Record<string, string> = {
  "getting-started": "Getting Started",
  guides: "Guides",
  auth: "Authentication",
  api: "API",
  infra: "Infrastructure",
  reference: "Reference",
};

const FILE_NAME_MAP: Record<string, string> = {
  "ci-cd": "CI/CD",
  /** Hub page: app + auth API links (sidebar label). */
  /** Auth section: Better Auth OpenAPI entry (sidebar label). */
  "openapi-reference": "OpenAPI",
};

export const docsListLLMO = [
  { slug: "getting-started", title: "Getting Started", category: "Guide" as const },
  {
    slug: "api/api-references",
    title: "API References",
    category: "Reference" as const,
  },
  {
    slug: "getting-started/development",
    title: "Development Setup",
    category: "Guide" as const,
  },
  { slug: "auth/overview", title: "Authentication", category: "Guide" as const },
  {
    slug: "deployment/production",
    title: "Production Deployment",
    category: "Guide" as const,
  },
];

/**
 * Converts a file name to its display name.
 * Checks FILE_NAME_MAP first for custom mappings, then formats kebab-case to Title Case.
 */
function getDisplayName(fileName: string): string {
  return FILE_NAME_MAP[fileName] ?? formatName(fileName);
}

/**
 * Converts a Vite glob key (e.g., "../../docs/auth/overview.md")
 * into a doc path (e.g., "auth/overview") for route matching.
 */
export function globKeyToDocPath(key: string): string {
  return key.replace(/^(\.\.\/)*docs\//, "").replace(/\.md$/, "");
}

/**
 * Safely extracts the splat path from route params.
 * In TanStack Router catch-all routes, _splat may be undefined for /docs root.
 */
export function getSplatPath(params: Record<string, unknown>): string {
  const raw = params._splat;
  return typeof raw === "string" ? raw : "";
}

/**
 * Builds a lookup map from doc path to raw markdown content.
 * Example: { "auth/overview": "# Auth Overview\n...", "architecture": "# Architecture\n..." }
 */
export function buildDocMap(modules: Record<string, string>): Map<string, string> {
  const docMap = new Map<string, string>();
  for (const [key, content] of Object.entries(modules)) {
    docMap.set(globKeyToDocPath(key), content);
  }
  return docMap;
}

/**
 * Formats a file or folder name into a readable display name.
 * Converts kebab-case to Title Case (e.g., "environment-variables" → "Environment Variables").
 */
function formatName(slug: string): string {
  return slug
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

/**
 * Scan all markdown files in /docs and build the sidebar config.
 * In Vite: import.meta.glob is replaced at build time with eager imports.
 * In test environments: falls back to filesystem scanning using require.
 * Using require avoids Vite attempting to bundle "fs" in test environments.
 */
function scanDocModules(): Record<string, string> {
  // Vite transforms this call at build time into static imports.
  // If not transformed (e.g. in tests), import.meta.glob is undefined and throws.
  if (import.meta.env.DEV || import.meta.env.PROD)
    return import.meta.glob("../../docs/**/*.md", {
      query: "?raw",
      import: "default",
      eager: true,
    }) as Record<string, string>;
  else {
    // Test environment fallback: use require for fs and path
    // This works in both Node.js and Bun test environments
    const fs = require("fs");
    const path = require("path");
    const { readdirSync, readFileSync } = fs;
    const { join } = path;
    const docsDir = join(__dirname, "../../docs");
    const modules: Record<string, string> = {};

    /**
     * Recursively walks a directory and collects .md files.
     * Builds glob-style relative keys matching the Vite convention.
     */
    function walkDir(dir: string, prefix: string): void {
      for (const entry of readdirSync(dir, { withFileTypes: true })) {
        const fullPath = join(dir, entry.name);
        if (entry.isDirectory()) {
          walkDir(fullPath, `${prefix}${entry.name}/`);
        } else if (entry.name.endsWith(".md")) {
          // Key format matches Vite glob: "../../docs/<path>.md"
          modules[`../../docs/${prefix}${entry.name}`] = readFileSync(fullPath, "utf-8");
        }
      }
    }

    walkDir(docsDir, "");
    return modules;
  }
}

const docModules = scanDocModules();

/**
 * Lookup map from doc path to raw markdown content.
 * Built from scanned doc modules using buildDocMap.
 */
export const docMap = buildDocMap(docModules);

/** Group doc paths by their top-level folder (or root) */
const groups = new Map<string, { name: string; href: string }[]>();

for (const key of Object.keys(docModules)) {
  // Convert glob key to doc path: "../../docs/getting-started/overview.md" → "getting-started/overview"
  const relPath = key.replace(/^(\.\.\/)*docs\//, "").replace(/\.md$/, "");
  const segments = relPath.split("/");
  const folder = segments.length > 1 ? (segments[0] as string) : "getting-started";
  const fileName = segments[segments.length - 1] as string;
  // Build the route href: root overview → "/docs", others → "/docs/<path>"
  const href = relPath === "getting-started/overview" ? "/docs" : `/docs/${relPath}`;

  // Overview pages always display as "Overview", other files use formatted file name
  const name = fileName === "overview" ? "Overview" : getDisplayName(fileName);

  if (!groups.has(folder)) {
    groups.set(folder, []);
  }
  groups.get(folder)!.push({ name, href });
}

/**
 * Sidebar navigation structure built dynamically from the /docs directory.
 * Each href maps to a markdown file under /docs/.
 * The "Overview" item in Getting Started uses href "/docs" so the sidebar
 * auto-expands when the user is on the docs landing page.
 */
export const docsConfig: DocSection[] = SECTION_ORDER.reduce((acc: DocSection[], folder) => {
  const items = groups.get(folder);
  if (items && items.length > 0) {
    // Sort: overview first, then alphabetical by name
    const sortedItems = [...items].sort((a, b) => {
      if (a.name === "Overview") return -1;
      if (b.name === "Overview") return 1;
      return a.name.localeCompare(b.name);
    });

    acc.push({
      title: SECTION_TITLE_MAP[folder] ?? formatName(folder),
      items: sortedItems,
    });
  }
  return acc;
}, []);