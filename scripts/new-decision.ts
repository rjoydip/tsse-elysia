import { readFileSync, appendFileSync } from "fs";

const FILE = "knowledge/DECISIONS.md";

const content = readFileSync(FILE, "utf-8");

const matches = [...content.matchAll(/### (\d+):/g)];

const lastId = matches.length ? Math.max(...matches.map((m) => Number(m[1]))) : 0;

const nextId = String(lastId + 1).padStart(3, "0");

const title = process.argv[2] || "New Decision";

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

console.log(`✅ Decision ${nextId} created`);