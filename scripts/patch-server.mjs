/**
 * Post-build patch to fix serverSsr.dehydrate TypeError in TanStack Start
 * Patches dist/server/server.js to add defensive check
 */

import { readFileSync, writeFileSync } from "fs";
import { join } from "path";
import { scriptLogger as logger } from "~/lib/logger";

const serverPath = join(process.cwd(), "dist/server/server.js");

const content = readFileSync(serverPath, "utf-8");

const oldCode = `if (routerInstance.state.redirect) return routerInstance.state.redirect;
			const ctx = getStartContext({ throwIfNotFound: false });
			await routerInstance.serverSsr.dehydrate({ requestAssets: ctx?.requestAssets });
			const responseHeaders = getStartResponseHeaders({ router: routerInstance });`;

const newCode = `if (routerInstance.state.redirect) return routerInstance.state.redirect;
			const ctx = getStartContext({ throwIfNotFound: false });
			// Defensive fix: check if serverSsr and dehydrate exist before calling
			if (routerInstance.serverSsr?.dehydrate) {
				await routerInstance.serverSsr.dehydrate({ requestAssets: ctx?.requestAssets });
			}
			const responseHeaders = getStartResponseHeaders({ router: routerInstance });`;

if (content.includes(oldCode)) {
  const patched = content.replace(oldCode, newCode);
  writeFileSync(serverPath, patched);
  logger.success("✅ Patched serverSsr.dehydrate successfully");
} else if (content.includes("routerInstance.serverSsr?.dehydrate")) {
  logger.success("✅ Already patched");
} else {
  logger.info("⚠️ Pattern not found - may already be fixed or different version");
}