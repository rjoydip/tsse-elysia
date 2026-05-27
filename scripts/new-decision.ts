/**
 * Creates a new decision entry in DECISIONS.md with auto-incremented ID.
 * Checks for duplicate titles to prevent idempotency issues.
 *
 * @example
 * bun scripts/new-decision.ts "Use SQLite for caching"
 */

import { readFileSync, appendFileSync, existsSync } from "fs";
import { logger } from "~/lib/logger";

const FILE = "knowledge/DECISIONS.md";

if (!existsSync(FILE)) {
  logger.error(`❌ ${FILE} not found`);
  process.exit(1);
}

const content = readFileSync(FILE, "utf-8");

const matches = [...content.matchAll(/### (\d+):/g)];

const lastId = matches.length ? Math.max(...matches.map((m) => Number(m[1]))) : 0;

const nextId = String(lastId + 1).padStart(3, "0");

const title = process.argv[2] || "New Decision";

// Check for duplicate title
const titleLower = title.toLowerCase();
if (content.toLowerCase().includes(titleLower)) {
  logger.warn(`⚠️ Decision with similar title already exists: "${title}"`);
  logger.warn("Use a unique title or check DECISIONS.md");
  process.exit(1);
}

const entry = `

### ${nextId}: ${title}

**Status:** Proposed

**Context:**
-

**Decision:**
-

**Alternatives Considered:**
-

**Tradeoffs:**
-
`;

appendFileSync(FILE, entry);

logger.log(`✅ Decision ${nextId} created`);