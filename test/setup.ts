// Preloaded before every test file (via `--preload ./test/setup.ts` or CI config).
// Sets per-worker PGlite directory and hints GC.

import { afterEach } from "bun:test";
import { mkdtempSync } from "node:fs";
import { resolve } from "node:path";
import { tmpdir } from "node:os";

// Each test worker gets a unique PGlite data dir so parallel workers
// never share the same WASM persistent state, avoiding the "Aborted()"
// WASM crash that occurs when multiple PGlite instances write into the
// same filesystem directory.
const DIR_KEY = "___tsse_pglite_worker_dir";
const g = globalThis as Record<string, unknown>;
if (!g[DIR_KEY]) {
  g[DIR_KEY] = mkdtempSync(resolve(tmpdir(), "tsse-elysia-"));
}
process.env.PGLITE_DATA_DIR = g[DIR_KEY] as string;

// Hint memory management
if (global.gc) {
  afterEach(() => {
    global.gc!();
  });
}