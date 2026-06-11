/**
 * Bruno collection generation script.
 * Generates Bruno collections from the OpenAPI spec served by the application.
 *
 * Usage:
 *   bun run script:generate-bruno          # Generate from running dev server
 *   bun run script:generate-bruno --file   # Generate from local OpenAPI JSON file
 */

import { openApiToBruno } from "@usebruno/converters";
import { existsSync, mkdirSync, writeFileSync, readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = join(__dirname, "..");
const BRUNO_DIR = join(PROJECT_ROOT, ".bruno", "collections");

/**
 * Logger for the generation process.
 */
const logger = {
  info: (msg: string) => console.log(`  [info] ${msg}`),
  step: (msg: string) => console.log(`\n  >> ${msg}`),
  success: (msg: string) => console.log(`  [OK]   ${msg}`),
  error: (msg: string) => console.error(`  [ERR]  ${msg}`),
};

/**
 * Determines the OpenAPI spec source.
 * Priority: --file argument > running server.
 */
async function getOpenApiSpec(): Promise<Record<string, unknown>> {
  const useFile = process.argv.includes("--file");

  if (useFile) {
    const fileIndex = process.argv.indexOf("--file");
    const filePath = process.argv[fileIndex + 1] || join(PROJECT_ROOT, "openapi.json");

    if (!existsSync(filePath)) {
      throw new Error(`OpenAPI spec file not found: ${filePath}`);
    }

    logger.info(`Reading OpenAPI spec from file: ${filePath}`);
    return JSON.parse(readFileSync(filePath, "utf-8")) as Record<string, unknown>;
  }

  const baseUrl = process.env.BASE_URL || "http://localhost:3000";
  const specUrl = `${baseUrl}/api/reference?format=json`;

  logger.info(`Fetching OpenAPI spec from: ${specUrl}`);
  const response = await fetch(specUrl);

  if (!response.ok) {
    throw new Error(
      `Failed to fetch OpenAPI spec: ${response.status} ${response.statusText}. ` +
        "Make sure the dev server is running, or use --file <path>.",
    );
  }

  return (await response.json()) as Record<string, unknown>;
}

/**
 * Generates Bruno collection files from an OpenAPI spec.
 */
async function generateCollection(openApiSpec: Record<string, unknown>): Promise<void> {
  logger.step("Converting OpenAPI spec to Bruno collection");

  const rawCollection = await openApiToBruno(openApiSpec);

  // Ensure output directory exists
  if (!existsSync(BRUNO_DIR)) {
    mkdirSync(BRUNO_DIR, { recursive: true });
  }

  // Write collection JSON file
  const outputPath = join(BRUNO_DIR, "collection.json");
  writeFileSync(outputPath, JSON.stringify(rawCollection, null, 2));
  logger.success(`Collection written to: ${outputPath}`);

  logger.info("Bruno collection generated successfully. Open in Bruno or use 'bru run'.");
}

/**
 * Main generation entry point.
 */
async function main(): Promise<void> {
  logger.step("Bruno Collection Generator");
  logger.info(`Output directory: ${BRUNO_DIR}`);

  try {
    const openApiSpec = await getOpenApiSpec();
    await generateCollection(openApiSpec);
  } catch (error) {
    logger.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

await main();